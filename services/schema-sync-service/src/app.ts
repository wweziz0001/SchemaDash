import Fastify from 'fastify';
import { ZodError } from 'zod';
import {
    schemaSyncServiceEnv,
    type SchemaSyncServiceEnv,
} from './config/env.js';
import { buildLoggerOptions } from './config/logger.js';
import {
    createSchemaSyncServiceContext,
    type SchemaSyncServiceContext,
} from './context/service-context.js';
import { registerHealthRoutes } from './routes/health-routes.js';
import { registerSchemaSyncRoutes } from './routes/schema-sync-routes.js';
import { AppError } from './utils/app-error.js';
import type { MetadataRepository } from './repositories/metadata-repository.js';

export const buildSchemaSyncServiceApp = (options?: {
    env?: SchemaSyncServiceEnv;
    metadataRepository?: MetadataRepository;
}) => {
    const env = options?.env ?? schemaSyncServiceEnv;
    const app = Fastify({
        logger: buildLoggerOptions(env),
        requestIdHeader: 'x-request-id',
        requestIdLogLabel: 'requestId',
    });
    const context: SchemaSyncServiceContext = createSchemaSyncServiceContext(
        env,
        {
            metadataRepository: options?.metadataRepository,
        }
    );

    app.setErrorHandler((error, request, reply) => {
        if (error instanceof ZodError) {
            return reply.code(400).send({
                error: 'Invalid request payload.',
                issues: error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                })),
            });
        }

        if (error instanceof AppError) {
            return reply.code(error.statusCode).send({
                error: error.message,
                code: error.code,
            });
        }

        request.log.error(error);
        return reply.code(500).send({
            error: 'Internal server error.',
        });
    });

    registerHealthRoutes(app, context);
    registerSchemaSyncRoutes(app, context);

    app.addHook('onClose', async () => {
        context.close();
    });

    return app;
};
