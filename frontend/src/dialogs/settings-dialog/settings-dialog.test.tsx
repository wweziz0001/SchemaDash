import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/tooltip/tooltip';
import { SettingsDialog } from './settings-dialog';

const logoutMock = vi.fn();
const setShowCardinalityMock = vi.fn();
const setShowDBViewsMock = vi.fn();
const setShowFieldAttributesMock = vi.fn();
const setShowMiniMapOnCanvasMock = vi.fn();
const setThemeMock = vi.fn();
const listCollectionsMock = vi.fn();
const listProjectsMock = vi.fn();
const listProjectDiagramsMock = vi.fn();

vi.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        authenticated: true,
        enabled: true,
        mode: 'local',
        serverReachable: true,
        logout: logoutMock,
        user: {
            email: 'wweziz37@gmail.com',
            displayName: 'Wweziz',
        },
    }),
}));

vi.mock('@/hooks/use-config', () => ({
    useConfig: () => ({
        config: {
            defaultDiagramId: 'diagram-1',
        },
    }),
}));

vi.mock('@/hooks/use-local-config', () => ({
    useLocalConfig: () => ({
        setShowCardinality: setShowCardinalityMock,
        setShowDBViews: setShowDBViewsMock,
        setShowFieldAttributes: setShowFieldAttributesMock,
        setShowMiniMapOnCanvas: setShowMiniMapOnCanvasMock,
        setTheme: setThemeMock,
        showCardinality: true,
        showDBViews: true,
        showFieldAttributes: true,
        showMiniMapOnCanvas: true,
        theme: 'system',
    }),
}));

vi.mock('@/hooks/use-storage', () => ({
    useStorage: () => ({
        listCollections: listCollectionsMock,
        listProjects: listProjectsMock,
        listProjectDiagrams: listProjectDiagramsMock,
    }),
}));

vi.mock('@/i18n/i18n', () => ({
    languages: [
        {
            code: 'ar',
            name: 'Arabic',
            nativeName: 'العربية',
        },
    ],
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        i18n: {
            changeLanguage: vi.fn(),
            languages: ['ar'],
        },
    }),
}));

describe('SettingsDialog', () => {
    beforeEach(() => {
        logoutMock.mockReset();
        setShowCardinalityMock.mockReset();
        setShowDBViewsMock.mockReset();
        setShowFieldAttributesMock.mockReset();
        setShowMiniMapOnCanvasMock.mockReset();
        setThemeMock.mockReset();
        listCollectionsMock.mockReset();
        listProjectsMock.mockReset();
        listProjectDiagramsMock.mockReset();
        listCollectionsMock.mockResolvedValue([{ id: 'collection-1' }]);
        listProjectsMock.mockResolvedValue([
            { id: 'project-1', status: 'active' },
            { id: 'project-2', status: 'active' },
            { id: 'project-3', status: 'deleted' },
        ]);
        listProjectDiagramsMock.mockImplementation(async (projectId: string) =>
            projectId === 'project-1'
                ? [{ id: 'diagram-1' }]
                : [{ id: 'diagram-2' }]
        );
    });

    it('renders the profile-styled settings modal and switches sections', async () => {
        const user = userEvent.setup();

        render(
            <TooltipProvider>
                <SettingsDialog open onOpenChange={vi.fn()} />
            </TooltipProvider>
        );

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Workspace settings')).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: 'Profile' })
        ).toBeInTheDocument();
        expect(screen.getByText('Account Details')).toBeInTheDocument();
        expect(screen.getByText('Auto-Save Settings')).toBeInTheDocument();
        expect(screen.getByText('Language')).toBeInTheDocument();
        expect(screen.queryByText('All Diagrams')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Canva' }));
        expect(
            screen.getByRole('heading', { name: 'Canva' })
        ).toBeInTheDocument();
        expect(screen.getByText('Canvas Preferences')).toBeInTheDocument();
        expect(screen.getByText('Show minimap')).toBeInTheDocument();
        expect(screen.getByText('Show database views')).toBeInTheDocument();

        await user.click(
            screen.getAllByRole('button', { name: 'Toggle setting' })[3]
        );
        expect(setShowDBViewsMock).toHaveBeenCalledWith(false);

        await user.click(screen.getByRole('button', { name: 'Appearance' }));
        expect(screen.getAllByText('Appearance').length).toBeGreaterThan(0);
        expect(screen.getByText('Theme')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toHaveClass('bg-background');
        expect(screen.getByRole('combobox', { name: '' })).toHaveClass(
            'bg-background'
        );

        await user.click(screen.getByRole('button', { name: 'Canva' }));
        expect(screen.getByText('Show minimap')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Account' }));
        expect(screen.getByText('Account Details')).toBeInTheDocument();
        expect(screen.getByText('Auth provider')).toBeInTheDocument();
        expect(screen.getByText('local')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Workspace snapshot')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Current saved workspace counts available in this session.'
            )
        ).toBeInTheDocument();
        const workspaceCard = screen
            .getByText('Workspace snapshot')
            .closest('[class*="rounded-"]');
        expect(workspaceCard).not.toBeNull();
        const workspaceScope = within(workspaceCard as HTMLElement);
        expect(workspaceScope.getByText('Collections')).toBeInTheDocument();
        expect(workspaceScope.getByText('Projects')).toBeInTheDocument();
        expect(workspaceScope.getByText('Diagrams')).toBeInTheDocument();
        expect(workspaceScope.getByText('1')).toBeInTheDocument();
        expect(workspaceScope.getAllByText('2').length).toBe(2);

        await user.click(screen.getByRole('button', { name: 'Subscription' }));
        expect(screen.getAllByText('Subscription').length).toBeGreaterThan(0);
        expect(screen.getByText('Check Plans')).toBeInTheDocument();
    });
});
