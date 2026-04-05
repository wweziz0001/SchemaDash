import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import type { CanonicalSchema } from '@schemadash/schema-sync-core';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { ReviewChangesDialog } from './review-changes-dialog';

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

vi.mock('@/components/resizable/resizable', () => ({
    ResizablePanelGroup: ({
        children,
        className,
    }: {
        children: React.ReactNode;
        className?: string;
    }) => <div className={className}>{children}</div>,
    ResizablePanel: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    ResizableHandle: () => <div />,
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
        {
            id: 'legacy_profiles',
            schemaName: 'public',
            name: 'legacy_profiles',
            kind: 'table',
            sync: { sourceId: 'legacy_profiles' },
            columns: [
                {
                    id: 'legacy_profiles.id',
                    name: 'id',
                    dataType: 'uuid',
                    nullable: false,
                    sync: { sourceId: 'legacy_profiles.id' },
                },
                {
                    id: 'legacy_profiles.bio',
                    name: 'bio',
                    dataType: 'text',
                    nullable: true,
                    sync: { sourceId: 'legacy_profiles.bio' },
                },
            ],
            primaryKey: {
                id: 'legacy_profiles_pkey',
                name: 'legacy_profiles_pkey',
                columnIds: ['legacy_profiles.id'],
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
        {
            id: 'dev-teams',
            name: 'teams',
            schema: 'public',
            x: 420,
            y: 80,
            fields: [
                {
                    id: 'dev-teams-id',
                    name: 'id',
                    type: { id: 'uuid', name: 'uuid' },
                    primaryKey: true,
                    unique: false,
                    nullable: false,
                    createdAt: 1,
                },
                {
                    id: 'dev-teams-name',
                    name: 'name',
                    type: { id: 'varchar_255', name: 'varchar(255)' },
                    primaryKey: false,
                    unique: false,
                    nullable: false,
                    createdAt: 2,
                },
            ],
            indexes: [],
            color: '#14b8a6',
            isView: false,
            createdAt: 2,
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

    it('renders the dual-pane review browser and switches between sql and dbml previews', async () => {
        const user = userEvent.setup();

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

        expect(screen.getByText('Review Proposed Changes')).toBeTruthy();
        expect(
            screen.getByPlaceholderText('Search tables and relationships...')
        ).toBeTruthy();
        expect(screen.getByText('Database')).toBeTruthy();
        expect(screen.getByText('Development')).toBeTruthy();
        expect(screen.getByText('Revert All')).toBeTruthy();
        expect(screen.getAllByText('Tables').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Relationships').length).toBeGreaterThan(0);
        expect(screen.getAllByText('users').length).toBeGreaterThan(0);
        expect(screen.getByText('legacy_profiles')).toBeTruthy();
        expect(screen.getByText('teams')).toBeTruthy();
        expect(
            screen.getByRole('button', {
                name: 'No target table for legacy_profiles',
            })
        ).toBeTruthy();
        expect(
            screen.getByRole('button', {
                name: 'No baseline table for teams',
            })
        ).toBeTruthy();
        expect(screen.getByText(/display_name/i)).toBeTruthy();
        expect(
            screen.getAllByTestId('review-code-line-target-added').length
        ).toBeGreaterThan(0);

        await user.click(
            screen.getByRole('button', { name: 'legacy_profiles' })
        );
        expect(
            screen.getAllByTestId('review-code-line-baseline-removed').length
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByTestId('review-code-line-target-placeholder').length
        ).toBeGreaterThan(0);

        await user.click(screen.getByRole('button', { name: 'teams' }));
        expect(
            screen.getAllByTestId('review-code-line-target-added').length
        ).toBeGreaterThan(0);
        expect(
            screen.getAllByTestId('review-code-line-baseline-placeholder')
                .length
        ).toBeGreaterThan(0);

        await user.click(screen.getAllByRole('button', { name: 'users' })[0]);
        await user.click(screen.getByRole('tab', { name: 'DBML' }));

        expect(
            screen.getAllByText(
                (_, element) =>
                    element?.textContent?.includes('Table "public"."users"') ??
                    false
            ).length
        ).toBeGreaterThan(0);
    });
});
