import { z } from 'zod';
import {
    canonicalColumnSchema,
    canonicalForeignKeySchema,
    canonicalSchemaSchema,
    canonicalTableSchema,
} from './types.js';

export const compareEntityStatusSchema = z.enum([
    'added',
    'removed',
    'changed',
    'unchanged',
]);
export type CompareEntityStatus = z.infer<typeof compareEntityStatusSchema>;

export const compareValueChangeSchema = z.object({
    property: z.string(),
    baseline: z.unknown().optional(),
    target: z.unknown().optional(),
});
export type CompareValueChange = z.infer<typeof compareValueChangeSchema>;

export const compareCountSummarySchema = z.object({
    added: z.number().int().nonnegative(),
    removed: z.number().int().nonnegative(),
    changed: z.number().int().nonnegative(),
    unchanged: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
});
export type CompareCountSummary = z.infer<typeof compareCountSummarySchema>;

export const compareFieldResultSchema = z.object({
    matchKey: z.string(),
    tableMatchKey: z.string(),
    status: compareEntityStatusSchema,
    baseline: canonicalColumnSchema.optional(),
    target: canonicalColumnSchema.optional(),
    changedProperties: z.array(compareValueChangeSchema).default([]),
});
export type CompareFieldResult = z.infer<typeof compareFieldResultSchema>;

export const compareTableResultSchema = z.object({
    matchKey: z.string(),
    status: compareEntityStatusSchema,
    baseline: canonicalTableSchema.optional(),
    target: canonicalTableSchema.optional(),
    changedProperties: z.array(compareValueChangeSchema).default([]),
    fields: z.array(compareFieldResultSchema).default([]),
});
export type CompareTableResult = z.infer<typeof compareTableResultSchema>;

export const compareRelationshipResultSchema = z.object({
    matchKey: z.string(),
    status: compareEntityStatusSchema,
    baselineTableMatchKey: z.string().optional(),
    targetTableMatchKey: z.string().optional(),
    baseline: canonicalForeignKeySchema.optional(),
    target: canonicalForeignKeySchema.optional(),
    changedProperties: z.array(compareValueChangeSchema).default([]),
});
export type CompareRelationshipResult = z.infer<
    typeof compareRelationshipResultSchema
>;

export const canonicalSchemaReferenceSchema = z.object({
    fingerprint: z.string().optional(),
    importedAt: z.string().optional(),
    schema: canonicalSchemaSchema,
});
export type CanonicalSchemaReference = z.infer<
    typeof canonicalSchemaReferenceSchema
>;

export const compareSummarySchema = z.object({
    tables: compareCountSummarySchema,
    fields: compareCountSummarySchema,
    relationships: compareCountSummarySchema,
});
export type CompareSummary = z.infer<typeof compareSummarySchema>;

export const compareSchemaResultSchema = z.object({
    baseline: canonicalSchemaReferenceSchema,
    target: canonicalSchemaReferenceSchema,
    tables: z.array(compareTableResultSchema),
    relationships: z.array(compareRelationshipResultSchema),
    summary: compareSummarySchema,
    hasChanges: z.boolean(),
});
export type CompareSchemaResult = z.infer<typeof compareSchemaResultSchema>;
