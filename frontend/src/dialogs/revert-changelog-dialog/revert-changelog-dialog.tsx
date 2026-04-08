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
import { useToast } from '@/components/toast/use-toast';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useStorage } from '@/hooks/use-storage';
import { persistenceClient } from '@/lib/api/persistence-client';
import type { DiagramWorkflowChangelogSummary } from '@/lib/api/diagram-workflow-client';
import { diagramWorkflowClient } from '@/lib/api/diagram-workflow-client';
import {
    getChangelogEntryTitle,
    getChangelogEventLabel,
} from '@/lib/diagram-workflow/changelog-entry-format';
import { diagramToCanonicalSchema } from '@/lib/schema-sync/canonical-adapters';
import { RotateCcw } from 'lucide-react';

export interface RevertChangelogDialogProps {
    open: boolean;
    entry?: DiagramWorkflowChangelogSummary;
    onOpenChange: (open: boolean) => void;
}

export const RevertChangelogDialog: React.FC<RevertChangelogDialogProps> = ({
    open,
    entry,
    onOpenChange,
}) => {
    const workflow = useOptionalDiagramWorkflow();
    const storage = useStorage();
    const { loadDiagramFromData } = useSchemaDash();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleRevert = async () => {
        if (!entry || !workflow?.diagramId || !workflow.developmentDiagram) {
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
                await diagramWorkflowClient.revertChangelogEntryToDevelopment(
                    workflow.diagramId,
                    entry.id,
                    {
                        baseVersion,
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

            workflow.setVersions(response.result.versions);
            workflow.setChangelogEntries(response.result.changelog);
            workflow.setActiveMode('development');
            onOpenChange(false);
            toast({
                title: 'Development reverted',
                description: `Development now reflects ${getChangelogEntryTitle(entry)}. A safety snapshot was created first.`,
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Revert failed. Try refreshing and retrying.';
            setErrorMessage(message);
            toast({
                title: 'Revert failed',
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
                    <DialogTitle>Revert to This Changelog State</DialogTitle>
                    <DialogDescription className="text-sm leading-6 text-muted-foreground">
                        Replace Development with the read-only state captured by
                        this changelog entry. The original timeline stays
                        immutable and a safety snapshot is created first.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-2xl border bg-muted/20 px-4 py-3 text-sm">
                        <span className="font-medium text-foreground">
                            {entry
                                ? getChangelogEntryTitle(entry)
                                : 'Selected state'}
                        </span>{' '}
                        from the{' '}
                        {entry
                            ? getChangelogEventLabel(entry.eventType)
                            : 'changelog'}{' '}
                        entry will become the new Development state.
                    </div>

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
                        onClick={() => void handleRevert()}
                        disabled={!entry || submitting}
                        className="gap-1.5"
                    >
                        <RotateCcw className="size-4" />
                        {submitting
                            ? 'Reverting...'
                            : 'Revert to This Changelog State'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
