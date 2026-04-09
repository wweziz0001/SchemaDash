import { Client } from 'pg';
import type {
    ConnectionTestResponse,
    DatabaseConnectionSecret,
} from '@schemadash/schema-sync-core';
import type { SchemaSyncQueryClient } from '../types.js';

export const createPostgresqlClient = async (
    secret: DatabaseConnectionSecret
): Promise<SchemaSyncQueryClient> => {
    const client = new Client({
        host: secret.host,
        port: secret.port,
        database: secret.database,
        user: secret.username,
        password: secret.password,
        ssl:
            secret.sslMode === 'disable'
                ? false
                : { rejectUnauthorized: false },
    });
    await client.connect();
    return client;
};

export const testPostgresqlConnection = async (
    secret: DatabaseConnectionSecret
): Promise<ConnectionTestResponse> => {
    const client = await createPostgresqlClient(secret);
    try {
        const versionResult = await client.query<{ version: string }>(
            'SELECT version() AS version'
        );
        const schemasResult = await client.query<{ schema_name: string }>(
            `
            SELECT schema_name
            FROM information_schema.schemata
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
            ORDER BY schema_name
            `
        );

        return {
            ok: true,
            version: versionResult.rows[0]?.version,
            databaseName: secret.database,
            availableSchemas: schemasResult.rows.map((row) => row.schema_name),
        };
    } finally {
        await client.end();
    }
};
