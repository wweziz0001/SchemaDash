import type {
    CompareEntityStatus,
    CompareSchemaResult,
    CompareTableResult,
    CompareValueChange,
} from '@schemadash/schema-sync-core/compare-types';
import type { CanonicalSchema } from '@schemadash/schema-sync-core';
import { compareCanonicalSchemas } from '@schemadash/schema-sync-core/compare';
import type { DBField, DBRelationship, DBTable, Diagram } from '@/lib/domain';
import { diagramToCanonicalSchema } from '@/features/schema-sync/lib/canonical-adapters';
import { canonicalSchemaToDiagram } from '@/features/schema-sync/lib/canonical-adapters';

export interface CompareTableVisual {
    id: string;
    matchKey: string;
    status: CompareEntityStatus;
    changedProperties: CompareValueChange[];
}

export interface CompareFieldVisual {
    id: string;
    tableId: string;
    tableMatchKey: string;
    matchKey: string;
    status: CompareEntityStatus;
    changedProperties: CompareValueChange[];
}

export interface CompareRelationshipVisual {
    id: string;
    matchKey: string;
    status: CompareEntityStatus;
    changedProperties: CompareValueChange[];
}

export interface CompareRenderModel {
    diagram: Diagram;
    compareResult: CompareSchemaResult;
    tablesById: Map<string, CompareTableVisual>;
    fieldsById: Map<string, CompareFieldVisual>;
    relationshipsById: Map<string, CompareRelationshipVisual>;
}

const qualifyTable = (
    schemaName: string | null | undefined,
    tableName: string
) => `${schemaName ?? 'public'}.${tableName}`;

const normalizeName = (value: string) => value.trim().toLowerCase();

const sanitizeKey = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

const encodeCompareId = (kind: string, ...parts: string[]) =>
    `compare_${kind}_${parts.map(sanitizeKey).join('__')}`;

const getDiagramTableMatchKey = (table: DBTable) =>
    (
        table.syncMetadata?.sourceId ?? qualifyTable(table.schema, table.name)
    ).toLowerCase();

const getDiagramTableMatchKeys = (table: DBTable) =>
    [
        table.syncMetadata?.sourceId?.toLowerCase(),
        qualifyTable(table.schema, table.name).toLowerCase(),
    ].filter(Boolean) as string[];

const getDiagramFieldMatchKey = (field: DBField) =>
    (field.syncMetadata?.sourceId ?? normalizeName(field.name)).toLowerCase();

const getDiagramFieldMatchKeys = (field: DBField) =>
    [
        field.syncMetadata?.sourceId?.toLowerCase(),
        normalizeName(field.name),
    ].filter(Boolean) as string[];

const getDiagramRelationshipSignature = ({
    relationship,
    tablesById,
}: {
    relationship: DBRelationship;
    tablesById: Map<string, DBTable>;
}) => {
    const sourceTable = tablesById.get(relationship.sourceTableId);
    const targetTable = tablesById.get(relationship.targetTableId);
    const sourceField = sourceTable?.fields.find(
        (field) => field.id === relationship.sourceFieldId
    );
    const targetField = targetTable?.fields.find(
        (field) => field.id === relationship.targetFieldId
    );

    if (relationship.syncMetadata?.sourceId) {
        return relationship.syncMetadata.sourceId.toLowerCase();
    }

    if (!sourceTable || !targetTable || !sourceField || !targetField) {
        return relationship.id.toLowerCase();
    }

    return [
        getDiagramTableMatchKey(targetTable),
        getDiagramFieldMatchKey(targetField),
        getDiagramTableMatchKey(sourceTable),
        getDiagramFieldMatchKey(sourceField),
    ]
        .join('|')
        .toLowerCase();
};

const getDiagramRelationshipMatchKeys = ({
    relationship,
    tablesById,
}: {
    relationship: DBRelationship;
    tablesById: Map<string, DBTable>;
}) => {
    const signature = getDiagramRelationshipSignature({
        relationship,
        tablesById,
    });

    return [
        relationship.syncMetadata?.sourceId?.toLowerCase(),
        signature,
    ].filter(Boolean) as string[];
};

const cloneField = (field: DBField): DBField => ({ ...field });

const cloneTable = (table: DBTable): DBTable => ({
    ...table,
    fields: table.fields.map(cloneField),
    indexes: table.indexes.map((index) => ({ ...index })),
    checkConstraints:
        table.checkConstraints?.map((constraint) => ({ ...constraint })) ??
        null,
});

const cloneRelationship = (relationship: DBRelationship): DBRelationship => ({
    ...relationship,
});

const getDiagramBounds = (tables: DBTable[]) => {
    if (tables.length === 0) {
        return {
            minX: 0,
            minY: 0,
            maxX: 0,
            maxY: 0,
        };
    }

    return tables.reduce(
        (bounds, table) => ({
            minX: Math.min(bounds.minX, table.x),
            minY: Math.min(bounds.minY, table.y),
            maxX: Math.max(bounds.maxX, table.x + (table.width ?? 260)),
            maxY: Math.max(
                bounds.maxY,
                table.y + table.fields.length * 32 + 120
            ),
        }),
        {
            minX: Number.POSITIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
            maxX: Number.NEGATIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY,
        }
    );
};

const getCompareTableOrder = ({
    compareTables,
    developmentTables,
}: {
    compareTables: CompareTableResult[];
    developmentTables: DBTable[];
}) => {
    const orderedKeys: string[] = [];

    for (const table of developmentTables) {
        const tableKey = getDiagramTableMatchKey(table);
        if (!orderedKeys.includes(tableKey)) {
            orderedKeys.push(tableKey);
        }
    }

    for (const table of compareTables) {
        if (!orderedKeys.includes(table.matchKey)) {
            orderedKeys.push(table.matchKey);
        }
    }

    return orderedKeys;
};

const buildFieldOrder = ({
    tableResult,
    developmentTable,
}: {
    tableResult: CompareTableResult;
    developmentTable?: DBTable;
}) => {
    const orderedKeys: string[] = [];

    for (const field of developmentTable?.fields ?? []) {
        const fieldKey = getDiagramFieldMatchKey(field);
        if (!orderedKeys.includes(fieldKey)) {
            orderedKeys.push(fieldKey);
        }
    }

    for (const field of tableResult.fields) {
        if (!orderedKeys.includes(field.matchKey)) {
            orderedKeys.push(field.matchKey);
        }
    }

    return orderedKeys;
};

const applyLiveOnlyTablePosition = ({
    table,
    offsetX,
}: {
    table: DBTable;
    offsetX: number;
}) => ({
    ...table,
    x: table.x + offsetX,
});

export const buildCompareRenderModel = ({
    baselineSchema,
    developmentDiagram,
}: {
    baselineSchema: CanonicalSchema;
    developmentDiagram: Diagram;
}): CompareRenderModel => {
    const targetCanonicalSchema = diagramToCanonicalSchema(developmentDiagram);
    const compareResult = compareCanonicalSchemas({
        baseline: baselineSchema,
        target: targetCanonicalSchema,
    });
    const liveDiagram = canonicalSchemaToDiagram({
        canonicalSchema: baselineSchema,
        diagramId: developmentDiagram.id,
        diagramName: developmentDiagram.name,
        schemaSync: developmentDiagram.schemaSync,
    });

    const compareTablesByResult = new Map(
        compareResult.tables.map((table) => [table.matchKey, table])
    );
    const developmentTablesByKey = new Map<string, DBTable>();
    for (const table of developmentDiagram.tables ?? []) {
        for (const key of getDiagramTableMatchKeys(table)) {
            developmentTablesByKey.set(key, table);
        }
    }
    const liveTablesByKey = new Map<string, DBTable>();
    for (const table of liveDiagram.tables ?? []) {
        for (const key of getDiagramTableMatchKeys(table)) {
            liveTablesByKey.set(key, table);
        }
    }

    const developmentBounds = getDiagramBounds(developmentDiagram.tables ?? []);
    const liveBounds = getDiagramBounds(liveDiagram.tables ?? []);
    const liveOnlyOffsetX =
        (developmentBounds.maxX || 0) - liveBounds.minX + 280;

    const tablesById = new Map<string, CompareTableVisual>();
    const fieldsById = new Map<string, CompareFieldVisual>();
    const relationshipsById = new Map<string, CompareRelationshipVisual>();
    const tableIdByMatchKey = new Map<string, string>();
    const fieldIdByCompositeKey = new Map<string, string>();
    const compareTables: DBTable[] = [];

    for (const tableMatchKey of getCompareTableOrder({
        compareTables: compareResult.tables,
        developmentTables: developmentDiagram.tables ?? [],
    })) {
        const tableResult = compareTablesByResult.get(tableMatchKey);
        if (!tableResult) {
            continue;
        }

        const developmentTable = developmentTablesByKey.get(tableMatchKey);
        const liveTable = liveTablesByKey.get(tableMatchKey);
        const baseTable = developmentTable
            ? cloneTable(developmentTable)
            : liveTable
              ? applyLiveOnlyTablePosition({
                    table: cloneTable(liveTable),
                    offsetX: liveOnlyOffsetX,
                })
              : undefined;

        if (!baseTable) {
            continue;
        }

        if (!developmentTable) {
            baseTable.id = encodeCompareId('table', tableMatchKey);
        }

        const compareFields: DBField[] = [];
        const fieldOrder = buildFieldOrder({
            tableResult,
            developmentTable,
        });
        const developmentFieldsByKey = new Map<string, DBField>();
        for (const field of developmentTable?.fields ?? []) {
            for (const key of getDiagramFieldMatchKeys(field)) {
                developmentFieldsByKey.set(key, field);
            }
        }
        const liveFieldsByKey = new Map<string, DBField>();
        for (const field of liveTable?.fields ?? []) {
            for (const key of getDiagramFieldMatchKeys(field)) {
                liveFieldsByKey.set(key, field);
            }
        }
        const tableFieldsByResult = new Map(
            tableResult.fields.map((field) => [field.matchKey, field])
        );

        for (const fieldMatchKey of fieldOrder) {
            const fieldResult = tableFieldsByResult.get(fieldMatchKey);
            if (!fieldResult) {
                continue;
            }

            const developmentField = developmentFieldsByKey.get(fieldMatchKey);
            const liveField = liveFieldsByKey.get(fieldMatchKey);
            const field = developmentField
                ? cloneField(developmentField)
                : liveField
                  ? cloneField(liveField)
                  : undefined;

            if (!field) {
                continue;
            }

            if (!developmentField) {
                field.id = encodeCompareId(
                    'field',
                    tableMatchKey,
                    fieldMatchKey
                );
            }

            compareFields.push(field);
            fieldIdByCompositeKey.set(
                `${tableMatchKey}|${fieldMatchKey}`,
                field.id
            );
            fieldsById.set(field.id, {
                id: field.id,
                tableId: baseTable.id,
                tableMatchKey,
                matchKey: fieldResult.matchKey,
                status: fieldResult.status,
                changedProperties: fieldResult.changedProperties,
            });
        }

        baseTable.fields = compareFields;
        tableIdByMatchKey.set(tableMatchKey, baseTable.id);
        tablesById.set(baseTable.id, {
            id: baseTable.id,
            matchKey: tableMatchKey,
            status: tableResult.status,
            changedProperties: tableResult.changedProperties,
        });
        compareTables.push(baseTable);
    }

    const developmentTablesById = new Map(
        (developmentDiagram.tables ?? []).map((table) => [table.id, table])
    );
    const liveTablesById = new Map(
        (liveDiagram.tables ?? []).map((table) => [table.id, table])
    );
    const developmentRelationshipsByKey = new Map<string, DBRelationship>();
    for (const relationship of developmentDiagram.relationships ?? []) {
        for (const key of getDiagramRelationshipMatchKeys({
            relationship,
            tablesById: developmentTablesById,
        })) {
            developmentRelationshipsByKey.set(key, relationship);
        }
    }
    const liveRelationshipsByKey = new Map<string, DBRelationship>();
    for (const relationship of liveDiagram.relationships ?? []) {
        for (const key of getDiagramRelationshipMatchKeys({
            relationship,
            tablesById: liveTablesById,
        })) {
            liveRelationshipsByKey.set(key, relationship);
        }
    }

    const compareRelationships: DBRelationship[] = [];
    for (const relationshipResult of compareResult.relationships) {
        const developmentRelationship = developmentRelationshipsByKey.get(
            relationshipResult.matchKey
        );
        const liveRelationship = liveRelationshipsByKey.get(
            relationshipResult.matchKey
        );
        const relationship = developmentRelationship
            ? cloneRelationship(developmentRelationship)
            : liveRelationship
              ? cloneRelationship(liveRelationship)
              : undefined;

        if (!relationship) {
            continue;
        }

        const sourceTablesById = developmentRelationship
            ? developmentTablesById
            : liveTablesById;
        const sourceTable = sourceTablesById.get(relationship.sourceTableId);
        const targetTable = sourceTablesById.get(relationship.targetTableId);
        const sourceField = sourceTable?.fields.find(
            (field) => field.id === relationship.sourceFieldId
        );
        const targetField = targetTable?.fields.find(
            (field) => field.id === relationship.targetFieldId
        );

        if (!sourceTable || !targetTable || !sourceField || !targetField) {
            continue;
        }

        const sourceTableMatchKey = getDiagramTableMatchKey(sourceTable);
        const targetTableMatchKey = getDiagramTableMatchKey(targetTable);
        const sourceFieldMatchKey = getDiagramFieldMatchKey(sourceField);
        const targetFieldMatchKey = getDiagramFieldMatchKey(targetField);
        const compareSourceTableId = tableIdByMatchKey.get(sourceTableMatchKey);
        const compareTargetTableId = tableIdByMatchKey.get(targetTableMatchKey);
        const compareSourceFieldId = fieldIdByCompositeKey.get(
            `${sourceTableMatchKey}|${sourceFieldMatchKey}`
        );
        const compareTargetFieldId = fieldIdByCompositeKey.get(
            `${targetTableMatchKey}|${targetFieldMatchKey}`
        );

        if (
            !compareSourceTableId ||
            !compareTargetTableId ||
            !compareSourceFieldId ||
            !compareTargetFieldId
        ) {
            continue;
        }

        if (!developmentRelationship) {
            relationship.id = encodeCompareId(
                'relationship',
                relationshipResult.matchKey
            );
        }

        relationship.sourceTableId = compareSourceTableId;
        relationship.targetTableId = compareTargetTableId;
        relationship.sourceFieldId = compareSourceFieldId;
        relationship.targetFieldId = compareTargetFieldId;
        compareRelationships.push(relationship);
        relationshipsById.set(relationship.id, {
            id: relationship.id,
            matchKey: relationshipResult.matchKey,
            status: relationshipResult.status,
            changedProperties: relationshipResult.changedProperties,
        });
    }

    return {
        diagram: {
            ...developmentDiagram,
            tables: compareTables,
            relationships: compareRelationships,
            dependencies: developmentDiagram.dependencies ?? [],
        },
        compareResult,
        tablesById,
        fieldsById,
        relationshipsById,
    };
};
