import React from 'react';
import { render, screen } from '@testing-library/react';
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
        expect(screen.getByText('Canvas preferences')).toBeInTheDocument();
        expect(screen.getByText('Show minimap')).toBeInTheDocument();
        expect(screen.getByText('Show database views')).toBeInTheDocument();

        await user.click(
            screen.getByRole('checkbox', { name: /Show database views/i })
        );
        expect(setShowDBViewsMock).toHaveBeenCalledWith(false);

        await user.click(screen.getByRole('button', { name: 'Appearance' }));
        expect(screen.getAllByText('Appearance').length).toBeGreaterThan(0);
        expect(screen.getByText('Theme')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Canva' }));
        expect(screen.getByText('Show minimap')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Subscription' }));
        expect(screen.getAllByText('Subscription').length).toBeGreaterThan(0);
        expect(screen.getByText('Check Plans')).toBeInTheDocument();
    });
});
