import React, { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { Separator } from '@/components/separator/separator';
import { diagramToCanonicalSchema } from '@/features/schema-sync/lib/canonical-adapters';
import { useToast } from '@/components/toast/use-toast';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import {
    diagramMigrationClient,
    type DiagramMigrationPreview,
    type DiagramMigrationValidation,
} from '../api/diagram-migration-client';
import { MigrationSummary } from './migration-summary';
import { MigrationWarningList } from './migration-warning-list';

export interface MigrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const workflow = useOptionalDiagramWorkflow();
    const { toast } = useToast();
    const [preview, setPreview] = useState<DiagramMigrationPreview | null>(
        null
    );
    const [validation, setValidation] =
        useState<DiagramMigrationValidation | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [validating, setValidating] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const targetSchema = useMemo(
        () =>
            workflow?.developmentDiagram
                ? diagramToCanonicalSchema(workflow.developmentDiagram)
                : null,
        [workflow?.developmentDiagram]
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        if (!workflow?.diagramId || !targetSchema) {
            setPreview(null);
            setValidation(null);
            return;
        }

        const loadPreview = async () => {
            setLoadingPreview(true);
            setLoadError(null);
            try {
                const response = await diagramMigrationClient.previewMigration(
                    workflow.diagramId!,
                    {
                        targetSchema,
                        expectedLiveSnapshotId:
                            workflow.workflow?.liveSnapshotId ?? null,
                    }
                );
                setPreview(response.preview);
                setValidation(null);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'Failed to generate the migration preview.';
                setLoadError(message);
                setPreview(null);
                setValidation(null);
            } finally {
                setLoadingPreview(false);
            }
        };

        void loadPreview();
    }, [
        open,
        targetSchema,
        workflow?.diagramId,
        workflow?.workflow?.liveSnapshotId,
    ]);

    const handleValidate = async () => {
        if (!workflow?.diagramId || !preview?.plan || !targetSchema) {
            return;
        }

        setValidating(true);
        try {
            const response = await diagramMigrationClient.validateMigration(
                workflow.diagramId,
                {
                    targetSchema,
                    expectedLiveSnapshotId:
                        workflow.workflow?.liveSnapshotId ?? null,
                }
            );
            setPreview(response.validation);
            setValidation(response.validation);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to validate the migration plan.';
            toast({
                title: 'Migration validation failed',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setValidating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex h-[85vh] w-[min(1180px,96vw)] max-w-none flex-col"
                showClose
            >
                <DialogHeader>
                    <DialogTitle>Migration</DialogTitle>
                    <DialogDescription>
                        Review the canonical migration plan, run preflight
                        validation, and confirm readiness before applying
                        changes to the live database.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="min-h-0 flex-1 pr-4">
                    <div className="flex flex-col gap-6 pb-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                                {loadingPreview
                                    ? 'Generating preview'
                                    : preview?.plan
                                      ? 'Preview ready'
                                      : 'Preview unavailable'}
                            </Badge>
                            <Badge variant="outline">
                                {validating
                                    ? 'Validating'
                                    : validation?.readyToApply
                                      ? 'Ready to apply'
                                      : validation
                                        ? 'Validation failed'
                                        : 'Validation pending'}
                            </Badge>
                        </div>

                        {loadError ? (
                            <Alert variant="destructive">
                                <AlertTitle>
                                    Migration preview failed
                                </AlertTitle>
                                <AlertDescription>{loadError}</AlertDescription>
                            </Alert>
                        ) : null}

                        {!targetSchema ? (
                            <Alert>
                                <AlertTitle>
                                    Development schema unavailable
                                </AlertTitle>
                                <AlertDescription>
                                    Load a development diagram before opening
                                    the migration workflow.
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        {preview?.plan ? (
                            <>
                                <MigrationSummary plan={preview.plan} />
                                <MigrationWarningList
                                    title="Preview notes, warnings, and blockers"
                                    issues={preview.issues}
                                />

                                <div className="rounded-lg border p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="text-sm font-medium">
                                                Validation / Preflight
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Confirm that the saved
                                                connection is reachable and that
                                                the live database still matches
                                                the expected baseline before
                                                execution is enabled.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() =>
                                                void handleValidate()
                                            }
                                            disabled={
                                                validating ||
                                                !preview.canValidate
                                            }
                                        >
                                            {validating
                                                ? 'Validating...'
                                                : 'Run Preflight Validation'}
                                        </Button>
                                    </div>

                                    {validation ? (
                                        <div className="mt-4 grid gap-3">
                                            {validation.checks.map((check) => (
                                                <div
                                                    key={check.code}
                                                    className="rounded-md border bg-muted/20 p-3"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="font-medium">
                                                            {check.label}
                                                        </div>
                                                        <Badge
                                                            variant={
                                                                check.status ===
                                                                'failed'
                                                                    ? 'destructive'
                                                                    : check.status ===
                                                                        'warning'
                                                                      ? 'secondary'
                                                                      : 'outline'
                                                            }
                                                        >
                                                            {check.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-2 text-sm text-muted-foreground">
                                                        {check.detail}
                                                    </div>
                                                </div>
                                            ))}
                                            <MigrationWarningList
                                                title="Validation findings"
                                                issues={validation.issues}
                                            />
                                        </div>
                                    ) : null}
                                </div>

                                <Separator />

                                <div className="rounded-lg border p-4">
                                    <div className="text-sm font-medium">
                                        SQL preview
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        This preview is generated from the
                                        canonical live baseline and current
                                        Development schema. Execution remains
                                        disabled until the apply workflow is
                                        explicitly confirmed.
                                    </p>
                                    <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-4 text-xs leading-6">
                                        <code>
                                            {preview.plan.sqlStatements.length >
                                            0
                                                ? preview.plan.sqlStatements.join(
                                                      '\n\n'
                                                  )
                                                : '-- No SQL statements are required for this plan.'}
                                        </code>
                                    </pre>
                                </div>
                            </>
                        ) : loadingPreview ? (
                            <Alert>
                                <AlertTitle>
                                    Generating migration preview
                                </AlertTitle>
                                <AlertDescription>
                                    Building the canonical plan from Live
                                    Database to Development.
                                </AlertDescription>
                            </Alert>
                        ) : null}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
