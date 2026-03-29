import { describe, expect, it } from 'vitest';
import { createChangePlan } from '../diff.js';
import type { CanonicalSchema } from '../types.js';

const baselineSchema: CanonicalSchema = {
    engine: 'postgresql',
    databaseName: 'app',
    defaultSchemaName: 'public',
    schemaNames: ['public'],
    customTypes: [],
    tables: [
        {
            id: 'public.Test',
            schemaName: 'public',
            name: 'Test',
            kind: 'table',
            sync: { sourceId: 'public.Test' },
            columns: [
                {
                    id: 'public.Test.id',
                    name: 'id',
                    dataType: 'uuid',
                    nullable: false,
                    sync: { sourceId: 'public.Test.id' },
                },
            ],
            primaryKey: {
                id: 'public.Test_pkey',
                name: 'Test_pkey',
                columnIds: ['public.Test.id'],
            },
            uniqueConstraints: [],
            indexes: [],
            foreignKeys: [],
            checkConstraints: [],
        },
    ],
};

describe('diff column matching', () => {
    it('falls back to column name matching when development sync metadata is missing', () => {
        const plan = createChangePlan({
            id: 'plan-column-fallback',
            baselineSnapshotId: 'snapshot-1',
            connectionId: 'conn-1',
            baseline: baselineSchema,
            target: {
                ...baselineSchema,
                tables: [
                    {
                        ...baselineSchema.tables[0],
                        columns: [
                            {
                                ...baselineSchema.tables[0].columns[0],
                                id: 'public.Test.id',
                                sync: undefined,
                            },
                        ],
                    },
                ],
            },
        });

        expect(
            plan.changes.some(
                (change) =>
                    change.kind === 'add_column' && change.column.name === 'id'
            )
        ).toBe(false);
        expect(
            plan.changes.some(
                (change) =>
                    change.kind === 'drop_column' && change.column.name === 'id'
            )
        ).toBe(false);
    });
});
