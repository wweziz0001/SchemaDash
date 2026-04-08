import {
    hashCanonicalSchema,
    type CanonicalSchema,
} from '@schemadash/schema-sync-core';
import { diagramToCanonicalSchema } from '@/lib/schema-sync/canonical-adapters';
import { deserializeDiagram } from '@/lib/persistence/diagram-serialization';
import type {
    DiagramWorkflowChangelogEventType,
    DiagramWorkflowChangelogRecord,
    DiagramWorkflowChangelogSummary,
} from '@/lib/api/diagram-workflow-client';
import {
    formatVersionRelativeTime,
    formatVersionTimestamp,
} from './version-labels';

export const getChangelogEventLabel = (
    eventType: DiagramWorkflowChangelogEventType
) => {
    if (eventType === 'change') {
        return 'Change';
    }

    if (eventType === 'auto_checkpoint') {
        return 'Auto Checkpoint';
    }

    if (eventType === 'restore') {
        return 'Restore';
    }

    if (eventType === 'revert') {
        return 'Revert';
    }

    if (eventType === 'version_created') {
        return 'Version Created';
    }

    if (eventType === 'version_deleted') {
        return 'Version Deleted';
    }

    if (eventType === 'version_viewed') {
        return 'Version Viewed';
    }

    if (eventType === 'live_connected') {
        return 'Live Linked';
    }

    if (eventType === 'live_synced') {
        return 'Live Sync';
    }

    return 'Save';
};

export const getChangelogEntryTitle = (
    entry: Pick<
        DiagramWorkflowChangelogSummary,
        'summary' | 'sourceLabel' | 'eventType'
    >
) => {
    if (
        entry.eventType === 'restore' ||
        entry.eventType === 'revert' ||
        entry.eventType === 'version_created' ||
        entry.eventType === 'version_deleted' ||
        entry.eventType === 'version_viewed' ||
        entry.eventType === 'live_connected' ||
        entry.eventType === 'live_synced'
    ) {
        return entry.sourceLabel?.trim() || entry.summary;
    }

    return entry.summary;
};

export const getChangelogEntryCaption = (
    entry: Pick<
        DiagramWorkflowChangelogSummary,
        'createdAt' | 'sourceDocumentVersion'
    >
) => {
    const parts = [formatVersionRelativeTime(entry.createdAt)];

    if (entry.sourceDocumentVersion) {
        parts.push(`Doc v${entry.sourceDocumentVersion}`);
    }

    return parts.join(' · ');
};

export const getChangelogEntryTimestamp = (
    entry: Pick<DiagramWorkflowChangelogSummary, 'createdAt'>
) => formatVersionTimestamp(entry.createdAt);

export const getAuthoritativeChangelogCanonicalSchema = (
    entry?: DiagramWorkflowChangelogRecord
): CanonicalSchema | undefined => {
    if (!entry) {
        return undefined;
    }

    if (!entry.snapshot.diagramDocument) {
        return entry.snapshot.canonicalSchema;
    }

    const canonicalFromDocument = diagramToCanonicalSchema(
        deserializeDiagram(entry.snapshot.diagramDocument)
    );

    return {
        ...canonicalFromDocument,
        fingerprint: hashCanonicalSchema(canonicalFromDocument),
        importedAt: entry.snapshot.createdAt,
    };
};
