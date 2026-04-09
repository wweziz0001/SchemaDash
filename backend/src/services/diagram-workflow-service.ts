import {
    hashCanonicalSchema,
    type CanonicalSchema,
} from '@schemadash/schema-sync-core';
import type { AppUserRecord } from '../repositories/app-repository.js';
import type {
    DiagramWorkflowRepository,
    DiagramWorkflowSnapshotRecord,
    DiagramWorkflowStateRecord,
    DiagramWorkflowVersionRecord,
} from '../repositories/diagram-workflow-repository.js';
import {
    bindDiagramWorkflowConnectionSchema,
    createDiagramWorkflowVersionSchema,
    type DiagramWorkflowVersionOrigin,
} from '../schemas/diagram-workflow.js';
import type { PersistenceService } from './persistence-service.js';
import type { SchemaSyncClient } from '../schema-sync/client.js';
import { AppError } from '../utils/app-error.js';
import { generateId } from '../utils/id.js';
import type { DiagramDocument } from '../schemas/persistence.js';

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

export interface DiagramWorkflowVersionAuthorView {
    id: string;
    displayName: string;
    email: string | null;
}

export interface DiagramWorkflowVersionSummaryView {
    id: string;
    diagramId: string;
    snapshotId: string;
    name: string | null;
    description: string | null;
    versionLabel: string;
    origin: DiagramWorkflowVersionOrigin;
    pinned: boolean;
    createdAt: string;
    createdBy: DiagramWorkflowVersionAuthorView | null;
}

export interface DiagramWorkflowVersionView extends DiagramWorkflowVersionSummaryView {
    snapshot: {
        id: string;
        fingerprint: string;
        canonicalSchema: CanonicalSchema;
        diagramDocument: DiagramDocument | null;
        layoutSource: DiagramWorkflowSnapshotRecord['layoutSource'];
        sourceKind: DiagramWorkflowSnapshotRecord['sourceKind'];
        createdAt: string;
    };
}

export interface DiagramWorkflowVersionDeleteResultView {
    diagramId: string;
    deletedVersionId: string;
    versions: DiagramWorkflowVersionSummaryView[];
}

export class DiagramWorkflowService {
    constructor(
        private readonly repository: DiagramWorkflowRepository,
        private readonly persistenceService: PersistenceService,
        private readonly schemaSyncClient: SchemaSyncClient
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

    listVersions(
        diagramId: string,
        actor?: AppUserRecord | null,
        options?: { shareToken?: string | null }
    ): DiagramWorkflowVersionSummaryView[] {
        this.requireDiagramView(diagramId, actor, options);

        return this.repository
            .listVersions(diagramId)
            .map((version) => this.toVersionSummaryView(version));
    }

    getVersion(
        diagramId: string,
        versionId: string,
        actor?: AppUserRecord | null,
        options?: { shareToken?: string | null }
    ): DiagramWorkflowVersionView {
        this.requireDiagramView(diagramId, actor, options);

        const version = this.repository.getVersion(versionId);
        if (!version || version.diagramId !== diagramId) {
            throw new AppError(
                'Version not found.',
                404,
                'DIAGRAM_VERSION_NOT_FOUND'
            );
        }

        const snapshot = this.repository.getSnapshot(version.snapshotId);
        if (!snapshot || snapshot.diagramId !== diagramId) {
            throw new AppError(
                'Version snapshot not found.',
                404,
                'DIAGRAM_VERSION_SNAPSHOT_NOT_FOUND'
            );
        }

        return this.toVersionView(version, snapshot);
    }

    createVersion(
        diagramId: string,
        input: unknown,
        actor?: AppUserRecord | null
    ): DiagramWorkflowVersionView {
        this.requireEditableDiagram(diagramId, actor);
        const payload = createDiagramWorkflowVersionSchema.parse(input);
        const createdAt = new Date().toISOString();
        const workflowState = this.repository.getState(diagramId);
        const snapshotId = generateId();
        const versionId = generateId();
        const versionNumber = this.repository.countVersions(diagramId) + 1;
        const versionLabel = `Version ${versionNumber}`;
        const fingerprint = hashCanonicalSchema(payload.canonicalSchema);
        const canonicalSchema: CanonicalSchema = {
            ...payload.canonicalSchema,
            fingerprint,
            importedAt: payload.canonicalSchema.importedAt ?? createdAt,
        };
        const snapshot: DiagramWorkflowSnapshotRecord = {
            id: snapshotId,
            diagramId,
            snapshotKind: 'version',
            sourceKind: 'development',
            connectionId: workflowState?.connectionId ?? null,
            fingerprint,
            canonicalSchema,
            diagramDocument: payload.diagramDocument,
            layoutSource: 'captured',
            basedOnSnapshotId: null,
            createdByUserId: actor?.id ?? null,
            createdAt,
        };
        const version: DiagramWorkflowVersionRecord = {
            id: versionId,
            diagramId,
            snapshotId,
            name: payload.name ?? null,
            description: payload.description ?? null,
            versionLabel,
            pinned: false,
            origin: payload.origin,
            createdByUserId: actor?.id ?? null,
            createdByDisplayName: actor?.displayName ?? null,
            createdByEmail: actor?.email ?? null,
            createdAt,
        };

        this.repository.transaction(() => {
            this.repository.putSnapshot(snapshot);
            this.repository.putVersion(version);
        });

        return this.toVersionView(version, snapshot);
    }

    deleteVersion(
        diagramId: string,
        versionId: string,
        actor?: AppUserRecord | null
    ): DiagramWorkflowVersionDeleteResultView {
        this.requireEditableDiagram(diagramId, actor);

        const version = this.repository.getVersion(versionId);
        if (!version || version.diagramId !== diagramId) {
            throw new AppError(
                'Version not found.',
                404,
                'DIAGRAM_VERSION_NOT_FOUND'
            );
        }

        const state = this.repository.getState(diagramId);
        const updatedAt = new Date().toISOString();

        this.repository.transaction(() => {
            this.repository.deleteVersion(versionId);

            if (
                this.repository.countVersionsBySnapshot(version.snapshotId) ===
                0
            ) {
                this.repository.deleteSnapshot(version.snapshotId);
            }

            if (
                state &&
                state.defaultCompareSourceKind === 'version' &&
                state.defaultCompareSourceId === versionId
            ) {
                this.repository.putState({
                    ...state,
                    defaultCompareSourceKind: null,
                    defaultCompareSourceId: null,
                    updatedAt,
                });
            }
        });

        return {
            diagramId,
            deletedVersionId: versionId,
            versions: this.repository
                .listVersions(diagramId)
                .map((item) => this.toVersionSummaryView(item)),
        };
    }

    async bindConnection(
        diagramId: string,
        input: unknown,
        actor?: AppUserRecord | null
    ): Promise<DiagramWorkflowView> {
        const diagram = this.requireEditableDiagram(diagramId, actor);
        const payload = bindDiagramWorkflowConnectionSchema.parse(input);
        const connection = await this.schemaSyncClient.getConnection(
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

        const connection = await this.schemaSyncClient.getConnection(
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
            const result = await this.schemaSyncClient.importLiveSchema({
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

    private toVersionSummaryView(
        version: DiagramWorkflowVersionRecord
    ): DiagramWorkflowVersionSummaryView {
        return {
            id: version.id,
            diagramId: version.diagramId,
            snapshotId: version.snapshotId,
            name: version.name,
            description: version.description,
            versionLabel: version.versionLabel,
            origin: version.origin,
            pinned: version.pinned,
            createdAt: version.createdAt,
            createdBy:
                version.createdByUserId &&
                (version.createdByDisplayName || version.createdByEmail)
                    ? {
                          id: version.createdByUserId,
                          displayName:
                              version.createdByDisplayName ??
                              version.createdByEmail ??
                              'Unknown user',
                          email: version.createdByEmail,
                      }
                    : null,
        };
    }

    private toVersionView(
        version: DiagramWorkflowVersionRecord,
        snapshot: DiagramWorkflowSnapshotRecord
    ): DiagramWorkflowVersionView {
        return {
            ...this.toVersionSummaryView(version),
            snapshot: {
                id: snapshot.id,
                fingerprint: snapshot.fingerprint,
                canonicalSchema: snapshot.canonicalSchema,
                diagramDocument: snapshot.diagramDocument,
                layoutSource: snapshot.layoutSource,
                sourceKind: snapshot.sourceKind,
                createdAt: snapshot.createdAt,
            },
        };
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
