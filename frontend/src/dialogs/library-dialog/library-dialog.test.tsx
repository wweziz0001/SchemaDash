import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/tooltip/tooltip';
import { LibraryDialog } from './library-dialog';

const listCollectionsMock = vi.fn();
const listProjectsMock = vi.fn();
const listProjectDiagramsMock = vi.fn();

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

vi.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        enabled: true,
        user: {
            id: 'user-1',
            email: 'ada@example.com',
            displayName: 'Ada Lovelace',
            role: 'admin',
        },
    }),
}));

vi.mock('@/hooks/use-storage', () => ({
    useStorage: () => ({
        listCollections: listCollectionsMock,
        listProjects: listProjectsMock,
        listProjectDiagrams: listProjectDiagramsMock,
    }),
}));

describe('LibraryDialog', () => {
    beforeEach(() => {
        listCollectionsMock.mockReset();
        listProjectsMock.mockReset();
        listProjectDiagramsMock.mockReset();
        listCollectionsMock.mockResolvedValue(collectionsFixture);
        listProjectsMock.mockResolvedValue(projectsFixture);
        listProjectDiagramsMock.mockResolvedValue(diagramsFixture);
    });

    it('renders the modal library shell and supports close/open interactions', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();

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

        await user.click(screen.getAllByRole('button', { name: 'Close' })[0]);

        await waitFor(() => {
            expect(onOpenChange).toHaveBeenCalledWith(false);
        });
    });
});
