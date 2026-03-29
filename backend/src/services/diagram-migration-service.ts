import {
    canonicalSchemaSchema,
    createChangePlan,
    hashCanonicalSchema,
    type CanonicalSchema,
    type ChangePlan,
    type RiskWarning,
} from '@schemadash/schema-sync-core';
import { introspectPostgresSchema } from '../postgres/introspection.js';
import type { AppUserRecord } from '../repositories/app-repository.js';
import type { DiagramWorkflowRepository } from '../repositories/diagram-workflow-repository.js';
import type { MetadataRepository } from '../repositories/metadata-repository.js';
import type { ConnectionsService } from './connections-service.js';
import type { PersistenceService } from './persistence-service.js';
import type { ApplyService } from './apply-service.js';
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

export class DiagramMigrationService {
    constructor(
        private readonly workflowRepository: DiagramWorkflowRepository,
        private readonly metadataRepository: MetadataRepository,
        private readonly persistenceService: PersistenceService,
        private readonly connectionsService: ConnectionsService,
        private readonly applyService: ApplyService
    ) {}

    previewMigration(
        diagramId: string,
        input: {
            targetSchema: CanonicalSchema;
            expectedLiveSnapshotId?: string | null;
            workflowFallback?: DiagramMigrationWorkflowFallback | null;
        },
        actor?: AppUserRecord | null
    ): DiagramMigrationPreview {
        this.requireEditableDiagram(diagramId, actor);

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

        if (state?.connectionId) {
            const connection = this.metadataRepository.getConnection(
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
            }
        }

        let plan: ChangePlan | null = null;

        if (state?.connectionId && liveSnapshot) {
            const baselineSnapshotId = generateId();
            this.metadataRepository.putSnapshot({
                id: baselineSnapshotId,
                connectionId: state.connectionId,
                kind: 'baseline',
                fingerprint: liveSnapshot.fingerprint,
                importedSchemas: state.importedSchemas,
                schema: liveSnapshot.canonicalSchema,
                createdAt: generatedAt,
            });

            plan = createChangePlan({
                id: generateId(),
                baselineSnapshotId,
                connectionId: state.connectionId,
                baseline: liveSnapshot.canonicalSchema,
                target: targetSchema,
            });
            this.metadataRepository.putChangePlan(plan);
            issues.push(...plan.warnings.map(warningToIssue));
            if (
                plan.blocked &&
                !plan.warnings.some((warning) => warning.level === 'blocked')
            ) {
                issues.push({
                    code: 'migration_plan_blocked',
                    severity: 'blocking',
                    title: 'Migration plan blocked',
                    message:
                        'The generated migration plan contains blocking changes and cannot be applied automatically.',
                });
            }
        }

        return {
            diagramId,
            connectionId: state?.connectionId ?? null,
            connectionName: state?.connectionNameCache ?? null,
            workflowLiveSnapshotId: state?.liveSnapshotId ?? null,
            workflowLiveFingerprint: state?.liveFingerprint ?? null,
            baselineFingerprint: liveSnapshot?.fingerprint ?? null,
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
        const preview = this.previewMigration(
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
        const checks: DiagramMigrationCheck[] = [];
        const issues = [...preview.issues];
        const validatedAt = new Date().toISOString();

        const connectionResult = state?.connectionId
            ? await this.connectionsService.testConnection({
                  connectionId: state.connectionId,
              })
            : {
                  ok: false,
                  error: 'Connection not configured.',
                  availableSchemas: [],
              };
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

        const planBaseline = this.metadataRepository.getSnapshot(
            preview.plan.baselineSnapshotId
        );
        if (!planBaseline) {
            checks.push({
                code: 'baseline_snapshot_available',
                label: 'Baseline snapshot available',
                status: 'failed',
                detail: 'The planned migration baseline snapshot could not be found.',
            });
            issues.push({
                code: 'migration_baseline_snapshot_missing',
                severity: 'blocking',
                title: 'Baseline snapshot missing',
                message:
                    'The stored migration baseline snapshot was not found. Regenerate the migration preview.',
            });
        } else if (state?.connectionId && connectionResult.ok) {
            const secret = this.connectionsService.getDecryptedSecret(
                state.connectionId
            );
            const liveSchema = await introspectPostgresSchema({
                secret,
                schemas: planBaseline.importedSchemas,
            });
            const liveFingerprint = hashCanonicalSchema(liveSchema);
            const baselineMatches =
                liveFingerprint === planBaseline.fingerprint;
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
            const applyResult = await this.applyService.applyPlan({
                planId: validation.plan.id,
                actor: actorLabel,
                destructiveApproval: input.destructiveApproval,
            });
            const updatedLiveSnapshotId = this.recordPostApplyLiveSnapshot({
                diagramId,
                actor,
                connectionId: validation.plan.connectionId,
                previousLiveSnapshotId:
                    validation.workflowLiveSnapshotId ?? undefined,
                postApplySnapshotId: applyResult.postApplySnapshotId ?? null,
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
            const audit = this.metadataRepository.getLatestAuditForChangePlan(
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

    private recordPostApplyLiveSnapshot({
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
    }): string | null {
        if (!postApplySnapshotId) {
            return null;
        }

        const postApplySnapshot =
            this.metadataRepository.getSnapshot(postApplySnapshotId);
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
    ) {
        const diagram = this.persistenceService.getDiagram(diagramId, actor);
        if (diagram.access !== 'edit' && diagram.access !== 'owner') {
            throw new AppError('Diagram not found.', 404, 'DIAGRAM_NOT_FOUND');
        }

        return diagram;
    }
}
