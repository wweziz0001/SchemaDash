import { describe, expect, it } from 'vitest';
import { compareCanonicalSchemas } from '../compare.js';
import type { CanonicalSchema } from '../types.js';

const baseline: CanonicalSchema = {
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
            uniqueConstraints: [
                {
                    id: 'users_email_key',
                    name: 'users_email_key',
                    columnIds: ['users.email'],
                    sync: { sourceId: 'users_email_key' },
                },
            ],
            indexes: [],
            foreignKeys: [],
            checkConstraints: [],
        },
        {
            id: 'posts',
            schemaName: 'public',
            name: 'posts',
            kind: 'table',
            sync: { sourceId: 'posts' },
            columns: [
                {
                    id: 'posts.id',
                    name: 'id',
                    dataType: 'uuid',
                    nullable: false,
                    sync: { sourceId: 'posts.id' },
                },
                {
                    id: 'posts.author_id',
                    name: 'author_id',
                    dataType: 'uuid',
                    nullable: false,
                    sync: { sourceId: 'posts.author_id' },
                },
            ],
            primaryKey: {
                id: 'posts_pkey',
                name: 'posts_pkey',
                columnIds: ['posts.id'],
            },
            uniqueConstraints: [],
            indexes: [],
            foreignKeys: [
                {
                    id: 'posts_author_id_fkey',
                    name: 'posts_author_id_fkey',
                    columnIds: ['posts.author_id'],
                    referencedSchemaName: 'public',
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'RESTRICT',
                    onUpdate: 'NO ACTION',
                    sync: { sourceId: 'posts_author_id_fkey' },
                },
            ],
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

describe('compare canonical schemas', () => {
    it('classifies added, removed, and changed tables, fields, and relationships', () => {
        const result = compareCanonicalSchemas({
            baseline,
            target: {
                ...baseline,
                tables: [
                    {
                        ...baseline.tables[0],
                        columns: [
                            baseline.tables[0].columns[0],
                            {
                                ...baseline.tables[0].columns[1],
                                dataType: 'varchar(255)',
                            },
                            {
                                id: 'users.display_name',
                                name: 'display_name',
                                dataType: 'text',
                                nullable: true,
                                sync: { sourceId: 'users.display_name' },
                            },
                        ],
                    },
                    {
                        ...baseline.tables[1],
                        columns: [
                            baseline.tables[1].columns[0],
                            {
                                ...baseline.tables[1].columns[1],
                                nullable: true,
                            },
                        ],
                        foreignKeys: [
                            {
                                ...baseline.tables[1].foreignKeys[0],
                                onDelete: 'CASCADE',
                            },
                        ],
                    },
                    {
                        id: 'profiles',
                        schemaName: 'public',
                        name: 'profiles',
                        kind: 'table',
                        sync: { sourceId: 'profiles' },
                        columns: [
                            {
                                id: 'profiles.id',
                                name: 'id',
                                dataType: 'uuid',
                                nullable: false,
                                sync: { sourceId: 'profiles.id' },
                            },
                            {
                                id: 'profiles.user_id',
                                name: 'user_id',
                                dataType: 'uuid',
                                nullable: false,
                                sync: { sourceId: 'profiles.user_id' },
                            },
                        ],
                        primaryKey: {
                            id: 'profiles_pkey',
                            name: 'profiles_pkey',
                            columnIds: ['profiles.id'],
                        },
                        uniqueConstraints: [],
                        indexes: [],
                        foreignKeys: [
                            {
                                id: 'profiles_user_id_fkey',
                                name: 'profiles_user_id_fkey',
                                columnIds: ['profiles.user_id'],
                                referencedSchemaName: 'public',
                                referencedTableName: 'users',
                                referencedColumnNames: ['id'],
                                onDelete: 'CASCADE',
                                onUpdate: 'NO ACTION',
                                sync: { sourceId: 'profiles_user_id_fkey' },
                            },
                        ],
                        checkConstraints: [],
                    },
                ],
            },
        });

        const usersTable = result.tables.find(
            (table) => table.matchKey === 'users'
        );
        const postsTable = result.tables.find(
            (table) => table.matchKey === 'posts'
        );
        const profilesTable = result.tables.find(
            (table) => table.matchKey === 'profiles'
        );
        const legacyTable = result.tables.find(
            (table) => table.matchKey === 'public.legacy_audit'
        );
        const emailField = usersTable?.fields.find(
            (field) => field.matchKey === 'users.email'
        );
        const displayNameField = usersTable?.fields.find(
            (field) => field.matchKey === 'users.display_name'
        );
        const authorField = postsTable?.fields.find(
            (field) => field.matchKey === 'posts.author_id'
        );
        const changedRelationship = result.relationships.find(
            (relationship) => relationship.matchKey === 'posts_author_id_fkey'
        );
        const addedRelationship = result.relationships.find(
            (relationship) => relationship.matchKey === 'profiles_user_id_fkey'
        );

        expect(usersTable?.status).toBe('changed');
        expect(postsTable?.status).toBe('changed');
        expect(profilesTable?.status).toBe('added');
        expect(legacyTable?.status).toBe('removed');
        expect(emailField?.status).toBe('changed');
        expect(
            emailField?.changedProperties.map((change) => change.property)
        ).toContain('type');
        expect(displayNameField?.status).toBe('added');
        expect(authorField?.status).toBe('changed');
        expect(
            authorField?.changedProperties.map((change) => change.property)
        ).toContain('nullable');
        expect(changedRelationship?.status).toBe('changed');
        expect(
            changedRelationship?.changedProperties.map(
                (change) => change.property
            )
        ).toContain('onDelete');
        expect(addedRelationship?.status).toBe('added');
        expect(result.summary.tables.added).toBe(1);
        expect(result.summary.tables.removed).toBe(1);
        expect(result.summary.tables.changed).toBe(2);
        expect(result.summary.relationships.added).toBe(1);
        expect(result.summary.relationships.changed).toBe(1);
        expect(result.hasChanges).toBe(true);
    });

    it('falls back to field-name matching when development sync metadata is missing', () => {
        const result = compareCanonicalSchemas({
            baseline,
            target: {
                ...baseline,
                tables: [
                    {
                        ...baseline.tables[0],
                        columns: baseline.tables[0].columns.map((column) => ({
                            ...column,
                            sync:
                                column.name === 'id' ? undefined : column.sync,
                        })),
                    },
                    ...baseline.tables.slice(1),
                ],
            },
        });

        const usersTable = result.tables.find(
            (table) => table.matchKey === 'users'
        );
        const idFields = usersTable?.fields.filter(
            (field) =>
                field.baseline?.name === 'id' || field.target?.name === 'id'
        );

        expect(usersTable?.status).toBe('unchanged');
        expect(idFields).toHaveLength(1);
        expect(idFields?.[0]?.status).toBe('unchanged');
        expect(
            usersTable?.fields.some((field) => field.status === 'added')
        ).toBe(false);
        expect(
            usersTable?.fields.some((field) => field.status === 'removed')
        ).toBe(false);
    });

    it('treats equivalent PostgreSQL type aliases as unchanged in compare mode', () => {
        const result = compareCanonicalSchemas({
            baseline: {
                ...baseline,
                tables: [
                    {
                        ...baseline.tables[0],
                        columns: [
                            {
                                ...baseline.tables[0].columns[0],
                                dataType: 'integer',
                            },
                            {
                                ...baseline.tables[0].columns[1],
                                dataType: 'character varying(200)',
                            },
                        ],
                    },
                    ...baseline.tables.slice(1),
                ],
            },
            target: {
                ...baseline,
                tables: [
                    {
                        ...baseline.tables[0],
                        columns: [
                            {
                                ...baseline.tables[0].columns[0],
                                dataType: 'int',
                            },
                            {
                                ...baseline.tables[0].columns[1],
                                dataType: 'varchar(200)',
                            },
                        ],
                    },
                    ...baseline.tables.slice(1),
                ],
            },
        });

        const usersTable = result.tables.find(
            (table) => table.matchKey === 'users'
        );

        expect(usersTable?.status).toBe('unchanged');
        expect(
            usersTable?.fields.every((field) => field.status === 'unchanged')
        ).toBe(true);
    });
});
