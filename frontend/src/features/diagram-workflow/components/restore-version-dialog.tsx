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
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useStorage } from '@/hooks/use-storage';
import { persistenceClient } from '@/features/persistence/api/persistence-client';
import { diagramToCanonicalSchema } from '@/features/schema-sync/lib/canonical-adapters';
import type { DiagramWorkflowVersionSummary } from '../api/diagram-workflow-client';
import { diagramWorkflowClient } from '../api/diagram-workflow-client';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import {
    getRestoreConfirmationHint,
    getRestoreVersionHeading,
    RESTORE_TO_DEVELOPMENT_CONFIRMATION_TEXT,
} from '../lib/restore-messages';
import { RestoreWarningPanel } from './restore-warning-panel';

export interface RestoreVersionDialogProps {
    open: boolean;
    version?: DiagramWorkflowVersionSummary;
    onOpenChange: (open: boolean) => void;
}

export const RestoreVersionDialog: React.FC<RestoreVersionDialogProps> = ({
    open,
    version,
    onOpenChange,
}) => {
    const workflow = useOptionalDiagramWorkflow();
    const storage = useStorage();
    const { updateDiagramData } = useSchemaDash();
    const [confirmationText, setConfirmationText] = useState('');
    const [submitting, setSubmitting] = useState(false);

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

    const handleRestore = async () => {
        if (!version || !workflow?.diagramId || !workflow.developmentDiagram) {
            return;
        }

        setSubmitting(true);
        try {
            const sessionState = await storage.getDiagramSessionState(
                workflow.diagramId
            );
            const persistedDiagram =
                sessionState?.collaboration.document.version === undefined
                    ? await persistenceClient.getDiagram(workflow.diagramId)
                    : null;
            const baseVersion =
                sessionState?.collaboration.document.version ??
                persistedDiagram?.collaboration.document.version;

            if (!baseVersion) {
                return;
            }

            await diagramWorkflowClient.restoreVersionToDevelopment(
                workflow.diagramId,
                version.id,
                {
                    confirmationText: confirmationText.trim(),
                    baseVersion,
                    sessionId: sessionState?.session.id,
                    currentDevelopmentCanonicalSchema: diagramToCanonicalSchema(
                        workflow.developmentDiagram
                    ),
                }
            );

            const refreshedDiagram = await storage.getDiagram(
                workflow.diagramId,
                {
                    includeRelationships: true,
                    includeTables: true,
                    includeDependencies: true,
                    includeAreas: true,
                    includeCustomTypes: true,
                    includeNotes: true,
                }
            );

            if (refreshedDiagram) {
                await updateDiagramData(refreshedDiagram, {
                    forceUpdateStorage: true,
                });
                workflow.setDevelopmentDiagram(refreshedDiagram);
            }

            workflow.setActiveMode('development');
            await workflow.refreshWorkflow();
            onOpenChange(false);
        } finally {
            setSubmitting(false);
        }
    };

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
                        onClick={() => void handleRestore()}
                    >
                        {submitting ? 'Restoring...' : 'Restore to Development'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
