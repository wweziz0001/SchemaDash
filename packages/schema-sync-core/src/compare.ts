import type {
    CanonicalColumn,
    CanonicalForeignKey,
    CanonicalSchema,
    CanonicalTable,
} from './types.js';
import type {
    CompareCountSummary,
    CompareFieldResult,
    CompareRelationshipResult,
    CompareSchemaResult,
    CompareTableResult,
    CompareValueChange,
} from './compare-types.js';

const qualifyTable = (schemaName: string, tableName: string) =>
    `${schemaName}.${tableName}`;

const normalizeName = (value: string) => value.trim().toLowerCase();

const normalizeType = (value?: string | null) =>
    value?.trim().replace(/\s+/g, ' ').toLowerCase() ?? null;

const normalizeScalar = (
    value: string | number | boolean | null | undefined
): string | number | boolean | null => {
    if (typeof value === 'string') {
        return value.trim();
    }

    return value ?? null;
};

const normalizeColumnRef = (value: string) => {
    const normalized = value.trim();
    if (normalized.includes('.')) {
        return normalizeName(normalized.slice(normalized.lastIndexOf('.') + 1));
    }

    return normalizeName(normalized);
};

const getTableMatchKey = (table: CanonicalTable) =>
    (
        table.sync?.sourceId ?? qualifyTable(table.schemaName, table.name)
    ).toLowerCase();

const getColumnMatchKey = (column: CanonicalColumn) =>
    (column.sync?.sourceId ?? normalizeName(column.name)).toLowerCase();

const getQualifiedColumnKey = (
    table: CanonicalTable,
    column: CanonicalColumn
) =>
    qualifyTable(table.schemaName, table.name)
        .concat(`.${column.name}`)
        .toLowerCase();

const getTableIdentityKey = (schemaName: string, tableName: string) =>
    qualifyTable(schemaName, tableName).toLowerCase();

const collectSingleColumnUniqueKeys = (table: CanonicalTable) =>
    new Set(
        table.uniqueConstraints
            .filter((constraint) => constraint.columnIds.length === 1)
            .map((constraint) => normalizeColumnRef(constraint.columnIds[0]))
    );

const isColumnPrimaryKey = (table: CanonicalTable, column: CanonicalColumn) => {
    const key = getColumnMatchKey(column);
    const qualifiedKey = getQualifiedColumnKey(table, column);
    const primaryKeyColumnIds = table.primaryKey?.columnIds ?? [];

    return (
        column.isPrimaryKey === true ||
        primaryKeyColumnIds.some((columnId) => {
            const normalized = normalizeName(columnId);
            return normalized === key || normalized === qualifiedKey;
        })
    );
};

const isColumnUnique = (table: CanonicalTable, column: CanonicalColumn) => {
    const columnKey = getColumnMatchKey(column);
    return (
        column.isUnique === true ||
        collectSingleColumnUniqueKeys(table).has(columnKey)
    );
};

const compareTableProperties = (
    baselineTable: CanonicalTable,
    targetTable: CanonicalTable
) => {
    const changes: CompareValueChange[] = [];

    if (baselineTable.schemaName !== targetTable.schemaName) {
        changes.push({
            property: 'schemaName',
            baseline: baselineTable.schemaName,
            target: targetTable.schemaName,
        });
    }

    if (baselineTable.name !== targetTable.name) {
        changes.push({
            property: 'name',
            baseline: baselineTable.name,
            target: targetTable.name,
        });
    }

    if (baselineTable.kind !== targetTable.kind) {
        changes.push({
            property: 'kind',
            baseline: baselineTable.kind,
            target: targetTable.kind,
        });
    }

    if (
        normalizeScalar(baselineTable.comment) !==
        normalizeScalar(targetTable.comment)
    ) {
        changes.push({
            property: 'comment',
            baseline: baselineTable.comment ?? null,
            target: targetTable.comment ?? null,
        });
    }

    return changes;
};

const compareColumns = ({
    baselineTable,
    targetTable,
    tableMatchKey,
}: {
    baselineTable: CanonicalTable;
    targetTable: CanonicalTable;
    tableMatchKey: string;
}): CompareFieldResult[] => {
    const baselineByKey = new Map(
        baselineTable.columns.map((column) => [
            getColumnMatchKey(column),
            column,
        ])
    );
    const targetByKey = new Map(
        targetTable.columns.map((column) => [getColumnMatchKey(column), column])
    );
    const fieldKeys = new Set([...baselineByKey.keys(), ...targetByKey.keys()]);
    const fields: CompareFieldResult[] = [];

    for (const fieldKey of fieldKeys) {
        const baselineColumn = baselineByKey.get(fieldKey);
        const targetColumn = targetByKey.get(fieldKey);

        if (!baselineColumn && targetColumn) {
            fields.push({
                matchKey: fieldKey,
                tableMatchKey,
                status: 'added',
                target: targetColumn,
                changedProperties: [],
            });
            continue;
        }

        if (baselineColumn && !targetColumn) {
            fields.push({
                matchKey: fieldKey,
                tableMatchKey,
                status: 'removed',
                baseline: baselineColumn,
                changedProperties: [],
            });
            continue;
        }

        if (!baselineColumn || !targetColumn) {
            continue;
        }

        const changedProperties: CompareValueChange[] = [];
        const baselineType = normalizeType(
            baselineColumn.dataTypeDisplay ?? baselineColumn.dataType
        );
        const targetType = normalizeType(
            targetColumn.dataTypeDisplay ?? targetColumn.dataType
        );

        if (baselineColumn.name !== targetColumn.name) {
            changedProperties.push({
                property: 'name',
                baseline: baselineColumn.name,
                target: targetColumn.name,
            });
        }

        if (baselineType !== targetType) {
            changedProperties.push({
                property: 'type',
                baseline:
                    baselineColumn.dataTypeDisplay ?? baselineColumn.dataType,
                target: targetColumn.dataTypeDisplay ?? targetColumn.dataType,
            });
        }

        if (baselineColumn.nullable !== targetColumn.nullable) {
            changedProperties.push({
                property: 'nullable',
                baseline: baselineColumn.nullable,
                target: targetColumn.nullable,
            });
        }

        if (
            normalizeScalar(baselineColumn.defaultValue) !==
            normalizeScalar(targetColumn.defaultValue)
        ) {
            changedProperties.push({
                property: 'default',
                baseline: baselineColumn.defaultValue ?? null,
                target: targetColumn.defaultValue ?? null,
            });
        }

        if (
            isColumnPrimaryKey(baselineTable, baselineColumn) !==
            isColumnPrimaryKey(targetTable, targetColumn)
        ) {
            changedProperties.push({
                property: 'primaryKey',
                baseline: isColumnPrimaryKey(baselineTable, baselineColumn),
                target: isColumnPrimaryKey(targetTable, targetColumn),
            });
        }

        if (
            isColumnUnique(baselineTable, baselineColumn) !==
            isColumnUnique(targetTable, targetColumn)
        ) {
            changedProperties.push({
                property: 'unique',
                baseline: isColumnUnique(baselineTable, baselineColumn),
                target: isColumnUnique(targetTable, targetColumn),
            });
        }

        fields.push({
            matchKey: fieldKey,
            tableMatchKey,
            status: changedProperties.length > 0 ? 'changed' : 'unchanged',
            baseline: baselineColumn,
            target: targetColumn,
            changedProperties,
        });
    }

    return fields;
};

const buildRelationshipMatchKey = ({
    foreignKey,
    localTable,
}: {
    foreignKey: CanonicalForeignKey;
    localTable: CanonicalTable;
}) =>
    (
        foreignKey.sync?.sourceId ??
        [
            getTableMatchKey(localTable),
            foreignKey.columnIds.map(normalizeColumnRef).join(','),
            getTableIdentityKey(
                foreignKey.referencedSchemaName,
                foreignKey.referencedTableName
            ),
            foreignKey.referencedColumnNames.map(normalizeName).join(','),
        ].join('|')
    ).toLowerCase();

const compareRelationshipProperties = (
    baselineForeignKey: CanonicalForeignKey,
    targetForeignKey: CanonicalForeignKey
) => {
    const changes: CompareValueChange[] = [];

    if (baselineForeignKey.name !== targetForeignKey.name) {
        changes.push({
            property: 'name',
            baseline: baselineForeignKey.name,
            target: targetForeignKey.name,
        });
    }

    const baselineColumns =
        baselineForeignKey.columnIds.map(normalizeColumnRef);
    const targetColumns = targetForeignKey.columnIds.map(normalizeColumnRef);
    if (JSON.stringify(baselineColumns) !== JSON.stringify(targetColumns)) {
        changes.push({
            property: 'columnIds',
            baseline: baselineForeignKey.columnIds,
            target: targetForeignKey.columnIds,
        });
    }

    const baselineReferencedTable = getTableIdentityKey(
        baselineForeignKey.referencedSchemaName,
        baselineForeignKey.referencedTableName
    );
    const targetReferencedTable = getTableIdentityKey(
        targetForeignKey.referencedSchemaName,
        targetForeignKey.referencedTableName
    );
    if (baselineReferencedTable !== targetReferencedTable) {
        changes.push({
            property: 'referencedTable',
            baseline: qualifyTable(
                baselineForeignKey.referencedSchemaName,
                baselineForeignKey.referencedTableName
            ),
            target: qualifyTable(
                targetForeignKey.referencedSchemaName,
                targetForeignKey.referencedTableName
            ),
        });
    }

    const baselineReferencedColumns =
        baselineForeignKey.referencedColumnNames.map(normalizeName);
    const targetReferencedColumns =
        targetForeignKey.referencedColumnNames.map(normalizeName);
    if (
        JSON.stringify(baselineReferencedColumns) !==
        JSON.stringify(targetReferencedColumns)
    ) {
        changes.push({
            property: 'referencedColumnNames',
            baseline: baselineForeignKey.referencedColumnNames,
            target: targetForeignKey.referencedColumnNames,
        });
    }

    if (
        normalizeScalar(baselineForeignKey.onUpdate) !==
        normalizeScalar(targetForeignKey.onUpdate)
    ) {
        changes.push({
            property: 'onUpdate',
            baseline: baselineForeignKey.onUpdate ?? null,
            target: targetForeignKey.onUpdate ?? null,
        });
    }

    if (
        normalizeScalar(baselineForeignKey.onDelete) !==
        normalizeScalar(targetForeignKey.onDelete)
    ) {
        changes.push({
            property: 'onDelete',
            baseline: baselineForeignKey.onDelete ?? null,
            target: targetForeignKey.onDelete ?? null,
        });
    }

    return changes;
};

const createSummary = (
    statuses: Array<CompareFieldResult['status']>
): CompareCountSummary => {
    const summary = {
        added: 0,
        removed: 0,
        changed: 0,
        unchanged: 0,
        total: statuses.length,
    };

    for (const status of statuses) {
        summary[status] += 1;
    }

    return summary;
};

export const compareCanonicalSchemas = ({
    baseline,
    target,
}: {
    baseline: CanonicalSchema;
    target: CanonicalSchema;
}): CompareSchemaResult => {
    const baselineTables = new Map(
        baseline.tables.map((table) => [getTableMatchKey(table), table])
    );
    const targetTables = new Map(
        target.tables.map((table) => [getTableMatchKey(table), table])
    );
    const tableKeys = new Set([
        ...baselineTables.keys(),
        ...targetTables.keys(),
    ]);

    const tables: CompareTableResult[] = [];
    const relationships: CompareRelationshipResult[] = [];

    for (const tableKey of tableKeys) {
        const baselineTable = baselineTables.get(tableKey);
        const targetTable = targetTables.get(tableKey);

        if (!baselineTable && targetTable) {
            tables.push({
                matchKey: tableKey,
                status: 'added',
                target: targetTable,
                changedProperties: [],
                fields: targetTable.columns.map((column) => ({
                    matchKey: getColumnMatchKey(column),
                    tableMatchKey: tableKey,
                    status: 'added',
                    target: column,
                    changedProperties: [],
                })),
            });
            continue;
        }

        if (baselineTable && !targetTable) {
            tables.push({
                matchKey: tableKey,
                status: 'removed',
                baseline: baselineTable,
                changedProperties: [],
                fields: baselineTable.columns.map((column) => ({
                    matchKey: getColumnMatchKey(column),
                    tableMatchKey: tableKey,
                    status: 'removed',
                    baseline: column,
                    changedProperties: [],
                })),
            });
            continue;
        }

        if (!baselineTable || !targetTable) {
            continue;
        }

        const fieldResults = compareColumns({
            baselineTable,
            targetTable,
            tableMatchKey: tableKey,
        });
        const changedProperties = compareTableProperties(
            baselineTable,
            targetTable
        );
        const hasFieldChanges = fieldResults.some(
            (field) => field.status !== 'unchanged'
        );

        tables.push({
            matchKey: tableKey,
            status:
                changedProperties.length > 0 || hasFieldChanges
                    ? 'changed'
                    : 'unchanged',
            baseline: baselineTable,
            target: targetTable,
            changedProperties,
            fields: fieldResults,
        });
    }

    const baselineRelationships = new Map<
        string,
        {
            foreignKey: CanonicalForeignKey;
            tableMatchKey: string;
        }
    >();
    for (const table of baseline.tables) {
        const tableMatchKey = getTableMatchKey(table);
        for (const foreignKey of table.foreignKeys) {
            baselineRelationships.set(
                buildRelationshipMatchKey({
                    foreignKey,
                    localTable: table,
                }),
                {
                    foreignKey,
                    tableMatchKey,
                }
            );
        }
    }

    const targetRelationships = new Map<
        string,
        {
            foreignKey: CanonicalForeignKey;
            tableMatchKey: string;
        }
    >();
    for (const table of target.tables) {
        const tableMatchKey = getTableMatchKey(table);
        for (const foreignKey of table.foreignKeys) {
            targetRelationships.set(
                buildRelationshipMatchKey({
                    foreignKey,
                    localTable: table,
                }),
                {
                    foreignKey,
                    tableMatchKey,
                }
            );
        }
    }

    const relationshipKeys = new Set([
        ...baselineRelationships.keys(),
        ...targetRelationships.keys(),
    ]);
    for (const relationshipKey of relationshipKeys) {
        const baselineRelationship = baselineRelationships.get(relationshipKey);
        const targetRelationship = targetRelationships.get(relationshipKey);

        if (!baselineRelationship && targetRelationship) {
            relationships.push({
                matchKey: relationshipKey,
                status: 'added',
                target: targetRelationship.foreignKey,
                targetTableMatchKey: targetRelationship.tableMatchKey,
                changedProperties: [],
            });
            continue;
        }

        if (baselineRelationship && !targetRelationship) {
            relationships.push({
                matchKey: relationshipKey,
                status: 'removed',
                baseline: baselineRelationship.foreignKey,
                baselineTableMatchKey: baselineRelationship.tableMatchKey,
                changedProperties: [],
            });
            continue;
        }

        if (!baselineRelationship || !targetRelationship) {
            continue;
        }

        const changedProperties = compareRelationshipProperties(
            baselineRelationship.foreignKey,
            targetRelationship.foreignKey
        );

        relationships.push({
            matchKey: relationshipKey,
            status: changedProperties.length > 0 ? 'changed' : 'unchanged',
            baseline: baselineRelationship.foreignKey,
            target: targetRelationship.foreignKey,
            baselineTableMatchKey: baselineRelationship.tableMatchKey,
            targetTableMatchKey: targetRelationship.tableMatchKey,
            changedProperties,
        });
    }

    const fieldStatuses = tables.flatMap((table) =>
        table.fields.map((field) => field.status)
    );
    const summary = {
        tables: createSummary(tables.map((table) => table.status)),
        fields: createSummary(fieldStatuses),
        relationships: createSummary(
            relationships.map((relationship) => relationship.status)
        ),
    };

    return {
        baseline: {
            fingerprint: baseline.fingerprint,
            importedAt: baseline.importedAt,
            schema: baseline,
        },
        target: {
            fingerprint: target.fingerprint,
            importedAt: target.importedAt,
            schema: target,
        },
        tables,
        relationships,
        summary,
        hasChanges:
            summary.tables.changed +
                summary.tables.added +
                summary.tables.removed +
                summary.relationships.changed +
                summary.relationships.added +
                summary.relationships.removed >
            0,
    };
};
