import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';

export interface MigrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
    open,
    onOpenChange,
}) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl" showClose>
            <DialogHeader>
                <DialogTitle>Migration</DialogTitle>
                <DialogDescription>
                    Migration preview, validation, and execution controls will
                    appear here.
                </DialogDescription>
            </DialogHeader>
        </DialogContent>
    </Dialog>
);
