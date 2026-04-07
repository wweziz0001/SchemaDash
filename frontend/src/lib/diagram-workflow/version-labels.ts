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

export const formatVersionRelativeTime = (value: string) => {
    const timestamp = new Date(value).getTime();
    const deltaMs = timestamp - Date.now();
    const deltaMinutes = Math.round(deltaMs / (1000 * 60));
    const relativeFormatter = new Intl.RelativeTimeFormat(undefined, {
        numeric: 'auto',
    });

    if (Math.abs(deltaMinutes) < 60) {
        return relativeFormatter.format(deltaMinutes, 'minute');
    }

    const deltaHours = Math.round(deltaMinutes / 60);
    if (Math.abs(deltaHours) < 24) {
        return relativeFormatter.format(deltaHours, 'hour');
    }

    const deltaDays = Math.round(deltaHours / 24);
    if (Math.abs(deltaDays) < 30) {
        return relativeFormatter.format(deltaDays, 'day');
    }

    const deltaMonths = Math.round(deltaDays / 30);
    if (Math.abs(deltaMonths) < 12) {
        return relativeFormatter.format(deltaMonths, 'month');
    }

    const deltaYears = Math.round(deltaDays / 365);
    return relativeFormatter.format(deltaYears, 'year');
};
