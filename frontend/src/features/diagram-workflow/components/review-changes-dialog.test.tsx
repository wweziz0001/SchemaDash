import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import type { CanonicalSchema } from '@schemadash/schema-sync-core';
import { ReviewChangesDialog } from './review-changes-dialog';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';

vi.mock('../context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);

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
                    unique: true,
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
                },
            ],
            indexes: [
                {
                    id: 'users_email_unique',
                    name: 'users_email_unique',
                    unique: true,
                    fieldIds: ['dev-users-email'],
                    createdAt: 1,
                },
            ],
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

describe('review changes dialog', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
    });

    it('renders structured compare sections and supplemental migration signals', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            workflow: {
                liveSnapshotId: 'workflow-live-1',
                connectionId: 'connection-1',
                liveSnapshot: {
                    canonicalSchema: baselineSchema,
                },
            },
            developmentDiagram,
        } as never);

        render(<ReviewChangesDialog open={true} onOpenChange={vi.fn()} />);

        expect(screen.getAllByText('Tables').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Fields').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Relationships').length).toBeGreaterThan(0);
        expect(screen.getByText('display_name')).toBeTruthy();
        expect(screen.getByText('Supplemental Migration Signals')).toBeTruthy();
        expect(screen.getByText('users_email_unique')).toBeTruthy();
    });
});
