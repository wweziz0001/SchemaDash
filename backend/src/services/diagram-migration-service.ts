import {
    canonicalSchemaSchema,
    hashCanonicalSchema,
    type ConnectionTestResponse,
    type CanonicalSchema,
    type ChangePlan,
    type RiskWarning,
} from '@schemadash/schema-sync-core';
import type { AppUserRecord } from '../repositories/app-repository.js';
import type { DiagramWorkflowRepository } from '../repositories/diagram-workflow-repository.js';
import type { PersistenceService } from './persistence-service.js';
import type { SchemaSyncClient } from '../schema-sync/client.js';
import { AppError } from '../utils/app-error.js';
import { generateId } from '../utils/id.js';

export type DiagramMigrationIssueSeverity = 'info' | 'warning' | 'blocking';
export type DiagramMigrationCheckStatus = 'passed' | 'warning' | 'failed';

export interface DiagramMigrationIssue {
    code: string;
    severity: DiagramMigrationIssueSeverity;
    title: string;
    message: string;
}

export interface DiagramMigrationCheck {
    code: string;
    label: string;
    status: DiagramMigrationCheckStatus;
    detail: string;
}

export interface DiagramMigrationPreview {
    diagramId: string;
    connectionId: string | null;
    connectionName: string | null;
    workflowLiveSnapshotId: string | null;
    workflowLiveFingerprint: string | null;
    baselineFingerprint: string | null;
    targetFingerprint: string | null;
    generatedAt: string;
    plan: ChangePlan | null;
    issues: DiagramMigrationIssue[];
    canValidate: boolean;
}

export interface DiagramMigrationWorkflowFallback {
    connectionId: string | null;
    connectionName: string | null;
    connectionEngine: string | null;
    importedSchemas: string[];
    liveSnapshot: {
        id: string;
        fingerprint: string | null;
        createdAt: string;
        canonicalSchema: CanonicalSchema;
    } | null;
}

export interface DiagramMigrationValidation extends DiagramMigrationPreview {
    plan: ChangePlan;
    validatedAt: string;
    checks: DiagramMigrationCheck[];
    readyToApply: boolean;
}

export interface DiagramMigrationApplyResult {
    status: 'succeeded' | 'failed';
    jobId: string | null;
    auditId: string | null;
    logs: string[];
    executedStatements: string[];
    error: string | null;
    postApplySnapshotId: string | null;
    updatedLiveSnapshotId: string | null;
}

export interface DiagramMigrationApplyResponse {
    validation: DiagramMigrationValidation;
    result: DiagramMigrationApplyResult;
}

const warningToIssue = (warning: RiskWarning): DiagramMigrationIssue => ({
    code: warning.code,
    severity:
        warning.level === 'blocked'
            ? 'blocking'
            : warning.level === 'warning' || warning.level === 'destructive'
              ? 'warning'
              : 'info',
    title: warning.title,
    message: warning.message,
});

const resolveMigrationActorLabel = (actor?: AppUserRecord | null) =>
    actor?.displayName ?? actor?.email ?? 'workflow-preview';

type RemoteMigrationOperation =
    | 'get_connection'
    | 'test_connection'
    | 'import_live_schema'
    | 'diff_schema';

type RemoteMigrationFailureClassification =
    | 'timeout'
    | 'service_unavailable'
    | 'not_ready'
    | 'invalid_response'
    | 'remote_failure'
    | 'other';

const classifyRemoteMigrationFailure = (
    operation: RemoteMigrationOperation,
    error: unknown
): {
    classification: RemoteMigrationFailureClassification;
    message: string;
} => {
    if (error instanceof AppError) {
        switch (error.code) {
            case 'schema_sync_timeout':
                return {
                    classification: 'timeout',
                    message: error.message,
                };
            case 'schema_sync_service_unavailable':
                return {
                    classification: 'service_unavailable',
                    message: error.message,
                };
            case 'schema_sync_service_not_ready':
                return {
                    classification: 'not_ready',
                    message: error.message,
                };
            case 'schema_sync_invalid_response':
                return {
                    classification: 'invalid_response',
                    message: error.message,
                };
            default:
                return {
                    classification: 'remote_failure',
                    message: error.message,
                };
        }
    }

    return {
        classification: 'other',
        message:
            error instanceof Error
                ? error.message
                : `Unexpected schema sync failure while ${operation}.`,
    };
};

const createRemoteMigrationIssue = (
    prefix: string,
    operation: RemoteMigrationOperation,
    error: unknown,
    fallbackTitle: string,
    fallbackMessage: string
): DiagramMigrationIssue => {
    const failure = classifyRemoteMigrationFailure(operation, error);

    if (failure.classification === 'timeout') {
        return {
            code: `${prefix}_timeout`,
            severity: 'blocking',
            title: 'Schema sync request timed out',
            message: failure.message,
        };
    }

    if (failure.classification === 'service_unavailable') {
        return {
            code: `${prefix}_service_unavailable`,
            severity: 'blocking',
            title: 'Schema sync service unavailable',
            message: failure.message,
        };
    }

    if (failure.classification === 'not_ready') {
        return {
            code: `${prefix}_readiness_failed`,
            severity: 'blocking',
            title: 'Schema sync service not ready',
            message: failure.message,
        };
    }

    if (failure.classification === 'invalid_response') {
        return {
            code: `${prefix}_invalid_response`,
            severity: 'blocking',
            title: 'Schema sync service returned invalid data',
            message: failure.message,
        };
    }

    return {
        code: `${prefix}_failed`,
        severity: 'blocking',
        title: fallbackTitle,
        message: failure.message || fallbackMessage,
    };
};

type PersistedDiagramView = NonNullable<
    ReturnType<PersistenceService['getDiagram']>
>;

interface DiagramSchemaSyncMetadata {
    connectionId?: string;
    baselineSnapshotId?: string;
    baselineFingerprint?: string;
    importedSchemas?: string[];
}

const getDiagramSchemaSyncMetadata = (
    diagram: PersistedDiagramView
): DiagramSchemaSyncMetadata =>
    (diagram.diagram.schemaSync as DiagramSchemaSyncMetadata | undefined) ?? {};

export class DiagramMigrationService {
    constructor(
        private readonly workflowRepository: DiagramWorkflowRepository,
        private readonly persistenceService: PersistenceService,
        private readonly schemaSyncClient: SchemaSyncClient
    ) {}

    async previewMigration(
        diagramId: string,
        input: {
            targetSchema: CanonicalSchema;
            expectedLiveSnapshotId?: string | null;
            workflowFallback?: DiagramMigrationWorkflowFallback | null;
        },
        actor?: AppUserRecord | null
    ): Promise<DiagramMigrationPreview> {
        const diagram = this.requireEditableDiagram(diagramId, actor);

        const targetSchema = canonicalSchemaSchema.parse(input.targetSchema);
        const generatedAt = new Date().toISOString();
        const { state, liveSnapshot } = this.ensureWorkflowStateFromFallback({
            diagramId,
            fallback: input.workflowFallback ?? null,
        });
        const issues: DiagramMigrationIssue[] = [];

        if (!state?.connectionId) {
            issues.push({
                code: 'migration_connection_missing',
                severity: 'blocking',
                title: 'Connection missing',
                message:
                    'Bind this diagram to a saved live database connection before planning a migration.',
            });
        }

        if (!state?.liveSnapshotId || !liveSnapshot) {
            issues.push({
                code: 'migration_live_snapshot_missing',
                severity: 'blocking',
                title: 'Live baseline missing',
                message:
                    'Refresh the live database snapshot before reviewing a migration plan.',
            });
        }

        if (
            input.expectedLiveSnapshotId &&
            state?.liveSnapshotId &&
            state.liveSnapshotId !== input.expectedLiveSnapshotId
        ) {
            issues.push({
                code: 'migration_live_snapshot_changed',
                severity: 'blocking',
                title: 'Compare baseline changed',
                message:
                    'The live compare baseline changed while planning this migration. Refresh the preview before continuing.',
            });
        }

        let plan: ChangePlan | null = null;

        const persistedSchemaSync = getDiagramSchemaSyncMetadata(diagram);
        const persistedBaselineSnapshotId =
            persistedSchemaSync.connectionId === state?.connectionId
                ? (persistedSchemaSync.baselineSnapshotId ?? null)
                : null;
        const persistedBaselineFingerprint =
            persistedSchemaSync.connectionId === state?.connectionId
                ? (persistedSchemaSync.baselineFingerprint ?? null)
                : null;

        let connectionName = state?.connectionNameCache ?? null;
        let schemaSyncOperational = true;
        if (state?.connectionId) {
            try {
                const connection = await this.schemaSyncClient.getConnection(
                    state.connectionId
                );
                if (!connection) {
                    issues.push({
                        code: 'migration_connection_not_found',
                        severity: 'blocking',
                        title: 'Connection not found',
                        message:
                            'The saved connection for this diagram no longer exists.',
                    });
                } else {
                    connectionName = connection.name;
                }
            } catch (error) {
                issues.push(
                    createRemoteMigrationIssue(
                        'migration_connection_lookup',
                        'get_connection',
                        error,
                        'Unable to load connection details',
                        'The schema sync service could not load the saved connection.'
                    )
                );
                schemaSyncOperational = false;
            }
        }

        if (
            state?.connectionId &&
            persistedSchemaSync.connectionId &&
            persistedSchemaSync.connectionId !== state.connectionId
        ) {
            issues.push({
                code: 'migration_schema_sync_connection_mismatch',
                severity: 'blocking',
                title: 'Schema sync baseline is stale',
                message:
                    'The saved schema sync baseline belongs to a different connection. Refresh the live database before planning a migration.',
            });
        }

        if (state?.connectionId && !persistedBaselineSnapshotId) {
            issues.push({
                code: 'migration_baseline_snapshot_missing',
                severity: 'blocking',
                title: 'Baseline snapshot missing',
                message:
                    'Refresh the live database before reviewing a migration plan.',
            });
        }

        if (
            state?.connectionId &&
            persistedBaselineSnapshotId &&
            liveSnapshot &&
            schemaSyncOperational
        ) {
            try {
                const response = await this.schemaSyncClient.diffSchema({
                    baselineSnapshotId: persistedBaselineSnapshotId,
                    targetSchema,
                    actor: resolveMigrationActorLabel(actor),
                });
                plan = response.plan;
                issues.push(...plan.warnings.map(warningToIssue));
                if (
                    plan.blocked &&
                    !plan.warnings.some(
                        (warning) => warning.level === 'blocked'
                    )
                ) {
                    issues.push({
                        code: 'migration_plan_blocked',
                        severity: 'blocking',
                        title: 'Migration plan blocked',
                        message:
                            'The generated migration plan contains blocking changes and cannot be applied automatically.',
                    });
                }
            } catch (error) {
                issues.push(
                    createRemoteMigrationIssue(
                        'migration_plan_generation',
                        'diff_schema',
                        error,
                        'Unable to generate migration plan',
                        'The schema sync service could not generate a migration plan.'
                    )
                );
            }
        }

        return {
            diagramId,
            connectionId: state?.connectionId ?? null,
            connectionName,
            workflowLiveSnapshotId: state?.liveSnapshotId ?? null,
            workflowLiveFingerprint: state?.liveFingerprint ?? null,
            baselineFingerprint:
                persistedBaselineFingerprint ??
                liveSnapshot?.fingerprint ??
                null,
            targetFingerprint:
                plan?.targetFingerprint ?? hashCanonicalSchema(targetSchema),
            generatedAt,
            plan,
            issues,
            canValidate:
                !!plan &&
                !issues.some((issue) => issue.severity === 'blocking'),
        };
    }

    async validateMigration(
        diagramId: string,
        input: {
            targetSchema: CanonicalSchema;
            expectedLiveSnapshotId?: string | null;
            workflowFallback?: DiagramMigrationWorkflowFallback | null;
        },
        actor?: AppUserRecord | null
    ): Promise<DiagramMigrationValidation> {
        const preview = await this.previewMigration(
            diagramId,
            {
                targetSchema: input.targetSchema,
                expectedLiveSnapshotId: input.expectedLiveSnapshotId,
                workflowFallback: input.workflowFallback ?? null,
            },
            actor
        );

        if (!preview.plan) {
            throw new AppError(
                'Unable to validate a migration without a generated plan.',
                409,
                'migration_plan_missing'
            );
        }

        const state = this.workflowRepository.getState(diagramId);
        const diagram = this.requireEditableDiagram(diagramId, actor);
        const checks: DiagramMigrationCheck[] = [];
        const issues = [...preview.issues];
        const validatedAt = new Date().toISOString();

        let connectionResult: ConnectionTestResponse;
        if (state?.connectionId) {
            try {
                connectionResult = await this.schemaSyncClient.testConnection({
                    connectionId: state.connectionId,
                });
            } catch (error) {
                const issue = createRemoteMigrationIssue(
                    'migration_connection_validation',
                    'test_connection',
                    error,
                    'Unable to validate connection',
                    'The schema sync service could not validate the saved connection.'
                );
                connectionResult = {
                    ok: false,
                    error: issue.message,
                    availableSchemas: [],
                };
                issues.push(issue);
            }
        } else {
            connectionResult = {
                ok: false,
                error: 'Connection not configured.',
                availableSchemas: [],
            };
        }
        checks.push({
            code: 'connection_reachable',
            label: 'Connection reachable',
            status: connectionResult.ok ? 'passed' : 'failed',
            detail: connectionResult.ok
                ? `Connected to ${connectionResult.databaseName ?? state?.connectionNameCache ?? 'database'}.`
                : (connectionResult.error ??
                  'Unable to reach the database connection.'),
        });
        if (!connectionResult.ok) {
            issues.push({
                code: 'migration_connection_unreachable',
                severity: 'blocking',
                title: 'Connection unreachable',
                message:
                    connectionResult.error ??
                    'Unable to reach the configured live database connection.',
            });
        }

        const importedSchemas = state?.importedSchemas?.length
            ? state.importedSchemas
            : (getDiagramSchemaSyncMetadata(diagram).importedSchemas ?? []);

        if (state?.connectionId && connectionResult.ok) {
            try {
                const liveImport = await this.schemaSyncClient.importLiveSchema(
                    {
                        connectionId: state.connectionId,
                        schemas: importedSchemas,
                    }
                );
                const baselineMatches =
                    !!preview.baselineFingerprint &&
                    liveImport.fingerprint === preview.baselineFingerprint;
                checks.push({
                    code: 'baseline_snapshot_available',
                    label: 'Baseline snapshot available',
                    status: preview.plan.baselineSnapshotId
                        ? 'passed'
                        : 'failed',
                    detail: preview.plan.baselineSnapshotId
                        ? 'The migration plan is anchored to a stored schema sync baseline.'
                        : 'The migration plan is missing a stored baseline snapshot.',
                });
                checks.push({
                    code: 'live_baseline_match',
                    label: 'Live baseline still matches',
                    status: baselineMatches ? 'passed' : 'failed',
                    detail: baselineMatches
                        ? 'The database still matches the expected live baseline snapshot.'
                        : 'The database drifted since the live baseline was captured. Refresh the live snapshot before applying.',
                });
                if (!baselineMatches) {
                    issues.push({
                        code: 'migration_live_drift_detected',
                        severity: 'blocking',
                        title: 'Live drift detected',
                        message:
                            'The current live schema no longer matches the expected baseline. Refresh Live Database and regenerate the migration plan.',
                    });
                }
            } catch (error) {
                const issue = createRemoteMigrationIssue(
                    'migration_live_drift_validation',
                    'import_live_schema',
                    error,
                    'Unable to validate live baseline',
                    'Unable to validate the live baseline against the schema sync service.'
                );
                checks.push({
                    code: 'baseline_snapshot_available',
                    label: 'Baseline snapshot available',
                    status: 'failed',
                    detail: 'The planned migration baseline snapshot could not be validated.',
                });
                checks.push({
                    code: 'live_baseline_match',
                    label: 'Live baseline still matches',
                    status: 'failed',
                    detail: issue.message,
                });
                issues.push(issue);
            }
        } else {
            checks.push({
                code: 'baseline_snapshot_available',
                label: 'Baseline snapshot available',
                status: preview.plan.baselineSnapshotId ? 'passed' : 'failed',
                detail: preview.plan.baselineSnapshotId
                    ? 'The migration plan is anchored to a stored schema sync baseline.'
                    : 'The planned migration baseline snapshot could not be found.',
            });
        }

        checks.push({
            code: 'plan_blocking_state',
            label: 'Plan has no blocking errors',
            status: preview.plan.blocked ? 'failed' : 'passed',
            detail: preview.plan.blocked
                ? 'The migration plan includes blocked operations.'
                : 'The migration plan passed canonical blocking analysis.',
        });

        const readyToApply =
            !preview.plan.blocked &&
            checks.every((check) => check.status !== 'failed') &&
            !issues.some((issue) => issue.severity === 'blocking');

        return {
            ...preview,
            validatedAt,
            checks,
            issues,
            readyToApply,
            plan: preview.plan,
        };
    }

    async applyMigration(
        diagramId: string,
        input: {
            targetSchema: CanonicalSchema;
            expectedLiveSnapshotId?: string | null;
            workflowFallback?: DiagramMigrationWorkflowFallback | null;
            destructiveApproval: {
                confirmed: boolean;
                confirmationText: string;
            };
        },
        actor?: AppUserRecord | null,
        actorLabel = 'local-user'
    ): Promise<DiagramMigrationApplyResponse> {
        const validation = await this.validateMigration(
            diagramId,
            {
                targetSchema: input.targetSchema,
                expectedLiveSnapshotId: input.expectedLiveSnapshotId,
                workflowFallback: input.workflowFallback ?? null,
            },
            actor
        );

        if (!validation.readyToApply) {
            return {
                validation,
                result: {
                    status: 'failed',
                    jobId: null,
                    auditId: null,
                    logs: [],
                    executedStatements: [],
                    error:
                        validation.issues.find(
                            (issue) => issue.severity === 'blocking'
                        )?.message ?? 'Migration validation did not pass.',
                    postApplySnapshotId: null,
                    updatedLiveSnapshotId: null,
                },
            };
        }

        try {
            const applyResult = await this.schemaSyncClient.applySchema({
                planId: validation.plan.id,
                actor: actorLabel,
                destructiveApproval: input.destructiveApproval,
            });
            const updatedLiveSnapshotId =
                await this.recordPostApplyLiveSnapshot({
                    diagramId,
                    actor,
                    connectionId: validation.plan.connectionId,
                    previousLiveSnapshotId:
                        validation.workflowLiveSnapshotId ?? undefined,
                    postApplySnapshotId:
                        applyResult.postApplySnapshotId ?? null,
                });

            return {
                validation,
                result: {
                    status: 'succeeded',
                    jobId: applyResult.jobId,
                    auditId: applyResult.auditId,
                    logs: applyResult.logs,
                    executedStatements: applyResult.executedStatements,
                    error: applyResult.error ?? null,
                    postApplySnapshotId:
                        applyResult.postApplySnapshotId ?? null,
                    updatedLiveSnapshotId,
                },
            };
        } catch (error) {
            const audit =
                await this.schemaSyncClient.getLatestAuditForChangePlan(
                    validation.plan.id
                );

            return {
                validation,
                result: {
                    status: 'failed',
                    jobId: null,
                    auditId: audit?.id ?? null,
                    logs: audit?.logs ?? [],
                    executedStatements: [],
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Failed to apply the migration plan.',
                    postApplySnapshotId: audit?.postApplySnapshotId ?? null,
                    updatedLiveSnapshotId: null,
                },
            };
        }
    }

    private async recordPostApplyLiveSnapshot({
        diagramId,
        actor,
        connectionId,
        previousLiveSnapshotId,
        postApplySnapshotId,
    }: {
        diagramId: string;
        actor?: AppUserRecord | null;
        connectionId: string;
        previousLiveSnapshotId?: string | null;
        postApplySnapshotId: string | null;
    }): Promise<string | null> {
        if (!postApplySnapshotId) {
            return null;
        }

        const postApplySnapshot =
            await this.schemaSyncClient.getSnapshot(postApplySnapshotId);
        const state = this.workflowRepository.getState(diagramId);
        if (!postApplySnapshot || !state) {
            return null;
        }

        const now = new Date().toISOString();
        const liveSnapshotId = generateId();
        this.workflowRepository.putSnapshot({
            id: liveSnapshotId,
            diagramId,
            snapshotKind: 'live',
            sourceKind: 'apply',
            connectionId,
            fingerprint: postApplySnapshot.fingerprint,
            canonicalSchema: postApplySnapshot.schema,
            diagramDocument: null,
            layoutSource: 'derived',
            basedOnSnapshotId: previousLiveSnapshotId ?? null,
            createdByUserId: actor?.id ?? null,
            createdAt: now,
        });
        this.workflowRepository.putState({
            ...state,
            liveSnapshotId,
            liveFingerprint: postApplySnapshot.fingerprint,
            syncStatus: 'in_sync',
            connectionStatus: 'ok',
            lastSyncedAt: now,
            lastSyncError: null,
            defaultCompareSourceKind: 'live',
            defaultCompareSourceId: liveSnapshotId,
            updatedAt: now,
        });

        return liveSnapshotId;
    }

    private ensureWorkflowStateFromFallback({
        diagramId,
        fallback,
    }: {
        diagramId: string;
        fallback?: DiagramMigrationWorkflowFallback | null;
    }) {
        let state = this.workflowRepository.getState(diagramId);
        let liveSnapshot = state?.liveSnapshotId
            ? (this.workflowRepository.getSnapshot(state.liveSnapshotId) ??
              null)
            : null;

        if (
            (!fallback?.connectionId && !fallback?.liveSnapshot) ||
            (state?.connectionId && state?.liveSnapshotId && liveSnapshot)
        ) {
            return { state, liveSnapshot };
        }

        const now = new Date().toISOString();
        const fallbackSnapshot = fallback?.liveSnapshot ?? null;
        if (
            fallbackSnapshot &&
            !this.workflowRepository.getSnapshot(fallbackSnapshot.id)
        ) {
            this.workflowRepository.putSnapshot({
                id: fallbackSnapshot.id,
                diagramId,
                snapshotKind: 'live',
                sourceKind: 'introspection',
                connectionId: fallback?.connectionId ?? null,
                fingerprint:
                    fallbackSnapshot.fingerprint ??
                    hashCanonicalSchema(fallbackSnapshot.canonicalSchema),
                canonicalSchema: fallbackSnapshot.canonicalSchema,
                diagramDocument: null,
                layoutSource: 'derived',
                basedOnSnapshotId: state?.liveSnapshotId ?? null,
                createdByUserId: null,
                createdAt: fallbackSnapshot.createdAt,
            });
        }

        const existingCreatedAt = state?.createdAt ?? now;
        if (
            !state?.connectionId ||
            !state.liveSnapshotId ||
            !liveSnapshot ||
            (fallback?.connectionId &&
                state.connectionId !== fallback.connectionId) ||
            (fallbackSnapshot &&
                state.liveSnapshotId !== fallbackSnapshot.id &&
                !liveSnapshot)
        ) {
            const nextLiveSnapshotId =
                state?.liveSnapshotId ?? fallbackSnapshot?.id ?? null;
            const nextFingerprint =
                state?.liveFingerprint ??
                fallbackSnapshot?.fingerprint ??
                (fallbackSnapshot
                    ? hashCanonicalSchema(fallbackSnapshot.canonicalSchema)
                    : null);
            this.workflowRepository.putState({
                diagramId,
                connectionId:
                    state?.connectionId ?? fallback?.connectionId ?? null,
                connectionNameCache:
                    state?.connectionNameCache ??
                    fallback?.connectionName ??
                    null,
                connectionEngine:
                    state?.connectionEngine ??
                    fallback?.connectionEngine ??
                    null,
                importedSchemas: state?.importedSchemas?.length
                    ? state.importedSchemas
                    : (fallback?.importedSchemas ?? []),
                liveSnapshotId: nextLiveSnapshotId,
                liveFingerprint: nextFingerprint,
                syncStatus:
                    nextLiveSnapshotId &&
                    (fallback?.connectionId ?? state?.connectionId)
                        ? 'in_sync'
                        : (state?.syncStatus ?? 'disconnected'),
                connectionStatus:
                    fallback?.connectionId || state?.connectionId
                        ? 'ok'
                        : (state?.connectionStatus ?? 'unknown'),
                lastConnectedAt:
                    state?.lastConnectedAt ??
                    fallbackSnapshot?.createdAt ??
                    now,
                lastSyncedAt:
                    state?.lastSyncedAt ?? fallbackSnapshot?.createdAt ?? now,
                lastSyncError: null,
                defaultCompareSourceKind: nextLiveSnapshotId
                    ? 'live'
                    : (state?.defaultCompareSourceKind ?? null),
                defaultCompareSourceId:
                    nextLiveSnapshotId ?? state?.defaultCompareSourceId ?? null,
                createdAt: existingCreatedAt,
                updatedAt: now,
            });
        }

        state = this.workflowRepository.getState(diagramId);
        liveSnapshot = state?.liveSnapshotId
            ? (this.workflowRepository.getSnapshot(state.liveSnapshotId) ??
              null)
            : null;

        return { state, liveSnapshot };
    }

    private requireEditableDiagram(
        diagramId: string,
        actor?: AppUserRecord | null
    ): PersistedDiagramView {
        const diagram = this.persistenceService.getDiagram(diagramId, actor);
        if (diagram.access !== 'edit' && diagram.access !== 'owner') {
            throw new AppError('Diagram not found.', 404, 'DIAGRAM_NOT_FOUND');
        }

        return diagram;
    }
}
