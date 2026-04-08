import React, { useState } from 'react';
import { Button } from '@/components/button/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useStorage } from '@/hooks/use-storage';
import { persistenceClient } from '@/lib/api/persistence-client';
import { diagramToCanonicalSchema } from '@/lib/schema-sync/canonical-adapters';
import { useToast } from '@/components/toast/use-toast';
import type { DiagramWorkflowVersionSummary } from '@/lib/api/diagram-workflow-client';
import { diagramWorkflowClient } from '@/lib/api/diagram-workflow-client';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import {
    getRestoreFailureMessage,
    getRestoreSuccessDescription,
    getRestoreVersionHeading,
} from '@/lib/diagram-workflow/restore-messages';
import { RotateCcw } from 'lucide-react';
import { RestoreWarningPanel } from './restore-warning-panel';

const mergeWorkflowVersions = ({
    currentVersions,
    incomingVersions,
}: {
    currentVersions: DiagramWorkflowVersionSummary[];
    incomingVersions: DiagramWorkflowVersionSummary[];
}) => {
    const versionMap = new Map<string, DiagramWorkflowVersionSummary>();

    currentVersions.forEach((item) => {
        versionMap.set(item.id, item);
    });
    incomingVersions.forEach((item) => {
        versionMap.set(item.id, item);
    });

    return [...versionMap.values()].sort(
        (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
    );
};

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
    const { loadDiagramFromData } = useSchemaDash();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
                loadDiagramFromData(refreshedDiagram);
                workflow.setDevelopmentDiagram(refreshedDiagram);
            }

            workflow.setVersions(
                mergeWorkflowVersions({
                    currentVersions: workflow.versions ?? [],
                    incomingVersions:
                        response.result.versions.length > 0
                            ? response.result.versions
                            : [
                                  response.result.restoredVersion,
                                  response.result.safetySnapshotVersion,
                              ],
                })
            );
            workflow.setActiveMode('development');
            onOpenChange(false);
            toast({
                title: 'Development restored',
                description: getRestoreSuccessDescription(response.result),
            });
            void workflow.refreshWorkflow().catch((refreshError) => {
                toast({
                    title: 'Versions updated with limited refresh',
                    description: getRestoreFailureMessage(refreshError),
                    variant: 'destructive',
                });
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

    const confirmDisabled = !version || submitting;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showClose className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Revert to This Version</DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-muted-foreground">
                        Replace Development with{' '}
                        <span className="font-medium text-foreground">
                            {version
                                ? getRestoreVersionHeading(version)
                                : 'the selected version'}
                        </span>
                        . The saved version will remain available afterwards.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
                        <span className="font-medium text-foreground">
                            {version
                                ? getRestoreVersionHeading(version)
                                : 'Selected version'}
                        </span>{' '}
                        will become the new Development state.
                    </div>

                    {version ? <RestoreWarningPanel version={version} /> : null}

                    {errorMessage ? (
                        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    ) : null}
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
                        className="gap-1.5"
                    >
                        <RotateCcw className="size-4" />
                        {submitting ? 'Reverting...' : 'Revert to This Version'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
