import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context/app-context.js';
import { requireOperationalAccess } from '../security/request-access.js';
import { resolveRequestShareToken } from '../utils/request-share-token.js';

export const registerDiagramWorkflowRoutes = (
    app: FastifyInstance,
    context: AppContext
) => {
    app.get('/api/diagrams/:id/workflow', async (request) => {
        const params = request.params as { id: string };
        const shareToken = resolveRequestShareToken(request);

        return {
            workflow: context.diagramWorkflowService.getDiagramWorkflow(
                params.id,
                request.auth.user,
                {
                    shareToken,
                }
            ),
        };
    });

    app.post('/api/diagrams/:id/workflow/bind-connection', async (request) => {
        requireOperationalAccess(request);
        const params = request.params as { id: string };

        return {
            workflow: context.diagramWorkflowService.bindConnection(
                params.id,
                request.body,
                request.auth.user
            ),
        };
    });

    app.post('/api/diagrams/:id/workflow/refresh-live', async (request) => {
        requireOperationalAccess(request);
        const params = request.params as { id: string };

        return await context.diagramWorkflowService.refreshLiveSnapshot(
            params.id,
            request.auth.user
        );
    });
};
