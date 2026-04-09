import type { FastifyInstance } from 'fastify';
import {
    applySchemaRequestSchema,
    canonicalSchemaSchema,
} from '@schemadash/schema-sync-core';
import { z } from 'zod';
import type { AppContext } from '../context/app-context.js';
import {
    requireOperationalAccess,
    resolveRequestActor,
} from '../security/request-access.js';

const migrationPreviewRequestSchema = z.object({
    targetSchema: canonicalSchemaSchema,
    expectedLiveSnapshotId: z.string().nullable().optional(),
    workflowFallback: z
        .object({
            connectionId: z.string().nullable(),
            connectionName: z.string().nullable(),
            connectionEngine: z.string().nullable(),
            importedSchemas: z.array(z.string()),
            liveSnapshot: z
                .object({
                    id: z.string(),
                    fingerprint: z.string().nullable(),
                    createdAt: z.string(),
                    canonicalSchema: canonicalSchemaSchema,
                })
                .nullable(),
        })
        .nullable()
        .optional(),
});

const migrationValidationRequestSchema = z.object({
    targetSchema: canonicalSchemaSchema,
    expectedLiveSnapshotId: z.string().nullable().optional(),
    workflowFallback: z
        .object({
            connectionId: z.string().nullable(),
            connectionName: z.string().nullable(),
            connectionEngine: z.string().nullable(),
            importedSchemas: z.array(z.string()),
            liveSnapshot: z
                .object({
                    id: z.string(),
                    fingerprint: z.string().nullable(),
                    createdAt: z.string(),
                    canonicalSchema: canonicalSchemaSchema,
                })
                .nullable(),
        })
        .nullable()
        .optional(),
});

const migrationApplyRequestSchema = z.object({
    targetSchema: canonicalSchemaSchema,
    expectedLiveSnapshotId: z.string().nullable().optional(),
    workflowFallback: z
        .object({
            connectionId: z.string().nullable(),
            connectionName: z.string().nullable(),
            connectionEngine: z.string().nullable(),
            importedSchemas: z.array(z.string()),
            liveSnapshot: z
                .object({
                    id: z.string(),
                    fingerprint: z.string().nullable(),
                    createdAt: z.string(),
                    canonicalSchema: canonicalSchemaSchema,
                })
                .nullable(),
        })
        .nullable()
        .optional(),
    destructiveApproval: applySchemaRequestSchema.shape.destructiveApproval,
});

export const registerDiagramMigrationRoutes = (
    app: FastifyInstance,
    context: AppContext
) => {
    app.post('/api/diagrams/:id/migration/preview', async (request) => {
        requireOperationalAccess(request);
        const params = request.params as { id: string };
        const payload = migrationPreviewRequestSchema.parse(request.body);

        return {
            preview: await context.diagramMigrationService.previewMigration(
                params.id,
                payload,
                request.auth.user
            ),
        };
    });

    app.post('/api/diagrams/:id/migration/validate', async (request) => {
        requireOperationalAccess(request);
        const params = request.params as { id: string };
        const payload = migrationValidationRequestSchema.parse(request.body);

        return {
            validation: await context.diagramMigrationService.validateMigration(
                params.id,
                payload,
                request.auth.user
            ),
        };
    });

    app.post('/api/diagrams/:id/migration/apply', async (request) => {
        requireOperationalAccess(request);
        const params = request.params as { id: string };
        const payload = migrationApplyRequestSchema.parse(request.body);

        return {
            apply: await context.diagramMigrationService.applyMigration(
                params.id,
                payload,
                request.auth.user,
                resolveRequestActor(request)
            ),
        };
    });
};
