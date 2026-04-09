import type { SchemaChange } from '@schemadash/schema-sync-core';
import type {
    SchemaSyncApplyPreflightInput,
    SchemaSyncStatementGroups,
} from '../types.js';

const quoteIdent = (value: string) => `"${value.replace(/"/g, '""')}"`;
const qualify = (schemaName: string, tableName: string) =>
    `${quoteIdent(schemaName)}.${quoteIdent(tableName)}`;

export const isPostgresqlNonTransactionalStatement = (statement: string) =>
    /^\s*ALTER\s+TYPE\b[\s\S]*\bADD\s+VALUE\b/i.test(statement);

export const splitPostgresqlStatements = (
    statements: string[]
): SchemaSyncStatementGroups => ({
    beforeTransaction: statements.filter(isPostgresqlNonTransactionalStatement),
    transactional: statements.filter(
        (statement) => !isPostgresqlNonTransactionalStatement(statement)
    ),
});

const validateNotNullPreflight = async ({
    client,
    change,
    logs,
}: {
    client: SchemaSyncApplyPreflightInput['client'];
    change: Extract<SchemaChange, { kind: 'alter_column_nullability' }>;
    logs: string[];
}) => {
    const result = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM ${qualify(
            change.schemaName,
            change.tableName
        )} WHERE ${quoteIdent(change.columnName)} IS NULL`
    );
    const count = Number.parseInt(result.rows[0]?.count ?? '0', 10);
    logs.push(
        `Preflight check ${change.tableName}.${change.columnName}: ${count} null rows`
    );
    if (count > 0) {
        throw new Error(
            `Cannot set ${change.tableName}.${change.columnName} to NOT NULL while ${count} rows still contain NULL values.`
        );
    }
};

export const validatePostgresqlApplyPreflight = async ({
    client,
    changes,
    logs,
}: SchemaSyncApplyPreflightInput) => {
    for (const change of changes) {
        if (
            change.kind === 'alter_column_nullability' &&
            change.toNullable === false
        ) {
            await validateNotNullPreflight({
                client,
                change,
                logs,
            });
        }
    }
};
