import { hashCanonicalSchema } from '@schemadash/schema-sync-core';
import type { AppUserRecord } from '../repositories/app-repository.js';
import type {
    DiagramWorkflowRepository,
    DiagramWorkflowSnapshotRecord,
    DiagramWorkflowStateRecord,
    DiagramWorkflowVersionRecord,
} from '../repositories/diagram-workflow-repository.js';
import {
    restoreDiagramWorkflowVersionSchema,
    restoreToDevelopmentConfirmationText,
    type RestoreDiagramWorkflowVersionInput,
} from '../schemas/diagram-workflow.js';
import type { PersistenceService } from './persistence-service.js';
import { AppError } from '../utils/app-error.js';
import { generateId } from '../utils/id.js';
import type { DiagramWorkflowVersionSummaryView } from './diagram-workflow-service.js';

type PersistedDiagramView = NonNullable<
    ReturnType<PersistenceService['getDiagram']>
>;

export interface DiagramVersionRestoreResultView {
    diagramId: string;
    restoredVersion: DiagramWorkflowVersionSummaryView;
    safetySnapshotVersion: DiagramWorkflowVersionSummaryView;
    development: {
        name: string;
        documentVersion: number;
        updatedAt: string;
    };
}

export class DiagramVersionRestoreService {
    constructor(
        private readonly repository: DiagramWorkflowRepository,
        private readonly persistenceService: PersistenceService
    ) {}

    restoreVersionToDevelopment(
        diagramId: string,
        versionId: string,
        input: unknown,
        actor?: AppUserRecord | null
    ): DiagramVersionRestoreResultView {
        const diagram = this.requireEditableDiagram(diagramId, actor);
        const payload = restoreDiagramWorkflowVersionSchema.parse(input);

        if (
            payload.confirmationText.trim() !==
            restoreToDevelopmentConfirmationText
        ) {
            throw new AppError(
                'Restore confirmation text did not match. Reconfirm the restore before trying again.',
                400,
                'DIAGRAM_RESTORE_CONFIRMATION_REQUIRED'
            );
        }

        if (diagram.collaboration.document.version !== payload.baseVersion) {
            throw new AppError(
                'Development changed before the restore could start. Reload the editor and try again.',
                409,
                'DIAGRAM_RESTORE_CONFLICT'
            );
        }

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

        if (!snapshot.diagramDocument) {
            throw new AppError(
                'This version cannot be restored because its stored diagram document is unavailable.',
                409,
                'DIAGRAM_VERSION_RESTORE_UNAVAILABLE'
            );
        }

        const createdAt = new Date().toISOString();
        const workflowState = this.repository.getState(diagramId);
        const safetySnapshotVersion = this.createSafetySnapshotVersion({
            diagram,
            version,
            workflowState,
            actor,
            createdAt,
            currentDevelopmentCanonicalSchema:
                payload.currentDevelopmentCanonicalSchema,
        });

        const restoredDiagram = this.persistenceService.upsertDiagram(
            diagramId,
            {
                projectId: diagram.projectId,
                ownerUserId: diagram.ownerUserId ?? undefined,
                description: diagram.description,
                baseVersion: payload.baseVersion,
                diagram: {
                    ...snapshot.diagramDocument,
                    id: diagramId,
                    schemaSync: diagram.diagram.schemaSync,
                    updatedAt: createdAt,
                },
            },
            actor
        );

        return {
            diagramId,
            restoredVersion: this.toVersionSummaryView(version),
            safetySnapshotVersion,
            development: {
                name: restoredDiagram.diagram.name,
                documentVersion: restoredDiagram.collaboration.document.version,
                updatedAt: restoredDiagram.updatedAt,
            },
        };
    }

    private createSafetySnapshotVersion({
        diagram,
        version,
        workflowState,
        actor,
        createdAt,
        currentDevelopmentCanonicalSchema,
    }: {
        diagram: PersistedDiagramView;
        version: DiagramWorkflowVersionRecord;
        workflowState?: DiagramWorkflowStateRecord;
        actor?: AppUserRecord | null;
        createdAt: string;
        currentDevelopmentCanonicalSchema: RestoreDiagramWorkflowVersionInput['currentDevelopmentCanonicalSchema'];
    }): DiagramWorkflowVersionSummaryView {
        const fingerprint = hashCanonicalSchema(
            currentDevelopmentCanonicalSchema
        );
        const canonicalSchema = {
            ...currentDevelopmentCanonicalSchema,
            fingerprint,
            importedAt:
                currentDevelopmentCanonicalSchema.importedAt ??
                diagram.diagram.updatedAt ??
                createdAt,
        };
        const snapshotId = generateId();
        const safetyVersionId = generateId();
        const safetyVersionNumber =
            this.repository.countVersions(diagram.id) + 1;
        const restoreLabel = version.name?.trim() || version.versionLabel;
        const safetySnapshot: DiagramWorkflowSnapshotRecord = {
            id: snapshotId,
            diagramId: diagram.id,
            snapshotKind: 'system',
            sourceKind: 'development',
            connectionId: workflowState?.connectionId ?? null,
            fingerprint,
            canonicalSchema,
            diagramDocument: diagram.diagram,
            layoutSource: 'captured',
            basedOnSnapshotId: null,
            createdByUserId: actor?.id ?? null,
            createdAt,
        };
        const safetyVersion: DiagramWorkflowVersionRecord = {
            id: safetyVersionId,
            diagramId: diagram.id,
            snapshotId,
            name: `Before restore: ${restoreLabel}`,
            description: `Automatic safety snapshot captured before restoring ${restoreLabel} into Development.`,
            versionLabel: `Version ${safetyVersionNumber}`,
            pinned: false,
            origin: 'before_restore',
            createdByUserId: actor?.id ?? null,
            createdByDisplayName: actor?.displayName ?? null,
            createdByEmail: actor?.email ?? null,
            createdAt,
        };

        this.repository.transaction(() => {
            this.repository.putSnapshot(safetySnapshot);
            this.repository.putVersion(safetyVersion);
        });

        return this.toVersionSummaryView(safetyVersion);
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
}
