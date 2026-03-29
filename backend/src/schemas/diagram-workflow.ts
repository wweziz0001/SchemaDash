import { z } from 'zod';

export const diagramWorkflowSyncStatusSchema = z.enum([
    'disconnected',
    'connected',
    'syncing',
    'in_sync',
    'drifted',
    'error',
]);

export const diagramWorkflowConnectionStatusSchema = z.enum([
    'unknown',
    'ok',
    'failed',
]);

export const diagramWorkflowCompareSourceKindSchema = z.enum([
    'live',
    'version',
]);

export const diagramWorkflowSnapshotKindSchema = z.enum([
    'live',
    'version',
    'system',
]);

export const diagramWorkflowSnapshotSourceKindSchema = z.enum([
    'introspection',
    'development',
    'restore',
    'apply',
]);

export const diagramWorkflowLayoutSourceSchema = z.enum([
    'captured',
    'derived',
    'auto_layout',
]);

export const bindDiagramWorkflowConnectionSchema = z.object({
    connectionId: z.string().trim().min(1),
    importedSchemas: z.array(z.string().trim().min(1)).optional(),
});

export type DiagramWorkflowSyncStatus = z.infer<
    typeof diagramWorkflowSyncStatusSchema
>;
export type DiagramWorkflowConnectionStatus = z.infer<
    typeof diagramWorkflowConnectionStatusSchema
>;
export type DiagramWorkflowCompareSourceKind = z.infer<
    typeof diagramWorkflowCompareSourceKindSchema
>;
export type DiagramWorkflowSnapshotKind = z.infer<
    typeof diagramWorkflowSnapshotKindSchema
>;
export type DiagramWorkflowSnapshotSourceKind = z.infer<
    typeof diagramWorkflowSnapshotSourceKindSchema
>;
export type DiagramWorkflowLayoutSource = z.infer<
    typeof diagramWorkflowLayoutSourceSchema
>;
export type BindDiagramWorkflowConnectionInput = z.infer<
    typeof bindDiagramWorkflowConnectionSchema
>;
