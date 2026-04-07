import React, { useState } from 'react';
import { ChevronDown, ClipboardList, Sparkles } from 'lucide-react';
import { Button } from '@/components/button/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
        workflow.activeMode !== 'compare'
    ) {
        return null;
    }

    const canOpenMigration = workflow.compareSourceKind === 'live';
    const reviewLabel =
        workflow.compareSourceKind === 'version'
            ? 'Review version changes'
            : 'Review changes';

    return (
        <>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="relative h-8 gap-1.5 rounded-xl border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 shadow-none hover:bg-sky-100 hover:text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-950/60 dark:hover:text-sky-100"
                    onClick={() => setReviewOpen(true)}
                >
                    <ClipboardList className="size-4" />
                    Review
                    {compareDifferenceCount > 0 ? (
                        <span
                            aria-hidden="true"
                            className="inline-flex min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
                        >
                            {compareDifferenceCount}
                        </span>
                    ) : null}
                </Button>

                {canOpenMigration ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-none"
                            >
                                <Sparkles className="size-4" />
                                Options
                                <ChevronDown className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                Compare workflow
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => setReviewOpen(true)}
                            >
                                {reviewLabel}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => setMigrationOpen(true)}
                            >
                                Migration
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : null}
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
