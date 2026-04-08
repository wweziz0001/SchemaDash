import type { CompareSchemaResult } from '@schemadash/schema-sync-core/compare-types';

type CompareSummary = Pick<CompareSchemaResult, 'summary'>;

export type VersionDifferenceTone = 'added' | 'removed' | 'changed' | 'muted';

export interface VersionDifferenceSegment {
    tone: VersionDifferenceTone;
    label: string;
}

export interface VersionDifferenceSummary {
    message: string;
    segments: VersionDifferenceSegment[];
}

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
    `${count} ${count === 1 ? singular : plural}`;

const buildSegments = ({
    added,
    removed,
    changed,
    label,
}: {
    added: number;
    removed: number;
    changed: number;
    label: string;
}) => {
    const segments: VersionDifferenceSegment[] = [];

    if (added > 0) {
        segments.push({
            tone: 'added',
            label: `+ ${pluralize(added, label)}`,
        });
    }

    if (removed > 0) {
        segments.push({
            tone: 'removed',
            label: `- ${pluralize(removed, label)}`,
        });
    }

    if (changed > 0) {
        segments.push({
            tone: 'changed',
            label: `~ ${pluralize(changed, label)}`,
        });
    }

    return segments;
};

export const getInitialVersionDifferenceSummary =
    (): VersionDifferenceSummary => ({
        message: 'Initial version',
        segments: [],
    });

export const buildVersionDifferenceSummary = (
    compareResult?: CompareSummary | null
): VersionDifferenceSummary => {
    if (!compareResult) {
        return {
            message: 'Reviewing changes...',
            segments: [],
        };
    }

    const tableSegments = buildSegments({
        added: compareResult.summary.tables.added,
        removed: compareResult.summary.tables.removed,
        changed: compareResult.summary.tables.changed,
        label: 'table',
    });

    if (tableSegments.length > 0) {
        return {
            message: tableSegments.map((segment) => segment.label).join(' '),
            segments: tableSegments,
        };
    }

    const relationshipSegments = buildSegments({
        added: compareResult.summary.relationships.added,
        removed: compareResult.summary.relationships.removed,
        changed: compareResult.summary.relationships.changed,
        label: 'relationship',
    });

    if (relationshipSegments.length > 0) {
        return {
            message: relationshipSegments
                .map((segment) => segment.label)
                .join(' '),
            segments: relationshipSegments,
        };
    }

    const fieldSegments = buildSegments({
        added: compareResult.summary.fields.added,
        removed: compareResult.summary.fields.removed,
        changed: compareResult.summary.fields.changed,
        label: 'field',
    });

    if (fieldSegments.length > 0) {
        return {
            message: fieldSegments.map((segment) => segment.label).join(' '),
            segments: fieldSegments,
        };
    }

    return {
        message: 'Only visual changes',
        segments: [],
    };
};
