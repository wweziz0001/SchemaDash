import type {
    CanonicalColumn,
    CanonicalSchema,
    CanonicalTable,
    SchemaChange,
} from './types.js';

const quoteIdent = (value: string) => `"${value.replace(/"/g, '""')}"`;
const quoteLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;
const qualify = (schemaName: string, tableName: string) =>
    `${quoteIdent(schemaName)}.${quoteIdent(tableName)}`;
const normalizeTypeReference = (value: string) =>
    value.replace(/"/g, '').replace(/\[\]$/, '').trim();
const normalizeName = (value: string) => value.trim().toLowerCase();

const buildCustomTypeMap = (schema?: CanonicalSchema) =>
    new Map(
        (schema?.customTypes ?? []).map((customType) => [
            customType.id,
            customType,
        ])
    );

const buildTableMap = (schema?: CanonicalSchema) =>
    new Map(
        (schema?.tables ?? []).map((table) => [
            `${normalizeName(table.schemaName)}.${normalizeName(table.name)}`,
            table,
        ])
    );

const resolveColumnName = (
    table: CanonicalTable,
    columnKeyOrName: string
): string | null => {
    const normalized = normalizeName(columnKeyOrName);
    const directName = columnKeyOrName.includes('.')
        ? columnKeyOrName.slice(columnKeyOrName.lastIndexOf('.') + 1)
        : columnKeyOrName;

    const directMatch = table.columns.find(
        (column) => normalizeName(column.name) === normalizeName(directName)
    );
    if (directMatch) {
        return directMatch.name;
    }

    const byReference = table.columns.find(
        (column) =>
            normalizeName(column.id) === normalized ||
            normalizeName(column.sync?.sourceId ?? '') === normalized
    );

    return byReference?.name ?? null;
};

const resolveColumnNames = (
    table: CanonicalTable,
    columnKeysOrNames: string[]
): string[] | null => {
    const resolved = columnKeysOrNames.map((value) =>
        resolveColumnName(table, value)
    );

    return resolved.every(Boolean) ? (resolved as string[]) : null;
};

const renderResolvedColumnList = (
    table: CanonicalTable,
    columnKeysOrNames: string[]
) => {
    const resolvedColumnNames = resolveColumnNames(table, columnKeysOrNames);
    if (!resolvedColumnNames?.length) {
        return null;
    }

    return resolvedColumnNames.map(quoteIdent).join(', ');
};

const renderTypeReference = ({
    typeName,
    customTypeId,
    customTypesById,
}: {
    typeName: string;
    customTypeId?: string | null;
    customTypesById: Map<string, CanonicalSchema['customTypes'][number]>;
}) => {
    const customType = customTypeId ? customTypesById.get(customTypeId) : null;
    if (customType) {
        return qualify(customType.schemaName, customType.name);
    }

    const normalized = normalizeTypeReference(typeName);
    if (
        normalized.includes('.') &&
        !normalized.includes(' ') &&
        !normalized.includes('(')
    ) {
        const [schemaName, localName] = normalized.split('.');
        return qualify(schemaName, localName);
    }

    return typeName;
};

const renderType = (
    column: CanonicalColumn,
    customTypesById: Map<string, CanonicalSchema['customTypes'][number]>
) => {
    const base = renderTypeReference({
        typeName: column.dataTypeDisplay ?? column.dataType,
        customTypeId: column.customTypeId,
        customTypesById,
    });
    if (column.isArray) {
        return `${base}[]`;
    }
    return base;
};

const renderColumnDefinition = (
    column: CanonicalColumn,
    customTypesById: Map<string, CanonicalSchema['customTypes'][number]>
) => {
    const parts = [
        `${quoteIdent(column.name)} ${renderType(column, customTypesById)}`,
    ];
    if (!column.nullable) {
        parts.push('NOT NULL');
    }
    if (column.defaultValue) {
        parts.push(`DEFAULT ${column.defaultValue}`);
    }
    if (column.isIdentity) {
        parts.push(
            `GENERATED ${column.identityGeneration ?? 'BY DEFAULT'} AS IDENTITY`
        );
    }
    return parts.join(' ');
};

const renderCreateTable = (
    table: CanonicalTable,
    customTypesById: Map<string, CanonicalSchema['customTypes'][number]>
) => {
    const lines = table.columns.map((column) =>
        renderColumnDefinition(column, customTypesById)
    );

    if (table.primaryKey?.columnIds.length) {
        const columnNames = renderResolvedColumnList(
            table,
            table.primaryKey.columnIds
        );
        if (columnNames) {
            lines.push(`PRIMARY KEY (${columnNames})`);
        }
    }

    for (const constraint of table.uniqueConstraints) {
        const columnNames = renderResolvedColumnList(
            table,
            constraint.columnIds
        );
        if (columnNames) {
            lines.push(
                `CONSTRAINT ${quoteIdent(constraint.name)} UNIQUE (${columnNames})`
            );
        }
    }

    for (const constraint of table.checkConstraints) {
        lines.push(
            `CONSTRAINT ${quoteIdent(constraint.name ?? constraint.id)} CHECK (${constraint.expression})`
        );
    }

    return `CREATE TABLE ${qualify(table.schemaName, table.name)} (\n  ${lines.join(',\n  ')}\n);`;
};

const alterColumnType = (
    change: Extract<SchemaChange, { kind: 'alter_column_type' }>,
    customTypesById: Map<string, CanonicalSchema['customTypes'][number]>
) =>
    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ALTER COLUMN ${quoteIdent(change.columnName)} TYPE ${renderTypeReference(
        {
            typeName: change.toType,
            customTypeId: change.customTypeId,
            customTypesById,
        }
    )} USING ${quoteIdent(change.columnName)}::${renderTypeReference({
        typeName: change.toType,
        customTypeId: change.customTypeId,
        customTypesById,
    })};`;

const orderRank = (change: SchemaChange): number => {
    switch (change.kind) {
        case 'create_schema':
            return 0;
        case 'create_enum_type':
            return 5;
        case 'create_table':
            return 10;
        case 'move_table':
        case 'rename_table':
            return 20;
        case 'add_enum_value':
            return 25;
        case 'add_column':
            return 30;
        case 'alter_column_type':
        case 'alter_column_default':
        case 'alter_column_nullability':
        case 'rename_column':
            return 40;
        case 'drop_primary_key':
            return 45;
        case 'add_primary_key':
        case 'add_unique_constraint':
        case 'add_check_constraint':
            return 50;
        case 'add_index':
            return 60;
        case 'add_foreign_key':
            return 70;
        case 'drop_foreign_key':
        case 'drop_index':
        case 'drop_unique_constraint':
        case 'drop_check_constraint':
            return 80;
        case 'drop_column':
            return 90;
        case 'drop_table':
            return 100;
    }
};

export const generateMigrationSql = (
    changes: SchemaChange[],
    targetSchema?: CanonicalSchema
): string[] => {
    const sql: string[] = [];
    const customTypesById = buildCustomTypeMap(targetSchema);
    const tablesByName = buildTableMap(targetSchema);

    for (const change of [...changes].sort(
        (left, right) => orderRank(left) - orderRank(right)
    )) {
        switch (change.kind) {
            case 'create_schema':
                sql.push(
                    `CREATE SCHEMA IF NOT EXISTS ${quoteIdent(change.schemaName)};`
                );
                break;
            case 'create_enum_type':
                sql.push(
                    `CREATE TYPE ${qualify(
                        change.customType.schemaName,
                        change.customType.name
                    )} AS ENUM (${change.customType.values
                        .map(quoteLiteral)
                        .join(', ')});`
                );
                break;
            case 'create_table':
                sql.push(renderCreateTable(change.table, customTypesById));
                break;
            case 'move_table':
                sql.push(
                    `ALTER TABLE ${qualify(change.fromSchema, change.tableName)} SET SCHEMA ${quoteIdent(change.toSchema)};`
                );
                break;
            case 'rename_table':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.fromName)} RENAME TO ${quoteIdent(change.toName)};`
                );
                break;
            case 'add_enum_value':
                sql.push(
                    `ALTER TYPE ${qualify(change.schemaName, change.typeName)} ADD VALUE IF NOT EXISTS ${quoteLiteral(change.value)};`
                );
                break;
            case 'add_column':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ADD COLUMN ${renderColumnDefinition(change.column, customTypesById)};`
                );
                break;
            case 'drop_column':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} DROP COLUMN ${quoteIdent(change.column.name)};`
                );
                break;
            case 'rename_column':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} RENAME COLUMN ${quoteIdent(change.fromName)} TO ${quoteIdent(change.toName)};`
                );
                break;
            case 'alter_column_type':
                sql.push(alterColumnType(change, customTypesById));
                break;
            case 'alter_column_nullability':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ALTER COLUMN ${quoteIdent(change.columnName)} ${change.toNullable ? 'DROP NOT NULL' : 'SET NOT NULL'};`
                );
                break;
            case 'alter_column_default':
                sql.push(
                    change.toDefault
                        ? `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ALTER COLUMN ${quoteIdent(change.columnName)} SET DEFAULT ${change.toDefault};`
                        : `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ALTER COLUMN ${quoteIdent(change.columnName)} DROP DEFAULT;`
                );
                break;
            case 'add_primary_key': {
                const table = tablesByName.get(
                    `${normalizeName(change.schemaName)}.${normalizeName(change.tableName)}`
                );
                const columnNames = table
                    ? renderResolvedColumnList(
                          table,
                          change.primaryKey.columnIds
                      )
                    : null;
                if (!columnNames) {
                    break;
                }
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ADD PRIMARY KEY (${columnNames});`
                );
                break;
            }
            case 'drop_primary_key':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} DROP CONSTRAINT IF EXISTS ${quoteIdent(change.primaryKey.name ?? `${change.tableName}_pkey`)};`
                );
                break;
            case 'add_unique_constraint': {
                const table = tablesByName.get(
                    `${normalizeName(change.schemaName)}.${normalizeName(change.tableName)}`
                );
                const columnNames = table
                    ? renderResolvedColumnList(
                          table,
                          change.constraint.columnIds
                      )
                    : null;
                if (!columnNames) {
                    break;
                }
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ADD CONSTRAINT ${quoteIdent(change.constraint.name)} UNIQUE (${columnNames});`
                );
                break;
            }
            case 'drop_unique_constraint':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} DROP CONSTRAINT IF EXISTS ${quoteIdent(change.constraint.name)};`
                );
                break;
            case 'add_index': {
                const table = tablesByName.get(
                    `${normalizeName(change.schemaName)}.${normalizeName(change.tableName)}`
                );
                const columnNames = table
                    ? renderResolvedColumnList(table, change.index.columnIds)
                    : null;
                if (!columnNames) {
                    break;
                }
                sql.push(
                    `CREATE ${change.index.unique ? 'UNIQUE ' : ''}INDEX ${quoteIdent(change.index.name)} ON ${qualify(change.schemaName, change.tableName)}${change.index.type ? ` USING ${change.index.type}` : ''} (${columnNames});`
                );
                break;
            }
            case 'drop_index':
                sql.push(
                    `DROP INDEX IF EXISTS ${qualify(change.schemaName, change.index.name)};`
                );
                break;
            case 'add_foreign_key': {
                const localTable = tablesByName.get(
                    `${normalizeName(change.schemaName)}.${normalizeName(change.tableName)}`
                );
                const referencedTable = tablesByName.get(
                    `${normalizeName(change.foreignKey.referencedSchemaName)}.${normalizeName(change.foreignKey.referencedTableName)}`
                );
                const localColumns = localTable
                    ? renderResolvedColumnList(
                          localTable,
                          change.foreignKey.columnIds
                      )
                    : null;
                const referenceColumns = referencedTable
                    ? renderResolvedColumnList(
                          referencedTable,
                          change.foreignKey.referencedColumnNames
                      )
                    : change.foreignKey.referencedColumnNames
                          .map(quoteIdent)
                          .join(', ');
                if (!localColumns || !referenceColumns) {
                    break;
                }
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ADD CONSTRAINT ${quoteIdent(change.foreignKey.name)} FOREIGN KEY (${localColumns}) REFERENCES ${qualify(change.foreignKey.referencedSchemaName, change.foreignKey.referencedTableName)} (${referenceColumns})${change.foreignKey.onDelete ? ` ON DELETE ${change.foreignKey.onDelete}` : ''}${change.foreignKey.onUpdate ? ` ON UPDATE ${change.foreignKey.onUpdate}` : ''};`
                );
                break;
            }
            case 'drop_foreign_key':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} DROP CONSTRAINT IF EXISTS ${quoteIdent(change.foreignKey.name)};`
                );
                break;
            case 'add_check_constraint':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} ADD CONSTRAINT ${quoteIdent(change.constraint.name ?? change.constraint.id)} CHECK (${change.constraint.expression});`
                );
                break;
            case 'drop_check_constraint':
                sql.push(
                    `ALTER TABLE ${qualify(change.schemaName, change.tableName)} DROP CONSTRAINT IF EXISTS ${quoteIdent(change.constraint.name ?? change.constraint.id)};`
                );
                break;
            case 'drop_table':
                sql.push(
                    `DROP TABLE ${qualify(change.table.schemaName, change.table.name)};`
                );
                break;
        }
    }

    return sql;
};
