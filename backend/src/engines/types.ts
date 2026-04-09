import type {
    CanonicalSchema,
    ConnectionTestResponse,
    DatabaseConnectionSecret,
    DatabaseEngine,
    EngineCapabilities,
    SchemaChange,
} from '@schemadash/schema-sync-core';

export interface SchemaSyncQueryResult<Row = Record<string, unknown>> {
    rows: Row[];
}

export interface SchemaSyncQueryClient {
    query<Row = Record<string, unknown>>(
        sql: string
    ): Promise<SchemaSyncQueryResult<Row>>;
    end(): Promise<void>;
}

export interface SchemaSyncIntrospectionInput {
    secret: DatabaseConnectionSecret;
    schemas: string[];
}

export interface SchemaSyncRenderPlanInput {
    changes: SchemaChange[];
    targetSchema: CanonicalSchema;
}

export interface SchemaSyncStatementGroups {
    beforeTransaction: string[];
    transactional: string[];
}

export interface SchemaSyncApplyPreflightInput {
    client: SchemaSyncQueryClient;
    changes: SchemaChange[];
    logs: string[];
}

export interface SchemaSyncAdapter {
    readonly engine: DatabaseEngine;
    getCapabilities(): EngineCapabilities;
    testConnection(
        secret: DatabaseConnectionSecret
    ): Promise<ConnectionTestResponse>;
    introspectSchema(
        input: SchemaSyncIntrospectionInput
    ): Promise<CanonicalSchema>;
    renderPlan(input: SchemaSyncRenderPlanInput): string[];
    createClient(
        secret: DatabaseConnectionSecret
    ): Promise<SchemaSyncQueryClient>;
    splitStatements(statements: string[]): SchemaSyncStatementGroups;
    validateApplyPreflight(input: SchemaSyncApplyPreflightInput): Promise<void>;
}
