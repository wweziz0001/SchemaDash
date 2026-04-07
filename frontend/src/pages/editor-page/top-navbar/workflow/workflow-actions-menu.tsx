import React, { useState } from 'react';
import { ChevronDown, ClipboardList } from 'lucide-react';
import { Button } from '@/components/button/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { MigrationDialog } from '@/dialogs/migration-dialog/migration-dialog';
import { ReviewChangesDialog } from '@/dialogs/review-changes-dialog/review-changes-dialog';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { getCompareDifferenceCount } from '@/lib/diagram-workflow/compare-summary';

export const WorkflowActionsMenu: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const [reviewOpen, setReviewOpen] = useState(false);
    const [migrationOpen, setMigrationOpen] = useState(false);
    const compareDifferenceCount = getCompareDifferenceCount(
        workflow?.compareRenderModel?.compareResult
    );

    if (
        !workflow?.diagramId ||
        !workflow.compareModeEnabled ||
        workflow.compareSourceKind !== 'live' ||
        workflow.activeMode !== 'compare'
    ) {
        return null;
    }

    return (
        <>
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="relative h-6 gap-1.5 border-sky-200 bg-sky-50 px-2.5 text-xs font-semibold text-sky-700 shadow-none hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-950/60 dark:hover:text-sky-100"
                        >
                            <ClipboardList className="size-4" />
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
                    <DropdownMenuContent align="center" className="w-40">
                        <DropdownMenuItem onSelect={() => setReviewOpen(true)}>
                            Review Changes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onSelect={() => setMigrationOpen(true)}
                        >
                            Migration
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-6 border-rose-200 bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 shadow-none hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950/60 dark:hover:text-rose-100"
                    onClick={() => workflow.setActiveMode('development')}
                >
                    Finish
                </Button>
            </div>

            <ReviewChangesDialog
                open={reviewOpen}
                onOpenChange={setReviewOpen}
            />
            <MigrationDialog
                open={migrationOpen}
                onOpenChange={setMigrationOpen}
            />
        </>
    );
};
