import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/badge/badge';
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
import { persistenceClient } from '@/lib/api/persistence-client';
import { diagramToCanonicalSchema } from '@/lib/schema-sync/canonical-adapters';
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
import { ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showClose className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Revert to This Version</DialogTitle>
                    <DialogDescription className="text-sm leading-6">
                        Replace the current Development diagram with{' '}
                        <span className="font-medium text-foreground">
                            {version
                                ? getRestoreVersionHeading(version)
                                : 'the selected version'}
                        </span>{' '}
                        while preserving the snapshot itself and creating a
                        safety copy of Development first.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="rounded-2xl border bg-gradient-to-br from-slate-50 via-white to-rose-50/70 p-4 shadow-sm dark:from-slate-950 dark:via-slate-950 dark:to-rose-950/20">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline">
                                        Source snapshot
                                    </Badge>
                                    <Badge variant="secondary">Immutable</Badge>
                                    <Badge variant="outline">
                                        Target Development
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <div className="rounded-2xl border bg-background px-4 py-3 shadow-sm">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                            From
                                        </div>
                                        <div className="pt-1 font-semibold text-foreground">
                                            {version
                                                ? getRestoreVersionHeading(
                                                      version
                                                  )
                                                : 'Selected version'}
                                        </div>
                                    </div>
                                    <div className="flex size-10 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm">
                                        <ArrowRight className="size-4" />
                                    </div>
                                    <div className="rounded-2xl border bg-background px-4 py-3 shadow-sm">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                            To
                                        </div>
                                        <div className="pt-1 font-semibold text-foreground">
                                            Development
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border bg-background px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                                    Safety behavior preserved
                                </div>
                                <p className="pt-2 text-sm text-muted-foreground">
                                    Development is snapshotted automatically
                                    before the revert is applied.
                                </p>
                            </div>
                        </div>
                    </div>

                    {version ? <RestoreWarningPanel version={version} /> : null}

                    {errorMessage ? (
                        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                            {errorMessage}
                        </div>
                    ) : null}

                    <div className="space-y-3 rounded-2xl border bg-card p-4 shadow-sm">
                        <div>
                            <Label htmlFor="restore-confirmation-text">
                                Confirmation text
                            </Label>
                            <p className="pt-1 text-sm text-muted-foreground">
                                This prevents accidental replacement of the
                                current Development state.
                            </p>
                        </div>
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
