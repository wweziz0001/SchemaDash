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

export const WorkflowActionsMenu: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const [reviewOpen, setReviewOpen] = useState(false);
    const [migrationOpen, setMigrationOpen] = useState(false);

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
                            className="h-6 gap-1.5 px-2.5 text-xs font-medium shadow-none"
                        >
                            <ClipboardList className="size-4" />
                            Review
                            <ChevronDown className="size-4" />
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
                    className="h-6 px-2.5 text-xs font-medium shadow-none"
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
