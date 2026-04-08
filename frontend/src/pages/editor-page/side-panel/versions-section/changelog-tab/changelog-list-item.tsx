import React from 'react';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import type { DiagramWorkflowChangelogSummary } from '@/lib/api/diagram-workflow-client';
import {
    getChangelogActorLabel,
    getChangelogChangeHighlights,
    getChangelogEntryCaption,
    getChangelogEntryRelativeTime,
    getChangelogEntryShortId,
    getChangelogSaveCountLabel,
} from '@/lib/diagram-workflow/changelog-entry-format';
import { cn } from '@/lib/utils';
import { Eye, GitCompareArrows } from 'lucide-react';

export interface ChangelogListItemProps {
    entry: DiagramWorkflowChangelogSummary;
    active: boolean;
    compareBaseline: boolean;
    onOpen: () => void;
    onCompare: () => void;
}

export const ChangelogListItem: React.FC<ChangelogListItemProps> = ({
    entry,
    active,
    compareBaseline,
    onOpen,
    onCompare,
}) => {
    const highlights = getChangelogChangeHighlights(entry);
    const caption = getChangelogEntryCaption(entry);

    return (
        <article
            className={cn(
                'rounded-2xl border bg-card shadow-sm transition-all',
                active &&
                    'border-pink-300 bg-pink-50/70 shadow-[0_0_0_1px_rgba(236,72,153,0.12)] dark:border-pink-700 dark:bg-pink-950/20',
                compareBaseline &&
                    !active &&
                    'border-sky-300 bg-sky-50/70 shadow-[0_0_0_1px_rgba(14,165,233,0.12)] dark:border-sky-700 dark:bg-sky-950/20'
            )}
        >
            <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-pink-100 text-xs font-semibold text-pink-600 dark:bg-pink-950/40 dark:text-pink-300">
                                {(
                                    getChangelogActorLabel(entry)[0] ?? 'S'
                                ).toUpperCase()}
                            </div>
                            <div className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                                {getChangelogActorLabel(entry)}
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {active ? (
                            <Badge className="border-pink-300 bg-pink-500 text-white hover:bg-pink-500 dark:border-pink-700">
                                Viewing
                            </Badge>
                        ) : null}
                        {compareBaseline ? (
                            <Badge className="border-sky-300 bg-sky-500 text-white hover:bg-sky-500 dark:border-sky-700">
                                Diff
                            </Badge>
                        ) : null}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {getChangelogEntryShortId(entry)}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    {highlights.map((highlight) => (
                        <span
                            key={`${entry.id}-${highlight.text}`}
                            className={cn(
                                highlight.tone === 'positive' &&
                                    'font-medium text-emerald-600 dark:text-emerald-400',
                                highlight.tone === 'negative' &&
                                    'font-medium text-rose-600 dark:text-rose-400',
                                highlight.tone === 'warning' &&
                                    'font-medium text-amber-600 dark:text-amber-400',
                                highlight.tone === 'neutral' &&
                                    'text-slate-700 dark:text-slate-200'
                            )}
                        >
                            {highlight.text}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex min-w-0 items-center gap-2">
                        <span>{getChangelogSaveCountLabel(entry)}</span>
                        {caption ? <span>{caption}</span> : null}
                    </div>
                    <span className="shrink-0">
                        {getChangelogEntryRelativeTime(entry)}
                    </span>
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
        </article>
    );
};
