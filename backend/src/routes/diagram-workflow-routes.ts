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
            workflow: await context.diagramWorkflowService.bindConnection(
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

    app.get('/api/diagrams/:id/workflow/versions', async (request) => {
        const params = request.params as { id: string };
        const shareToken = resolveRequestShareToken(request);

        return {
            items: context.diagramWorkflowService.listVersions(
                params.id,
                request.auth.user,
                {
                    shareToken,
                }
            ),
        };
    });

    app.get(
        '/api/diagrams/:id/workflow/versions/:versionId',
        async (request) => {
            const params = request.params as { id: string; versionId: string };
            const shareToken = resolveRequestShareToken(request);

            return {
                version: context.diagramWorkflowService.getVersion(
                    params.id,
                    params.versionId,
                    request.auth.user,
                    {
                        shareToken,
                    }
                ),
            };
        }
    );

    app.post('/api/diagrams/:id/workflow/versions', async (request) => {
        const params = request.params as { id: string };

        return {
            version: context.diagramWorkflowService.createVersion(
                params.id,
                request.body,
                request.auth.user
            ),
        };
    });

    app.delete(
        '/api/diagrams/:id/workflow/versions/:versionId',
        async (request) => {
            const params = request.params as { id: string; versionId: string };

            return {
                result: context.diagramWorkflowService.deleteVersion(
                    params.id,
                    params.versionId,
                    request.auth.user
                ),
            };
        }
    );
};
