import { z } from 'zod';

export const databaseEngineSchema = z.enum([
    'postgresql',
    'mysql',
    'mariadb',
    'sqlserver',
]);
export type DatabaseEngine = z.infer<typeof databaseEngineSchema>;

export const capabilitySupportSchema = z.enum([
    'full',
    'partial',
    'preview_only',
    'unsupported',
]);
export type CapabilitySupport = z.infer<typeof capabilitySupportSchema>;

export const engineCapabilitiesSchema = z.object({
    connection: z.object({
        testConnection: capabilitySupportSchema,
        multipleNamespaces: capabilitySupportSchema,
    }),
    introspection: z.object({
        tables: capabilitySupportSchema,
        views: capabilitySupportSchema,
        enums: capabilitySupportSchema,
        customTypes: capabilitySupportSchema,
        checkConstraints: capabilitySupportSchema,
    }),
    migration: z.object({
        createTable: capabilitySupportSchema,
        dropTable: capabilitySupportSchema,
        renameTable: capabilitySupportSchema,
        moveNamespace: capabilitySupportSchema,
        addColumn: capabilitySupportSchema,
        dropColumn: capabilitySupportSchema,
        alterColumnType: capabilitySupportSchema,
        alterNullability: capabilitySupportSchema,
        alterDefault: capabilitySupportSchema,
        primaryKeys: capabilitySupportSchema,
        uniqueConstraints: capabilitySupportSchema,
        indexes: capabilitySupportSchema,
        foreignKeys: capabilitySupportSchema,
        enums: capabilitySupportSchema,
        views: capabilitySupportSchema,
    }),
    apply: z.object({
        transactionalDdl: capabilitySupportSchema,
        nonTransactionalOperationsPresent: z.boolean(),
        destructiveApprovalRequired: z.boolean(),
    }),
});
export type EngineCapabilities = z.infer<typeof engineCapabilitiesSchema>;

export interface SchemaEngineDefinition {
    id: DatabaseEngine;
    label: string;
    defaultNamespace: string;
    namespaceModel: 'schema' | 'database';
    capabilities: EngineCapabilities;
}

const unsupportedCapabilities = (): EngineCapabilities => ({
    connection: {
        testConnection: 'unsupported',
        multipleNamespaces: 'unsupported',
    },
    introspection: {
        tables: 'unsupported',
        views: 'unsupported',
        enums: 'unsupported',
        customTypes: 'unsupported',
        checkConstraints: 'unsupported',
    },
    migration: {
        createTable: 'unsupported',
        dropTable: 'unsupported',
        renameTable: 'unsupported',
        moveNamespace: 'unsupported',
        addColumn: 'unsupported',
        dropColumn: 'unsupported',
        alterColumnType: 'unsupported',
        alterNullability: 'unsupported',
        alterDefault: 'unsupported',
        primaryKeys: 'unsupported',
        uniqueConstraints: 'unsupported',
        indexes: 'unsupported',
        foreignKeys: 'unsupported',
        enums: 'unsupported',
        views: 'unsupported',
    },
    apply: {
        transactionalDdl: 'unsupported',
        nonTransactionalOperationsPresent: false,
        destructiveApprovalRequired: true,
    },
});

export const postgresqlEngineCapabilities: EngineCapabilities = {
    connection: {
        testConnection: 'full',
        multipleNamespaces: 'full',
    },
    introspection: {
        tables: 'full',
        views: 'partial',
        enums: 'partial',
        customTypes: 'partial',
        checkConstraints: 'full',
    },
    migration: {
        createTable: 'full',
        dropTable: 'full',
        renameTable: 'full',
        moveNamespace: 'full',
        addColumn: 'full',
        dropColumn: 'full',
        alterColumnType: 'full',
        alterNullability: 'full',
        alterDefault: 'full',
        primaryKeys: 'full',
        uniqueConstraints: 'full',
        indexes: 'full',
        foreignKeys: 'full',
        enums: 'partial',
        views: 'preview_only',
    },
    apply: {
        transactionalDdl: 'partial',
        nonTransactionalOperationsPresent: true,
        destructiveApprovalRequired: true,
    },
};

export const schemaEngineDefinitions: Record<
    DatabaseEngine,
    SchemaEngineDefinition
> = {
    postgresql: {
        id: 'postgresql',
        label: 'PostgreSQL',
        defaultNamespace: 'public',
        namespaceModel: 'schema',
        capabilities: postgresqlEngineCapabilities,
    },
    mysql: {
        id: 'mysql',
        label: 'MySQL',
        defaultNamespace: '',
        namespaceModel: 'database',
        capabilities: unsupportedCapabilities(),
    },
    mariadb: {
        id: 'mariadb',
        label: 'MariaDB',
        defaultNamespace: '',
        namespaceModel: 'database',
        capabilities: unsupportedCapabilities(),
    },
    sqlserver: {
        id: 'sqlserver',
        label: 'SQL Server',
        defaultNamespace: 'dbo',
        namespaceModel: 'schema',
        capabilities: unsupportedCapabilities(),
    },
};

export const getSchemaEngineDefinition = (
    engine: DatabaseEngine
): SchemaEngineDefinition => schemaEngineDefinitions[engine];

export const getSchemaEngineDefaultNamespace = (
    engine: DatabaseEngine
): string => getSchemaEngineDefinition(engine).defaultNamespace;
