import { requestJson } from '@/lib/api/request';
import type { CanonicalSchema } from '@schemadash/schema-sync-core';

export type DiagramWorkflowSyncStatus =
    | 'disconnected'
    | 'connected'
    | 'syncing'
    | 'in_sync'
    | 'drifted'
    | 'error';

export type DiagramWorkflowConnectionStatus = 'unknown' | 'ok' | 'failed';

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

export interface WorkflowCompatibilitySyncMetadata {
    connectionId: string;
    importedSchemas: string[];
    baselineSnapshotId: string;
    baselineFingerprint: string;
    lastImportedAt: string;
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
};
