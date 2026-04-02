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
import { useToast } from '@/components/toast/use-toast';
import type { DiagramWorkflowVersionSummary } from '@/lib/api/diagram-workflow-client';
import { diagramWorkflowClient } from '@/lib/api/diagram-workflow-client';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import {
    getRestoreConfirmationHint,
    getRestoreFailureMessage,
    getRestoreSuccessDescription,
    getRestoreVersionHeading,
    RESTORE_TO_DEVELOPMENT_CONFIRMATION_TEXT,
} from '@/lib/diagram-workflow/restore-messages';
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
    const { toast } = useToast();
    const [confirmationText, setConfirmationText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setConfirmationText('');
            setErrorMessage(null);
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
        setErrorMessage(null);
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

            const response =
                await diagramWorkflowClient.restoreVersionToDevelopment(
                    workflow.diagramId,
                    version.id,
                    {
                        confirmationText: confirmationText.trim(),
                        baseVersion,
                        sessionId: sessionState?.session.id,
                        currentDevelopmentCanonicalSchema:
                            diagramToCanonicalSchema(
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
            toast({
                title: 'Development restored',
                description: getRestoreSuccessDescription(response.result),
            });
        } catch (error) {
            const message = getRestoreFailureMessage(error);
            setErrorMessage(message);
            toast({
                title: 'Restore failed',
                description: message,
                variant: 'destructive',
            });
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
                    <div className="rounded-xl border bg-muted/15 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                                Source{' '}
                                {version
                                    ? getRestoreVersionHeading(version)
                                    : 'Selected version'}
                            </span>
                            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                                Target Development
                            </span>
                            <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                                Copy, do not mutate snapshot
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Restoring copies the selected immutable version back
                            into the mutable Development head. The stored
                            version itself is never edited.
                        </p>
                    </div>

                    {version ? <RestoreWarningPanel version={version} /> : null}

                    {errorMessage ? (
                        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    ) : null}

                    <div className="space-y-2 rounded-xl border bg-card/60 p-4 shadow-sm">
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
