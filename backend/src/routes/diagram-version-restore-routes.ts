import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context/app-context.js';

export const registerDiagramVersionRestoreRoutes = (
    app: FastifyInstance,
    context: AppContext
) => {
    app.post(
        '/api/diagrams/:id/workflow/versions/:versionId/restore-to-development',
        async (request) => {
            const params = request.params as { id: string; versionId: string };

            return {
                result: context.diagramVersionRestoreService.restoreVersionToDevelopment(
                    params.id,
                    params.versionId,
                    request.body,
                    request.auth.user
                ),
            };
        }
    );
};
