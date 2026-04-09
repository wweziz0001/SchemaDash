import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CanonicalSchema } from '@schemadash/schema-sync-core';
import type { ServerEnv } from '../src/config/env.js';
import { createSchemaSyncClient } from '../src/schema-sync/client.js';

const createEnv = (overrides: Partial<ServerEnv> = {}): ServerEnv => ({
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
    sessionCookieName: 'schemadash_session',
    sessionCookieSecure: false,
    oidcIssuer: null,
    oidcClientId: null,
    oidcClientSecret: null,
    oidcRedirectUrl: null,
    oidcLogoutUrl: null,
    oidcScopes: 'openid profile email',
    schemaSyncEnabled: true,
    schemaSyncMode: 'external-service',
    schemaSyncServiceUrl: 'http://schema-sync.test',
    dataDir: '/tmp/schemadash-client-test',
    metadataDbPath: '/tmp/schemadash-client-test/schema-sync.sqlite',
    appDbPath: '/tmp/schemadash-client-test/app.sqlite',
    encryptionKey: Buffer.from('test-key'),
    defaultOwnerName: 'Test Owner',
    defaultProjectName: 'Test Project',
    ...overrides,
});

const createTargetSchema = (): CanonicalSchema => ({
    engine: 'postgresql',
    databaseName: 'warehouse',
    defaultSchemaName: 'public',
    schemaNames: ['public'],
    tables: [],
    customTypes: [],
    fingerprint: 'target-fingerprint',
    importedAt: '2026-04-09T00:00:00.000Z',
});

const createAbortAwarePendingFetch = () =>
    vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        return new Promise<Response>((_, reject) => {
            const signal = init?.signal as AbortSignal | undefined;
            signal?.addEventListener(
                'abort',
                () => {
                    reject(new DOMException('Aborted', 'AbortError'));
                },
                { once: true }
            );
        });
    });

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('schema sync client', () => {
    it('does not call the remote service when schema sync is disabled', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const client = createSchemaSyncClient(
            createEnv({
                schemaSyncEnabled: false,
                schemaSyncMode: 'disabled',
                schemaSyncServiceUrl: null,
            })
        );

        const readiness = await client.getReadiness();

        expect(readiness).toMatchObject({
            status: 'disabled',
            ok: true,
        });
        expect(fetchMock).not.toHaveBeenCalled();
        await expect(client.listConnections()).rejects.toMatchObject({
            code: 'schema_sync_disabled',
        });
    });

    it('uses the short readiness timeout and reports the service as unavailable', async () => {
        vi.useFakeTimers();
        const fetchMock = createAbortAwarePendingFetch();
        vi.stubGlobal('fetch', fetchMock);

        const client = createSchemaSyncClient(createEnv());
        const readinessPromise = client.getReadiness();
        const readinessExpectation = expect(
            readinessPromise
        ).resolves.toMatchObject({
            status: 'unavailable',
            ok: false,
            errorCode: 'schema_sync_timeout',
        });

        await vi.advanceTimersByTimeAsync(2_000);

        await readinessExpectation;
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('retries a transient connection-test transport failure once and logs the retry', async () => {
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        };
        const fetchMock = vi
            .fn()
            .mockRejectedValueOnce(new TypeError('connect ECONNREFUSED'))
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        ok: true,
                        databaseName: 'warehouse',
                        availableSchemas: ['public'],
                    }),
                    {
                        status: 200,
                        headers: {
                            'content-type': 'application/json',
                        },
                    }
                )
            );
        vi.stubGlobal('fetch', fetchMock);

        const client = createSchemaSyncClient(createEnv(), { logger });
        const result = await client.testConnection({
            connectionId: 'connection-1',
        });

        expect(result.ok).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(logger.warn).toHaveBeenCalledWith(
            expect.objectContaining({
                schemaSync: expect.objectContaining({
                    operation: 'test_connection',
                    attempt: 1,
                    maxAttempts: 2,
                }),
            }),
            'Retrying schema sync remote call after a transient failure'
        );
    });

    it('does not retry apply when the remote transport fails', async () => {
        const fetchMock = vi
            .fn()
            .mockRejectedValue(new TypeError('socket hang up'));
        vi.stubGlobal('fetch', fetchMock);

        const client = createSchemaSyncClient(createEnv());

        await expect(
            client.applySchema({
                planId: 'plan-1',
                actor: 'admin:owner@example.com',
                destructiveApproval: {
                    confirmed: true,
                    confirmationText: '',
                },
            })
        ).rejects.toMatchObject({
            code: 'schema_sync_service_unavailable',
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('classifies a 503 readiness response as not ready', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    ok: false,
                    checks: {
                        metadataDatabase: {
                            status: 'down',
                        },
                    },
                }),
                {
                    status: 503,
                    headers: {
                        'content-type': 'application/json',
                    },
                }
            )
        );
        vi.stubGlobal('fetch', fetchMock);

        const client = createSchemaSyncClient(createEnv());
        const readiness = await client.getReadiness();

        expect(readiness).toMatchObject({
            status: 'not_ready',
            ok: false,
            errorCode: 'schema_sync_service_not_ready',
        });
    });

    it('surfaces diff timeouts as explicit timeout errors', async () => {
        vi.useFakeTimers();
        const fetchMock = createAbortAwarePendingFetch();
        vi.stubGlobal('fetch', fetchMock);

        const client = createSchemaSyncClient(createEnv());
        const diffPromise = client.diffSchema({
            baselineSnapshotId: 'baseline-1',
            targetSchema: createTargetSchema(),
            actor: 'workflow-preview',
        });
        const diffExpectation = expect(diffPromise).rejects.toMatchObject({
            code: 'schema_sync_timeout',
        });

        await vi.advanceTimersByTimeAsync(20_000);

        await diffExpectation;
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('classifies invalid JSON as an invalid remote response and logs it', async () => {
        const logger = {
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
        };
        const fetchMock = vi.fn().mockResolvedValue(
            new Response('not-json', {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                },
            })
        );
        vi.stubGlobal('fetch', fetchMock);

        const client = createSchemaSyncClient(createEnv(), { logger });

        await expect(client.listConnections()).rejects.toMatchObject({
            code: 'schema_sync_invalid_response',
        });
        expect(logger.error).toHaveBeenCalledWith(
            expect.objectContaining({
                schemaSync: expect.objectContaining({
                    operation: 'list_connections',
                    error: expect.objectContaining({
                        code: 'schema_sync_invalid_response',
                    }),
                }),
            }),
            'Schema sync remote call failed'
        );
    });
});
