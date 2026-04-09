import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import type { ServerEnv } from '../src/config/env.js';
import type { SchemaSyncClient } from '../src/schema-sync/client.js';

const tempDirs: string[] = [];

const createTestEnv = (overrides: Partial<ServerEnv> = {}): ServerEnv => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), 'chartdb-health-'));
    tempDirs.push(dataDir);
    return {
        nodeEnv: 'test',
        host: '127.0.0.1',
        port: 4010,
        corsOrigin: '*',
        logLevel: 'silent',
        authMode: 'disabled',
        authEmail: null,
        authPassword: null,
        authDisplayName: 'Test Owner',
        bootstrapSetupCode: null,
        bootstrapSetupCodeTtlMs: 15 * 60 * 1000,
        bootstrapSetupCodeMaxAttempts: 10,
        bootstrapAdminEmail: null,
        sessionTtlHours: 24,
        sessionCookieName: 'chartdb_session',
        sessionCookieSecure: false,
        oidcIssuer: null,
        oidcClientId: null,
        oidcClientSecret: null,
        oidcRedirectUrl: null,
        oidcLogoutUrl: null,
        oidcScopes: 'openid profile email',
        schemaSyncEnabled: false,
        schemaSyncMode: 'disabled',
        schemaSyncServiceUrl: null,
        dataDir,
        metadataDbPath: path.join(dataDir, 'schema-sync.sqlite'),
        appDbPath: path.join(dataDir, 'chartdb-app.sqlite'),
        encryptionKey: Buffer.from('test-key'),
        defaultOwnerName: 'Test Owner',
        defaultProjectName: 'Test Project',
        ...overrides,
    };
};

const createSchemaSyncClient = (
    overrides: Partial<SchemaSyncClient> = {}
): SchemaSyncClient =>
    ({
        config: {
            enabled: false,
            mode: 'disabled',
            serviceUrl: null,
        },
        getReadiness: vi.fn().mockResolvedValue({
            enabled: false,
            mode: 'disabled',
            serviceUrl: null,
            status: 'disabled',
            ok: true,
            error: null,
        }),
        listConnections: vi.fn(),
        getConnection: vi.fn(),
        createConnection: vi.fn(),
        updateConnection: vi.fn(),
        deleteConnection: vi.fn(),
        testConnection: vi.fn(),
        importLiveSchema: vi.fn(),
        diffSchema: vi.fn(),
        applySchema: vi.fn(),
        getApplyJob: vi.fn(),
        getAudit: vi.fn(),
        getLatestAuditForChangePlan: vi.fn(),
        getSnapshot: vi.fn(),
        ...overrides,
    }) as SchemaSyncClient;

afterEach(() => {
    while (tempDirs.length > 0) {
        const dir = tempDirs.pop();
        if (dir) {
            rmSync(dir, { recursive: true, force: true });
        }
    }
});

describe('health routes', () => {
    it('reports disabled schema sync as a healthy degraded state', async () => {
        const app = buildApp({
            env: createTestEnv(),
            schemaSyncClient: createSchemaSyncClient(),
        });

        const livez = await app.inject({
            method: 'GET',
            url: '/api/livez',
        });
        const readyz = await app.inject({
            method: 'GET',
            url: '/api/readyz',
        });
        const health = await app.inject({
            method: 'GET',
            url: '/api/health',
        });

        expect(livez.statusCode).toBe(200);
        expect(livez.json()).toMatchObject({
            ok: true,
            service: 'schemadash-api',
        });

        expect(readyz.statusCode).toBe(200);
        expect(readyz.json()).toMatchObject({
            ok: true,
            checks: {
                appDatabase: {
                    status: 'up',
                },
                schemaSyncService: {
                    status: 'disabled',
                },
            },
        });

        expect(health.statusCode).toBe(200);
        expect(health.json()).toMatchObject({
            ok: true,
            service: 'schemadash-api',
            persistence: {
                app: {
                    adapter: 'sqlite',
                    status: 'up',
                },
                schemaSync: {
                    mode: 'disabled',
                    enabled: false,
                    status: 'disabled',
                },
            },
        });

        await app.close();
    });

    it('returns 503 readiness when enabled schema sync service is down', async () => {
        const app = buildApp({
            env: createTestEnv({
                schemaSyncEnabled: true,
                schemaSyncMode: 'external-service',
                schemaSyncServiceUrl: 'http://schema-sync.test',
            }),
            schemaSyncClient: createSchemaSyncClient({
                config: {
                    enabled: true,
                    mode: 'external-service',
                    serviceUrl: 'http://schema-sync.test',
                },
                getReadiness: vi.fn().mockResolvedValue({
                    enabled: true,
                    mode: 'external-service',
                    serviceUrl: 'http://schema-sync.test',
                    status: 'down',
                    ok: false,
                    error: 'Schema sync service is unavailable.',
                }),
            }),
        });

        const readyz = await app.inject({
            method: 'GET',
            url: '/api/readyz',
        });

        expect(readyz.statusCode).toBe(503);
        expect(readyz.json()).toMatchObject({
            ok: false,
            checks: {
                schemaSyncService: {
                    status: 'down',
                    serviceUrl: 'http://schema-sync.test',
                },
            },
        });

        await app.close();
    });
});
