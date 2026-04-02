import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import { EmptyState } from '@/components/empty-state/empty-state';
import { Input } from '@/components/input/input';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { CreateVersionDialog } from '@/dialogs/create-version-dialog/create-version-dialog';
import { RestoreVersionDialog } from '@/dialogs/restore-version-dialog/restore-version-dialog';
import type { DiagramWorkflowVersionSummary } from '@/lib/api/diagram-workflow-client';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { formatVersionTimestamp } from '@/lib/diagram-workflow/version-labels';
import { History, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VersionListItem } from './version-list-item';

export interface VersionTabProps {}

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

    return (
        <>
            <div className="flex flex-1 flex-col overflow-hidden px-2">
                <div className="flex items-center justify-between gap-4 pb-2">
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder={t(
                                'side_panel.versions_section.filter'
                            )}
                            className="h-8 w-full focus-visible:ring-0"
                            value={filterText}
                            onChange={(event) =>
                                setFilterText(event.target.value)
                            }
                        />
                    </div>
                    {canCreateVersion ? (
                        <Button
                            variant="secondary"
                            className="h-8 gap-1.5 px-2 text-xs"
                            onClick={() => setCreateOpen(true)}
                        >
                            <History className="h-4" />
                            {t('side_panel.versions_section.add_version')}
                        </Button>
                    ) : null}
                </div>

                <div className="rounded-xl border bg-muted/15 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                            {versions.length} snapshot
                            {versions.length === 1 ? '' : 's'}
                        </Badge>
                        <Badge variant="secondary">
                            {workflow?.activeMode === 'version'
                                ? 'Read-only snapshot open'
                                : 'Development remains editable'}
                        </Badge>
                        {latestVersion ? (
                            <Badge variant="outline">
                                Latest{' '}
                                {formatVersionTimestamp(
                                    latestVersion.createdAt
                                )}
                            </Badge>
                        ) : null}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Versions are immutable snapshots. Open them for
                        read-only review, compare them against Development, or
                        restore by copying them back into the mutable head.
                    </p>
                </div>

                <div className="flex flex-1 flex-col overflow-hidden pt-2">
                    <ScrollArea className="h-full">
                        {versions.length === 0 ? (
                            <EmptyState
                                title={t(
                                    'side_panel.versions_section.empty_state.title'
                                )}
                                description={t(
                                    'side_panel.versions_section.empty_state.description'
                                )}
                                className="mt-20"
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
                            <div className="space-y-3 pb-2">
                                {filteredVersions.map((version) => (
                                    <VersionListItem
                                        key={version.id}
                                        version={version}
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
                                        onCompare={() =>
                                            workflow?.compareVersionToDevelopment(
                                                version.id
                                            )
                                        }
                                        onRestore={
                                            canCreateVersion
                                                ? () =>
                                                      setRestoreVersion(version)
                                                : undefined
                                        }
                                    />
                                ))}
                            </div>
                        )}
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
