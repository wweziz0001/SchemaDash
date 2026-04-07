import React, { useMemo } from 'react';
import { Badge } from '@/components/badge/badge';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import {
    formatVersionRelativeTime,
    formatVersionTimestamp,
    getVersionDisplayLabel,
    getVersionOriginLabel,
} from '@/lib/diagram-workflow/version-labels';
import { cn } from '@/lib/utils';
import { GitBranch, History, Sparkles } from 'lucide-react';

const getModeLabel = (mode: string | undefined) => {
    if (mode === 'live') {
        return 'Live Database';
    }

    if (mode === 'compare') {
        return 'Viewing Diffs';
    }

    if (mode === 'version') {
        return 'Viewing Snapshot';
    }

    return 'Development';
};

const getDevelopmentTimelineCopy = ({
    activeMode,
    compareSourceKind,
}: {
    activeMode: string | undefined;
    compareSourceKind: 'live' | 'version' | null | undefined;
}) => {
    if (activeMode === 'development') {
        return 'Current editable head for ongoing schema work.';
    }

    if (activeMode === 'compare' && compareSourceKind === 'version') {
        return 'Diff target while comparing a historical snapshot against Development.';
    }

    if (activeMode === 'compare') {
        return 'Diff target while reviewing live-to-development changes.';
    }

    if (activeMode === 'version') {
        return 'Still the editable head while you inspect a stored snapshot.';
    }

    return 'Mutable head for the diagram workflow.';
};

export interface ChangelogTabProps {}

export const ChangelogTab: React.FC<ChangelogTabProps> = () => {
    const workflow = useOptionalDiagramWorkflow();
    const latestVersion = workflow?.versions[0];
    const timelineVersions = useMemo(
        () =>
            [...(workflow?.versions ?? [])].sort(
                (left, right) =>
                    new Date(right.createdAt).getTime() -
                    new Date(left.createdAt).getTime()
            ),
        [workflow?.versions]
    );

    return (
        <div className="flex flex-1 flex-col overflow-hidden px-2 pb-2">
            <ScrollArea className="h-full">
                <div className="space-y-4 pb-2">
                    <section className="rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-sky-50/70 p-4 shadow-sm dark:from-slate-950 dark:via-slate-950 dark:to-sky-950/20">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-200">
                                    <Sparkles className="size-3.5" />
                                    Changelog
                                </div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    Follow the flow from Development to stored
                                    snapshots and back again.
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Use this timeline to understand what is
                                    current, what is immutable, and how the
                                    selected snapshot relates to diff review or
                                    a revert.
                                </p>
                            </div>

                            <div className="grid min-w-[180px] gap-2 rounded-2xl border bg-background/90 p-3 shadow-sm">
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                        Active workflow
                                    </div>
                                    <div className="pt-1 text-sm font-semibold text-foreground">
                                        {getModeLabel(workflow?.activeMode)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                        Stored versions
                                    </div>
                                    <div className="pt-1 text-sm font-semibold text-foreground">
                                        {workflow?.versions.length ?? 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border bg-card p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                                Current workflow state
                            </Badge>
                            {workflow?.compareSourceKind === 'version' &&
                            workflow.compareVersion ? (
                                <Badge variant="outline">
                                    Comparing{' '}
                                    {getVersionDisplayLabel(
                                        workflow.compareVersion
                                    )}
                                </Badge>
                            ) : null}
                            {workflow?.selectedVersion ? (
                                <Badge variant="outline">
                                    Viewing{' '}
                                    {getVersionDisplayLabel(
                                        workflow.selectedVersion
                                    )}
                                </Badge>
                            ) : null}
                        </div>
                        <p className="pt-3 text-sm text-muted-foreground">
                            Development remains the mutable head. Stored
                            versions are immutable checkpoints that can be
                            reviewed directly, compared against Development, or
                            copied back into Development with a protected revert
                            flow.
                        </p>
                    </section>

                    <section className="rounded-2xl border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-semibold text-foreground">
                                    Workflow Timeline
                                </div>
                                <div className="pt-1 text-xs text-muted-foreground">
                                    Development first, then the immutable
                                    snapshots captured from it.
                                </div>
                            </div>
                            {latestVersion ? (
                                <Badge variant="outline">
                                    Latest{' '}
                                    {formatVersionRelativeTime(
                                        latestVersion.createdAt
                                    )}
                                </Badge>
                            ) : null}
                        </div>

                        <div className="mt-4 space-y-4">
                            <article className="relative rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
                                <div className="absolute left-5 top-12 h-[calc(100%+1rem)] w-px bg-border/80" />
                                <div className="flex items-start gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300 bg-white text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                                        <GitBranch className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold text-foreground">
                                                Development
                                            </span>
                                            <Badge className="border-emerald-300 bg-emerald-500 text-white hover:bg-emerald-500 dark:border-emerald-600">
                                                {workflow?.activeMode ===
                                                'development'
                                                    ? 'Current'
                                                    : 'Editable'}
                                            </Badge>
                                            <Badge variant="outline">
                                                Mutable head
                                            </Badge>
                                        </div>
                                        <p className="pt-2 text-sm text-muted-foreground">
                                            {getDevelopmentTimelineCopy({
                                                activeMode:
                                                    workflow?.activeMode,
                                                compareSourceKind:
                                                    workflow?.compareSourceKind,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </article>

                            {timelineVersions.length === 0 ? (
                                <div className="rounded-2xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                                    No stored versions yet. Create a version
                                    from Development to start building a usable
                                    history and revert path.
                                </div>
                            ) : (
                                timelineVersions.map((version) => {
                                    const isViewing =
                                        workflow?.activeMode === 'version' &&
                                        workflow.selectedVersion?.id ===
                                            version.id;
                                    const isDiffSource =
                                        workflow?.compareSourceKind ===
                                            'version' &&
                                        workflow.compareVersion?.id ===
                                            version.id;

                                    return (
                                        <article
                                            key={version.id}
                                            className={cn(
                                                'relative rounded-2xl border bg-card p-4 shadow-sm',
                                                isViewing &&
                                                    'border-pink-300 bg-pink-50/70 dark:border-pink-800 dark:bg-pink-950/20',
                                                isDiffSource &&
                                                    !isViewing &&
                                                    'border-sky-300 bg-sky-50/70 dark:border-sky-800 dark:bg-sky-950/20'
                                            )}
                                        >
                                            <div className="absolute left-5 top-12 h-[calc(100%+1rem)] w-px bg-border/80" />
                                            <div className="flex items-start gap-3">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground shadow-sm">
                                                    <History className="size-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-sm font-semibold text-foreground">
                                                            {getVersionDisplayLabel(
                                                                version
                                                            )}
                                                        </span>
                                                        <Badge variant="outline">
                                                            {getVersionOriginLabel(
                                                                version.origin
                                                            )}
                                                        </Badge>
                                                        <Badge variant="secondary">
                                                            Immutable
                                                        </Badge>
                                                        {isViewing ? (
                                                            <Badge className="border-pink-300 bg-pink-500 text-white hover:bg-pink-500 dark:border-pink-600">
                                                                Viewing
                                                            </Badge>
                                                        ) : null}
                                                        {isDiffSource ? (
                                                            <Badge className="border-sky-300 bg-sky-500 text-white hover:bg-sky-500 dark:border-sky-600">
                                                                Diff source
                                                            </Badge>
                                                        ) : null}
                                                    </div>
                                                    <div className="pt-2 text-sm text-muted-foreground">
                                                        {version.description?.trim() ||
                                                            'Saved without a description.'}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-muted-foreground">
                                                        <span>
                                                            {formatVersionRelativeTime(
                                                                version.createdAt
                                                            )}
                                                        </span>
                                                        <span
                                                            title={formatVersionTimestamp(
                                                                version.createdAt
                                                            )}
                                                        >
                                                            {formatVersionTimestamp(
                                                                version.createdAt
                                                            )}
                                                        </span>
                                                        {version.createdBy ? (
                                                            <span>
                                                                by{' '}
                                                                {
                                                                    version
                                                                        .createdBy
                                                                        .displayName
                                                                }
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })
                            )}
                        </div>
                    </section>
                </div>
            </ScrollArea>
        </div>
    );
};
