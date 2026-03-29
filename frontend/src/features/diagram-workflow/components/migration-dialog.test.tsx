import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import {
    createChangePlan,
    type CanonicalSchema,
} from '@schemadash/schema-sync-core';
import { diagramToCanonicalSchema } from '@/features/schema-sync/lib/canonical-adapters';
import { MigrationDialog } from './migration-dialog';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import { diagramMigrationClient } from '../api/diagram-migration-client';

const toast = vi.fn();

vi.mock('../context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

vi.mock('../api/diagram-migration-client', () => ({
    diagramMigrationClient: {
        previewMigration: vi.fn(),
        validateMigration: vi.fn(),
        applyMigration: vi.fn(),
    },
}));

vi.mock('@/components/toast/use-toast', () => ({
    useToast: () => ({
        toast,
    }),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);
const mockedPreviewMigration = vi.mocked(
    diagramMigrationClient.previewMigration
);
const mockedValidateMigration = vi.mocked(
    diagramMigrationClient.validateMigration
);
const mockedApplyMigration = vi.mocked(diagramMigrationClient.applyMigration);

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

const targetSchema = diagramToCanonicalSchema(developmentDiagram);
const basePlan = createChangePlan({
    id: 'plan-1',
    baselineSnapshotId: 'baseline-1',
    connectionId: 'connection-1',
    baseline: baselineSchema,
    target: targetSchema,
});

const buildPreview = (
    overrides?: Partial<
        (typeof diagramMigrationClient)['previewMigration'] extends (
            ...args: never[]
        ) => Promise<{ preview: infer T }>
            ? T
            : never
    >
) => ({
    diagramId: 'diagram-1',
    connectionId: 'connection-1',
    connectionName: 'Warehouse',
    workflowLiveSnapshotId: 'workflow-live-1',
    workflowLiveFingerprint: 'live-fingerprint',
    baselineFingerprint: 'live-fingerprint',
    targetFingerprint: basePlan.targetFingerprint,
    generatedAt: '2026-03-29T18:00:00.000Z',
    plan: basePlan,
    issues: [],
    canValidate: true,
    ...overrides,
});

const buildValidation = (
    overrides?: Partial<
        (typeof diagramMigrationClient)['validateMigration'] extends (
            ...args: never[]
        ) => Promise<{ validation: infer T }>
            ? T
            : never
    >
) => ({
    ...buildPreview(),
    plan: basePlan,
    validatedAt: '2026-03-29T18:01:00.000Z',
    checks: [
        {
            code: 'connection_reachable',
            label: 'Connection reachable',
            status: 'passed' as const,
            detail: 'Connected to warehouse.',
        },
        {
            code: 'live_baseline_match',
            label: 'Live baseline still matches',
            status: 'passed' as const,
            detail: 'The database still matches the expected baseline snapshot.',
        },
    ],
    readyToApply: true,
    ...overrides,
});

describe('migration dialog', () => {
    beforeEach(() => {
        toast.mockReset();
        mockedUseOptionalDiagramWorkflow.mockReset();
        mockedPreviewMigration.mockReset();
        mockedValidateMigration.mockReset();
        mockedApplyMigration.mockReset();
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            developmentDiagram,
            workflow: {
                liveSnapshotId: 'workflow-live-1',
            },
            refreshWorkflow: vi.fn().mockResolvedValue(undefined),
        } as never);
    });

    it('loads the migration preview and shows validation results', async () => {
        const user = userEvent.setup();
        mockedPreviewMigration.mockResolvedValue({
            preview: buildPreview(),
        });
        mockedValidateMigration.mockResolvedValue({
            validation: buildValidation(),
        });

        render(<MigrationDialog open={true} onOpenChange={vi.fn()} />);

        expect(await screen.findByText('Planned changes')).toBeTruthy();

        await user.click(
            screen.getByRole('button', { name: 'Run Preflight Validation' })
        );

        expect(await screen.findByText('Connection reachable')).toBeTruthy();
        expect(
            screen.getByRole('button', { name: 'Apply Migration' })
        ).toBeTruthy();
    });

    it('requires destructive confirmation and shows failed apply output', async () => {
        const user = userEvent.setup();
        const destructivePlan = {
            ...basePlan,
            requiresConfirmation: true,
        };
        mockedPreviewMigration.mockResolvedValue({
            preview: buildPreview({
                plan: destructivePlan,
            }),
        });
        mockedValidateMigration.mockResolvedValue({
            validation: buildValidation({
                plan: destructivePlan,
            }),
        });
        mockedApplyMigration.mockResolvedValue({
            apply: {
                validation: buildValidation({
                    plan: destructivePlan,
                }),
                result: {
                    status: 'failed',
                    jobId: null,
                    auditId: 'audit-1',
                    logs: ['Transaction rolled back'],
                    executedStatements: [],
                    error: 'Constraint validation failed.',
                    postApplySnapshotId: null,
                    updatedLiveSnapshotId: null,
                },
            },
        });

        render(<MigrationDialog open={true} onOpenChange={vi.fn()} />);

        await screen.findByText('Planned changes');
        await user.click(
            screen.getByRole('button', { name: 'Run Preflight Validation' })
        );
        await screen.findByText('Connection reachable');

        const applyButton = screen.getByRole('button', {
            name: 'Apply Migration',
        }) as HTMLButtonElement;
        expect(applyButton.disabled).toBe(true);

        await user.type(
            screen.getByPlaceholderText('APPLY DESTRUCTIVE CHANGES'),
            'APPLY DESTRUCTIVE CHANGES'
        );
        expect(applyButton.disabled).toBe(false);

        await user.click(applyButton);

        expect(await screen.findByText('Migration failed')).toBeTruthy();
        expect(screen.getByText('Transaction rolled back')).toBeTruthy();
    });

    it('shows successful apply results and refreshes workflow state', async () => {
        const user = userEvent.setup();
        const refreshWorkflow = vi.fn().mockResolvedValue(undefined);
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            developmentDiagram,
            workflow: {
                liveSnapshotId: 'workflow-live-1',
            },
            refreshWorkflow,
        } as never);
        mockedPreviewMigration.mockResolvedValue({
            preview: buildPreview(),
        });
        mockedValidateMigration.mockResolvedValue({
            validation: buildValidation(),
        });
        mockedApplyMigration.mockResolvedValue({
            apply: {
                validation: buildValidation(),
                result: {
                    status: 'succeeded',
                    jobId: 'job-1',
                    auditId: 'audit-1',
                    logs: ['Transaction committed'],
                    executedStatements: [
                        'ALTER TABLE "users" ADD COLUMN "display_name" text;',
                    ],
                    error: null,
                    postApplySnapshotId: 'post-apply-1',
                    updatedLiveSnapshotId: 'workflow-live-2',
                },
            },
        });

        render(<MigrationDialog open={true} onOpenChange={vi.fn()} />);

        await screen.findByText('Planned changes');
        await user.click(
            screen.getByRole('button', { name: 'Run Preflight Validation' })
        );
        await screen.findByText('Connection reachable');
        await user.click(
            screen.getByRole('button', { name: 'Apply Migration' })
        );

        expect(await screen.findByText('Migration succeeded')).toBeTruthy();
        await waitFor(() => {
            expect(refreshWorkflow).toHaveBeenCalledTimes(1);
        });
    });
});
