import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/tooltip/tooltip';
import { SettingsDialog } from './settings-dialog';

const setShowCardinalityMock = vi.fn();
const setShowDBViewsMock = vi.fn();
const setShowFieldAttributesMock = vi.fn();
const setShowMiniMapOnCanvasMock = vi.fn();
const setThemeMock = vi.fn();

vi.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        enabled: true,
        mode: 'local',
        serverReachable: true,
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

describe('SettingsDialog', () => {
    beforeEach(() => {
        setShowCardinalityMock.mockReset();
        setShowDBViewsMock.mockReset();
        setShowFieldAttributesMock.mockReset();
        setShowMiniMapOnCanvasMock.mockReset();
        setThemeMock.mockReset();
    });

    it('renders a settings-only workspace modal and switches sections', async () => {
        const user = userEvent.setup();

        render(
            <TooltipProvider>
                <SettingsDialog open onOpenChange={vi.fn()} />
            </TooltipProvider>
        );

        expect(await screen.findByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Workspace settings')).toBeInTheDocument();
        expect(screen.getAllByText('Appearance').length).toBeGreaterThan(0);
        expect(screen.queryByText('All Diagrams')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Canvas/ }));
        expect(
            await screen.findByText('Canvas preferences')
        ).toBeInTheDocument();
        expect(screen.getByText('Show minimap')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Defaults/ }));
        expect(
            await screen.findByText('Default diagram id')
        ).toBeInTheDocument();
    });
});
