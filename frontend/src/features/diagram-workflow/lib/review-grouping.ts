import {
    compareCanonicalSchemas,
    createChangePlan,
    type ChangePlan,
    type CompareEntityStatus,
    type CompareSchemaResult,
    type SchemaChange,
} from '@schemadash/schema-sync-core';
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
    plan: ChangePlan;
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

const mapPlanChangeToSection = (
    change: SchemaChange
): { key: string; title: string; description: string } | null => {
    switch (change.kind) {
        case 'create_enum_type':
        case 'add_enum_value':
            return {
                key: 'custom-types',
                title: 'Custom Types',
                description:
                    'Enum and type changes that affect downstream migration safety.',
            };
        case 'add_primary_key':
        case 'drop_primary_key':
        case 'add_unique_constraint':
        case 'drop_unique_constraint':
        case 'add_check_constraint':
        case 'drop_check_constraint':
            return {
                key: 'constraints',
                title: 'Constraints',
                description:
                    'Constraint changes surfaced from the canonical migration plan.',
            };
        case 'add_index':
        case 'drop_index':
            return {
                key: 'indexes',
                title: 'Indexes',
                description:
                    'Index changes that are not directly visible in the compare canvas.',
            };
        default:
            return null;
    }
};

const mapPlanChangeStatus = (change: SchemaChange): CompareEntityStatus => {
    if (change.kind.startsWith('create_') || change.kind.startsWith('add_')) {
        return 'added';
    }

    if (change.kind.startsWith('drop_')) {
        return 'removed';
    }

    return 'changed';
};

const mapPlanChangeLabel = (change: SchemaChange) => {
    switch (change.kind) {
        case 'create_enum_type':
            return {
                label: `${change.customType.schemaName}.${change.customType.name}`,
                context: 'Enum type',
            };
        case 'add_enum_value':
            return {
                label: `${change.schemaName}.${change.typeName}`,
                context: `Enum value ${change.value}`,
            };
        case 'add_primary_key':
        case 'drop_primary_key':
            return {
                label: qualifyTable(change.schemaName, change.tableName),
                context: 'Primary key',
            };
        case 'add_unique_constraint':
        case 'drop_unique_constraint':
            return {
                label: change.constraint.name,
                context: qualifyTable(change.schemaName, change.tableName),
            };
        case 'add_check_constraint':
        case 'drop_check_constraint':
            return {
                label: change.constraint.name ?? 'Unnamed check constraint',
                context: qualifyTable(change.schemaName, change.tableName),
            };
        case 'add_index':
        case 'drop_index':
            return {
                label: change.index.name,
                context: qualifyTable(change.schemaName, change.tableName),
            };
        default:
            return {
                label: change.kind,
                context: undefined,
            };
    }
};

const mapPlanChangeDetails = (change: SchemaChange): string[] => {
    switch (change.kind) {
        case 'add_enum_value':
            return [`New enum value: ${change.value}`];
        case 'add_primary_key':
        case 'drop_primary_key':
            return [change.primaryKey.columnIds.join(', ')];
        case 'add_unique_constraint':
        case 'drop_unique_constraint':
            return [change.constraint.columnIds.join(', ')];
        case 'add_check_constraint':
        case 'drop_check_constraint':
            return [change.constraint.expression];
        case 'add_index':
        case 'drop_index':
            return [change.index.columnIds.join(', ')];
        default:
            return [];
    }
};

const buildSupplementalSections = (plan: ChangePlan): ReviewSection[] => {
    const sections = new Map<
        string,
        {
            title: string;
            description: string;
            items: ReviewChangeItem[];
        }
    >();

    for (const change of plan.changes) {
        const section = mapPlanChangeToSection(change);
        if (!section) {
            continue;
        }

        const existing = sections.get(section.key) ?? {
            title: section.title,
            description: section.description,
            items: [],
        };
        const { label, context } = mapPlanChangeLabel(change);
        existing.items.push({
            id: `plan:${change.id}`,
            label,
            context,
            details: mapPlanChangeDetails(change),
            status: mapPlanChangeStatus(change),
        });
        sections.set(section.key, existing);
    }

    return [...sections.entries()].map(([key, section]) => ({
        key,
        title: section.title,
        description: section.description,
        totalCount: section.items.length,
        buckets: buildBuckets(section.items),
    }));
};

export const buildReviewGrouping = ({
    baselineSchema,
    developmentDiagram,
    baselineSnapshotId,
    connectionId,
}: {
    baselineSchema: CanonicalSchema;
    developmentDiagram: Diagram;
    baselineSnapshotId: string;
    connectionId: string;
}): ReviewGroupingResult => {
    const targetSchema = diagramToCanonicalSchema(developmentDiagram);
    const compareResult = compareCanonicalSchemas({
        baseline: baselineSchema,
        target: targetSchema,
    });
    const plan = createChangePlan({
        id: 'local-review-plan',
        baselineSnapshotId,
        connectionId,
        baseline: baselineSchema,
        target: targetSchema,
    });

    return {
        compareResult,
        plan,
        sections: buildCompareSections(compareResult),
        supplementalSections: buildSupplementalSections(plan),
    };
};
