import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VersionsPanel } from './versions-panel';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import { useLayout } from '@/hooks/use-layout';

vi.mock('../context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));
vi.mock('@/hooks/use-layout', () => ({
    useLayout: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);
const mockedUseLayout = vi.mocked(useLayout);

describe('versions panel', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
        mockedUseLayout.mockReset();
        mockedUseLayout.mockReturnValue({
            selectSidebarSection: vi.fn(),
            selectedSidebarSection: 'tables',
            selectVersionsTab: vi.fn(),
            showSidePanel: vi.fn(),
        } as never);
    });

    it('stays hidden until a workflow diagram is loaded', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue(undefined);

        render(<VersionsPanel />);

        expect(screen.queryByRole('button', { name: 'Versions' })).toBeNull();
    });

    it('routes the toolbar button into the versions side panel', async () => {
        const user = userEvent.setup();
        const selectSidebarSection = vi.fn();
        const selectVersionsTab = vi.fn();
        const showSidePanel = vi.fn();

        mockedUseLayout.mockReturnValue({
            selectSidebarSection,
            selectedSidebarSection: 'tables',
            selectVersionsTab,
            showSidePanel,
        } as never);

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            versions: [
                {
                    id: 'version-1',
                    diagramId: 'diagram-1',
                    snapshotId: 'snapshot-1',
                    name: null,
                    description: 'Before the refactor',
                    versionLabel: 'Version 1',
                    origin: 'manual',
                    pinned: false,
                    createdAt: '2026-03-29T15:00:00.000Z',
                    createdBy: {
                        id: 'user-1',
                        displayName: 'Test Owner',
                        email: 'owner@example.com',
                    },
                },
            ],
        } as never);

        render(<VersionsPanel />);

        const button = screen.getByRole('button', { name: /Versions/i });
        expect(screen.getByText('1')).toBeTruthy();

        await user.click(button);

        expect(showSidePanel).toHaveBeenCalledTimes(1);
        expect(selectSidebarSection).toHaveBeenCalledWith('versions');
        expect(selectVersionsTab).toHaveBeenCalledWith('version');
    });
});
