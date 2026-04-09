import {
    generateMigrationSql,
    type CanonicalSchema,
    type SchemaChange,
} from '@schemadash/schema-sync-core';

export const renderPostgresqlPlan = ({
    changes,
    targetSchema,
}: {
    changes: SchemaChange[];
    targetSchema: CanonicalSchema;
}) => generateMigrationSql(changes, targetSchema);
