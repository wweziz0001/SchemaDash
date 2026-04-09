import type { FastifyInstance, FastifyReply } from 'fastify';
import type { AppContext } from '../context/app-context.js';

const resolveReadiness = async (context: AppContext) => {
    const schemaSync = await context.schemaSyncClient.getReadiness();
    const checks = {
        appDatabase: {
            status: context.appRepository.ping() ? 'up' : 'down',
            path: context.env.appDbPath,
        },
        schemaSyncService: {
            status: schemaSync.status,
            serviceUrl: schemaSync.serviceUrl,
            error: schemaSync.error,
            errorCode: schemaSync.errorCode,
            checkedAt: schemaSync.checkedAt,
        },
    } as const;

    return {
        ok:
            checks.appDatabase.status === 'up' &&
            (checks.schemaSyncService.status === 'ready' ||
                checks.schemaSyncService.status === 'disabled'),
        checks,
    };
};

const sendWithStatus = (
    reply: FastifyReply,
    statusCode: number,
    payload: Record<string, unknown>
) => reply.code(statusCode).send(payload);

export const registerHealthRoutes = (
    app: FastifyInstance,
    context: AppContext
) => {
    app.get('/api/livez', async (_, reply) => {
        return sendWithStatus(reply, 200, {
            ok: true,
            service: 'schemadash-api',
            environment: context.env.nodeEnv,
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.round(process.uptime()),
        });
    });

    app.get('/api/readyz', async (_, reply) => {
        const readiness = await resolveReadiness(context);

        return sendWithStatus(reply, readiness.ok ? 200 : 503, {
            ok: readiness.ok,
            service: 'schemadash-api',
            checks: readiness.checks,
            timestamp: new Date().toISOString(),
        });
    });

    app.get('/api/health', async (_, reply) => {
        const readiness = await resolveReadiness(context);
        const authBootstrap = context.authService.getBootstrapStatus();

        return sendWithStatus(reply, readiness.ok ? 200 : 503, {
            ok: readiness.ok,
            service: 'schemadash-api',
            environment: context.env.nodeEnv,
            persistence: {
                app: {
                    adapter: 'sqlite',
                    path: context.env.appDbPath,
                    status: readiness.checks.appDatabase.status,
                },
                schemaSync: {
                    mode: context.env.schemaSyncMode,
                    serviceUrl: context.env.schemaSyncServiceUrl,
                    enabled: context.env.schemaSyncEnabled,
                    status: readiness.checks.schemaSyncService.status,
                    error: readiness.checks.schemaSyncService.error,
                    errorCode: readiness.checks.schemaSyncService.errorCode,
                    checkedAt: readiness.checks.schemaSyncService.checkedAt,
                },
            },
            auth: {
                mode: context.env.authMode,
                bootstrapRequired: authBootstrap.required,
                adminInitialized: authBootstrap.completed,
            },
            proxy: {
                trustProxy: context.env.trustProxy ?? false,
            },
            uptimeSeconds: Math.round(process.uptime()),
            timestamp: new Date().toISOString(),
        });
    });
};
