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
});

const migrationValidationRequestSchema = z.object({
    targetSchema: canonicalSchemaSchema,
    expectedLiveSnapshotId: z.string().nullable().optional(),
});

const migrationApplyRequestSchema = z.object({
    targetSchema: canonicalSchemaSchema,
    expectedLiveSnapshotId: z.string().nullable().optional(),
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
            preview: context.diagramMigrationService.previewMigration(
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
