import { describe, expect, it } from 'vitest';
import { DatabaseType } from '@/lib/domain/database-type';
import type { DiagramWorkflowVersionRecord } from '@/lib/api/diagram-workflow-client';
import { getAuthoritativeVersionCanonicalSchema } from './version-canonical';

const versionWithDiagramDocument: DiagramWorkflowVersionRecord = {
    id: 'version-1',
    diagramId: 'diagram-1',
    snapshotId: 'snapshot-1',
    name: 'Release candidate',
    description: null,
    versionLabel: 'Version 1',
    origin: 'manual',
    pinned: false,
    createdAt: '2026-03-30T10:00:00.000Z',
    createdBy: null,
    snapshot: {
        id: 'snapshot-1',
        fingerprint: 'stale-fingerprint',
        createdAt: '2026-03-30T10:00:00.000Z',
        layoutSource: 'captured',
        sourceKind: 'development',
        canonicalSchema: {
            engine: 'postgresql',
            databaseName: 'stale',
            defaultSchemaName: 'public',
            schemaNames: ['public'],
            tables: [
                {
                    id: 'public.stale_table',
                    schemaName: 'public',
                    name: 'stale_table',
                    kind: 'table',
                    columns: [],
                    primaryKey: null,
                    uniqueConstraints: [],
                    indexes: [],
                    foreignKeys: [],
                    checkConstraints: [],
                },
            ],
            customTypes: [],
            fingerprint: 'stale-fingerprint',
            importedAt: '2026-03-29T10:00:00.000Z',
        },
        diagramDocument: {
            id: 'diagram-1',
            name: 'Authoritative snapshot',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [
                {
                    id: 'users',
                    name: 'users',
                    schema: 'public',
                    x: 120,
                    y: 80,
                    fields: [
                        {
                            id: 'users-id',
                            name: 'id',
                            type: { id: 'uuid', name: 'uuid' },
                            primaryKey: true,
                            unique: false,
                            nullable: false,
                            createdAt: 1,
                        },
                    ],
                    indexes: [],
                    color: '#84cc16',
                    isView: false,
                    createdAt: 1,
                },
            ],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
            notes: [],
            createdAt: '2026-03-30T10:00:00.000Z',
            updatedAt: '2026-03-30T10:00:00.000Z',
        },
    },
};

describe('getAuthoritativeVersionCanonicalSchema', () => {
    it('derives the canonical baseline from the immutable diagram document when present', () => {
        const canonical = getAuthoritativeVersionCanonicalSchema(
            versionWithDiagramDocument
        );

        expect(canonical?.databaseName).toBe('Authoritative snapshot');
        expect(canonical?.tables.map((table) => table.name)).toEqual(['users']);
        expect(canonical?.fingerprint).not.toBe('stale-fingerprint');
        expect(canonical?.importedAt).toBe('2026-03-30T10:00:00.000Z');
    });

    it('falls back to the stored canonical schema when no diagram document exists', () => {
        const fallbackVersion: DiagramWorkflowVersionRecord = {
            ...versionWithDiagramDocument,
            snapshot: {
                ...versionWithDiagramDocument.snapshot,
                diagramDocument: null,
            },
        };

        expect(getAuthoritativeVersionCanonicalSchema(fallbackVersion)).toBe(
            fallbackVersion.snapshot.canonicalSchema
        );
    });
});
