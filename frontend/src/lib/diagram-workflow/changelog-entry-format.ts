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
        return 'Checkpoint';
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

    if (eventType === 'diagram_renamed') {
        return 'Renamed';
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
        entry.eventType === 'diagram_renamed' ||
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
    const parts: string[] = [];

    if (entry.sourceDocumentVersion) {
        parts.push(`Doc v${entry.sourceDocumentVersion}`);
    }

    return parts.join(' · ');
};

export const getChangelogEntryTimestamp = (
    entry: Pick<DiagramWorkflowChangelogSummary, 'createdAt'>
) => formatVersionTimestamp(entry.createdAt);

export const getChangelogEntryRelativeTime = (
    entry: Pick<DiagramWorkflowChangelogSummary, 'createdAt'>
) => formatVersionRelativeTime(entry.createdAt);

export const getChangelogEntryShortId = (
    entry: Pick<DiagramWorkflowChangelogSummary, 'id'>
) => entry.id.slice(0, 6);

export const getChangelogActorLabel = (
    entry: Pick<DiagramWorkflowChangelogSummary, 'createdBy'>
) =>
    entry.createdBy?.email?.trim() ||
    entry.createdBy?.displayName?.trim() ||
    'SchemaDash';

export const getChangelogSaveCountLabel = (
    entry: Pick<DiagramWorkflowChangelogSummary, 'eventType'>
) => {
    if (entry.eventType === 'save') {
        return '1 save';
    }

    if (entry.eventType === 'auto_checkpoint') {
        return '5 min checkpoint';
    }

    if (entry.eventType === 'version_created') {
        return 'Version created';
    }

    if (entry.eventType === 'version_deleted') {
        return 'Version deleted';
    }

    if (entry.eventType === 'version_viewed') {
        return 'Version viewed';
    }

    if (entry.eventType === 'diagram_renamed') {
        return 'Name updated';
    }

    if (entry.eventType === 'live_connected') {
        return 'Live database linked';
    }

    if (entry.eventType === 'live_synced') {
        return 'Live database synced';
    }

    if (entry.eventType === 'restore') {
        return 'Version restored';
    }

    if (entry.eventType === 'revert') {
        return 'Development reverted';
    }

    return 'Timeline event';
};

export const getChangelogChangeHighlights = (
    entry: Pick<
        DiagramWorkflowChangelogSummary,
        'eventType' | 'changeSummary' | 'summary' | 'sourceLabel'
    >
) => {
    if (
        entry.eventType === 'version_created' ||
        entry.eventType === 'version_deleted' ||
        entry.eventType === 'version_viewed' ||
        entry.eventType === 'diagram_renamed' ||
        entry.eventType === 'live_connected' ||
        entry.eventType === 'live_synced' ||
        entry.eventType === 'restore' ||
        entry.eventType === 'revert'
    ) {
        return [
            {
                tone: 'neutral' as const,
                text: entry.sourceLabel?.trim() || entry.summary,
            },
        ];
    }

    if (!entry.changeSummary || !entry.changeSummary.hasChanges) {
        return [
            {
                tone: 'neutral' as const,
                text: 'Only visual changes',
            },
        ];
    }

    const highlights: Array<{
        tone: 'positive' | 'negative' | 'warning' | 'neutral';
        text: string;
    }> = [];

    if (entry.changeSummary.tables.added > 0) {
        highlights.push({
            tone: 'positive',
            text: `+ ${entry.changeSummary.tables.added} table${entry.changeSummary.tables.added === 1 ? '' : 's'}`,
        });
    }

    if (entry.changeSummary.tables.removed > 0) {
        highlights.push({
            tone: 'negative',
            text: `- ${entry.changeSummary.tables.removed} table${entry.changeSummary.tables.removed === 1 ? '' : 's'}`,
        });
    }

    if (entry.changeSummary.tables.changed > 0) {
        highlights.push({
            tone: 'warning',
            text: `${entry.changeSummary.tables.changed} table${entry.changeSummary.tables.changed === 1 ? '' : 's'} changed`,
        });
    }

    if (entry.changeSummary.relationships.changed > 0) {
        highlights.push({
            tone: 'warning',
            text: `${entry.changeSummary.relationships.changed} relation${entry.changeSummary.relationships.changed === 1 ? '' : 's'} changed`,
        });
    }

    return highlights.length > 0
        ? highlights
        : [
              {
                  tone: 'neutral' as const,
                  text: 'Only visual changes',
              },
          ];
};

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
