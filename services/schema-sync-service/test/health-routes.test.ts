import { describe, expect, it, vi } from 'vitest';
import { buildSchemaSyncServiceApp } from '../src/app.js';
import type { SchemaSyncServiceEnv } from '../src/config/env.js';

const createTestEnv = (): SchemaSyncServiceEnv => ({
    nodeEnv: 'test',
    host: '127.0.0.1',
    port: 4020,
    logLevel: 'silent',
    dataDir: '/tmp/schemadash-schema-sync-test',
    metadataDbPath: '/tmp/schemadash-schema-sync-test/schema-sync.sqlite',
    encryptionKey: Buffer.from('test-key'),
});

const createMetadataRepository = (ping: () => boolean) =>
    ({
        ping,
        close: vi.fn(),
    }) as never;

describe('schema sync service health routes', () => {
    it('serves live and readiness aliases when the service is healthy', async () => {
        const app = buildSchemaSyncServiceApp({
            env: createTestEnv(),
            metadataRepository: createMetadataRepository(() => true),
        });

        const livez = await app.inject({
            method: 'GET',
            url: '/livez',
        });
        const readyz = await app.inject({
            method: 'GET',
            url: '/readyz',
        });
        const apiHealth = await app.inject({
            method: 'GET',
            url: '/api/health',
        });

        expect(livez.statusCode).toBe(200);
        expect(livez.json()).toMatchObject({
            ok: true,
            service: 'schemadash-schema-sync-service',
        });

        expect(readyz.statusCode).toBe(200);
        expect(readyz.json()).toMatchObject({
            ok: true,
            checks: {
                metadataDatabase: {
                    status: 'up',
                },
            },
        });

        expect(apiHealth.statusCode).toBe(200);
        expect(apiHealth.json()).toMatchObject({
            ok: true,
            persistence: {
                metadata: {
                    adapter: 'sqlite',
                    status: 'up',
                },
            },
        });

        await app.close();
    });

    it('returns 503 readiness when the metadata database is unavailable', async () => {
        const app = buildSchemaSyncServiceApp({
            env: createTestEnv(),
            metadataRepository: createMetadataRepository(() => false),
        });

        const readyz = await app.inject({
            method: 'GET',
            url: '/api/readyz',
        });
        const healthz = await app.inject({
            method: 'GET',
            url: '/healthz',
        });

        expect(readyz.statusCode).toBe(503);
        expect(readyz.json()).toMatchObject({
            ok: false,
            checks: {
                metadataDatabase: {
                    status: 'down',
                },
            },
        });

        expect(healthz.statusCode).toBe(503);
        expect(healthz.json()).toMatchObject({
            ok: false,
            persistence: {
                metadata: {
                    status: 'down',
                },
            },
        });

        await app.close();
    });
});
