import type { FastifyInstance, FastifyReply } from 'fastify';
import type { SchemaSyncServiceContext } from '../context/service-context.js';

const sendWithStatus = (
    reply: FastifyReply,
    statusCode: number,
    payload: Record<string, unknown>
) => reply.code(statusCode).send(payload);

export const registerHealthRoutes = (
    app: FastifyInstance,
    context: SchemaSyncServiceContext
) => {
    const sendLivez = async (_: unknown, reply: FastifyReply) =>
        sendWithStatus(reply, 200, {
            ok: true,
            service: 'schemadash-schema-sync-service',
            environment: context.env.nodeEnv,
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
        });

    const sendReadyz = async (_: unknown, reply: FastifyReply) => {
        const metadataUp = context.metadataRepository.ping();

        return sendWithStatus(reply, metadataUp ? 200 : 503, {
            ok: metadataUp,
            service: 'schemadash-schema-sync-service',
            checks: {
                metadataDatabase: {
                    status: metadataUp ? 'up' : 'down',
                    path: context.env.metadataDbPath,
                },
            },
            timestamp: new Date().toISOString(),
        });
    };

    const sendHealth = async (_: unknown, reply: FastifyReply) => {
        const metadataUp = context.metadataRepository.ping();

        return sendWithStatus(reply, metadataUp ? 200 : 503, {
            ok: metadataUp,
            service: 'schemadash-schema-sync-service',
            environment: context.env.nodeEnv,
            persistence: {
                metadata: {
                    adapter: 'sqlite',
                    path: context.env.metadataDbPath,
                    status: metadataUp ? 'up' : 'down',
                },
            },
            uptimeSeconds: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
        });
    };

    app.get('/livez', sendLivez);
    app.get('/readyz', sendReadyz);
    app.get('/healthz', sendHealth);
    app.get('/api/livez', sendLivez);
    app.get('/api/readyz', sendReadyz);
    app.get('/api/health', sendHealth);
};
