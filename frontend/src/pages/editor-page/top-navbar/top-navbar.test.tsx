import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TopNavbar } from './top-navbar';
import { TopNavbarMobile } from './top-navbar-mobile';

const logoutMock = vi.fn();
const toggleSidebarMock = vi.fn();

vi.mock('./diagram-name', () => ({
    DiagramName: () => <div>Diagram Name</div>,
}));

vi.mock('./last-saved', () => ({
    LastSaved: () => <div>Last Saved</div>,
}));

vi.mock('./language-nav/language-nav', () => ({
    LanguageNav: () => <div>Language Nav</div>,
}));

vi.mock('./menu/menu', () => ({
    Menu: () => <div>Menu</div>,
}));

vi.mock('./active-diagram-participants', () => ({
    ActiveDiagramParticipants: () => <div>Participants</div>,
}));

vi.mock('./workflow/version-view-badge', () => ({
    VersionViewBadge: () => <div>Version Badge</div>,
}));

vi.mock('./workflow/workflow-actions-menu', () => ({
    WorkflowActionsMenu: () => <div>Workflow Actions</div>,
}));

vi.mock('./workflow/schema-sync-toolbar-button', () => ({
    SchemaSyncToolbarButton: () => <div>Schema Sync</div>,
}));

vi.mock('./workflow/workflow-mode-switcher', () => ({
    WorkflowModeSwitcher: () => <div>Workflow Switcher</div>,
}));

vi.mock('@/hooks/use-theme', () => ({
    useTheme: () => ({
        effectiveTheme: 'light',
    }),
}));

vi.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        enabled: true,
        user: {
            role: 'admin',
            displayName: 'Ada Lovelace',
            email: 'ada@example.com',
        },
        logout: logoutMock,
    }),
}));

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: () => ({
        diagramId: 'diagram-1',
        activeMode: 'development',
    }),
}));

vi.mock('@/components/sidebar/use-sidebar', () => ({
    useSidebar: () => ({
        toggleSidebar: toggleSidebarMock,
    }),
}));

describe('TopNavbar library access', () => {
    beforeEach(() => {
        logoutMock.mockReset();
        toggleSidebarMock.mockReset();
    });

    it('removes the desktop Library entry button while keeping the remaining actions', () => {
        render(
            <MemoryRouter>
                <TopNavbar />
            </MemoryRouter>
        );

        expect(
            screen.queryByRole('link', { name: 'Library' })
        ).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Log out' })
        ).toBeInTheDocument();
    });

    it('removes the mobile Library entry button while keeping the remaining controls', () => {
        render(
            <MemoryRouter>
                <TopNavbarMobile />
            </MemoryRouter>
        );

        expect(
            screen.queryByRole('link', { name: 'Library' })
        ).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Log out' })
        ).toBeInTheDocument();
    });
});
