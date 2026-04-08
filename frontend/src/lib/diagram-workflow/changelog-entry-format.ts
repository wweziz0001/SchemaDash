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
    if (eventType === 'auto_checkpoint') {
        return 'Auto Checkpoint';
    }

    if (eventType === 'restore') {
        return 'Restore';
    }

    if (eventType === 'revert') {
        return 'Revert';
    }

    return 'Save';
};

export const getChangelogEntryTitle = (
    entry: Pick<
        DiagramWorkflowChangelogSummary,
        'summary' | 'sourceLabel' | 'eventType'
    >
) => {
    if (entry.eventType === 'restore' || entry.eventType === 'revert') {
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
