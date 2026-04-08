import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import { EmptyState } from '@/components/empty-state/empty-state';
import { Input } from '@/components/input/input';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { CreateVersionDialog } from '@/dialogs/create-version-dialog/create-version-dialog';
import { RestoreVersionDialog } from '@/dialogs/restore-version-dialog/restore-version-dialog';
import type { DiagramWorkflowVersionSummary } from '@/lib/api/diagram-workflow-client';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { compareCanonicalSchemas } from '@schemadash/schema-sync-core/compare';
import { formatVersionRelativeTime } from '@/lib/diagram-workflow/version-labels';
import {
    buildVersionDifferenceSummary,
    getInitialVersionDifferenceSummary,
} from '@/lib/diagram-workflow/version-difference-summary';
import { getAuthoritativeVersionCanonicalSchema } from '@/lib/diagram-workflow/version-canonical';
import { cn } from '@/lib/utils';
import { Clock3, GitBranch, Plus, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VersionListItem } from './version-list-item';

export interface VersionTabProps {}

const getDevelopmentStatus = ({
    activeMode,
    compareSourceKind,
}: {
    activeMode: string | undefined;
    compareSourceKind: 'live' | 'version' | 'changelog' | null | undefined;
}) => {
    if (activeMode === 'development') {
        return {
            label: 'Current',
            secondaryLabel: 'Editable',
            tone: 'current' as const,
            description: 'Current editable version',
        };
    }

    if (activeMode === 'compare' && compareSourceKind === 'version') {
        return {
            label: 'Viewing',
            secondaryLabel: 'Diff target',
            tone: 'viewing' as const,
            description:
                'Development is shown as the editable target beside a historical snapshot.',
        };
    }

    if (activeMode === 'compare' && compareSourceKind === 'changelog') {
        return {
            label: 'Viewing',
            secondaryLabel: 'Diff target',
            tone: 'viewing' as const,
            description:
                'Development is shown as the editable target beside a historical changelog state.',
        };
    }

    if (activeMode === 'version') {
        return {
            label: 'Current',
            secondaryLabel: 'Editable',
            tone: 'muted' as const,
            description:
                'Development stays editable while you review a stored version.',
        };
    }

    if (activeMode === 'compare') {
        return {
            label: 'Viewing',
            secondaryLabel: 'Editable head',
            tone: 'viewing' as const,
            description:
                'Development is being compared in a read-only workflow, but it remains the mutable head.',
        };
    }

    return {
        label: 'Current',
        secondaryLabel: 'Editable',
        tone: 'muted' as const,
        description: 'Development is the mutable head for ongoing schema work.',
    };
};

export const VersionTab: React.FC<VersionTabProps> = () => {
    const workflow = useOptionalDiagramWorkflow();
    const { t } = useTranslation();
    const [filterText, setFilterText] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [restoreVersion, setRestoreVersion] =
        useState<DiagramWorkflowVersionSummary>();

    const canCreateVersion =
        workflow?.workflow?.diagramAccess === 'edit' ||
        workflow?.workflow?.diagramAccess === 'owner';

    const versions = useMemo(
        () =>
            [...(workflow?.versions ?? [])].sort(
                (left, right) =>
                    new Date(right.createdAt).getTime() -
                    new Date(left.createdAt).getTime()
            ),
        [workflow?.versions]
    );

    useEffect(() => {
        if (!workflow?.ensureVersionRecord) {
            return;
        }

        const missingVersionIds = versions
            .map((version) => version.id)
            .filter((versionId) => !workflow.versionRecords[versionId]);

        if (missingVersionIds.length === 0) {
            return;
        }

        void Promise.all(
            missingVersionIds.map((versionId) =>
                workflow.ensureVersionRecord(versionId)
            )
        );
    }, [versions, workflow]);

    const filteredVersions = useMemo(() => {
        const normalizedFilter = filterText.trim().toLowerCase();

        if (!normalizedFilter) {
            return versions;
        }

        return versions.filter((version) => {
            const searchableText = [
                version.name,
                version.versionLabel,
                version.description,
                version.createdBy?.displayName,
                version.createdBy?.email,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return searchableText.includes(normalizedFilter);
        });
    }, [filterText, versions]);

    const latestVersion = versions[0];
    const versionDifferenceSummaries = useMemo(() => {
        const summaries = new Map<
            string,
            ReturnType<typeof buildVersionDifferenceSummary>
        >();

        versions.forEach((version, index) => {
            const previousVersion = versions[index + 1];

            if (!previousVersion) {
                summaries.set(version.id, getInitialVersionDifferenceSummary());
                return;
            }

            const currentRecord = workflow?.versionRecords[version.id];
            const previousRecord = workflow?.versionRecords[previousVersion.id];

            if (!currentRecord || !previousRecord) {
                return;
            }

            const compareResult = compareCanonicalSchemas({
                baseline:
                    getAuthoritativeVersionCanonicalSchema(previousRecord),
                target: getAuthoritativeVersionCanonicalSchema(currentRecord),
            });

            summaries.set(
                version.id,
                buildVersionDifferenceSummary(compareResult)
            );
        });

        return summaries;
    }, [versions, workflow?.versionRecords]);
    const developmentStatus = getDevelopmentStatus({
        activeMode: workflow?.activeMode,
        compareSourceKind: workflow?.compareSourceKind,
    });
    const latestCaptureLabel = latestVersion
        ? formatVersionRelativeTime(latestVersion.createdAt)
        : 'No saved versions yet';

    return (
        <>
            <div className="flex flex-1 flex-col overflow-hidden px-2 pb-2">
                <div className="space-y-3 pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder={t(
                                    'side_panel.versions_section.filter'
                                )}
                                className="h-10 rounded-xl border bg-background px-9 focus-visible:ring-1"
                                value={filterText}
                                onChange={(event) =>
                                    setFilterText(event.target.value)
                                }
                            />
                            {filterText ? (
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                    onClick={() => setFilterText('')}
                                    aria-label={t(
                                        'side_panel.versions_section.clear'
                                    )}
                                >
                                    <X className="size-4" />
                                </button>
                            ) : null}
                        </div>
                        {canCreateVersion ? (
                            <Button
                                variant="secondary"
                                className="h-10 gap-2 rounded-xl px-3 text-xs font-semibold"
                                onClick={() => setCreateOpen(true)}
                            >
                                <Plus className="size-4" />
                                {t('side_panel.versions_section.add_version')}
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-1 flex-col overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="space-y-4 pb-2">
                            <article
                                className={cn(
                                    'rounded-2xl border bg-card shadow-sm transition-all',
                                    workflow?.activeMode === 'development'
                                        ? 'border-emerald-300 bg-emerald-50/70 shadow-[0_0_0_1px_rgba(16,185,129,0.14)] dark:border-emerald-700 dark:bg-emerald-950/20'
                                        : 'border-border bg-card'
                                )}
                            >
                                <button
                                    type="button"
                                    className="flex w-full items-start gap-3 p-4 text-left"
                                    onClick={() =>
                                        workflow?.setActiveMode('development')
                                    }
                                >
                                    <div
                                        className={cn(
                                            'flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-emerald-700 shadow-sm dark:text-emerald-300',
                                            workflow?.activeMode ===
                                                'development' &&
                                                'border-emerald-300 bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40'
                                        )}
                                    >
                                        <GitBranch className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-3">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Badge className="border-emerald-300 bg-emerald-500 text-white hover:bg-emerald-500 dark:border-emerald-600">
                                                        {
                                                            developmentStatus.label
                                                        }
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        {
                                                            developmentStatus.secondaryLabel
                                                        }
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        Mutable head
                                                    </Badge>
                                                </div>
                                                <div className="text-sm font-semibold text-foreground">
                                                    Development
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {
                                                        developmentStatus.description
                                                    }
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock3 className="size-3.5" />
                                                <span>
                                                    Last capture{' '}
                                                    {latestCaptureLabel}
                                                </span>
                                            </div>
                                        </div>
                                        {/*                                         <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            <span>
                                                The only editable surface
                                            </span>
                                            <span>
                                                Open saved versions in read-only
                                                mode
                                            </span>
                                            {latestVersion ? (
                                                <span
                                                    title={formatVersionTimestamp(
                                                        latestVersion.createdAt
                                                    )}
                                                >
                                                    Latest snapshot{' '}
                                                    {latestVersion.versionLabel}
                                                </span>
                                            ) : null}
                                        </div> */}
                                    </div>
                                </button>
                            </article>

                            {versions.length === 0 ? (
                                <EmptyState
                                    title={t(
                                        'side_panel.versions_section.empty_state.title'
                                    )}
                                    description={t(
                                        'side_panel.versions_section.empty_state.description'
                                    )}
                                    className="mt-10"
                                    secondaryAction={
                                        canCreateVersion
                                            ? {
                                                  label: t(
                                                      'side_panel.versions_section.add_version'
                                                  ),
                                                  onClick: () =>
                                                      setCreateOpen(true),
                                              }
                                            : undefined
                                    }
                                />
                            ) : filterText && filteredVersions.length === 0 ? (
                                <div className="mt-10 flex flex-col items-center gap-2">
                                    <div className="text-sm text-muted-foreground">
                                        {t(
                                            'side_panel.versions_section.no_results'
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setFilterText('')}
                                        className="gap-1"
                                    >
                                        <X className="size-3.5" />
                                        {t('side_panel.versions_section.clear')}
                                    </Button>
                                </div>
                            ) : (
                                filteredVersions.map((version) => (
                                    <VersionListItem
                                        key={version.id}
                                        version={version}
                                        differenceSummary={versionDifferenceSummaries.get(
                                            version.id
                                        )}
                                        active={
                                            workflow?.activeMode ===
                                                'version' &&
                                            workflow.selectedVersion?.id ===
                                                version.id
                                        }
                                        compareBaseline={
                                            workflow?.compareSourceKind ===
                                                'version' &&
                                            workflow.compareVersion?.id ===
                                                version.id
                                        }
                                        onOpen={() =>
                                            workflow?.openVersion(version.id)
                                        }
                                    />
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            <CreateVersionDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={async () => {
                    await workflow?.refreshWorkflow();
                }}
            />

            <RestoreVersionDialog
                open={!!restoreVersion}
                version={restoreVersion}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setRestoreVersion(undefined);
                    }
                }}
            />
        </>
    );
};
