import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/button/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { Input } from '@/components/input/input';
import { Label } from '@/components/label/label';
import type { DiagramWorkflowVersionSummary } from '../api/diagram-workflow-client';
import {
    getRestoreConfirmationHint,
    getRestoreVersionHeading,
    RESTORE_TO_DEVELOPMENT_CONFIRMATION_TEXT,
} from '../lib/restore-messages';
import { RestoreWarningPanel } from './restore-warning-panel';

export interface RestoreVersionDialogProps {
    open: boolean;
    version?: DiagramWorkflowVersionSummary;
    submitting?: boolean;
    errorMessage?: string | null;
    onOpenChange: (open: boolean) => void;
    onConfirm?: (
        version: DiagramWorkflowVersionSummary,
        confirmationText: string
    ) => Promise<void> | void;
}

export const RestoreVersionDialog: React.FC<RestoreVersionDialogProps> = ({
    open,
    version,
    submitting = false,
    errorMessage = null,
    onOpenChange,
    onConfirm,
}) => {
    const [confirmationText, setConfirmationText] = useState('');

    useEffect(() => {
        if (!open) {
            setConfirmationText('');
        }
    }, [open]);

    const confirmDisabled = useMemo(
        () =>
            !version ||
            submitting ||
            confirmationText.trim() !==
                RESTORE_TO_DEVELOPMENT_CONFIRMATION_TEXT,
        [confirmationText, submitting, version]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showClose className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Restore to Development</DialogTitle>
                    <DialogDescription>
                        Review the impact carefully before replacing the current
                        Development document with{' '}
                        {version
                            ? getRestoreVersionHeading(version)
                            : 'the selected version'}
                        .
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {version ? <RestoreWarningPanel version={version} /> : null}

                    {errorMessage ? (
                        <p className="text-sm text-destructive">
                            {errorMessage}
                        </p>
                    ) : null}

                    <div className="space-y-2">
                        <Label htmlFor="restore-confirmation-text">
                            Confirmation text
                        </Label>
                        <Input
                            id="restore-confirmation-text"
                            value={confirmationText}
                            onChange={(event) =>
                                setConfirmationText(event.target.value)
                            }
                            placeholder={
                                RESTORE_TO_DEVELOPMENT_CONFIRMATION_TEXT
                            }
                            autoComplete="off"
                            disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground">
                            {getRestoreConfirmationHint()}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={confirmDisabled}
                        onClick={() => {
                            if (!version || !onConfirm) {
                                return;
                            }

                            void onConfirm(version, confirmationText.trim());
                        }}
                    >
                        {submitting ? 'Restoring...' : 'Restore to Development'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
