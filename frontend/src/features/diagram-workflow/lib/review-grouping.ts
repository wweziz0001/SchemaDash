import {
    type CompareEntityStatus,
    type CompareSchemaResult,
} from '@schemadash/schema-sync-core/compare-types';
import { compareCanonicalSchemas } from '@schemadash/schema-sync-core/compare';
import { diagramToCanonicalSchema } from '@/features/schema-sync/lib/canonical-adapters';
import type { Diagram } from '@/lib/domain/diagram';
import type { CanonicalSchema } from '@schemadash/schema-sync-core';

export interface ReviewChangeItem {
    id: string;
    label: string;
    context?: string;
    details: string[];
    status: CompareEntityStatus;
}

export interface ReviewChangeBucket {
    status: CompareEntityStatus;
    label: string;
    count: number;
    items: ReviewChangeItem[];
}

export interface ReviewSection {
    key: string;
    title: string;
    description: string;
    totalCount: number;
    buckets: ReviewChangeBucket[];
}

export interface ReviewGroupingResult {
    compareResult: CompareSchemaResult;
    sections: ReviewSection[];
    supplementalSections: ReviewSection[];
}

const qualifyTable = (schemaName: string | undefined, tableName: string) =>
    `${schemaName ?? 'public'}.${tableName}`;

const prettyPropertyName = (property: string) =>
    property
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (value) => value.toUpperCase());

const formatValue = (value: unknown): string => {
    if (Array.isArray(value)) {
        return value.join(', ');
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    if (value === null || value === undefined || value === '') {
        return 'None';
    }

    return String(value);
};

const compareDetailLines = (
    changedProperties: Array<{
        property: string;
        baseline?: unknown;
        target?: unknown;
    }>
) =>
    changedProperties.map(
        ({ property, baseline, target }) =>
            `${prettyPropertyName(property)}: ${formatValue(baseline)} -> ${formatValue(target)}`
    );

const buildBuckets = (items: ReviewChangeItem[]): ReviewChangeBucket[] =>
    (['added', 'removed', 'changed'] as const)
        .map((status) => {
            const bucketItems = items.filter((item) => item.status === status);
            return {
                status,
                label:
                    status === 'added'
                        ? 'Added'
                        : status === 'removed'
                          ? 'Removed'
                          : 'Changed',
                count: bucketItems.length,
                items: bucketItems,
            };
        })
        .filter((bucket) => bucket.count > 0);

const buildCompareSections = (
    compareResult: CompareSchemaResult
): ReviewSection[] => {
    const tableItems: ReviewChangeItem[] = compareResult.tables
        .filter((table) => table.status !== 'unchanged')
        .map((table) => {
            const tableName = qualifyTable(
                table.target?.schemaName ?? table.baseline?.schemaName,
                table.target?.name ?? table.baseline?.name ?? 'unknown'
            );
            const changedFieldCount = table.fields.filter(
                (field) => field.status !== 'unchanged'
            ).length;
            const details = [
                ...compareDetailLines(table.changedProperties),
                ...(changedFieldCount > 0
                    ? [`Field deltas in this table: ${changedFieldCount}`]
                    : []),
            ];

            return {
                id: `table:${table.matchKey}`,
                label: tableName,
                context:
                    table.target?.kind === 'view' ||
                    table.baseline?.kind === 'view'
                        ? 'View'
                        : 'Table',
                details,
                status: table.status,
            };
        });

    const fieldItems: ReviewChangeItem[] = compareResult.tables.flatMap(
        (table) =>
            table.fields
                .filter((field) => field.status !== 'unchanged')
                .map((field) => ({
                    id: `field:${table.matchKey}:${field.matchKey}`,
                    label:
                        field.target?.name ??
                        field.baseline?.name ??
                        field.matchKey,
                    context: qualifyTable(
                        table.target?.schemaName ?? table.baseline?.schemaName,
                        table.target?.name ?? table.baseline?.name ?? 'unknown'
                    ),
                    details: compareDetailLines(field.changedProperties),
                    status: field.status,
                }))
    );

    const relationshipItems: ReviewChangeItem[] = compareResult.relationships
        .filter((relationship) => relationship.status !== 'unchanged')
        .map((relationship) => {
            const relationshipName =
                relationship.target?.name ??
                relationship.baseline?.name ??
                'Unnamed relationship';
            const sourceTable = qualifyTable(
                relationship.target?.referencedSchemaName ??
                    relationship.baseline?.referencedSchemaName,
                relationship.target?.referencedTableName ??
                    relationship.baseline?.referencedTableName ??
                    'unknown'
            );
            const targetTable = qualifyTable(
                compareResult.tables.find(
                    (table) =>
                        table.matchKey ===
                        (relationship.targetTableMatchKey ??
                            relationship.baselineTableMatchKey)
                )?.target?.schemaName ??
                    compareResult.tables.find(
                        (table) =>
                            table.matchKey ===
                            (relationship.targetTableMatchKey ??
                                relationship.baselineTableMatchKey)
                    )?.baseline?.schemaName,
                compareResult.tables.find(
                    (table) =>
                        table.matchKey ===
                        (relationship.targetTableMatchKey ??
                            relationship.baselineTableMatchKey)
                )?.target?.name ??
                    compareResult.tables.find(
                        (table) =>
                            table.matchKey ===
                            (relationship.targetTableMatchKey ??
                                relationship.baselineTableMatchKey)
                    )?.baseline?.name ??
                    'unknown'
            );

            return {
                id: `relationship:${relationship.matchKey}`,
                label: relationshipName,
                context: `${targetTable} -> ${sourceTable}`,
                details: compareDetailLines(relationship.changedProperties),
                status: relationship.status,
            };
        });

    return [
        {
            key: 'tables',
            title: 'Tables',
            description:
                'Schema objects added, removed, or changed between Live Database and Development.',
            totalCount: tableItems.length,
            buckets: buildBuckets(tableItems),
        },
        {
            key: 'fields',
            title: 'Fields',
            description:
                'Column-level additions, removals, and edits grouped by table.',
            totalCount: fieldItems.length,
            buckets: buildBuckets(fieldItems),
        },
        {
            key: 'relationships',
            title: 'Relationships',
            description:
                'Foreign key and relationship changes detected from the canonical schema.',
            totalCount: relationshipItems.length,
            buckets: buildBuckets(relationshipItems),
        },
    ];
};

const getNamedMatchKey = (
    item:
        | { name: string; sync?: { sourceId?: string } }
        | { name?: string | null; id: string; sync?: { sourceId?: string } }
) =>
    (
        item.sync?.sourceId ??
        item.name ??
        ('id' in item ? item.id : '')
    ).toLowerCase();

const buildSection = ({
    key,
    title,
    description,
    items,
}: {
    key: string;
    title: string;
    description: string;
    items: ReviewChangeItem[];
}): ReviewSection | null =>
    items.length > 0
        ? {
              key,
              title,
              description,
              totalCount: items.length,
              buckets: buildBuckets(items),
          }
        : null;

const buildCustomTypeSection = ({
    baselineSchema,
    targetSchema,
}: {
    baselineSchema: CanonicalSchema;
    targetSchema: CanonicalSchema;
}): ReviewSection | null => {
    const baselineMap = new Map(
        baselineSchema.customTypes.map((customType) => [
            getNamedMatchKey(customType),
            customType,
        ])
    );
    const targetMap = new Map(
        targetSchema.customTypes.map((customType) => [
            getNamedMatchKey(customType),
            customType,
        ])
    );
    const keys = new Set([...baselineMap.keys(), ...targetMap.keys()]);
    const items: ReviewChangeItem[] = [];

    for (const key of keys) {
        const baselineType = baselineMap.get(key);
        const targetType = targetMap.get(key);

        if (!baselineType && targetType) {
            items.push({
                id: `custom-type:${key}`,
                label: `${targetType.schemaName}.${targetType.name}`,
                context: targetType.kind,
                details:
                    targetType.kind === 'enum'
                        ? [targetType.values.join(', ')]
                        : targetType.fields.map(
                              (field) => `${field.name}: ${field.dataType}`
                          ),
                status: 'added',
            });
            continue;
        }

        if (baselineType && !targetType) {
            items.push({
                id: `custom-type:${key}`,
                label: `${baselineType.schemaName}.${baselineType.name}`,
                context: baselineType.kind,
                details: [],
                status: 'removed',
            });
            continue;
        }

        if (
            baselineType &&
            targetType &&
            JSON.stringify(baselineType) !== JSON.stringify(targetType)
        ) {
            items.push({
                id: `custom-type:${key}`,
                label: `${targetType.schemaName}.${targetType.name}`,
                context: targetType.kind,
                details:
                    targetType.kind === 'enum'
                        ? [
                              `Values: ${baselineType.kind === 'enum' ? baselineType.values.join(', ') : 'n/a'} -> ${targetType.values.join(', ')}`,
                          ]
                        : ['Composite type fields changed.'],
                status: 'changed',
            });
        }
    }

    return buildSection({
        key: 'custom-types',
        title: 'Custom Types',
        description:
            'Enum and type changes that are relevant to downstream migration review.',
        items,
    });
};

const buildConstraintSection = ({
    baselineSchema,
    targetSchema,
}: {
    baselineSchema: CanonicalSchema;
    targetSchema: CanonicalSchema;
}): ReviewSection | null => {
    const baselineTables = new Map(
        baselineSchema.tables.map((table) => [getNamedMatchKey(table), table])
    );
    const targetTables = new Map(
        targetSchema.tables.map((table) => [getNamedMatchKey(table), table])
    );
    const keys = new Set([...baselineTables.keys(), ...targetTables.keys()]);
    const items: ReviewChangeItem[] = [];

    const pushPkItem = ({
        tableName,
        status,
        columnIds,
    }: {
        tableName: string;
        status: CompareEntityStatus;
        columnIds: string[];
    }) => {
        items.push({
            id: `constraint:pk:${tableName}:${status}`,
            label: tableName,
            context: 'Primary key',
            details: [columnIds.join(', ')],
            status,
        });
    };

    for (const key of keys) {
        const baselineTable = baselineTables.get(key);
        const targetTable = targetTables.get(key);
        const baselineName = baselineTable
            ? qualifyTable(baselineTable.schemaName, baselineTable.name)
            : undefined;
        const targetName = targetTable
            ? qualifyTable(targetTable.schemaName, targetTable.name)
            : undefined;

        if (
            baselineTable?.primaryKey &&
            !targetTable?.primaryKey &&
            baselineName
        ) {
            pushPkItem({
                tableName: baselineName,
                status: 'removed',
                columnIds: baselineTable.primaryKey.columnIds,
            });
        }

        if (
            !baselineTable?.primaryKey &&
            targetTable?.primaryKey &&
            targetName
        ) {
            pushPkItem({
                tableName: targetName,
                status: 'added',
                columnIds: targetTable.primaryKey.columnIds,
            });
        }

        if (
            baselineTable?.primaryKey &&
            targetTable?.primaryKey &&
            JSON.stringify(baselineTable.primaryKey.columnIds) !==
                JSON.stringify(targetTable.primaryKey.columnIds) &&
            targetName
        ) {
            pushPkItem({
                tableName: targetName,
                status: 'changed',
                columnIds: targetTable.primaryKey.columnIds,
            });
        }

        const baselineUnique = new Map(
            (baselineTable?.uniqueConstraints ?? []).map((constraint) => [
                getNamedMatchKey(constraint),
                constraint,
            ])
        );
        const targetUnique = new Map(
            (targetTable?.uniqueConstraints ?? []).map((constraint) => [
                getNamedMatchKey(constraint),
                constraint,
            ])
        );
        const uniqueKeys = new Set([
            ...baselineUnique.keys(),
            ...targetUnique.keys(),
        ]);

        for (const uniqueKey of uniqueKeys) {
            const baselineConstraint = baselineUnique.get(uniqueKey);
            const targetConstraint = targetUnique.get(uniqueKey);
            const tableName = targetName ?? baselineName ?? 'unknown';

            if (!baselineConstraint && targetConstraint) {
                items.push({
                    id: `constraint:unique:${tableName}:${uniqueKey}`,
                    label: targetConstraint.name,
                    context: tableName,
                    details: [targetConstraint.columnIds.join(', ')],
                    status: 'added',
                });
            } else if (baselineConstraint && !targetConstraint) {
                items.push({
                    id: `constraint:unique:${tableName}:${uniqueKey}`,
                    label: baselineConstraint.name,
                    context: tableName,
                    details: [baselineConstraint.columnIds.join(', ')],
                    status: 'removed',
                });
            } else if (
                baselineConstraint &&
                targetConstraint &&
                JSON.stringify(baselineConstraint.columnIds) !==
                    JSON.stringify(targetConstraint.columnIds)
            ) {
                items.push({
                    id: `constraint:unique:${tableName}:${uniqueKey}`,
                    label: targetConstraint.name,
                    context: tableName,
                    details: [
                        `${baselineConstraint.columnIds.join(', ')} -> ${targetConstraint.columnIds.join(', ')}`,
                    ],
                    status: 'changed',
                });
            }
        }

        const baselineChecks = new Map(
            (baselineTable?.checkConstraints ?? []).map((constraint) => [
                getNamedMatchKey({
                    ...constraint,
                    name: constraint.name ?? constraint.id,
                }),
                constraint,
            ])
        );
        const targetChecks = new Map(
            (targetTable?.checkConstraints ?? []).map((constraint) => [
                getNamedMatchKey({
                    ...constraint,
                    name: constraint.name ?? constraint.id,
                }),
                constraint,
            ])
        );
        const checkKeys = new Set([
            ...baselineChecks.keys(),
            ...targetChecks.keys(),
        ]);

        for (const checkKey of checkKeys) {
            const baselineConstraint = baselineChecks.get(checkKey);
            const targetConstraint = targetChecks.get(checkKey);
            const tableName = targetName ?? baselineName ?? 'unknown';
            const label =
                targetConstraint?.name ??
                baselineConstraint?.name ??
                'Unnamed check constraint';

            if (!baselineConstraint && targetConstraint) {
                items.push({
                    id: `constraint:check:${tableName}:${checkKey}`,
                    label,
                    context: tableName,
                    details: [targetConstraint.expression],
                    status: 'added',
                });
            } else if (baselineConstraint && !targetConstraint) {
                items.push({
                    id: `constraint:check:${tableName}:${checkKey}`,
                    label,
                    context: tableName,
                    details: [baselineConstraint.expression],
                    status: 'removed',
                });
            } else if (
                baselineConstraint &&
                targetConstraint &&
                baselineConstraint.expression !== targetConstraint.expression
            ) {
                items.push({
                    id: `constraint:check:${tableName}:${checkKey}`,
                    label,
                    context: tableName,
                    details: [
                        `${baselineConstraint.expression} -> ${targetConstraint.expression}`,
                    ],
                    status: 'changed',
                });
            }
        }
    }

    return buildSection({
        key: 'constraints',
        title: 'Constraints',
        description:
            'Constraint changes not directly represented by the compare canvas alone.',
        items,
    });
};

const buildIndexSection = ({
    baselineSchema,
    targetSchema,
}: {
    baselineSchema: CanonicalSchema;
    targetSchema: CanonicalSchema;
}): ReviewSection | null => {
    const baselineTables = new Map(
        baselineSchema.tables.map((table) => [getNamedMatchKey(table), table])
    );
    const targetTables = new Map(
        targetSchema.tables.map((table) => [getNamedMatchKey(table), table])
    );
    const tableKeys = new Set([
        ...baselineTables.keys(),
        ...targetTables.keys(),
    ]);
    const items: ReviewChangeItem[] = [];

    for (const tableKey of tableKeys) {
        const baselineTable = baselineTables.get(tableKey);
        const targetTable = targetTables.get(tableKey);
        const tableName = qualifyTable(
            targetTable?.schemaName ?? baselineTable?.schemaName,
            targetTable?.name ?? baselineTable?.name ?? 'unknown'
        );
        const baselineIndexes = new Map(
            (baselineTable?.indexes ?? []).map((index) => [
                getNamedMatchKey(index),
                index,
            ])
        );
        const targetIndexes = new Map(
            (targetTable?.indexes ?? []).map((index) => [
                getNamedMatchKey(index),
                index,
            ])
        );
        const indexKeys = new Set([
            ...baselineIndexes.keys(),
            ...targetIndexes.keys(),
        ]);

        for (const indexKey of indexKeys) {
            const baselineIndex = baselineIndexes.get(indexKey);
            const targetIndex = targetIndexes.get(indexKey);
            const label =
                targetIndex?.name ?? baselineIndex?.name ?? 'Unnamed index';

            if (!baselineIndex && targetIndex) {
                items.push({
                    id: `index:${tableName}:${indexKey}`,
                    label,
                    context: tableName,
                    details: [targetIndex.columnIds.join(', ')],
                    status: 'added',
                });
            } else if (baselineIndex && !targetIndex) {
                items.push({
                    id: `index:${tableName}:${indexKey}`,
                    label,
                    context: tableName,
                    details: [baselineIndex.columnIds.join(', ')],
                    status: 'removed',
                });
            } else if (
                baselineIndex &&
                targetIndex &&
                (JSON.stringify(baselineIndex.columnIds) !==
                    JSON.stringify(targetIndex.columnIds) ||
                    baselineIndex.unique !== targetIndex.unique ||
                    baselineIndex.type !== targetIndex.type)
            ) {
                items.push({
                    id: `index:${tableName}:${indexKey}`,
                    label,
                    context: tableName,
                    details: [
                        `${baselineIndex.columnIds.join(', ')} -> ${targetIndex.columnIds.join(', ')}`,
                    ],
                    status: 'changed',
                });
            }
        }
    }

    return buildSection({
        key: 'indexes',
        title: 'Indexes',
        description:
            'Index changes that support engineering review beyond the visual compare surface.',
        items,
    });
};

const buildSupplementalSections = ({
    baselineSchema,
    targetSchema,
}: {
    baselineSchema: CanonicalSchema;
    targetSchema: CanonicalSchema;
}): ReviewSection[] =>
    [
        buildCustomTypeSection({ baselineSchema, targetSchema }),
        buildConstraintSection({ baselineSchema, targetSchema }),
        buildIndexSection({ baselineSchema, targetSchema }),
    ].filter(Boolean) as ReviewSection[];

export const buildReviewGrouping = ({
    baselineSchema,
    developmentDiagram,
}: {
    baselineSchema: CanonicalSchema;
    developmentDiagram: Diagram;
}): ReviewGroupingResult => {
    const targetSchema = diagramToCanonicalSchema(developmentDiagram);
    const compareResult = compareCanonicalSchemas({
        baseline: baselineSchema,
        target: targetSchema,
    });

    return {
        compareResult,
        sections: buildCompareSections(compareResult),
        supplementalSections: buildSupplementalSections({
            baselineSchema,
            targetSchema,
        }),
    };
};
