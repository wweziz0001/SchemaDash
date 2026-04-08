import React from 'react';
import { Badge } from '@/components/badge/badge';
import { History } from 'lucide-react';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import {
    getChangelogEntryTitle,
    getChangelogEventLabel,
} from '@/lib/diagram-workflow/changelog-entry-format';
import {
    formatVersionRelativeTime,
    formatVersionTimestamp,
    getVersionDisplayLabel,
} from '@/lib/diagram-workflow/version-labels';

export const VersionViewBadge: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const version =
        workflow?.compareSourceKind === 'version'
            ? workflow.compareVersion
            : undefined;
    const changelogEntry =
        workflow?.compareSourceKind === 'changelog'
            ? workflow.compareChangelogEntry
            : undefined;

    if (!version && !changelogEntry) {
        return null;
    }

    const stateLabel = 'Diff Baseline';
    const label = version
        ? getVersionDisplayLabel(version)
        : getChangelogEntryTitle(changelogEntry!);
    const relativeTime = formatVersionRelativeTime(
        version?.createdAt ?? changelogEntry!.createdAt
    );
    const timestamp = formatVersionTimestamp(
        version?.createdAt ?? changelogEntry!.createdAt
    );
    const entryKindLabel = version
        ? 'Snapshot'
        : getChangelogEventLabel(changelogEntry!.eventType);

    return (
        <div className="inline-flex max-w-full flex-col items-start gap-2 rounded-2xl border border-pink-200 bg-gradient-to-r from-pink-50 via-pink-50 to-rose-50 px-3.5 py-2 shadow-sm dark:border-pink-900 dark:from-pink-950/40 dark:via-pink-950/25 dark:to-rose-950/20">
            <div className="flex max-w-full flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-pink-800 dark:text-pink-100">
                    <History className="size-3" />
                    {entryKindLabel}
                </span>
                <Badge className="border-pink-300 bg-pink-500 text-white hover:bg-pink-500 dark:border-pink-600">
                    {stateLabel}
                </Badge>
                <Badge variant="secondary">Immutable</Badge>
                <Badge
                    variant="outline"
                    className="max-w-64 bg-background/80"
                    title={label}
                >
                    <span className="truncate">{label}</span>
                </Badge>
                <Badge variant="outline" className="bg-background/80">
                    {relativeTime}
                </Badge>
            </div>
            <Badge
                variant="outline"
                className="bg-background/80"
                title={timestamp}
            >
                Saved {timestamp}
            </Badge>
        </div>
    );
};
