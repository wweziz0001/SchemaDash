import { requestJson } from '@/lib/api/request';
import type { DiagramDto } from '@/lib/persistence/persistence-types';
import type { CanonicalSchema } from '@schemadash/schema-sync-core';

export type DiagramWorkflowSyncStatus =
    | 'disconnected'
    | 'connected'
    | 'syncing'
    | 'in_sync'
    | 'drifted'
    | 'error';

export type DiagramWorkflowConnectionStatus = 'unknown' | 'ok' | 'failed';

export type DiagramWorkflowVersionOrigin =
    | 'manual'
    | 'milestone'
    | 'system'
    | 'before_restore'
    | 'before_apply';

export interface DiagramWorkflowLiveSnapshot {
    id: string;
    fingerprint: string;
    createdAt: string;
    connectionId: string | null;
    canonicalSchema: CanonicalSchema;
}

export interface DiagramWorkflowRecord {
    diagramId: string;
    diagramName: string;
    diagramAccess: 'view' | 'edit' | 'owner';
    connectionId: string | null;
    connectionName: string | null;
    connectionEngine: string | null;
    importedSchemas: string[];
    liveSnapshotId: string | null;
    liveFingerprint: string | null;
    syncStatus: DiagramWorkflowSyncStatus;
    connectionStatus: DiagramWorkflowConnectionStatus;
    lastConnectedAt: string | null;
    lastSyncedAt: string | null;
    lastSyncError: string | null;
    defaultCompareSourceKind: 'live' | 'version' | null;
    defaultCompareSourceId: string | null;
    updatedAt: string;
    liveSnapshot: DiagramWorkflowLiveSnapshot | null;
}

export interface DiagramWorkflowVersionAuthor {
    id: string;
    displayName: string;
    email: string | null;
}

export interface DiagramWorkflowVersionSummary {
    id: string;
    diagramId: string;
    snapshotId: string;
    name: string | null;
    description: string | null;
    versionLabel: string;
    origin: DiagramWorkflowVersionOrigin;
    pinned: boolean;
    createdAt: string;
    createdBy: DiagramWorkflowVersionAuthor | null;
}

export interface DiagramWorkflowVersionRecord extends DiagramWorkflowVersionSummary {
    snapshot: {
        id: string;
        fingerprint: string;
        canonicalSchema: CanonicalSchema;
        diagramDocument: DiagramDto | null;
        layoutSource: 'captured' | 'derived' | 'auto_layout';
        sourceKind: 'introspection' | 'development' | 'restore' | 'apply';
        createdAt: string;
    };
}

export interface WorkflowCompatibilitySyncMetadata {
    connectionId: string;
    importedSchemas: string[];
    baselineSnapshotId: string;
    baselineFingerprint: string;
    lastImportedAt: string;
}

export interface DiagramWorkflowVersionRestoreResult {
    diagramId: string;
    restoredVersion: DiagramWorkflowVersionSummary;
    safetySnapshotVersion: DiagramWorkflowVersionSummary;
    versions: DiagramWorkflowVersionSummary[];
    development: {
        name: string;
        documentVersion: number;
        updatedAt: string;
    };
}

export interface DiagramWorkflowVersionDeleteResult {
    diagramId: string;
    deletedVersionId: string;
    versions: DiagramWorkflowVersionSummary[];
}

export const diagramWorkflowClient = {
    getWorkflow: async (diagramId: string) =>
        requestJson<{ workflow: DiagramWorkflowRecord }>(
            `/api/diagrams/${diagramId}/workflow`
        ),
    bindConnection: async (
        diagramId: string,
        payload: {
            connectionId: string;
            importedSchemas?: string[];
        }
    ) =>
        requestJson<{ workflow: DiagramWorkflowRecord }>(
            `/api/diagrams/${diagramId}/workflow/bind-connection`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
    refreshLiveSnapshot: async (diagramId: string) =>
        requestJson<{
            workflow: DiagramWorkflowRecord;
            compatibilitySync: WorkflowCompatibilitySyncMetadata;
        }>(`/api/diagrams/${diagramId}/workflow/refresh-live`, {
            method: 'POST',
        }),
    listVersions: async (diagramId: string) =>
        requestJson<{ items: DiagramWorkflowVersionSummary[] }>(
            `/api/diagrams/${diagramId}/workflow/versions`
        ),
    getVersion: async (diagramId: string, versionId: string) =>
        requestJson<{ version: DiagramWorkflowVersionRecord }>(
            `/api/diagrams/${diagramId}/workflow/versions/${versionId}`
        ),
    createVersion: async (
        diagramId: string,
        payload: {
            name?: string | null;
            description?: string | null;
            origin?: DiagramWorkflowVersionOrigin;
            canonicalSchema: CanonicalSchema;
            diagramDocument: DiagramDto;
        }
    ) =>
        requestJson<{ version: DiagramWorkflowVersionRecord }>(
            `/api/diagrams/${diagramId}/workflow/versions`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
    restoreVersionToDevelopment: async (
        diagramId: string,
        versionId: string,
        payload: {
            confirmationText: string;
            baseVersion: number;
            sessionId?: string;
            currentDevelopmentCanonicalSchema: CanonicalSchema;
        }
    ) =>
        requestJson<{ result: DiagramWorkflowVersionRestoreResult }>(
            `/api/diagrams/${diagramId}/workflow/versions/${versionId}/restore-to-development`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
    deleteVersion: async (diagramId: string, versionId: string) =>
        requestJson<{ result: DiagramWorkflowVersionDeleteResult }>(
            `/api/diagrams/${diagramId}/workflow/versions/${versionId}`,
            {
                method: 'DELETE',
            }
        ),
};
