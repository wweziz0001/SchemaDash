import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowActionsMenu } from './workflow-actions-menu';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);

describe('review dropdown', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
    });

    it('stays hidden until compare workflow data is available', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            compareModeEnabled: false,
            compareSourceKind: 'live',
            activeMode: 'development',
        } as never);

        render(<WorkflowActionsMenu />);

        expect(screen.queryByRole('button', { name: 'Review' })).toBeNull();
    });

    it('opens a menu with review changes and migration actions', async () => {
        const user = userEvent.setup();
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            compareModeEnabled: true,
            compareSourceKind: 'live',
            activeMode: 'compare',
            setActiveMode: vi.fn(),
        } as never);

        render(<WorkflowActionsMenu />);

        expect(screen.getByRole('button', { name: 'Finish' })).toBeTruthy();
        await user.click(screen.getByRole('button', { name: 'Review' }));

        expect(
            screen.getByRole('menuitem', { name: 'Review Changes' })
        ).toBeTruthy();
        expect(
            screen.getByRole('menuitem', { name: 'Migration' })
        ).toBeTruthy();
    });

    it('stays hidden when compare is based on a historical version', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            compareModeEnabled: true,
            compareSourceKind: 'version',
            activeMode: 'compare',
        } as never);

        render(<WorkflowActionsMenu />);

        expect(screen.queryByRole('button', { name: 'Review' })).toBeNull();
    });

    it('stays hidden until compare mode is active', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            compareModeEnabled: true,
            compareSourceKind: 'live',
            activeMode: 'development',
        } as never);

        render(<WorkflowActionsMenu />);

        expect(screen.queryByRole('button', { name: 'Review' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Finish' })).toBeNull();
    });

    it('returns to development when finish is pressed', async () => {
        const user = userEvent.setup();
        const setActiveMode = vi.fn();

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            compareModeEnabled: true,
            compareSourceKind: 'live',
            activeMode: 'compare',
            setActiveMode,
        } as never);

        render(<WorkflowActionsMenu />);

        await user.click(screen.getByRole('button', { name: 'Finish' }));

        expect(setActiveMode).toHaveBeenCalledWith('development');
    });
});
