import { describe, expect, it, vi } from 'vitest';
import type { ConnectionTestDraft } from '@schemadash/schema-sync-core';
import { createSchemaSyncAdapterRegistry } from '../src/engines/registry.js';
import { ConnectionsService } from '../src/services/connections-service.js';

describe('schema sync adapter registry', () => {
    it('resolves the PostgreSQL adapter with the expected capabilities', () => {
        const registry = createSchemaSyncAdapterRegistry();

        const adapter = registry.resolve('postgresql');

        expect(adapter.engine).toBe('postgresql');
        expect(adapter.getCapabilities()).toEqual(
            expect.objectContaining({
                connection: expect.objectContaining({
                    testConnection: 'full',
                }),
                migration: expect.objectContaining({
                    createTable: 'full',
                    enums: 'partial',
                }),
                apply: expect.objectContaining({
                    transactionalDdl: 'partial',
                    destructiveApprovalRequired: true,
                }),
            })
        );
    });

    it('rejects unsupported adapters until they are implemented', () => {
        const registry = createSchemaSyncAdapterRegistry();

        expect(() => registry.resolve('mysql')).toThrow(
            /Schema sync adapter for engine mysql is not available/
        );
    });
});

describe('connections service adapter routing', () => {
    it('tests draft connections through the resolved engine adapter', async () => {
        const draft: ConnectionTestDraft = {
            name: '',
            engine: 'postgresql',
            defaultSchemas: ['public'],
            secret: {
                host: 'localhost',
                port: 5432,
                database: 'warehouse',
                username: 'postgres',
                password: 'postgres',
                sslMode: 'disable',
            },
        };
        const adapterTestConnection = vi.fn().mockResolvedValue({
            ok: true,
            version: 'PostgreSQL 16',
            databaseName: 'warehouse',
            availableSchemas: ['public'],
        });
        const registry = {
            resolve: vi.fn().mockReturnValue({
                testConnection: adapterTestConnection,
            }),
        };
        const service = new ConnectionsService(
            {
                listConnections: vi.fn().mockReturnValue([]),
                getConnection: vi.fn().mockReturnValue(undefined),
            } as never,
            Buffer.from('test-key'),
            registry as never
        );

        const result = await service.testConnection({
            connection: draft,
        });

        expect(registry.resolve).toHaveBeenCalledWith('postgresql');
        expect(adapterTestConnection).toHaveBeenCalledWith(draft.secret);
        expect(result).toEqual(
            expect.objectContaining({
                ok: true,
                databaseName: 'warehouse',
                availableSchemas: ['public'],
            })
        );
    });
});
