import { z } from 'zod';
import { canonicalSchemaSchema } from '@schemadash/schema-sync-core';
import { diagramDocumentSchema } from './persistence.js';

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
    'changelog',
]);

export const diagramWorkflowSnapshotKindSchema = z.enum([
    'live',
    'version',
    'system',
    'changelog',
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

export const diagramWorkflowVersionOriginSchema = z.enum([
    'manual',
    'milestone',
    'system',
    'before_restore',
    'before_apply',
]);

export const diagramWorkflowChangelogEventTypeSchema = z.enum([
    'save',
    'auto_checkpoint',
    'restore',
    'revert',
]);

export const diagramWorkflowCompareSummarySchema = z.object({
    tables: z.object({
        added: z.number().int().nonnegative(),
        removed: z.number().int().nonnegative(),
        changed: z.number().int().nonnegative(),
        unchanged: z.number().int().nonnegative(),
        total: z.number().int().nonnegative(),
    }),
    fields: z.object({
        added: z.number().int().nonnegative(),
        removed: z.number().int().nonnegative(),
        changed: z.number().int().nonnegative(),
        unchanged: z.number().int().nonnegative(),
        total: z.number().int().nonnegative(),
    }),
    relationships: z.object({
        added: z.number().int().nonnegative(),
        removed: z.number().int().nonnegative(),
        changed: z.number().int().nonnegative(),
        unchanged: z.number().int().nonnegative(),
        total: z.number().int().nonnegative(),
    }),
    totalChanges: z.number().int().nonnegative(),
    hasChanges: z.boolean(),
});

export const bindDiagramWorkflowConnectionSchema = z.object({
    connectionId: z.string().trim().min(1),
    importedSchemas: z.array(z.string().trim().min(1)).optional(),
});

export const createDiagramWorkflowVersionSchema = z.object({
    name: z.string().trim().min(1).max(160).nullable().optional(),
    description: z.string().trim().max(500).nullable().optional(),
    origin: diagramWorkflowVersionOriginSchema.optional().default('manual'),
    canonicalSchema: canonicalSchemaSchema,
    diagramDocument: diagramDocumentSchema,
});

export const restoreDiagramWorkflowVersionSchema = z.object({
    baseVersion: z.number().int().min(1),
    sessionId: z.string().trim().min(1).optional(),
    currentDevelopmentCanonicalSchema: canonicalSchemaSchema,
});

export const createDiagramWorkflowChangelogEntrySchema = z.object({
    eventType: diagramWorkflowChangelogEventTypeSchema,
    sessionId: z.string().trim().min(1).nullable().optional(),
    sourceDocumentVersion: z.number().int().min(1).nullable().optional(),
    sourceLabel: z.string().trim().min(1).max(160).nullable().optional(),
    summary: z.string().trim().min(1).max(240).nullable().optional(),
    canonicalSchema: canonicalSchemaSchema,
    diagramDocument: diagramDocumentSchema,
});

export const revertDiagramWorkflowChangelogEntrySchema = z.object({
    baseVersion: z.number().int().min(1),
    currentDevelopmentCanonicalSchema: canonicalSchemaSchema,
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
export type DiagramWorkflowVersionOrigin = z.infer<
    typeof diagramWorkflowVersionOriginSchema
>;
export type DiagramWorkflowChangelogEventType = z.infer<
    typeof diagramWorkflowChangelogEventTypeSchema
>;
export type DiagramWorkflowCompareSummary = z.infer<
    typeof diagramWorkflowCompareSummarySchema
>;
export type BindDiagramWorkflowConnectionInput = z.infer<
    typeof bindDiagramWorkflowConnectionSchema
>;
export type CreateDiagramWorkflowVersionInput = z.infer<
    typeof createDiagramWorkflowVersionSchema
>;
export type RestoreDiagramWorkflowVersionInput = z.infer<
    typeof restoreDiagramWorkflowVersionSchema
>;
export type CreateDiagramWorkflowChangelogEntryInput = z.infer<
    typeof createDiagramWorkflowChangelogEntrySchema
>;
export type RevertDiagramWorkflowChangelogEntryInput = z.infer<
    typeof revertDiagramWorkflowChangelogEntrySchema
>;
