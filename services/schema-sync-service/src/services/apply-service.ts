import type {
    ApplySchemaRequest,
    ApplySchemaResponse,
    AuditRecord,
    RiskWarning,
} from '@schemadash/schema-sync-core';
import { generateId } from '../utils/id.js';
import type { MetadataRepository } from '../repositories/metadata-repository.js';
import type { ConnectionsService } from './connections-service.js';
import type { SchemaSyncService } from './schema-sync-service.js';
import { hashCanonicalSchema } from '@schemadash/schema-sync-core';
import { AppError } from '../utils/app-error.js';
import type { SchemaSyncAdapterRegistry } from '../engines/registry.js';
import type { SchemaSyncQueryClient } from '../engines/types.js';

const requiresDestructiveApproval = (warnings: RiskWarning[]) =>
    warnings.some((warning) => warning.level === 'destructive');

const expectedConfirmationText = 'APPLY DESTRUCTIVE CHANGES';

export class ApplyService {
    constructor(
        private readonly repository: MetadataRepository,
        private readonly connectionsService: ConnectionsService,
        private readonly schemaSyncService: SchemaSyncService,
        private readonly adapterRegistry: SchemaSyncAdapterRegistry
    ) {}

    async applyPlan(request: ApplySchemaRequest): Promise<ApplySchemaResponse> {
        const plan = this.schemaSyncService.getChangePlan(request.planId);
        const baselineSnapshot = this.repository.getSnapshot(
            plan.baselineSnapshotId
        );
        if (!baselineSnapshot) {
            throw new AppError(
                `Baseline snapshot ${plan.baselineSnapshotId} not found`,
                404,
                'baseline_snapshot_not_found'
            );
        }

        if (plan.blocked) {
            throw new AppError(
                'This plan is blocked and cannot be applied.',
                409,
                'plan_blocked'
            );
        }

        if (
            requiresDestructiveApproval(plan.warnings) &&
            (!request.destructiveApproval.confirmed ||
                request.destructiveApproval.confirmationText.trim() !==
                    expectedConfirmationText)
        ) {
            throw new AppError(
                `Destructive changes require confirmation text: ${expectedConfirmationText}`,
                400,
                'destructive_confirmation_required'
            );
        }

        const jobId = generateId();
        const now = new Date().toISOString();
        const reusableAudit = this.repository.getLatestAuditForChangePlan(
            plan.id
        );
        const auditId =
            reusableAudit?.status === 'pending'
                ? reusableAudit.id
                : generateId();
        const logs: string[] =
            reusableAudit?.status === 'pending'
                ? [...reusableAudit.logs, 'Apply requested']
                : ['Apply requested'];
        const executedStatements: string[] = [];

        const audit: AuditRecord = {
            id: auditId,
            actor: request.actor,
            connectionId: plan.connectionId,
            baselineSnapshotId: plan.baselineSnapshotId,
            targetSnapshotId:
                reusableAudit?.status === 'pending'
                    ? reusableAudit.targetSnapshotId
                    : null,
            preApplySnapshotId: null,
            postApplySnapshotId: null,
            changePlanId: plan.id,
            sqlStatements: plan.sqlStatements,
            warnings: plan.warnings,
            status: 'running',
            logs,
            error: null,
            createdAt:
                reusableAudit?.status === 'pending'
                    ? reusableAudit.createdAt
                    : now,
            updatedAt: now,
        };
        this.repository.putAudit(audit);
        this.repository.putApplyJob({
            id: jobId,
            planId: plan.id,
            auditId,
            status: 'running',
            logs,
            executedStatements,
            error: null,
            createdAt: now,
            updatedAt: now,
        });

        const secret = this.connectionsService.getDecryptedSecret(
            plan.connectionId
        );
        const adapter = this.adapterRegistry.resolve(plan.engine);
        let preApplySnapshotId: string | null = null;
        let client: SchemaSyncQueryClient | null = null;
        let transactionStarted = false;

        try {
            const liveSchema = await adapter.introspectSchema({
                secret,
                schemas: baselineSnapshot.importedSchemas,
            });
            const liveFingerprint = hashCanonicalSchema(liveSchema);
            const expectedBaselineFingerprint = hashCanonicalSchema(
                baselineSnapshot.schema
            );
            if (liveFingerprint !== expectedBaselineFingerprint) {
                throw new AppError(
                    'Live database schema drift detected. Refresh from database before applying changes.',
                    409,
                    'schema_drift_detected'
                );
            }

            preApplySnapshotId = generateId();
            this.repository.putSnapshot({
                id: preApplySnapshotId,
                connectionId: plan.connectionId,
                kind: 'pre_apply',
                fingerprint: liveFingerprint,
                importedSchemas: baselineSnapshot.importedSchemas,
                schema: liveSchema,
                createdAt: new Date().toISOString(),
            });

            client = await adapter.createClient(secret);
            await adapter.validateApplyPreflight({
                client,
                changes: plan.changes,
                logs,
            });

            const { beforeTransaction, transactional } =
                adapter.splitStatements(plan.sqlStatements);

            for (const statement of beforeTransaction) {
                logs.push(`Executing before transaction: ${statement}`);
                await client.query(statement);
                executedStatements.push(statement);
            }

            if (transactional.length > 0) {
                await client.query('BEGIN');
                transactionStarted = true;
                logs.push('Transaction started');

                for (const statement of transactional) {
                    logs.push(`Executing: ${statement}`);
                    await client.query(statement);
                    executedStatements.push(statement);
                }

                await client.query('COMMIT');
                transactionStarted = false;
                logs.push('Transaction committed');
            }

            const postApplySchema = await adapter.introspectSchema({
                secret,
                schemas: baselineSnapshot.importedSchemas,
            });
            const postApplySnapshotId = generateId();
            this.repository.putSnapshot({
                id: postApplySnapshotId,
                connectionId: plan.connectionId,
                kind: 'post_apply',
                fingerprint: hashCanonicalSchema(postApplySchema),
                importedSchemas: baselineSnapshot.importedSchemas,
                schema: postApplySchema,
                createdAt: new Date().toISOString(),
            });

            this.repository.putAudit({
                ...audit,
                preApplySnapshotId,
                postApplySnapshotId,
                status: 'succeeded',
                logs,
                error: null,
                updatedAt: new Date().toISOString(),
            });
            this.repository.putApplyJob({
                id: jobId,
                planId: plan.id,
                auditId,
                status: 'succeeded',
                logs,
                executedStatements,
                error: null,
                createdAt: now,
                updatedAt: new Date().toISOString(),
            });

            return {
                jobId,
                status: 'succeeded',
                executedStatements,
                logs,
                error: null,
                auditId,
                postApplySnapshotId,
            };
        } catch (error) {
            if (client && transactionStarted) {
                await client.query('ROLLBACK');
                logs.push('Transaction rolled back');
            }

            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to apply plan.';

            this.repository.putAudit({
                ...audit,
                preApplySnapshotId,
                status: 'failed',
                logs,
                error: message,
                updatedAt: new Date().toISOString(),
            });
            this.repository.putApplyJob({
                id: jobId,
                planId: plan.id,
                auditId,
                status: 'failed',
                logs,
                executedStatements,
                error: message,
                createdAt: now,
                updatedAt: new Date().toISOString(),
            });
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(message, 422, 'apply_execution_failed');
        } finally {
            if (client) {
                await client.end();
            }
        }
    }
}
