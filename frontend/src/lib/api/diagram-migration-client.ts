import type { CanonicalSchema, ChangePlan } from '@schemadash/schema-sync-core';
import { requestJson } from '@/lib/api/request';

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

export const diagramMigrationClient = {
    previewMigration: async (
        diagramId: string,
        payload: {
            targetSchema: CanonicalSchema;
            expectedLiveSnapshotId?: string | null;
            workflowFallback?: DiagramMigrationWorkflowFallback | null;
        }
    ) =>
        requestJson<{ preview: DiagramMigrationPreview }>(
            `/api/diagrams/${diagramId}/migration/preview`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
    validateMigration: async (
        diagramId: string,
        payload: {
            targetSchema: CanonicalSchema;
            expectedLiveSnapshotId?: string | null;
            workflowFallback?: DiagramMigrationWorkflowFallback | null;
        }
    ) =>
        requestJson<{ validation: DiagramMigrationValidation }>(
            `/api/diagrams/${diagramId}/migration/validate`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
    applyMigration: async (
        diagramId: string,
        payload: {
            targetSchema: CanonicalSchema;
            expectedLiveSnapshotId?: string | null;
            workflowFallback?: DiagramMigrationWorkflowFallback | null;
            destructiveApproval: {
                confirmed: boolean;
                confirmationText: string;
            };
        }
    ) =>
        requestJson<{ apply: DiagramMigrationApplyResponse }>(
            `/api/diagrams/${diagramId}/migration/apply`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
};
