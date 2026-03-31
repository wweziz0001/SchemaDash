import type {
    DiagramWorkflowVersionOrigin,
    DiagramWorkflowVersionSummary,
} from '@/lib/api/diagram-workflow-client';

export const getVersionDisplayLabel = (
    version: Pick<DiagramWorkflowVersionSummary, 'name' | 'versionLabel'>
) => version.name?.trim() || version.versionLabel;

export const getVersionOriginLabel = (origin: DiagramWorkflowVersionOrigin) => {
    if (origin === 'before_restore') {
        return 'Before Restore';
    }

    if (origin === 'before_apply') {
        return 'Before Apply';
    }

    if (origin === 'milestone') {
        return 'Milestone';
    }

    if (origin === 'system') {
        return 'System';
    }

    return 'Manual';
};

export const formatVersionTimestamp = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
