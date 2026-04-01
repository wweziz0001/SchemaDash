import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorSidebar } from './editor-sidebar';
import { SidebarProvider } from '@/components/sidebar/sidebar';

const navigateMock = vi.fn();
const logoutMock = vi.fn();
const setThemeMock = vi.fn();
const getSavedDiagramMock = vi.fn();

vi.mock('../top-navbar/current-diagram-share-button', () => ({
    CurrentDiagramShareButton: () => (
        <div data-testid="current-diagram-share-button" />
    ),
}));

vi.mock('@/hooks/use-layout', () => ({
    useLayout: () => ({
        selectSidebarSection: vi.fn(),
        selectedSidebarSection: 'tables',
        showSidePanel: vi.fn(),
        selectVisualsTab: vi.fn(),
        selectVersionsTab: vi.fn(),
    }),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('@/hooks/use-breakpoint', () => ({
    useBreakpoint: () => ({
        isMd: true,
    }),
}));

vi.mock('@/hooks/use-theme', () => ({
    useTheme: () => ({
        effectiveTheme: 'light',
        setTheme: setThemeMock,
    }),
}));

vi.mock('@/hooks/use-schemadash', () => ({
    useSchemaDash: () => ({
        databaseType: 'postgresql',
        customTypes: [],
        currentDiagram: {
            id: 'diagram-1',
        },
    }),
}));

vi.mock('@/hooks/use-dialog', () => ({
    useDialog: () => ({
        openCreateDiagramDialog: vi.fn(),
        openOpenDiagramDialog: vi.fn(),
    }),
}));

vi.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        user: {
            id: 'user-1',
            email: 'ada@example.com',
            displayName: 'Ada Lovelace',
            authProvider: 'local',
            status: 'active',
            role: 'admin',
            ownershipScope: 'workspace',
            createdAt: '2026-03-01T00:00:00.000Z',
            updatedAt: '2026-03-31T00:00:00.000Z',
        },
        enabled: true,
        authenticated: true,
        logout: logoutMock,
    }),
}));

vi.mock('@/hooks/use-storage', () => ({
    useStorage: () => ({
        getSavedDiagram: getSavedDiagramMock,
    }),
}));

vi.mock(
    '@/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api',
    () => ({
        useSharingSettingsDialogApi: () => ({
            loadSharing: vi.fn(),
            searchUsers: vi.fn(),
            addPerson: vi.fn(),
            updatePerson: vi.fn(),
            removePerson: vi.fn(),
            updateGeneralAccess: vi.fn(),
        }),
    })
);

vi.mock('@/dialogs/open-diagram-dialog/sharing-settings-dialog', () => ({
    SharingSettingsDialog: ({
        open,
        subject,
    }: {
        open: boolean;
        subject: { name: string } | null;
    }) =>
        open ? (
            <div data-testid="sharing-settings-dialog">{subject?.name}</div>
        ) : null,
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock,
}));

describe('EditorSidebar account menu', () => {
    const renderSidebar = () =>
        render(
            <SidebarProvider>
                <EditorSidebar />
            </SidebarProvider>
        );

    beforeEach(() => {
        navigateMock.mockReset();
        logoutMock.mockReset();
        setThemeMock.mockReset();
        getSavedDiagramMock.mockReset();
        getSavedDiagramMock.mockResolvedValue({
            id: 'diagram-1',
            projectId: 'project-1',
            ownerUserId: 'user-1',
            name: 'Warehouse ERD',
            description: null,
            databaseType: 'postgresql',
            databaseEdition: null,
            visibility: 'workspace',
            status: 'active',
            sharingScope: 'authenticated',
            sharingAccess: 'edit',
            access: 'owner',
            tableCount: 12,
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            updatedAt: new Date('2026-03-31T00:00:00.000Z'),
        });
    });

    it('removes the social footer actions and renders the account trigger', async () => {
        renderSidebar();

        expect(screen.queryByText('Discord')).not.toBeInTheDocument();
        expect(screen.queryByText('Twitter')).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Open account menu' })
        ).toBeInTheDocument();
        expect(screen.getByText('AL')).toBeInTheDocument();

        await waitFor(() => {
            expect(getSavedDiagramMock).toHaveBeenCalledWith('diagram-1');
        });
    });

    it('opens the account menu and closes it on escape and outside click', async () => {
        const user = userEvent.setup();

        renderSidebar();

        const trigger = screen.getByRole('button', {
            name: 'Open account menu',
        });

        await user.click(trigger);

        expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
        expect(screen.getByText('ada@example.com')).toBeInTheDocument();
        expect(screen.getByText('All Diagrams')).toBeInTheDocument();

        await user.keyboard('{Escape}');

        await waitFor(() => {
            expect(screen.queryByText('All Diagrams')).not.toBeInTheDocument();
        });

        await user.click(trigger);
        expect(screen.getByText('Settings')).toBeInTheDocument();

        fireEvent.pointerDown(document.documentElement);
        fireEvent.mouseDown(document.documentElement);
        fireEvent.click(document.documentElement);

        await waitFor(() => {
            expect(screen.queryByText('Settings')).not.toBeInTheDocument();
        });
    });

    it('navigates to existing routes from the account menu', async () => {
        const user = userEvent.setup();

        renderSidebar();

        const trigger = screen.getByRole('button', {
            name: 'Open account menu',
        });

        await user.click(trigger);
        await user.click(
            screen.getByRole('menuitem', { name: 'All Diagrams' })
        );

        expect(navigateMock).toHaveBeenCalledWith('/');

        await waitFor(() => {
            expect(screen.queryByText('Profile')).not.toBeInTheDocument();
        });

        await user.click(trigger);
        await user.click(screen.getByRole('menuitem', { name: 'Settings' }));

        expect(navigateMock).toHaveBeenCalledWith('/settings');
    });

    it('reuses sharing, theme, and logout flows from the existing app', async () => {
        const user = userEvent.setup();

        renderSidebar();

        const trigger = screen.getByRole('button', {
            name: 'Open account menu',
        });

        await user.click(trigger);

        await waitFor(() => {
            expect(
                screen.getByRole('menuitem', { name: 'Diagram Visibility' })
            ).not.toHaveAttribute('data-disabled');
        });

        await user.click(
            screen.getByRole('menuitem', { name: 'Diagram Visibility' })
        );

        expect(
            await screen.findByTestId('sharing-settings-dialog')
        ).toHaveTextContent('Warehouse ERD');

        await user.click(trigger);
        await user.click(screen.getByRole('button', { name: 'Dark' }));

        expect(setThemeMock).toHaveBeenCalledWith('dark');

        await user.click(screen.getByRole('menuitem', { name: 'Log out' }));

        expect(logoutMock).toHaveBeenCalledTimes(1);
    });
});
