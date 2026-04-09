import type { DatabaseEngine } from '@schemadash/schema-sync-core';
import { AppError } from '../utils/app-error.js';
import type { SchemaSyncAdapter } from './types.js';
import { postgresqlSchemaSyncAdapter } from './postgresql/adapter.js';

export class SchemaSyncAdapterRegistry {
    private readonly adapters: Map<DatabaseEngine, SchemaSyncAdapter>;

    constructor(adapters: SchemaSyncAdapter[]) {
        this.adapters = new Map(
            adapters.map((adapter) => [adapter.engine, adapter])
        );
    }

    resolve(engine: DatabaseEngine): SchemaSyncAdapter {
        const adapter = this.adapters.get(engine);
        if (!adapter) {
            throw new AppError(
                `Schema sync adapter for engine ${engine} is not available.`,
                501,
                'schema_sync_engine_not_supported'
            );
        }

        return adapter;
    }
}

export const createSchemaSyncAdapterRegistry = () =>
    new SchemaSyncAdapterRegistry([postgresqlSchemaSyncAdapter]);
