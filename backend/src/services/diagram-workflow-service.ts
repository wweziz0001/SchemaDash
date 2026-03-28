import type { CanonicalSchema } from '@schemadash/schema-sync-core';
import type { AppUserRecord } from '../repositories/app-repository.js';
import type {
    DiagramWorkflowRepository,
    DiagramWorkflowSnapshotRecord,
    DiagramWorkflowStateRecord,
} from '../repositories/diagram-workflow-repository.js';
import type { MetadataRepository } from '../repositories/metadata-repository.js';
import { bindDiagramWorkflowConnectionSchema } from '../schemas/diagram-workflow.js';
import type { PersistenceService } from './persistence-service.js';
import type { SchemaSyncService } from './schema-sync-service.js';
import { AppError } from '../utils/app-error.js';
import { generateId } from '../utils/id.js';

type PersistedDiagramView = NonNullable<
    ReturnType<PersistenceService['getDiagram']>
>;

export interface DiagramWorkflowCompatibilitySyncMetadata {
    connectionId: string;
    importedSchemas: string[];
    baselineSnapshotId: string;
    baselineFingerprint: string;
    lastImportedAt: string;
}

export interface DiagramWorkflowLiveSnapshotView {
    id: string;
    fingerprint: string;
    createdAt: string;
    connectionId: string | null;
    canonicalSchema: CanonicalSchema;
}

export interface DiagramWorkflowView {
    diagramId: string;
    diagramName: string;
    diagramAccess: PersistedDiagramView['access'];
    connectionId: string | null;
    connectionName: string | null;
    connectionEngine: string | null;
    importedSchemas: string[];
    liveSnapshotId: string | null;
    liveFingerprint: string | null;
    syncStatus: DiagramWorkflowStateRecord['syncStatus'];
    connectionStatus: DiagramWorkflowStateRecord['connectionStatus'];
    lastConnectedAt: string | null;
    lastSyncedAt: string | null;
    lastSyncError: string | null;
    defaultCompareSourceKind: DiagramWorkflowStateRecord['defaultCompareSourceKind'];
    defaultCompareSourceId: string | null;
    updatedAt: string;
    liveSnapshot: DiagramWorkflowLiveSnapshotView | null;
}

export class DiagramWorkflowService {
    constructor(
        private readonly repository: DiagramWorkflowRepository,
        private readonly metadataRepository: MetadataRepository,
        private readonly persistenceService: PersistenceService,
        private readonly schemaSyncService: SchemaSyncService
    ) {}

    getDiagramWorkflow(
        diagramId: string,
        actor?: AppUserRecord | null,
        options?: { shareToken?: string | null }
    ): DiagramWorkflowView {
        const diagram = this.requireDiagramView(diagramId, actor, options);
        const state = this.repository.getState(diagramId);
        const liveSnapshot = state?.liveSnapshotId
            ? (this.repository.getSnapshot(state.liveSnapshotId) ?? null)
            : null;

        return this.toWorkflowView(diagram, state, liveSnapshot);
    }

    bindConnection(
        diagramId: string,
        input: unknown,
        actor?: AppUserRecord | null
    ): DiagramWorkflowView {
        const diagram = this.requireEditableDiagram(diagramId, actor);
        const payload = bindDiagramWorkflowConnectionSchema.parse(input);
        const connection = this.metadataRepository.getConnection(
            payload.connectionId
        );

        if (!connection) {
            throw new AppError(
                'Connection not found.',
                404,
                'CONNECTION_NOT_FOUND'
            );
        }

        const now = new Date().toISOString();
        const existing = this.repository.getState(diagramId);
        const importedSchemas =
            payload.importedSchemas?.length &&
            payload.importedSchemas.length > 0
                ? payload.importedSchemas
                : connection.defaultSchemas;
        const keepLiveSnapshot = existing?.connectionId === connection.id;

        const nextState: DiagramWorkflowStateRecord = {
            diagramId,
            connectionId: connection.id,
            connectionNameCache: connection.name,
            connectionEngine: connection.engine,
            importedSchemas,
            liveSnapshotId: keepLiveSnapshot
                ? (existing?.liveSnapshotId ?? null)
                : null,
            liveFingerprint: keepLiveSnapshot
                ? (existing?.liveFingerprint ?? null)
                : null,
            syncStatus: keepLiveSnapshot
                ? (existing?.syncStatus ?? 'in_sync')
                : 'connected',
            connectionStatus: keepLiveSnapshot
                ? (existing?.connectionStatus ?? 'unknown')
                : 'unknown',
            lastConnectedAt: now,
            lastSyncedAt: keepLiveSnapshot
                ? (existing?.lastSyncedAt ?? null)
                : null,
            lastSyncError: null,
            defaultCompareSourceKind:
                existing?.defaultCompareSourceKind ?? 'live',
            defaultCompareSourceId: keepLiveSnapshot
                ? (existing?.defaultCompareSourceId ??
                  existing?.liveSnapshotId ??
                  null)
                : null,
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        };

        this.repository.putState(nextState);

        return this.toWorkflowView(
            diagram,
            nextState,
            nextState.liveSnapshotId
                ? (this.repository.getSnapshot(nextState.liveSnapshotId) ??
                      null)
                : null
        );
    }

    async refreshLiveSnapshot(
        diagramId: string,
        actor?: AppUserRecord | null
    ): Promise<{
        workflow: DiagramWorkflowView;
        compatibilitySync: DiagramWorkflowCompatibilitySyncMetadata;
    }> {
        const diagram = this.requireEditableDiagram(diagramId, actor);
        const existing = this.repository.getState(diagramId);
        if (!existing?.connectionId) {
            throw new AppError(
                'Bind this diagram to a saved connection before syncing.',
                409,
                'DIAGRAM_WORKFLOW_NOT_BOUND'
            );
        }

        const connection = this.metadataRepository.getConnection(
            existing.connectionId
        );
        if (!connection) {
            throw new AppError(
                'The saved connection for this diagram no longer exists.',
                404,
                'CONNECTION_NOT_FOUND'
            );
        }

        const importedSchemas =
            existing.importedSchemas.length > 0
                ? existing.importedSchemas
                : connection.defaultSchemas;
        const syncingAt = new Date().toISOString();

        this.repository.putState({
            ...existing,
            connectionNameCache: connection.name,
            connectionEngine: connection.engine,
            importedSchemas,
            syncStatus: 'syncing',
            connectionStatus: 'unknown',
            lastSyncError: null,
            updatedAt: syncingAt,
        });

        try {
            const result = await this.schemaSyncService.importLiveSchema({
                connectionId: connection.id,
                schemas: importedSchemas,
            });
            const liveSnapshotId = generateId();
            const liveSnapshot: DiagramWorkflowSnapshotRecord = {
                id: liveSnapshotId,
                diagramId,
                snapshotKind: 'live',
                sourceKind: 'introspection',
                connectionId: connection.id,
                fingerprint: result.fingerprint,
                canonicalSchema: result.canonicalSchema,
                diagramDocument: null,
                layoutSource: 'derived',
                basedOnSnapshotId: existing.liveSnapshotId,
                createdByUserId: actor?.id ?? null,
                createdAt: syncingAt,
            };
            const nextState: DiagramWorkflowStateRecord = {
                ...existing,
                connectionNameCache: connection.name,
                connectionEngine: connection.engine,
                importedSchemas,
                liveSnapshotId,
                liveFingerprint: result.fingerprint,
                syncStatus: 'in_sync',
                connectionStatus: 'ok',
                lastConnectedAt: syncingAt,
                lastSyncedAt: syncingAt,
                lastSyncError: null,
                defaultCompareSourceKind:
                    existing.defaultCompareSourceKind ?? 'live',
                defaultCompareSourceId: liveSnapshotId,
                updatedAt: syncingAt,
            };

            this.repository.putSnapshot(liveSnapshot);
            this.repository.putState(nextState);

            return {
                workflow: this.toWorkflowView(diagram, nextState, liveSnapshot),
                compatibilitySync: {
                    connectionId: connection.id,
                    importedSchemas,
                    baselineSnapshotId: result.snapshotId,
                    baselineFingerprint: result.fingerprint,
                    lastImportedAt: syncingAt,
                },
            };
        } catch (error) {
            this.repository.putState({
                ...existing,
                connectionNameCache: connection.name,
                connectionEngine: connection.engine,
                importedSchemas,
                syncStatus: 'error',
                connectionStatus: 'failed',
                lastSyncError:
                    error instanceof Error
                        ? error.message
                        : 'Live sync failed.',
                updatedAt: new Date().toISOString(),
            });
            throw error;
        }
    }

    private requireDiagramView(
        diagramId: string,
        actor?: AppUserRecord | null,
        options?: { shareToken?: string | null }
    ): PersistedDiagramView {
        return this.persistenceService.getDiagram(diagramId, actor, options);
    }

    private requireEditableDiagram(
        diagramId: string,
        actor?: AppUserRecord | null
    ): PersistedDiagramView {
        const diagram = this.persistenceService.getDiagram(diagramId, actor);
        if (diagram.access !== 'edit' && diagram.access !== 'owner') {
            throw new AppError('Diagram not found.', 404, 'DIAGRAM_NOT_FOUND');
        }

        return diagram;
    }

    private toWorkflowView(
        diagram: PersistedDiagramView,
        state?: DiagramWorkflowStateRecord,
        liveSnapshot?: DiagramWorkflowSnapshotRecord | null
    ): DiagramWorkflowView {
        return {
            diagramId: diagram.id,
            diagramName: diagram.name,
            diagramAccess: diagram.access,
            connectionId: state?.connectionId ?? null,
            connectionName: state?.connectionNameCache ?? null,
            connectionEngine: state?.connectionEngine ?? null,
            importedSchemas: state?.importedSchemas ?? [],
            liveSnapshotId: state?.liveSnapshotId ?? null,
            liveFingerprint: state?.liveFingerprint ?? null,
            syncStatus: state?.syncStatus ?? 'disconnected',
            connectionStatus: state?.connectionStatus ?? 'unknown',
            lastConnectedAt: state?.lastConnectedAt ?? null,
            lastSyncedAt: state?.lastSyncedAt ?? null,
            lastSyncError: state?.lastSyncError ?? null,
            defaultCompareSourceKind: state?.defaultCompareSourceKind ?? null,
            defaultCompareSourceId: state?.defaultCompareSourceId ?? null,
            updatedAt: state?.updatedAt ?? diagram.updatedAt,
            liveSnapshot: liveSnapshot
                ? {
                      id: liveSnapshot.id,
                      fingerprint: liveSnapshot.fingerprint,
                      createdAt: liveSnapshot.createdAt,
                      connectionId: liveSnapshot.connectionId,
                      canonicalSchema: liveSnapshot.canonicalSchema,
                  }
                : null,
        };
    }
}
