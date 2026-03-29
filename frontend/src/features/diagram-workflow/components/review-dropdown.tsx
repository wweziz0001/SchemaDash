import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/button/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import { MigrationDialog } from './migration-dialog';
import { ReviewChangesDialog } from './review-changes-dialog';

export const ReviewDropdown: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const [reviewOpen, setReviewOpen] = useState(false);
    const [migrationOpen, setMigrationOpen] = useState(false);

    if (
        !workflow?.diagramId ||
        !workflow.compareModeEnabled ||
        workflow.compareSourceKind !== 'live'
    ) {
        return null;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        Review
                        <ChevronDown className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => setReviewOpen(true)}>
                        Review Changes
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setMigrationOpen(true)}>
                        Migration
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

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
