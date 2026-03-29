import { describe, expect, it } from 'vitest';
import { buildCompareRenderModel } from './compare-render-model';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import type { CanonicalSchema } from '@schemadash/schema-sync-core';

const baselineSchema: CanonicalSchema = {
    engine: 'postgresql',
    databaseName: 'app',
    defaultSchemaName: 'public',
    schemaNames: ['public'],
    customTypes: [],
    tables: [
        {
            id: 'users',
            schemaName: 'public',
            name: 'users',
            kind: 'table',
            sync: { sourceId: 'users' },
            columns: [
                {
                    id: 'users.id',
                    name: 'id',
                    dataType: 'uuid',
                    nullable: false,
                    sync: { sourceId: 'users.id' },
                },
                {
                    id: 'users.email',
                    name: 'email',
                    dataType: 'text',
                    nullable: false,
                    sync: { sourceId: 'users.email' },
                },
            ],
            primaryKey: {
                id: 'users_pkey',
                name: 'users_pkey',
                columnIds: ['users.id'],
            },
            uniqueConstraints: [],
            indexes: [],
            foreignKeys: [],
            checkConstraints: [],
        },
        {
            id: 'legacy_audit',
            schemaName: 'public',
            name: 'legacy_audit',
            kind: 'table',
            columns: [
                {
                    id: 'legacy_audit.id',
                    name: 'id',
                    dataType: 'uuid',
                    nullable: false,
                },
            ],
            primaryKey: {
                id: 'legacy_audit_pkey',
                name: 'legacy_audit_pkey',
                columnIds: ['legacy_audit.id'],
            },
            uniqueConstraints: [],
            indexes: [],
            foreignKeys: [],
            checkConstraints: [],
        },
    ],
};

const developmentDiagram: Diagram = {
    id: 'diagram-1',
    name: 'Development',
    databaseType: DatabaseType.POSTGRESQL,
    tables: [
        {
            id: 'dev-users',
            name: 'users',
            schema: 'public',
            x: 120,
            y: 80,
            fields: [
                {
                    id: 'dev-users-id',
                    name: 'id',
                    type: { id: 'uuid', name: 'uuid' },
                    primaryKey: true,
                    unique: false,
                    nullable: false,
                    createdAt: 1,
                    syncMetadata: { sourceId: 'users.id', sourceName: 'id' },
                },
                {
                    id: 'dev-users-email',
                    name: 'email',
                    type: { id: 'varchar_255', name: 'varchar(255)' },
                    primaryKey: false,
                    unique: false,
                    nullable: false,
                    createdAt: 2,
                    syncMetadata: {
                        sourceId: 'users.email',
                        sourceName: 'email',
                    },
                },
                {
                    id: 'dev-users-display-name',
                    name: 'display_name',
                    type: { id: 'text', name: 'text' },
                    primaryKey: false,
                    unique: false,
                    nullable: true,
                    createdAt: 3,
                    syncMetadata: {
                        sourceId: 'users.display_name',
                        sourceName: 'display_name',
                    },
                },
            ],
            indexes: [],
            color: '#84cc16',
            isView: false,
            createdAt: 1,
            syncMetadata: { sourceId: 'users', sourceName: 'users' },
        },
    ],
    relationships: [],
    dependencies: [],
    areas: [],
    customTypes: [],
    notes: [],
    createdAt: new Date('2026-03-28T10:00:00.000Z'),
    updatedAt: new Date('2026-03-29T10:00:00.000Z'),
};

describe('buildCompareRenderModel', () => {
    it('preserves development layout while adding live-only entities and compare metadata', () => {
        const model = buildCompareRenderModel({
            baselineSchema,
            developmentDiagram,
        });

        const usersTable = model.diagram.tables?.find(
            (table) => table.id === 'dev-users'
        );
        const removedTable = model.diagram.tables?.find((table) =>
            table.name.includes('legacy_audit')
        );
        const displayNameField = model.diagram.tables?.[0]?.fields.find(
            (field) => field.name === 'display_name'
        );

        expect(usersTable?.x).toBe(120);
        expect(model.tablesById.get('dev-users')?.status).toBe('changed');
        expect(model.fieldsById.get('dev-users-display-name')?.status).toBe(
            'added'
        );
        expect(displayNameField?.id).toBe('dev-users-display-name');
        expect(removedTable).toBeTruthy();
        expect(removedTable?.id.startsWith('compare_table_')).toBe(true);
        expect(removedTable?.x).toBeGreaterThan(usersTable?.x ?? 0);
        expect(model.tablesById.get(removedTable?.id ?? '')?.status).toBe(
            'removed'
        );
    });
});
