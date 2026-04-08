import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context/app-context.js';
import { requireOperationalAccess } from '../security/request-access.js';
import { resolveRequestShareToken } from '../utils/request-share-token.js';

export const registerDiagramChangelogRoutes = (
    app: FastifyInstance,
    context: AppContext
) => {
    app.get('/api/diagrams/:id/workflow/changelog', async (request) => {
        const params = request.params as { id: string };
        const shareToken = resolveRequestShareToken(request);

        return {
            items: context.diagramChangelogService.listChangelog(
                params.id,
                request.auth.user,
                {
                    shareToken,
                }
            ),
        };
    });

    app.get(
        '/api/diagrams/:id/workflow/changelog/:entryId',
        async (request) => {
            const params = request.params as { id: string; entryId: string };
            const shareToken = resolveRequestShareToken(request);

            return {
                entry: context.diagramChangelogService.getChangelogEntry(
                    params.id,
                    params.entryId,
                    request.auth.user,
                    {
                        shareToken,
                    }
                ),
            };
        }
    );

    app.post('/api/diagrams/:id/workflow/changelog', async (request) => {
        requireOperationalAccess(request);
        const params = request.params as { id: string };

        return {
            result: context.diagramChangelogService.captureEntry(
                params.id,
                request.body,
                request.auth.user
            ),
        };
    });

    app.post(
        '/api/diagrams/:id/workflow/changelog/:entryId/revert-to-development',
        async (request) => {
            requireOperationalAccess(request);
            const params = request.params as { id: string; entryId: string };

            return {
                result: context.diagramVersionRestoreService.restoreChangelogEntryToDevelopment(
                    params.id,
                    params.entryId,
                    request.body,
                    request.auth.user
                ),
            };
        }
    );
};
