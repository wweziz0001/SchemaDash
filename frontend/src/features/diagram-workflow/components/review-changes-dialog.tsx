import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';

export interface ReviewChangesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ReviewChangesDialog: React.FC<ReviewChangesDialogProps> = ({
    open,
    onOpenChange,
}) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl" showClose>
            <DialogHeader>
                <DialogTitle>Review Changes</DialogTitle>
                <DialogDescription>
                    Structured review details will appear here.
                </DialogDescription>
            </DialogHeader>
        </DialogContent>
    </Dialog>
);
