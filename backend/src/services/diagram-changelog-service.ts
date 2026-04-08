import {
    compareCanonicalSchemas,
    hashCanonicalSchema,
    type CanonicalSchema,
} from '@schemadash/schema-sync-core';
import type { AppUserRecord } from '../repositories/app-repository.js';
import type {
    DiagramWorkflowChangelogRecord,
    DiagramWorkflowRepository,
    DiagramWorkflowSnapshotRecord,
} from '../repositories/diagram-workflow-repository.js';
import {
    createDiagramWorkflowChangelogEntrySchema,
    type DiagramWorkflowChangelogEventType,
} from '../schemas/diagram-workflow.js';
import type { PersistenceService } from './persistence-service.js';
import { AppError } from '../utils/app-error.js';
import { generateId } from '../utils/id.js';
import type { DiagramDocument } from '../schemas/persistence.js';

type PersistedDiagramView = NonNullable<
    ReturnType<PersistenceService['getDiagram']>
>;

export interface DiagramWorkflowChangelogAuthorView {
    id: string;
    displayName: string;
    email: string | null;
}

export interface DiagramWorkflowChangelogSummaryView {
    id: string;
    diagramId: string;
    snapshotId: string;
    eventType: DiagramWorkflowChangelogEventType;
    sessionId: string | null;
    sourceDocumentVersion: number | null;
    sourceLabel: string | null;
    summary: string;
    changeSummary: DiagramWorkflowChangelogRecord['changeSummary'];
    fingerprint: string;
    createdAt: string;
    createdBy: DiagramWorkflowChangelogAuthorView | null;
}

export interface DiagramWorkflowChangelogEntryView extends DiagramWorkflowChangelogSummaryView {
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

export interface CaptureDiagramWorkflowChangelogResultView {
    created: boolean;
    entry: DiagramWorkflowChangelogEntryView;
}

const buildFallbackSummary = (
    eventType: DiagramWorkflowChangelogEventType,
    sourceLabel: string | null,
    hasPreviousEntry: boolean
) => {
    if (eventType === 'change') {
        return hasPreviousEntry
            ? 'Captured Development changes.'
            : 'Captured the first Development changes.';
    }

    if (eventType === 'auto_checkpoint') {
        return hasPreviousEntry
            ? 'Captured an automatic Development checkpoint.'
            : 'Captured the first automatic Development checkpoint.';
    }

    if (eventType === 'restore') {
        return sourceLabel
            ? `Restored Development from ${sourceLabel}.`
            : 'Restored Development from a historical state.';
    }

    if (eventType === 'revert') {
        return sourceLabel
            ? `Reverted Development to ${sourceLabel}.`
            : 'Reverted Development to a historical changelog state.';
    }

    if (eventType === 'version_created') {
        return sourceLabel
            ? `Created version ${sourceLabel}.`
            : 'Created a new immutable version.';
    }

    if (eventType === 'version_deleted') {
        return sourceLabel
            ? `Deleted version ${sourceLabel}.`
            : 'Deleted an immutable version.';
    }

    if (eventType === 'version_viewed') {
        return sourceLabel
            ? `Viewed ${sourceLabel}.`
            : 'Viewed a historical version.';
    }

    if (eventType === 'diagram_renamed') {
        return sourceLabel
            ? `Renamed Development to ${sourceLabel}.`
            : 'Renamed the Development diagram.';
    }

    if (eventType === 'live_connected') {
        return sourceLabel
            ? `Linked Development to live database ${sourceLabel}.`
            : 'Linked Development to a live database.';
    }

    if (eventType === 'live_synced') {
        return sourceLabel
            ? `Synced Live Database from ${sourceLabel}.`
            : 'Synced the Live Database baseline.';
    }

    return hasPreviousEntry
        ? 'Saved Development changes.'
        : 'Captured the first saved Development state.';
};

const buildChangeSummary = ({
    previousSnapshot,
    canonicalSchema,
}: {
    previousSnapshot?: DiagramWorkflowSnapshotRecord;
    canonicalSchema: CanonicalSchema;
}) => {
    if (!previousSnapshot) {
        return null;
    }

    const compareResult = compareCanonicalSchemas({
        baseline: previousSnapshot.canonicalSchema,
        target: canonicalSchema,
    });

    return {
        ...compareResult.summary,
        totalChanges:
            compareResult.summary.tables.added +
            compareResult.summary.tables.removed +
            compareResult.summary.tables.changed +
            compareResult.summary.fields.added +
            compareResult.summary.fields.removed +
            compareResult.summary.fields.changed +
            compareResult.summary.relationships.added +
            compareResult.summary.relationships.removed +
            compareResult.summary.relationships.changed,
        hasChanges: compareResult.hasChanges,
    };
};

export class DiagramChangelogService {
    constructor(
        private readonly repository: DiagramWorkflowRepository,
        private readonly persistenceService: PersistenceService
    ) {}

    listChangelog(
        diagramId: string,
        actor?: AppUserRecord | null,
        options?: { shareToken?: string | null }
    ): DiagramWorkflowChangelogSummaryView[] {
        this.requireDiagramView(diagramId, actor, options);

        return this.repository.listChangelogEntries(diagramId).map((entry) => {
            const snapshot = this.repository.getSnapshot(entry.snapshotId);
            if (!snapshot || snapshot.diagramId !== diagramId) {
                throw new AppError(
                    'Changelog snapshot not found.',
                    404,
                    'DIAGRAM_CHANGELOG_SNAPSHOT_NOT_FOUND'
                );
            }

            return this.toSummaryView(entry, snapshot);
        });
    }

    getChangelogEntry(
        diagramId: string,
        entryId: string,
        actor?: AppUserRecord | null,
        options?: { shareToken?: string | null }
    ): DiagramWorkflowChangelogEntryView {
        this.requireDiagramView(diagramId, actor, options);

        const entry = this.repository.getChangelogEntry(entryId);
        if (!entry || entry.diagramId !== diagramId) {
            throw new AppError(
                'Changelog entry not found.',
                404,
                'DIAGRAM_CHANGELOG_NOT_FOUND'
            );
        }

        const snapshot = this.repository.getSnapshot(entry.snapshotId);
        if (!snapshot || snapshot.diagramId !== diagramId) {
            throw new AppError(
                'Changelog snapshot not found.',
                404,
                'DIAGRAM_CHANGELOG_SNAPSHOT_NOT_FOUND'
            );
        }

        return this.toEntryView(entry, snapshot);
    }

    captureEntry(
        diagramId: string,
        input: unknown,
        actor?: AppUserRecord | null
    ): CaptureDiagramWorkflowChangelogResultView {
        this.requireEditableDiagram(diagramId, actor);
        const payload = createDiagramWorkflowChangelogEntrySchema.parse(input);
        const previousEntry =
            this.repository.getLatestChangelogEntry(diagramId);
        const previousSnapshot = previousEntry
            ? this.repository.getSnapshot(previousEntry.snapshotId)
            : undefined;
        const fingerprint = hashCanonicalSchema(payload.canonicalSchema);

        if (
            previousEntry &&
            previousSnapshot &&
            this.shouldSkipCapture({
                latestEntry: previousEntry,
                latestSnapshot: previousSnapshot,
                eventType: payload.eventType,
                fingerprint,
                sourceDocumentVersion: payload.sourceDocumentVersion ?? null,
            })
        ) {
            return {
                created: false,
                entry: this.toEntryView(previousEntry, previousSnapshot),
            };
        }

        const createdAt = new Date().toISOString();
        const workflowState = this.repository.getState(diagramId);
        const canonicalSchema: CanonicalSchema = {
            ...payload.canonicalSchema,
            fingerprint,
            importedAt: payload.canonicalSchema.importedAt ?? createdAt,
        };
        const snapshot: DiagramWorkflowSnapshotRecord = {
            id: generateId(),
            diagramId,
            snapshotKind: 'changelog',
            sourceKind:
                payload.eventType === 'restore' ||
                payload.eventType === 'revert'
                    ? 'restore'
                    : 'development',
            connectionId: workflowState?.connectionId ?? null,
            fingerprint,
            canonicalSchema,
            diagramDocument: payload.diagramDocument,
            layoutSource: 'captured',
            basedOnSnapshotId: previousEntry?.snapshotId ?? null,
            createdByUserId: actor?.id ?? null,
            createdAt,
        };
        const entry: DiagramWorkflowChangelogRecord = {
            id: generateId(),
            diagramId,
            snapshotId: snapshot.id,
            eventType: payload.eventType,
            sessionId: payload.sessionId ?? null,
            sourceDocumentVersion: payload.sourceDocumentVersion ?? null,
            sourceLabel: payload.sourceLabel ?? null,
            summary:
                payload.summary?.trim() ||
                buildFallbackSummary(
                    payload.eventType,
                    payload.sourceLabel ?? null,
                    !!previousEntry
                ),
            changeSummary: buildChangeSummary({
                previousSnapshot,
                canonicalSchema,
            }),
            createdByUserId: actor?.id ?? null,
            createdByDisplayName: actor?.displayName ?? null,
            createdByEmail: actor?.email ?? null,
            createdAt,
        };

        this.repository.transaction(() => {
            this.repository.putSnapshot(snapshot);
            this.repository.putChangelogEntry(entry);
        });

        return {
            created: true,
            entry: this.toEntryView(entry, snapshot),
        };
    }

    private shouldSkipCapture({
        latestEntry,
        latestSnapshot,
        eventType,
        fingerprint,
        sourceDocumentVersion,
    }: {
        latestEntry: DiagramWorkflowChangelogRecord;
        latestSnapshot: DiagramWorkflowSnapshotRecord;
        eventType: DiagramWorkflowChangelogEventType;
        fingerprint: string;
        sourceDocumentVersion: number | null;
    }) {
        if (
            eventType === 'restore' ||
            eventType === 'revert' ||
            eventType === 'version_created' ||
            eventType === 'version_deleted' ||
            eventType === 'version_viewed' ||
            eventType === 'diagram_renamed' ||
            eventType === 'live_connected' ||
            eventType === 'live_synced'
        ) {
            return false;
        }

        if (eventType === 'auto_checkpoint') {
            return latestSnapshot.fingerprint === fingerprint;
        }

        if (
            latestEntry.eventType === 'save' &&
            latestSnapshot.fingerprint === fingerprint
        ) {
            return true;
        }

        if (
            sourceDocumentVersion !== null &&
            latestEntry.eventType === eventType &&
            latestEntry.sourceDocumentVersion === sourceDocumentVersion
        ) {
            return true;
        }

        return false;
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

    private toAuthorView(
        entry: DiagramWorkflowChangelogRecord
    ): DiagramWorkflowChangelogAuthorView | null {
        return entry.createdByUserId &&
            (entry.createdByDisplayName || entry.createdByEmail)
            ? {
                  id: entry.createdByUserId,
                  displayName:
                      entry.createdByDisplayName ??
                      entry.createdByEmail ??
                      'Unknown user',
                  email: entry.createdByEmail,
              }
            : null;
    }

    private toSummaryView(
        entry: DiagramWorkflowChangelogRecord,
        snapshot: DiagramWorkflowSnapshotRecord
    ): DiagramWorkflowChangelogSummaryView {
        return {
            id: entry.id,
            diagramId: entry.diagramId,
            snapshotId: entry.snapshotId,
            eventType: entry.eventType,
            sessionId: entry.sessionId,
            sourceDocumentVersion: entry.sourceDocumentVersion,
            sourceLabel: entry.sourceLabel,
            summary: entry.summary,
            changeSummary: entry.changeSummary,
            fingerprint: snapshot.fingerprint,
            createdAt: entry.createdAt,
            createdBy: this.toAuthorView(entry),
        };
    }

    private toEntryView(
        entry: DiagramWorkflowChangelogRecord,
        snapshot: DiagramWorkflowSnapshotRecord
    ): DiagramWorkflowChangelogEntryView {
        return {
            ...this.toSummaryView(entry, snapshot),
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
}
