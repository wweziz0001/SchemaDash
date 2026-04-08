import React from 'react';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import type { DiagramWorkflowChangelogSummary } from '@/lib/api/diagram-workflow-client';
import {
    getChangelogEntryCaption,
    getChangelogEntryTimestamp,
    getChangelogEventLabel,
    getChangelogEntryTitle,
} from '@/lib/diagram-workflow/changelog-entry-format';
import { cn } from '@/lib/utils';
import { Clock3, Eye, GitCompareArrows, History } from 'lucide-react';

export interface ChangelogListItemProps {
    entry: DiagramWorkflowChangelogSummary;
    active: boolean;
    compareBaseline: boolean;
    onOpen: () => void;
    onCompare: () => void;
}

const getChangeLabel = (entry: DiagramWorkflowChangelogSummary) => {
    if (!entry.changeSummary) {
        return 'Initial capture';
    }

    if (!entry.changeSummary.hasChanges) {
        return 'No structural changes';
    }

    return `${entry.changeSummary.totalChanges} changes`;
};

export const ChangelogListItem: React.FC<ChangelogListItemProps> = ({
    entry,
    active,
    compareBaseline,
    onOpen,
    onCompare,
}) => (
    <article
        className={cn(
            'rounded-3xl border bg-card shadow-sm transition-all',
            active &&
                'border-amber-300 bg-amber-50/80 shadow-[0_0_0_1px_rgba(245,158,11,0.12)] dark:border-amber-700 dark:bg-amber-950/20',
            compareBaseline &&
                !active &&
                'border-sky-300 bg-sky-50/80 shadow-[0_0_0_1px_rgba(14,165,233,0.12)] dark:border-sky-700 dark:bg-sky-950/20'
        )}
    >
        <div className="flex items-start gap-3 p-4">
            <div
                className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-background text-muted-foreground shadow-sm',
                    active &&
                        'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300',
                    compareBaseline &&
                        !active &&
                        'border-sky-300 text-sky-700 dark:border-sky-700 dark:text-sky-300'
                )}
            >
                <History className="size-4" />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline">
                        {getChangelogEventLabel(entry.eventType)}
                    </Badge>
                    <Badge variant="secondary">{getChangeLabel(entry)}</Badge>
                    {active ? (
                        <Badge className="border-amber-300 bg-amber-500 text-white hover:bg-amber-500 dark:border-amber-600">
                            Viewing
                        </Badge>
                    ) : null}
                    {compareBaseline ? (
                        <Badge className="border-sky-300 bg-sky-500 text-white hover:bg-sky-500 dark:border-sky-600">
                            Diff baseline
                        </Badge>
                    ) : null}
                </div>

                <div className="space-y-1">
                    <div className="text-sm font-semibold text-foreground">
                        {getChangelogEntryTitle(entry)}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        {entry.summary}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {getChangelogEntryCaption(entry)}
                    </span>
                    <span title={getChangelogEntryTimestamp(entry)}>
                        {getChangelogEntryTimestamp(entry)}
                    </span>
                    {entry.createdBy ? (
                        <span>{entry.createdBy.displayName}</span>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        size="sm"
                        variant={active ? 'secondary' : 'outline'}
                        className="rounded-xl px-3 text-xs font-semibold"
                        onClick={onOpen}
                    >
                        <Eye className="size-3.5" />
                        {active ? 'Viewing' : 'Open'}
                    </Button>
                    <Button
                        size="sm"
                        variant={compareBaseline ? 'secondary' : 'outline'}
                        className="rounded-xl px-3 text-xs font-semibold"
                        onClick={onCompare}
                    >
                        <GitCompareArrows className="size-3.5" />
                        {compareBaseline ? 'Viewing Diffs' : 'View Diffs'}
                    </Button>
                </div>
            </div>
        </div>
    </article>
);
