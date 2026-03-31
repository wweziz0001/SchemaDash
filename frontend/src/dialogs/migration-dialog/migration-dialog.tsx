import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
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
import { MetricCard } from '@/components/metric-card/metric-card';
import {
    diagramMigrationClient,
    type DiagramMigrationApplyResponse,
    type DiagramMigrationPreview,
    type DiagramMigrationValidation,
    type DiagramMigrationWorkflowFallback,
} from '@/lib/api/diagram-migration-client';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { useStorage } from '@/hooks/use-storage';
import { ChangePlanSummary } from '@/components/change-plan-summary/change-plan-summary';
import { MigrationWarningList } from './migration-warning-list';

export interface MigrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const FULL_DIAGRAM_LOAD_OPTIONS = {
    includeRelationships: true,
    includeTables: true,
    includeDependencies: true,
    includeAreas: true,
    includeCustomTypes: true,
    includeNotes: true,
} as const;

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const workflow = useOptionalDiagramWorkflow();
    const storage = useStorage();
    const { toast } = useToast();
    const [preview, setPreview] = useState<DiagramMigrationPreview | null>(
        null
    );
    const [validation, setValidation] =
        useState<DiagramMigrationValidation | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [validating, setValidating] = useState(false);
    const [applying, setApplying] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [execution, setExecution] =
        useState<DiagramMigrationApplyResponse | null>(null);
    const [confirmationText, setConfirmationText] = useState('');

    const targetSchema = useMemo(
        () =>
            workflow?.developmentDiagram
                ? diagramToCanonicalSchema(workflow.developmentDiagram)
                : null,
        [workflow?.developmentDiagram]
    );
    const workflowFallback = useMemo<DiagramMigrationWorkflowFallback | null>(
        () =>
            workflow?.workflow?.liveSnapshot || workflow?.workflow?.connectionId
                ? {
                      connectionId: workflow?.workflow?.connectionId ?? null,
                      connectionName:
                          workflow?.workflow?.connectionName ?? null,
                      connectionEngine:
                          workflow?.workflow?.connectionEngine ?? null,
                      importedSchemas:
                          workflow?.workflow?.importedSchemas ?? [],
                      liveSnapshot: workflow?.workflow?.liveSnapshot
                          ? {
                                id: workflow.workflow.liveSnapshot.id,
                                fingerprint:
                                    workflow.workflow.liveSnapshot
                                        .fingerprint ?? null,
                                createdAt:
                                    workflow.workflow.liveSnapshot.createdAt,
                                canonicalSchema:
                                    workflow.workflow.liveSnapshot
                                        .canonicalSchema,
                            }
                          : null,
                  }
                : null,
        [workflow?.workflow]
    );

    const syncCompatibilityMetadata = useCallback(
        async (response: DiagramMigrationApplyResponse) => {
            if (!workflow?.diagramId) {
                return false;
            }

            const existingDiagram = await storage.getDiagram(
                workflow.diagramId,
                FULL_DIAGRAM_LOAD_OPTIONS
            );
            if (!existingDiagram) {
                return false;
            }

            const appliedAt = new Date().toISOString();
            const nextSchemaSync =
                response.result.status === 'succeeded' &&
                response.result.postApplySnapshotId
                    ? {
                          ...(existingDiagram.schemaSync ?? {}),
                          connectionId:
                              workflow.workflow?.connectionId ??
                              existingDiagram.schemaSync?.connectionId,
                          importedSchemas:
                              workflow.workflow?.importedSchemas ??
                              existingDiagram.schemaSync?.importedSchemas,
                          baselineSnapshotId:
                              response.result.postApplySnapshotId,
                          baselineFingerprint:
                              response.validation.plan.targetFingerprint,
                          lastImportedAt: appliedAt,
                          lastPreviewPlanId: null,
                          lastPreviewedAt: null,
                          lastAuditId: response.result.auditId,
                          lastPostApplySnapshotId:
                              response.result.postApplySnapshotId,
                      }
                    : {
                          ...(existingDiagram.schemaSync ?? {}),
                          lastAuditId: response.result.auditId,
                          lastPostApplySnapshotId:
                              response.result.postApplySnapshotId ?? null,
                      };

            await storage.addDiagram({
                diagram: {
                    ...existingDiagram,
                    schemaSync: nextSchemaSync,
                    updatedAt: new Date(appliedAt),
                },
            });

            return true;
        },
        [
            storage,
            workflow?.diagramId,
            workflow?.workflow?.connectionId,
            workflow?.workflow?.importedSchemas,
        ]
    );

    const loadPreview = useCallback(async () => {
        if (!workflow?.diagramId || !targetSchema) {
            setPreview(null);
            setValidation(null);
            setExecution(null);
            return;
        }

        setLoadingPreview(true);
        setLoadError(null);
        try {
            const response = await diagramMigrationClient.previewMigration(
                workflow.diagramId,
                {
                    targetSchema,
                    expectedLiveSnapshotId:
                        workflow.workflow?.liveSnapshotId ?? null,
                    workflowFallback,
                }
            );
            setPreview(response.preview);
            setValidation(null);
            setExecution(null);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to generate the migration preview.';
            setLoadError(message);
            setPreview(null);
            setValidation(null);
            setExecution(null);
        } finally {
            setLoadingPreview(false);
        }
    }, [
        targetSchema,
        workflow?.diagramId,
        workflow?.workflow?.liveSnapshotId,
        workflowFallback,
    ]);

    useEffect(() => {
        if (!open) {
            return;
        }

        if (!workflow?.diagramId || !targetSchema) {
            setPreview(null);
            setValidation(null);
            return;
        }

        void loadPreview();
    }, [
        open,
        targetSchema,
        workflow?.diagramId,
        workflow?.workflow?.liveSnapshotId,
        loadPreview,
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
                    workflowFallback,
                }
            );
            setPreview(response.validation);
            setValidation(response.validation);
            setExecution(null);
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

    const requiresDestructiveConfirmation =
        !!preview?.plan?.requiresConfirmation;
    const previewIssues = preview?.issues ?? [];
    const blockingPreviewIssues = previewIssues.filter(
        (issue) => issue.severity === 'blocking'
    ).length;
    const applyDisabled =
        !validation?.readyToApply ||
        applying ||
        !targetSchema ||
        (requiresDestructiveConfirmation &&
            confirmationText.trim() !== 'APPLY DESTRUCTIVE CHANGES');

    const handleApply = async () => {
        if (
            !workflow?.diagramId ||
            !targetSchema ||
            !validation?.readyToApply
        ) {
            return;
        }

        setApplying(true);
        try {
            const response = await diagramMigrationClient.applyMigration(
                workflow.diagramId,
                {
                    targetSchema,
                    expectedLiveSnapshotId:
                        workflow.workflow?.liveSnapshotId ?? null,
                    workflowFallback,
                    destructiveApproval: {
                        confirmed: !requiresDestructiveConfirmation
                            ? true
                            : confirmationText.trim() ===
                              'APPLY DESTRUCTIVE CHANGES',
                        confirmationText,
                    },
                }
            );
            setExecution(response.apply);
            setPreview(response.apply.validation);
            setValidation(response.apply.validation);
            if (response.apply.result.status === 'succeeded') {
                let compatibilityWarning: string | null = null;
                try {
                    await syncCompatibilityMetadata(response.apply);
                } catch (error) {
                    compatibilityWarning =
                        error instanceof Error
                            ? error.message
                            : 'The legacy Schema Sync baseline metadata could not be updated automatically.';
                }
                await workflow.refreshWorkflow();
                toast({
                    title: compatibilityWarning
                        ? 'Migration applied with follow-up warning'
                        : 'Migration applied',
                    description:
                        compatibilityWarning ??
                        'The live database snapshot and legacy Schema Sync baseline were updated after the migration finished successfully.',
                });
            } else {
                try {
                    await syncCompatibilityMetadata(response.apply);
                } catch {
                    // The migration already failed; do not replace the primary failure surface.
                }
                toast({
                    title: 'Migration failed',
                    description:
                        response.apply.result.error ??
                        'The migration did not complete successfully.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to apply the migration.';
            toast({
                title: 'Migration apply failed',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setApplying(false);
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
                        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/15 p-3 shadow-sm">
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
                            <Badge variant="outline">
                                {workflow?.workflow?.connectionName ??
                                    'No bound connection'}
                            </Badge>
                            <Badge variant="outline">
                                {workflow?.workflow?.liveSnapshotId
                                    ? 'Live baseline ready'
                                    : 'Live baseline missing'}
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

                        {!loadingPreview && !preview?.plan ? (
                            <div className="space-y-4">
                                <div className="rounded-xl border bg-card/60 p-4 shadow-sm">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="text-sm font-medium">
                                                Preview unavailable
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                The migration workflow could not
                                                produce a canonical plan yet.
                                                Review the blockers below, then
                                                retry after the live baseline
                                                and connection state are ready.
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => void loadPreview()}
                                            disabled={!targetSchema}
                                        >
                                            Retry Preview
                                        </Button>
                                    </div>

                                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                                        <MetricCard
                                            label="Connection"
                                            value={
                                                preview?.connectionName ??
                                                'Unavailable'
                                            }
                                            detail="Saved connection bound to this workflow."
                                        />
                                        <MetricCard
                                            label="Live snapshot"
                                            value={
                                                preview?.workflowLiveSnapshotId
                                                    ? 'Available'
                                                    : 'Missing'
                                            }
                                            detail="A live baseline is required to produce a reliable plan."
                                        />
                                        <MetricCard
                                            label="Blocking issues"
                                            value={blockingPreviewIssues}
                                            detail="Blocking findings that prevent the preview from being actionable."
                                        />
                                        <MetricCard
                                            label="Generated"
                                            value={
                                                preview?.generatedAt
                                                    ? new Date(
                                                          preview.generatedAt
                                                      ).toLocaleTimeString()
                                                    : 'Not generated'
                                            }
                                            detail={
                                                preview?.generatedAt
                                                    ? new Date(
                                                          preview.generatedAt
                                                      ).toLocaleDateString()
                                                    : 'Preview generation did not complete.'
                                            }
                                        />
                                    </div>
                                </div>

                                <MigrationWarningList
                                    title="Preview blockers and notes"
                                    issues={previewIssues}
                                />
                            </div>
                        ) : null}

                        {preview?.plan ? (
                            <>
                                <div className="rounded-xl border bg-muted/15 p-4 shadow-sm">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge variant="secondary">
                                                    Canonical plan
                                                </Badge>
                                                <Badge variant="outline">
                                                    Baseline Live Database
                                                </Badge>
                                                <Badge variant="outline">
                                                    Target Development
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                The migration workflow turns the
                                                current live baseline and
                                                Development schema into a
                                                previewable, validation-aware
                                                execution plan.
                                            </p>
                                        </div>
                                        <Badge variant="outline">
                                            {preview.connectionName ??
                                                'Connection unavailable'}
                                        </Badge>
                                    </div>
                                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                                        <MetricCard
                                            label="Connection"
                                            value={
                                                preview.connectionName ??
                                                'Unavailable'
                                            }
                                            detail="Target database connection for this migration."
                                        />
                                        <MetricCard
                                            label="Live snapshot"
                                            value={
                                                preview.workflowLiveSnapshotId
                                                    ? 'Ready'
                                                    : 'Missing'
                                            }
                                            detail="The live baseline used to build this canonical plan."
                                        />
                                        <MetricCard
                                            label="Blocking issues"
                                            value={blockingPreviewIssues}
                                            detail="Blocking findings currently attached to the preview."
                                        />
                                        <MetricCard
                                            label="Generated"
                                            value={new Date(
                                                preview.generatedAt
                                            ).toLocaleTimeString()}
                                            detail={new Date(
                                                preview.generatedAt
                                            ).toLocaleDateString()}
                                        />
                                    </div>
                                </div>

                                <ChangePlanSummary plan={preview.plan} />
                                <MigrationWarningList
                                    title="Preview notes, warnings, and blockers"
                                    issues={preview.issues}
                                />

                                <div className="rounded-xl border bg-card/60 p-4 shadow-sm">
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
                                                    className="rounded-xl border bg-background/80 p-4 shadow-sm"
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

                                <div className="rounded-xl border bg-card/60 p-4 shadow-sm">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="text-sm font-medium">
                                                Execution / Apply
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Applying is always explicit. The
                                                migration uses the current
                                                validated plan and updates the
                                                live workflow snapshot only
                                                after success.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => void handleApply()}
                                            disabled={applyDisabled}
                                        >
                                            {applying
                                                ? 'Applying...'
                                                : 'Apply Migration'}
                                        </Button>
                                    </div>

                                    {requiresDestructiveConfirmation ? (
                                        <div className="mt-4 grid gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                                            <label className="text-sm font-medium">
                                                Destructive confirmation text
                                            </label>
                                            <Input
                                                value={confirmationText}
                                                onChange={(event) =>
                                                    setConfirmationText(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="APPLY DESTRUCTIVE CHANGES"
                                            />
                                            <div className="text-xs text-muted-foreground">
                                                Type{' '}
                                                <code>
                                                    APPLY DESTRUCTIVE CHANGES
                                                </code>{' '}
                                                to allow destructive operations.
                                            </div>
                                        </div>
                                    ) : null}

                                    {execution ? (
                                        <div className="mt-4 space-y-4">
                                            <Alert
                                                variant={
                                                    execution.result.status ===
                                                    'failed'
                                                        ? 'destructive'
                                                        : 'default'
                                                }
                                            >
                                                <AlertTitle>
                                                    {execution.result.status ===
                                                    'succeeded'
                                                        ? 'Migration succeeded'
                                                        : 'Migration failed'}
                                                </AlertTitle>
                                                <AlertDescription>
                                                    {execution.result.error ??
                                                        (execution.result
                                                            .executedStatements
                                                            .length > 0
                                                            ? `Executed ${execution.result.executedStatements.length} SQL statement(s).`
                                                            : 'Migration completed without executing any SQL statements.')}
                                                </AlertDescription>
                                            </Alert>

                                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                                <MetricCard
                                                    label="Job ID"
                                                    value={
                                                        execution.result
                                                            .jobId ??
                                                        'Not recorded'
                                                    }
                                                />
                                                <MetricCard
                                                    label="Audit ID"
                                                    value={
                                                        execution.result
                                                            .auditId ??
                                                        'Not recorded'
                                                    }
                                                />
                                                <MetricCard
                                                    label="Post-apply snapshot"
                                                    value={
                                                        execution.result
                                                            .postApplySnapshotId ??
                                                        'Not recorded'
                                                    }
                                                />
                                                <MetricCard
                                                    label="Workflow live snapshot"
                                                    value={
                                                        execution.result
                                                            .updatedLiveSnapshotId ??
                                                        'Not updated'
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="rounded-xl border bg-background/80 p-4 shadow-sm">
                                                    <div className="text-sm font-medium">
                                                        Result logs
                                                    </div>
                                                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                                                        {(execution.result.logs
                                                            .length > 0
                                                            ? execution.result
                                                                  .logs
                                                            : [
                                                                  'No execution logs were returned.',
                                                              ]
                                                        ).map((log) => (
                                                            <div key={log}>
                                                                {log}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border bg-background/80 p-4 shadow-sm">
                                                    <div className="text-sm font-medium">
                                                        Executed SQL
                                                    </div>
                                                    <pre className="mt-2 overflow-x-auto text-xs leading-6 text-muted-foreground">
                                                        <code>
                                                            {execution.result
                                                                .executedStatements
                                                                .length > 0
                                                                ? execution.result.executedStatements.join(
                                                                      '\n\n'
                                                                  )
                                                                : '-- No statements executed.'}
                                                        </code>
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <Separator />

                                <div className="rounded-xl border bg-card/60 p-4 shadow-sm">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-sm font-medium">
                                            SQL preview
                                        </div>
                                        <Badge variant="outline">
                                            {preview.plan.sqlStatements.length}{' '}
                                            statement
                                            {preview.plan.sqlStatements
                                                .length === 1
                                                ? ''
                                                : 's'}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        This preview is generated from the
                                        canonical live baseline and current
                                        Development schema. Execution remains
                                        disabled until the apply workflow is
                                        explicitly confirmed.
                                    </p>
                                    <pre className="mt-4 overflow-x-auto rounded-xl border bg-background/90 p-4 text-xs leading-6 shadow-sm">
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
