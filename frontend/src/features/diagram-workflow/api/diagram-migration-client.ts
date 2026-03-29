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

export const diagramMigrationClient = {
    previewMigration: async (
        diagramId: string,
        payload: {
            targetSchema: CanonicalSchema;
            expectedLiveSnapshotId?: string | null;
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
        }
    ) =>
        requestJson<{ validation: DiagramMigrationValidation }>(
            `/api/diagrams/${diagramId}/migration/validate`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
};
