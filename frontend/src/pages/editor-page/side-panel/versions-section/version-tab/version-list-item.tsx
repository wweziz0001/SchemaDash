import React from 'react';
import { Badge } from '@/components/badge/badge';
import { cn } from '@/lib/utils';
import type { DiagramWorkflowVersionSummary } from '@/lib/api/diagram-workflow-client';
import {
    formatVersionRelativeTime,
    formatVersionTimestamp,
    getVersionDisplayLabel,
    getVersionOriginLabel,
} from '@/lib/diagram-workflow/version-labels';
import { ArrowRight, History } from 'lucide-react';

export interface VersionListItemProps {
    version: DiagramWorkflowVersionSummary;
    active?: boolean;
    compareBaseline?: boolean;
    onOpen: () => void;
}

export const VersionListItem: React.FC<VersionListItemProps> = ({
    version,
    active = false,
    compareBaseline = false,
    onOpen,
}) => {
    const relativeTime = formatVersionRelativeTime(version.createdAt);
    const absoluteTime = formatVersionTimestamp(version.createdAt);

    return (
        <article
            className={cn(
                'group rounded-2xl border bg-card shadow-sm transition-all',
                'hover:border-sky-200 hover:shadow-md dark:hover:border-sky-900',
                active &&
                    'border-pink-400 bg-pink-50/60 shadow-[0_0_0_1px_rgba(236,72,153,0.18)] dark:border-pink-500 dark:bg-pink-950/20',
                compareBaseline &&
                    !active &&
                    'border-sky-300 bg-sky-50/70 shadow-[0_0_0_1px_rgba(14,165,233,0.14)] dark:border-sky-700 dark:bg-sky-950/20'
            )}
        >
            <button
                type="button"
                className="flex w-full items-start gap-3 p-4 text-left"
                onClick={onOpen}
            >
                <div
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-sm transition-colors',
                        active &&
                            'border-pink-300 bg-pink-100 text-pink-700 dark:border-pink-700 dark:bg-pink-950/40 dark:text-pink-100',
                        compareBaseline &&
                            !active &&
                            'border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-100'
                    )}
                >
                    <History className="size-4" />
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline">
                                    {getVersionOriginLabel(version.origin)}
                                </Badge>
                                <Badge variant="secondary">Immutable</Badge>
                                {active ? (
                                    <Badge className="border-pink-300 bg-pink-500 text-white hover:bg-pink-500 dark:border-pink-500">
                                        Viewing
                                    </Badge>
                                ) : null}
                                {compareBaseline ? (
                                    <Badge className="border-sky-300 bg-sky-500 text-white hover:bg-sky-500 dark:border-sky-500">
                                        Diff source
                                    </Badge>
                                ) : null}
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                                {getVersionDisplayLabel(version)}
                            </div>
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                {version.description?.trim() ||
                                    'No description was saved for this snapshot.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span title={absoluteTime}>{absoluteTime}</span>
                        {version.createdBy ? (
                            <span>by {version.createdBy.displayName}</span>
                        ) : null}
                        <span>{relativeTime}</span>
                    </div>
                </div>

                <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
        </article>
    );
};
