import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import { diagramWorkflowClient } from '@/lib/api/diagram-workflow-client';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { RestoreVersionDialog } from './restore-version-dialog';
import { useStorage } from '@/hooks/use-storage';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { diagramToCanonicalSchema } from '@/lib/schema-sync/canonical-adapters';

const toast = vi.fn();

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

vi.mock('@/hooks/use-storage', () => ({
    useStorage: vi.fn(),
}));

vi.mock('@/hooks/use-schemadash', () => ({
    useSchemaDash: vi.fn(),
}));

vi.mock('@/lib/api/persistence-client', async () => {
    const actual = await vi.importActual('@/lib/api/persistence-client');

    return {
        ...actual,
        persistenceClient: {
            getDiagram: vi.fn(),
        },
    };
});

vi.mock('@/lib/api/diagram-workflow-client', () => ({
    diagramWorkflowClient: {
        restoreVersionToDevelopment: vi.fn(),
    },
}));

vi.mock('@/lib/schema-sync/canonical-adapters', () => ({
    diagramToCanonicalSchema: vi.fn(),
}));

vi.mock('@/components/toast/use-toast', () => ({
    useToast: () => ({
        toast,
    }),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);
const mockedUseStorage = vi.mocked(useStorage);
const mockedUseSchemaDash = vi.mocked(useSchemaDash);
const mockedRestoreVersionToDevelopment = vi.mocked(
    diagramWorkflowClient.restoreVersionToDevelopment
);
const mockedDiagramToCanonicalSchema = vi.mocked(diagramToCanonicalSchema);
const developmentCanonicalSchema = {
    engine: 'postgresql' as const,
    databaseName: 'warehouse',
    defaultSchemaName: 'public',
    schemaNames: ['public'],
    tables: [],
    customTypes: [],
    fingerprint: 'development-fingerprint',
    importedAt: '2026-03-29T10:00:00.000Z',
};

const developmentDiagram: Diagram = {
    id: 'diagram-1',
    name: 'Development Diagram',
    databaseType: DatabaseType.POSTGRESQL,
    tables: [],
    relationships: [],
    dependencies: [],
    areas: [],
    customTypes: [],
    notes: [],
    createdAt: new Date('2026-03-29T10:00:00.000Z'),
    updatedAt: new Date('2026-03-29T10:00:00.000Z'),
};

const version = {
    id: 'version-1',
    diagramId: 'diagram-1',
    snapshotId: 'snapshot-1',
    name: 'Stable release',
    description: 'Saved before the refactor',
    versionLabel: 'Version 1',
    origin: 'manual' as const,
    pinned: false,
    createdAt: '2026-03-29T12:00:00.000Z',
    createdBy: {
        id: 'user-1',
        displayName: 'Test Owner',
        email: 'owner@example.com',
    },
};

describe('restore version dialog', () => {
    beforeEach(() => {
        toast.mockReset();
        mockedUseOptionalDiagramWorkflow.mockReset();
        mockedUseStorage.mockReset();
        mockedUseSchemaDash.mockReset();
        mockedRestoreVersionToDevelopment.mockReset();
        mockedDiagramToCanonicalSchema.mockReset();

        mockedDiagramToCanonicalSchema.mockReturnValue(
            developmentCanonicalSchema
        );
    });

    it('requires explicit confirmation and restores Development through the workflow API', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        const loadDiagramFromData = vi.fn();
        const setDevelopmentDiagram = vi.fn();
        const setActiveMode = vi.fn();
        const setVersions = vi.fn();
        const refreshWorkflow = vi.fn().mockResolvedValue(undefined);
        const getDiagramSessionState = vi.fn().mockResolvedValue({
            session: { id: 'session-1' },
            collaboration: {
                document: { version: 7 },
            },
        });
        const getDiagram = vi.fn().mockResolvedValue(developmentDiagram);

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            developmentDiagram,
            versions: [version],
            refreshWorkflow,
            setActiveMode,
            setDevelopmentDiagram,
            setVersions,
        } as never);
        mockedUseStorage.mockReturnValue({
            getDiagramSessionState,
            getDiagram,
        } as never);
        mockedUseSchemaDash.mockReturnValue({
            loadDiagramFromData,
        } as never);
        mockedRestoreVersionToDevelopment.mockResolvedValue({
            result: {
                diagramId: 'diagram-1',
                restoredVersion: version,
                safetySnapshotVersion: {
                    ...version,
                    id: 'version-2',
                    snapshotId: 'snapshot-2',
                    name: 'Before restore: Stable release',
                    versionLabel: 'Version 2',
                    origin: 'before_restore',
                },
                versions: [
                    {
                        ...version,
                        id: 'version-2',
                        snapshotId: 'snapshot-2',
                        name: 'Before restore: Stable release',
                        versionLabel: 'Version 2',
                        origin: 'before_restore',
                    },
                    version,
                ],
                development: {
                    name: 'Development Diagram',
                    documentVersion: 8,
                    updatedAt: '2026-03-29T14:00:00.000Z',
                },
            },
        });

        render(
            <RestoreVersionDialog
                open
                version={version}
                onOpenChange={onOpenChange}
            />
        );

        const restoreButton = screen.getByRole('button', {
            name: 'Revert to This Version',
        });
        expect(restoreButton).toBeDisabled();

        await user.type(
            screen.getByLabelText('Confirmation text'),
            'RESTORE DEVELOPMENT'
        );
        expect(restoreButton).not.toBeDisabled();

        await user.click(restoreButton);

        await waitFor(() => {
            expect(mockedRestoreVersionToDevelopment).toHaveBeenCalledWith(
                'diagram-1',
                'version-1',
                {
                    confirmationText: 'RESTORE DEVELOPMENT',
                    baseVersion: 7,
                    sessionId: 'session-1',
                    currentDevelopmentCanonicalSchema:
                        developmentCanonicalSchema,
                }
            );
        });
        expect(getDiagram).toHaveBeenCalledWith('diagram-1', {
            includeRelationships: true,
            includeTables: true,
            includeDependencies: true,
            includeAreas: true,
            includeCustomTypes: true,
            includeNotes: true,
        });
        expect(loadDiagramFromData).toHaveBeenCalledWith(developmentDiagram);
        expect(setDevelopmentDiagram).toHaveBeenCalledWith(developmentDiagram);
        expect(setVersions).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ id: 'version-2' }),
                expect.objectContaining({ id: 'version-1' }),
            ])
        );
        expect(setActiveMode).toHaveBeenCalledWith('development');
        await waitFor(() => {
            expect(refreshWorkflow).toHaveBeenCalled();
        });
        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(toast).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Development restored',
                description: expect.stringContaining('document version 8'),
            })
        );
    });

    it('shows actionable restore failures without mutating the editor state', async () => {
        const user = userEvent.setup();
        const loadDiagramFromData = vi.fn();

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            developmentDiagram,
            versions: [version],
            refreshWorkflow: vi.fn(),
            setActiveMode: vi.fn(),
            setDevelopmentDiagram: vi.fn(),
            setVersions: vi.fn(),
        } as never);
        mockedUseStorage.mockReturnValue({
            getDiagramSessionState: vi.fn().mockResolvedValue({
                session: { id: 'session-1' },
                collaboration: {
                    document: { version: 7 },
                },
            }),
            getDiagram: vi.fn(),
        } as never);
        mockedUseSchemaDash.mockReturnValue({
            loadDiagramFromData,
        } as never);
        mockedRestoreVersionToDevelopment.mockRejectedValue(
            new Error('Development changed before the restore could start.')
        );

        render(
            <RestoreVersionDialog
                open
                version={version}
                onOpenChange={vi.fn()}
            />
        );

        await user.type(
            screen.getByLabelText('Confirmation text'),
            'RESTORE DEVELOPMENT'
        );
        await user.click(
            screen.getByRole('button', {
                name: 'Revert to This Version',
            })
        );

        await waitFor(() => {
            expect(
                screen.getByText(
                    'Development changed before the restore could start.'
                )
            ).toBeTruthy();
        });
        expect(loadDiagramFromData).not.toHaveBeenCalled();
        expect(toast).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Restore failed',
                variant: 'destructive',
            })
        );
    });
});
