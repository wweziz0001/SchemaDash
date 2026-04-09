import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
    CanonicalSchema,
    DiffSchemaResponse,
} from '@schemadash/schema-sync-core';
import { buildApp } from '../src/app.js';
import type { ServerEnv } from '../src/config/env.js';
import { AppRepository } from '../src/repositories/app-repository.js';
import type { SchemaSyncClient } from '../src/schema-sync/client.js';

const tempDirs: string[] = [];

const createSchemaSyncEnv = (overrides: Partial<ServerEnv> = {}): ServerEnv => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), 'chartdb-schema-sync-'));
    tempDirs.push(dataDir);
    return {
        nodeEnv: 'test',
        host: '127.0.0.1',
        port: 4010,
        corsOrigin: 'http://localhost:5173',
        logLevel: 'silent',
        authMode: 'password',
        authEmail: 'owner@example.com',
        authPassword: 'super-secret-password',
        authDisplayName: 'Owner',
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

const getSessionCookie = (setCookieHeader: string | string[] | undefined) => {
    const headerValue = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader;
    const cookie = headerValue?.split(';')[0];
    if (!cookie) {
        throw new Error('Expected a session cookie to be set.');
    }

    return cookie;
};

const createCanonicalSchema = (): CanonicalSchema => ({
    engine: 'postgresql',
    databaseName: 'warehouse',
    defaultSchemaName: 'public',
    schemaNames: ['public'],
    tables: [],
    customTypes: [],
    fingerprint: 'baseline-fingerprint',
    importedAt: '2026-03-25T00:00:00.000Z',
});

const createSchemaSyncClientMock = (
    overrides: Partial<SchemaSyncClient> = {}
): SchemaSyncClient =>
    ({
        config: {
            enabled: true,
            mode: 'external-service',
            serviceUrl: 'http://schema-sync.test',
        },
        getReadiness: vi.fn().mockResolvedValue({
            enabled: true,
            mode: 'external-service',
            serviceUrl: 'http://schema-sync.test',
            status: 'ready',
            ok: true,
            error: null,
            errorCode: null,
            checkedAt: '2026-04-09T00:00:00.000Z',
        }),
        listConnections: vi.fn().mockResolvedValue([]),
        getConnection: vi.fn().mockResolvedValue(null),
        createConnection: vi.fn(),
        updateConnection: vi.fn(),
        deleteConnection: vi.fn(),
        testConnection: vi.fn(),
        importLiveSchema: vi.fn(),
        diffSchema: vi.fn(),
        applySchema: vi.fn(),
        getApplyJob: vi.fn().mockResolvedValue(null),
        getAudit: vi.fn().mockResolvedValue(null),
        getLatestAuditForChangePlan: vi.fn().mockResolvedValue(null),
        getSnapshot: vi.fn().mockResolvedValue(null),
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

describe('schema sync routes', () => {
    it('returns 503 when schema sync is disabled', async () => {
        const app = buildApp({
            env: createSchemaSyncEnv({
                authMode: 'disabled',
            }),
        });

        const response = await app.inject({
            method: 'GET',
            url: '/api/connections',
        });

        expect(response.statusCode).toBe(503);
        expect(response.json()).toEqual(
            expect.objectContaining({
                code: 'schema_sync_disabled',
            })
        );

        await app.close();
    });

    it('requires an administrator for operational schema-sync routes when auth is enabled', async () => {
        const env = createSchemaSyncEnv({
            schemaSyncEnabled: true,
            schemaSyncMode: 'external-service',
            schemaSyncServiceUrl: 'http://schema-sync.test',
        });
        const appRepository = new AppRepository(env.appDbPath);
        const app = buildApp({
            env,
            appRepository,
            schemaSyncClient: createSchemaSyncClientMock(),
        });

        const loginResponse = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: {
                email: env.authEmail,
                password: env.authPassword,
            },
        });
        const cookie = getSessionCookie(loginResponse.headers['set-cookie']);
        const owner = appRepository.getUserAuthByEmail('owner@example.com');
        appRepository.putUserAuthRecord({
            ...owner!,
            role: 'member',
            updatedAt: new Date().toISOString(),
        });

        const response = await app.inject({
            method: 'GET',
            url: '/api/connections',
            headers: {
                cookie,
            },
        });

        expect(response.statusCode).toBe(403);
        expect(response.json()).toEqual(
            expect.objectContaining({
                code: 'AUTH_FORBIDDEN',
            })
        );

        await app.close();
        appRepository.close();
    });

    it('routes diff requests through the schema sync client and overwrites spoofed actors', async () => {
        const env = createSchemaSyncEnv({
            schemaSyncEnabled: true,
            schemaSyncMode: 'external-service',
            schemaSyncServiceUrl: 'http://schema-sync.test',
        });
        const appRepository = new AppRepository(env.appDbPath);
        const diffResponse: DiffSchemaResponse = {
            plan: {
                id: 'plan-1',
                baselineSnapshotId: 'baseline-snapshot',
                connectionId: 'connection-1',
                engine: 'postgresql',
                baselineFingerprint: 'baseline-fingerprint',
                targetFingerprint: 'baseline-fingerprint',
                changes: [],
                warnings: [],
                sqlStatements: [],
                summary: {
                    totalChanges: 0,
                    safeChanges: 0,
                    warningChanges: 0,
                    destructiveChanges: 0,
                    blockedChanges: 0,
                },
                requiresConfirmation: false,
                blocked: false,
                createdAt: '2026-03-25T00:00:00.000Z',
            },
        };
        const schemaSyncClient = createSchemaSyncClientMock({
            diffSchema: vi.fn().mockResolvedValue(diffResponse),
        });
        const app = buildApp({
            env,
            appRepository,
            schemaSyncClient,
        });

        const loginResponse = await app.inject({
            method: 'POST',
            url: '/api/auth/login',
            payload: {
                email: env.authEmail,
                password: env.authPassword,
            },
        });
        const cookie = getSessionCookie(loginResponse.headers['set-cookie']);
        const baselineSchema = createCanonicalSchema();

        const response = await app.inject({
            method: 'POST',
            url: '/api/schema/diff',
            headers: {
                cookie,
            },
            payload: {
                baselineSnapshotId: 'baseline-snapshot',
                targetSchema: baselineSchema,
                actor: 'spoofed-client-actor',
            },
        });

        expect(response.statusCode).toBe(200);
        expect(schemaSyncClient.diffSchema).toHaveBeenCalledWith({
            baselineSnapshotId: 'baseline-snapshot',
            targetSchema: baselineSchema,
            actor: 'admin:owner@example.com',
        });
        expect(response.json()).toEqual(diffResponse);

        await app.close();
        appRepository.close();
    });
});
