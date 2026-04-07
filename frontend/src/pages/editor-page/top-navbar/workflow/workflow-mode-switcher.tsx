import React, { useMemo, useState } from 'react';
import { Button } from '@/components/button/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { RestoreVersionDialog } from '@/dialogs/restore-version-dialog/restore-version-dialog';
import { ReviewChangesDialog } from '@/dialogs/review-changes-dialog/review-changes-dialog';
import { cn } from '@/lib/utils';
import {
    ChevronDown,
    Database,
    GitBranch,
    GitCompareArrows,
    RotateCcw,
    Tag,
} from 'lucide-react';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { WorkflowActionsMenu } from './workflow-actions-menu';
import { buildCompareRenderModel } from '@/lib/diagram-workflow/compare-render-model';
import { getCompareDifferenceCount } from '@/lib/diagram-workflow/compare-summary';
import { getAuthoritativeVersionCanonicalSchema } from '@/lib/diagram-workflow/version-canonical';
import { getVersionDisplayLabel } from '@/lib/diagram-workflow/version-labels';

export const WorkflowModeSwitcher: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const [reviewOpen, setReviewOpen] = useState(false);
    const [restoreOpen, setRestoreOpen] = useState(false);
    const hasWorkflowChrome = !!workflow?.diagramId;

    const versionSource =
        workflow?.selectedVersion ??
        (workflow?.compareSourceKind === 'version'
            ? workflow?.compareVersion
            : undefined);
    const canRestoreVersion =
        !!workflow?.compareVersion &&
        (workflow?.workflow?.diagramAccess === 'edit' ||
            workflow?.workflow?.diagramAccess === 'owner');
    const showSnapshotWorkflow = !!versionSource;
    const selectedVersionLabel = versionSource
        ? getVersionDisplayLabel(versionSource)
        : '';
    const showCompareButton = workflow?.activeMode !== 'compare';
    const versionPreviewCompareResult = useMemo(() => {
        if (!workflow?.selectedVersion || !workflow.developmentDiagram) {
            return undefined;
        }

        const baselineSchema = getAuthoritativeVersionCanonicalSchema(
            workflow.selectedVersion
        );

        if (!baselineSchema) {
            return undefined;
        }

        return buildCompareRenderModel({
            baselineSchema,
            developmentDiagram: workflow.developmentDiagram,
        }).compareResult;
    }, [workflow?.developmentDiagram, workflow?.selectedVersion]);
    const compareResultForCounts =
        workflow?.activeMode === 'version' && workflow.selectedVersion
            ? versionPreviewCompareResult
            : workflow?.compareRenderModel?.compareResult;
    const compareDifferenceCount = getCompareDifferenceCount(
        compareResultForCounts
    );
    const compareButtonLabel = 'Compare';

    if (!hasWorkflowChrome || !workflow) {
        return null;
    }

    return (
        <>
            <div className="flex min-w-0 items-center">
                <div
                    data-orientation="vertical"
                    role="none"
                    className="mx-2 h-6 w-px shrink-0 bg-border"
                />

                {showSnapshotWorkflow ? (
                    <>
                        <div className="flex h-fit max-h-7 items-center rounded-md border bg-muted/30 p-0">
                            <Button
                                size="sm"
                                variant={
                                    workflow.activeMode === 'version'
                                        ? 'secondary'
                                        : 'outline'
                                }
                                className={cn(
                                    'h-6 gap-1.5 rounded-none rounded-l-[5px] px-2.5 text-xs font-medium shadow-none',
                                    workflow.activeMode === 'version'
                                        ? 'bg-background text-foreground ring-1 ring-border'
                                        : 'text-muted-foreground hover:text-accent-foreground'
                                )}
                                onClick={() => {
                                    if (versionSource) {
                                        workflow.openVersion(versionSource.id);
                                    }
                                }}
                            >
                                <Tag className="size-3.5 text-muted-foreground" />
                                <span className="truncate">
                                    {selectedVersionLabel}
                                </span>
                            </Button>

                            <Button
                                size="sm"
                                variant={
                                    workflow.activeMode === 'development'
                                        ? 'secondary'
                                        : 'ghost'
                                }
                                className={cn(
                                    'h-6 gap-1.5 rounded-none rounded-r-[5px] px-2.5 text-xs font-medium shadow-none',
                                    workflow.activeMode === 'development'
                                        ? 'bg-background text-foreground ring-1 ring-border'
                                        : 'text-muted-foreground hover:text-accent-foreground'
                                )}
                                onClick={() =>
                                    workflow.setActiveMode('development')
                                }
                            >
                                <GitBranch className="size-3.5" />
                                Development
                            </Button>
                        </div>
                        <div
                            data-orientation="vertical"
                            role="none"
                            className="mx-2 h-6 w-px shrink-0 bg-border"
                        />
                        <div className="flex items-center gap-0">
                            {workflow.compareSourceKind !== 'version' ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={cn(
                                        'relative h-6 gap-1.5 rounded-none rounded-[5px] px-2.5 text-xs font-semibold shadow-none',
                                        'border-border bg-background text-foreground hover:bg-accent',
                                        compareDifferenceCount > 0 && 'pr-5'
                                    )}
                                    onClick={() => {
                                        if (
                                            workflow.activeMode === 'compare' &&
                                            workflow.compareSourceKind ===
                                                'version' &&
                                            workflow.compareVersion
                                        ) {
                                            workflow.openVersion(
                                                workflow.compareVersion.id
                                            );
                                            return;
                                        }

                                        if (versionSource) {
                                            workflow.compareVersionToDevelopment(
                                                versionSource.id
                                            );
                                        }
                                    }}
                                    title={
                                        workflow.compareModeEnabled
                                            ? 'Inspect live database versus development in a read-only compare view'
                                            : 'Sync a live database and load a development diagram to enable compare'
                                    }
                                >
                                    <GitCompareArrows className="size-3.5 text-sky-600 dark:text-sky-400" />
                                    <span>{compareButtonLabel}</span>
                                    {compareDifferenceCount > 0 ? (
                                        <span
                                            aria-hidden="true"
                                            className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold leading-none text-white"
                                        >
                                            {compareDifferenceCount}
                                        </span>
                                    ) : null}
                                </Button>
                            ) : (
                                <>
                                    <WorkflowActionsMenu />
                                </>
                            )}

                            {workflow.activeMode === 'compare' &&
                            workflow.compareVersion &&
                            workflow.compareModeEnabled ? (
                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="relative h-6 gap-1.5 border-sky-200 bg-sky-50 px-2.5 text-xs font-semibold text-sky-700 shadow-none hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-950/60 dark:hover:text-sky-100"
                                            >
                                                Review
                                                <ChevronDown className="size-4" />
                                                {compareDifferenceCount > 0 ? (
                                                    <span
                                                        aria-hidden="true"
                                                        className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold leading-none text-white"
                                                    >
                                                        {compareDifferenceCount}
                                                    </span>
                                                ) : null}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="center"
                                            className="w-40"
                                        >
                                            <DropdownMenuItem
                                                onSelect={() =>
                                                    setReviewOpen(true)
                                                }
                                            >
                                                Review Changes
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                disabled={!canRestoreVersion}
                                                onSelect={() =>
                                                    setRestoreOpen(true)
                                                }
                                                className="text-rose-600 focus:text-rose-700 dark:text-rose-300 dark:focus:text-rose-200"
                                            >
                                                <RotateCcw className="mr-2 size-4" />
                                                Revert
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 shadow-none hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950/60 dark:hover:text-rose-100"
                                        onClick={() =>
                                            workflow.openVersion(
                                                workflow.compareVersion.id
                                            )
                                        }
                                    >
                                        Finish
                                    </Button>
                                    <ReviewChangesDialog
                                        open={reviewOpen}
                                        onOpenChange={setReviewOpen}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex h-fit max-h-7 items-center rounded-md border bg-muted/30 p-0">
                            <Button
                                size="sm"
                                variant={
                                    workflow.activeMode === 'live'
                                        ? 'secondary'
                                        : 'ghost'
                                }
                                className={cn(
                                    'h-6 gap-1.5 rounded-none rounded-l-[5px] px-2.5 text-xs font-medium shadow-none',
                                    workflow.activeMode === 'live'
                                        ? 'bg-background text-foreground ring-1 ring-border'
                                        : 'text-muted-foreground hover:text-accent-foreground'
                                )}
                                onClick={() => workflow.setActiveMode('live')}
                                disabled={!workflow.liveModeEnabled}
                                title={
                                    workflow.liveModeEnabled
                                        ? 'Open the last synced live schema snapshot'
                                        : 'Bind and sync a live database to enable this view'
                                }
                            >
                                <Database
                                    className={cn(
                                        'size-3.5',
                                        workflow.activeMode === 'live'
                                            ? 'text-teal-600 dark:text-teal-400'
                                            : 'text-muted-foreground'
                                    )}
                                />
                                <span>Live Database</span>
                            </Button>
                            <Button
                                size="sm"
                                variant={
                                    workflow.activeMode === 'development'
                                        ? 'secondary'
                                        : 'ghost'
                                }
                                className={cn(
                                    'h-6 gap-1.5 rounded-none rounded-r-[5px] px-2.5 text-xs font-medium shadow-none',
                                    workflow.activeMode === 'development'
                                        ? 'bg-background text-foreground ring-1 ring-border'
                                        : 'text-muted-foreground hover:text-accent-foreground'
                                )}
                                onClick={() =>
                                    workflow.setActiveMode('development')
                                }
                            >
                                <GitBranch
                                    className={cn(
                                        'size-3.5',
                                        workflow.activeMode === 'development'
                                            ? 'text-teal-600 dark:text-teal-400'
                                            : 'text-muted-foreground'
                                    )}
                                />
                                <span>Development</span>
                            </Button>
                        </div>
                        <div
                            data-orientation="vertical"
                            role="none"
                            className="mx-2 h-6 w-px shrink-0 bg-border"
                        />
                        <div className="flex items-center gap-0">
                            {showCompareButton ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={cn(
                                        'relative h-6 gap-1.5 rounded-none rounded-[5px] px-2.5 text-xs font-semibold shadow-none',
                                        'border-border bg-background text-foreground hover:bg-accent',
                                        compareDifferenceCount > 0 && 'pr-5'
                                    )}
                                    onClick={() =>
                                        workflow.setActiveMode('compare')
                                    }
                                    disabled={!workflow.compareModeEnabled}
                                    title={
                                        workflow.compareModeEnabled
                                            ? 'Inspect live database versus development in a read-only compare view'
                                            : 'Sync a live database and load a development diagram to enable compare'
                                    }
                                >
                                    <GitCompareArrows className="size-3.5 text-sky-600 dark:text-sky-400" />
                                    <span>{compareButtonLabel}</span>
                                    {compareDifferenceCount > 0 ? (
                                        <span
                                            aria-hidden="true"
                                            className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold leading-none text-white"
                                        >
                                            {compareDifferenceCount}
                                        </span>
                                    ) : null}
                                </Button>
                            ) : (
                                <>
                                    <WorkflowActionsMenu />
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {versionSource ? (
                <RestoreVersionDialog
                    open={restoreOpen}
                    version={versionSource}
                    onOpenChange={setRestoreOpen}
                />
            ) : null}
        </>
    );
};
