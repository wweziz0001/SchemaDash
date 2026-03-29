import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowModeSwitcher } from './workflow-mode-switcher';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';

vi.mock('../context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);

describe('workflow mode switcher', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
    });

    it('shows Development and disables Live Database until a live snapshot exists', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'development',
            liveModeEnabled: false,
            setActiveMode: vi.fn(),
        } as never);

        render(<WorkflowModeSwitcher />);

        expect(
            screen.getByRole('button', { name: 'Development' })
        ).toBeEnabled();
        expect(
            screen.getByRole('button', { name: 'Live Database' })
        ).toBeDisabled();
    });

    it('switches into Live Database mode when a synced snapshot is available', async () => {
        const user = userEvent.setup();
        const setActiveMode = vi.fn();
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'development',
            liveModeEnabled: true,
            setActiveMode,
        } as never);

        render(<WorkflowModeSwitcher />);

        await user.click(screen.getByRole('button', { name: 'Live Database' }));

        expect(setActiveMode).toHaveBeenCalledWith('live');
    });
});
