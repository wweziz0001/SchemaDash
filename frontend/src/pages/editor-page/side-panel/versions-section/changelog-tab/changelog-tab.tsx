import React, { useEffect, useMemo } from 'react';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { formatVersionRelativeTime } from '@/lib/diagram-workflow/version-labels';
import { Clock3, Sparkles } from 'lucide-react';
import { ChangelogListItem } from './changelog-list-item';
import { CurrentDevelopmentCard } from './current-development-card';

const getDevelopmentDescription = ({
    activeMode,
    compareSourceKind,
}: {
    activeMode: string | undefined;
    compareSourceKind: 'live' | 'version' | 'changelog' | null | undefined;
}) => {
    if (activeMode === 'development') {
        return 'This is the editable head of the diagram. Direct edits, saves, restores, version actions, live-sync events, and automatic checkpoints all feed the changelog timeline without turning it into a Versions clone.';
    }

    if (activeMode === 'changelog') {
        return 'Development stays mutable while you inspect a read-only point in time from the changelog timeline.';
    }

    if (activeMode === 'compare' && compareSourceKind === 'changelog') {
        return 'Development is the current editable target while you inspect differences from a historical changelog state.';
    }

    if (activeMode === 'compare' && compareSourceKind === 'version') {
        return 'Development is the current editable target while you inspect differences from a saved version.';
    }

    if (activeMode === 'compare') {
        return 'Development remains the editable target while live database differences are under review.';
    }

    return 'Development remains the mutable head even while you review other workflow surfaces.';
};

export interface ChangelogTabProps {}

export const ChangelogTab: React.FC<ChangelogTabProps> = () => {
    const workflow = useOptionalDiagramWorkflow();

    const entries = useMemo(
        () =>
            [...(workflow?.changelogEntries ?? [])].sort(
                (left, right) =>
                    new Date(right.createdAt).getTime() -
                    new Date(left.createdAt).getTime()
            ),
        [workflow?.changelogEntries]
    );

    useEffect(() => {
        if (!workflow?.ensureChangelogRecord) {
            return;
        }

        const missingEntryIds = entries
            .map((entry) => entry.id)
            .filter((entryId) => !workflow.changelogRecords[entryId]);

        if (missingEntryIds.length === 0) {
            return;
        }

        void Promise.all(
            missingEntryIds.map((entryId) =>
                workflow.ensureChangelogRecord(entryId)
            )
        );
    }, [entries, workflow]);

    const latestEntry = entries[0];
    const latestCaptureLabel = latestEntry
        ? formatVersionRelativeTime(latestEntry.createdAt)
        : 'has not been captured yet';

    return (
        <div className="flex flex-1 flex-col overflow-hidden px-2 pb-2">
            <ScrollArea className="h-full">
                <div className="space-y-4 pb-2">
                    <section className="rounded-3xl border bg-gradient-to-br from-slate-50 via-white to-amber-50/60 p-4 shadow-sm dark:from-slate-950 dark:via-slate-950 dark:to-amber-950/20">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200">
                                    <Sparkles className="size-3.5" />
                                    Development Changelog
                                </div>
                                <h2 className="text-sm font-semibold text-foreground">
                                    A timeline of actual Development history.
                                </h2>
                                <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                                    Changelog entries come from ongoing
                                    Development activity such as direct edits,
                                    saves, version actions, live sync, and
                                    revert flows. Versions stay separate as
                                    intentional named milestones.
                                </p>
                            </div>

                            <div className="rounded-2xl border bg-background/90 px-4 py-3 shadow-sm">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                    Timeline entries
                                </div>
                                <div className="pt-1 text-lg font-semibold text-foreground">
                                    {entries.length}
                                </div>
                                <div className="inline-flex items-center gap-1 pt-2 text-xs text-muted-foreground">
                                    <Clock3 className="size-3.5" />
                                    Latest capture {latestCaptureLabel}
                                </div>
                            </div>
                        </div>
                    </section>

                    <CurrentDevelopmentCard
                        active={workflow?.activeMode === 'development'}
                        latestCaptureLabel={latestCaptureLabel}
                        description={getDevelopmentDescription({
                            activeMode: workflow?.activeMode,
                            compareSourceKind: workflow?.compareSourceKind,
                        })}
                        onOpen={() => workflow?.setActiveMode('development')}
                    />

                    {entries.length === 0 ? (
                        <EmptyState
                            title="No changelog entries yet"
                            description="Edit the Development diagram, save it, create a version, or keep working long enough for the first automatic checkpoint to be captured."
                            className="mt-8"
                        />
                    ) : (
                        <div className="space-y-3">
                            {entries.map((entry) => (
                                <ChangelogListItem
                                    key={entry.id}
                                    entry={entry}
                                    active={
                                        workflow?.activeMode === 'changelog' &&
                                        workflow.selectedChangelogEntry?.id ===
                                            entry.id
                                    }
                                    compareBaseline={
                                        workflow?.compareSourceKind ===
                                            'changelog' &&
                                        workflow.compareChangelogEntry?.id ===
                                            entry.id
                                    }
                                    onOpen={() =>
                                        workflow?.openChangelogEntry(entry.id)
                                    }
                                    onCompare={() =>
                                        workflow?.compareChangelogToDevelopment(
                                            entry.id
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
