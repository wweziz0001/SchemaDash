import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/tooltip/tooltip';
import { LibraryDialog } from './library-dialog';

const closeOpenDiagramDialogMock = vi.fn();
const createCollectionMock = vi.fn();
const createProjectMock = vi.fn();
const deleteCollectionMock = vi.fn();
const deleteDiagramMock = vi.fn();
const deleteProjectMock = vi.fn();
const listCollectionsMock = vi.fn();
const listProjectDiagramsMock = vi.fn();
const listProjectsMock = vi.fn();
const loadDiagramMock = vi.fn();
const openCreateDiagramDialogMock = vi.fn();
const openImportDiagramDialogMock = vi.fn();
const showAlertMock = vi.fn();
const updateCollectionMock = vi.fn();
const updateConfigMock = vi.fn();
const updateProjectMock = vi.fn();
const updateSavedDiagramMock = vi.fn();

const collectionsFixture = [
    {
        id: 'collection-1',
        name: 'Core Models',
        description: 'Primary shared schemas',
        ownerUserId: 'user-1',
        projectCount: 1,
        diagramCount: 1,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-20T00:00:00.000Z'),
    },
];

const projectsFixture = [
    {
        id: 'project-1',
        name: 'Warehouse',
        description: 'Inventory domain',
        collectionId: 'collection-1',
        ownerUserId: 'user-1',
        visibility: 'workspace' as const,
        status: 'active' as const,
        sharingScope: 'authenticated' as const,
        sharingAccess: 'edit' as const,
        access: 'owner' as const,
        diagramCount: 1,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-20T00:00:00.000Z'),
    },
];

const diagramsFixture = [
    {
        id: 'diagram-1',
        projectId: 'project-1',
        ownerUserId: 'user-1',
        name: 'Warehouse ERD',
        description: 'Inventory tables',
        databaseType: 'postgresql',
        databaseEdition: null,
        visibility: 'workspace' as const,
        status: 'active' as const,
        sharingScope: 'authenticated' as const,
        sharingAccess: 'edit' as const,
        access: 'owner' as const,
        tableCount: 12,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-31T00:00:00.000Z'),
    },
];

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        authenticated: true,
        enabled: true,
        mode: 'local',
        user: {
            id: 'user-1',
            email: 'ada@example.com',
            displayName: 'Ada Lovelace',
            role: 'admin',
            authProvider: 'local',
            status: 'active',
        },
    }),
}));

vi.mock('@/hooks/use-config', () => ({
    useConfig: () => ({
        config: {
            defaultDiagramId: 'diagram-1',
        },
        updateConfig: updateConfigMock,
    }),
}));

vi.mock('@/hooks/use-local-config', () => ({
    useLocalConfig: () => ({
        setShowCardinality: vi.fn(),
        setShowDBViews: vi.fn(),
        setShowFieldAttributes: vi.fn(),
        setShowMiniMapOnCanvas: vi.fn(),
        setTheme: vi.fn(),
        showCardinality: true,
        showDBViews: true,
        showFieldAttributes: true,
        showMiniMapOnCanvas: true,
        theme: 'system',
    }),
}));

vi.mock('@/hooks/use-dialog', () => ({
    useDialog: () => ({
        closeOpenDiagramDialog: closeOpenDiagramDialogMock,
        openCreateDiagramDialog: openCreateDiagramDialogMock,
        openImportDiagramDialog: openImportDiagramDialogMock,
    }),
}));

vi.mock('@/hooks/use-schemadash', () => ({
    useSchemaDash: () => ({
        currentDiagram: {
            id: 'diagram-1',
        },
        loadDiagram: loadDiagramMock,
    }),
}));

vi.mock('@/context/alert-context/alert-context', () => ({
    useAlert: () => ({
        showAlert: showAlertMock,
    }),
}));

vi.mock('@/hooks/use-storage', () => ({
    useStorage: () => ({
        createCollection: createCollectionMock,
        createProject: createProjectMock,
        deleteCollection: deleteCollectionMock,
        deleteDiagram: deleteDiagramMock,
        deleteProject: deleteProjectMock,
        listCollections: listCollectionsMock,
        listProjectDiagrams: listProjectDiagramsMock,
        listProjects: listProjectsMock,
        updateCollection: updateCollectionMock,
        updateProject: updateProjectMock,
        updateSavedDiagram: updateSavedDiagramMock,
    }),
}));

vi.mock(
    '@/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api',
    () => ({
        useSharingSettingsDialogApi: () => ({
            addPerson: vi.fn(),
            loadSharing: vi.fn(),
            removePerson: vi.fn(),
            searchUsers: vi.fn(),
            updateGeneralAccess: vi.fn(),
            updatePerson: vi.fn(),
        }),
    })
);

vi.mock('@/dialogs/open-diagram-dialog/sharing-settings-dialog', () => ({
    SharingSettingsDialog: () => null,
}));

describe('LibraryDialog', () => {
    const renderDialog = (initialTab: 'all' | 'collections' = 'all') =>
        render(
            <MemoryRouter>
                <TooltipProvider>
                    <LibraryDialog
                        initialTab={initialTab}
                        open
                        onOpenChange={vi.fn()}
                    />
                </TooltipProvider>
            </MemoryRouter>
        );

    beforeEach(() => {
        closeOpenDiagramDialogMock.mockReset();
        createCollectionMock.mockReset();
        createProjectMock.mockReset();
        deleteCollectionMock.mockReset();
        deleteDiagramMock.mockReset();
        deleteProjectMock.mockReset();
        listCollectionsMock.mockReset();
        listProjectDiagramsMock.mockReset();
        listProjectsMock.mockReset();
        loadDiagramMock.mockReset();
        openCreateDiagramDialogMock.mockReset();
        openImportDiagramDialogMock.mockReset();
        showAlertMock.mockReset();
        updateCollectionMock.mockReset();
        updateConfigMock.mockReset();
        updateProjectMock.mockReset();
        updateSavedDiagramMock.mockReset();

        listCollectionsMock.mockResolvedValue(collectionsFixture);
        listProjectsMock.mockResolvedValue(projectsFixture);
        listProjectDiagramsMock.mockResolvedValue(diagramsFixture);
        createCollectionMock.mockResolvedValue({
            ...collectionsFixture[0],
            id: 'collection-2',
            name: 'New collection',
        });
        createProjectMock.mockResolvedValue({
            ...projectsFixture[0],
            id: 'project-2',
            name: 'New project',
        });
    });

    it('renders the workspace modal shell and supports tab switching', async () => {
        const user = userEvent.setup();

        renderDialog();

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Workspace')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /All Diagrams/ })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Shared with Me' })
        ).toBeInTheDocument();
        expect(screen.getByText('Projects')).toBeInTheDocument();
        expect(await screen.findByText('Warehouse ERD')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Unorganized' }));
        expect(
            await screen.findByText('Unorganized projects')
        ).toBeInTheDocument();
    });

    it('creates projects and opens create/import dialogs without route navigation', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        const promptSpy = vi
            .spyOn(window, 'prompt')
            .mockReturnValueOnce('Ops project')
            .mockReturnValueOnce('Project description');

        render(
            <MemoryRouter>
                <TooltipProvider>
                    <LibraryDialog
                        initialTab="all"
                        open
                        onOpenChange={onOpenChange}
                    />
                </TooltipProvider>
            </MemoryRouter>
        );

        expect(await screen.findByText('Warehouse ERD')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'New project' }));

        await waitFor(() => {
            expect(createProjectMock).toHaveBeenCalledWith({
                collectionId: 'collection-1',
                description: 'Project description',
                name: 'Ops project',
            });
        });

        await user.click(
            screen.getByRole('button', { name: 'Create diagram' })
        );

        expect(onOpenChange).toHaveBeenCalledWith(false);
        expect(closeOpenDiagramDialogMock).toHaveBeenCalledTimes(1);
        expect(openCreateDiagramDialogMock).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: 'Import' }));

        expect(openImportDiagramDialogMock).toHaveBeenCalledWith({});

        promptSpy.mockRestore();
    });

    it('creates and renames collections from the collections tab', async () => {
        const user = userEvent.setup();
        const promptSpy = vi
            .spyOn(window, 'prompt')
            .mockReturnValueOnce('Renamed collection')
            .mockReturnValueOnce('Updated description')
            .mockReturnValueOnce('New collection')
            .mockReturnValueOnce('Collection description');

        renderDialog('collections');

        expect(
            await screen.findByRole('button', { name: 'New collection' })
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Rename' }));

        await waitFor(() => {
            expect(updateCollectionMock).toHaveBeenCalledWith('collection-1', {
                description: 'Updated description',
                name: 'Renamed collection',
            });
        });

        await user.click(
            screen.getByRole('button', { name: 'New collection' })
        );

        await waitFor(() => {
            expect(createCollectionMock).toHaveBeenCalledWith({
                description: 'Collection description',
                name: 'New collection',
            });
        });

        promptSpy.mockRestore();
    });
});
