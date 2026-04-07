import React, { useState } from 'react';
import { Button } from '@/components/button/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { RestoreVersionDialog } from '@/dialogs/restore-version-dialog/restore-version-dialog';
import { cn } from '@/lib/utils';
import {
    ChevronDown,
    Database,
    Eye,
    EyeOff,
    GitBranch,
    GitCompareArrows,
    RotateCcw,
} from 'lucide-react';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { WorkflowActionsMenu } from './workflow-actions-menu';
import { getCompareDifferenceCount } from '@/lib/diagram-workflow/compare-summary';

export const WorkflowModeSwitcher: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const [restoreOpen, setRestoreOpen] = useState(false);

    if (!workflow?.diagramId) {
        return null;
    }

    const versionSource =
        workflow.selectedVersion ??
        (workflow.compareSourceKind === 'version'
            ? workflow.compareVersion
            : undefined);
    const canRestoreVersion =
        workflow.selectedVersion &&
        (workflow.workflow?.diagramAccess === 'edit' ||
            workflow.workflow?.diagramAccess === 'owner');
    const showSnapshotWorkflow = !!versionSource;
    const showCompareButton = workflow.activeMode !== 'compare';
    const compareDifferenceCount = getCompareDifferenceCount(
        workflow.compareRenderModel?.compareResult
    );
    const compareButtonLabel =
        workflow.activeMode === 'compare' &&
        workflow.compareSourceKind === 'version' &&
        workflow.compareVersion
            ? 'Hide Diffs'
            : 'Compare';

    const handleExitCompare = () => {
        if (
            workflow.activeMode === 'compare' &&
            workflow.compareSourceKind === 'version' &&
            workflow.compareVersion
        ) {
            workflow.openVersion(workflow.compareVersion.id);
            return;
        }

        workflow.setActiveMode('development');
    };

    return (
        <>
            <div className="flex min-w-0 items-center">
                <div
                    data-orientation="vertical"
                    role="none"
                    className="mx-2 h-6 w-px shrink-0 bg-border"
                />

                {showSnapshotWorkflow ? (
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Button
                            size="sm"
                            variant={
                                workflow.activeMode === 'development'
                                    ? 'secondary'
                                    : 'outline'
                            }
                            className={cn(
                                'h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-none',
                                workflow.activeMode === 'development' &&
                                    'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60'
                            )}
                            onClick={() =>
                                workflow.setActiveMode('development')
                            }
                        >
                            <GitBranch className="size-3.5" />
                            Development
                        </Button>

                        <Button
                            size="sm"
                            variant={
                                workflow.activeMode === 'compare'
                                    ? 'secondary'
                                    : 'outline'
                            }
                            className={cn(
                                'h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-none',
                                workflow.activeMode === 'compare'
                                    ? 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-950/60'
                                    : 'border-border bg-background text-foreground hover:bg-accent'
                            )}
                            onClick={() => {
                                if (
                                    workflow.activeMode === 'compare' &&
                                    workflow.compareSourceKind === 'version' &&
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
                        >
                            {workflow.activeMode === 'compare' ? (
                                <EyeOff className="size-3.5" />
                            ) : (
                                <Eye className="size-3.5" />
                            )}
                            {workflow.activeMode === 'compare'
                                ? 'Hide Diffs'
                                : 'View Diffs'}
                        </Button>

                        {workflow.activeMode === 'compare' ? (
                            <WorkflowActionsMenu />
                        ) : null}

                        {workflow.activeMode === 'version' &&
                        workflow.selectedVersion ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-none"
                                    >
                                        Options
                                        <ChevronDown className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-64"
                                >
                                    <DropdownMenuLabel>
                                        Snapshot actions
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            workflow.compareVersionToDevelopment(
                                                workflow.selectedVersion!.id
                                            )
                                        }
                                    >
                                        <GitCompareArrows className="mr-2 size-4" />
                                        View Diffs
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        disabled={!canRestoreVersion}
                                        onSelect={() => setRestoreOpen(true)}
                                        className="text-rose-600 focus:text-rose-700 dark:text-rose-300 dark:focus:text-rose-200"
                                    >
                                        <RotateCcw className="mr-2 size-4" />
                                        Revert to This Version
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                    </div>
                ) : (
                    <>
                        <div className="flex h-fit max-h-8 items-center rounded-xl border bg-muted/30 p-0.5">
                            <Button
                                size="sm"
                                variant={
                                    workflow.activeMode === 'live'
                                        ? 'secondary'
                                        : 'ghost'
                                }
                                className={cn(
                                    'h-7 gap-1.5 rounded-[10px] px-3 text-xs font-medium shadow-none',
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
                                    'h-7 gap-1.5 rounded-[10px] px-3 text-xs font-medium shadow-none',
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
                        <div className="flex items-center gap-2">
                            {showCompareButton ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={cn(
                                        'relative h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-none',
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
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-xl border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 shadow-none hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950/60 dark:hover:text-rose-100"
                                        onClick={handleExitCompare}
                                    >
                                        Finish
                                    </Button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {workflow.selectedVersion ? (
                <RestoreVersionDialog
                    open={restoreOpen}
                    version={workflow.selectedVersion}
                    onOpenChange={setRestoreOpen}
                />
            ) : null}
        </>
    );
};
