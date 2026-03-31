import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowModeSwitcher } from './workflow-mode-switcher';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);

describe('workflow mode switcher', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
    });

    it('shows compare as disabled until both a live snapshot and development diagram exist', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'development',
            liveModeEnabled: false,
            compareModeEnabled: false,
            setActiveMode: vi.fn(),
        } as never);

        render(<WorkflowModeSwitcher />);

        expect(
            (
                screen.getByRole('button', { name: 'Development' }) as
                    | HTMLButtonElement
                    | undefined
            )?.disabled
        ).toBe(false);
        expect(
            (
                screen.getByRole('button', {
                    name: 'Live Database',
                }) as HTMLButtonElement
            ).disabled
        ).toBe(true);
        expect(
            (
                screen.getByRole('button', {
                    name: 'Compare',
                }) as HTMLButtonElement
            ).disabled
        ).toBe(true);
    });

    it('switches into Live Database mode when a synced snapshot is available', async () => {
        const user = userEvent.setup();
        const setActiveMode = vi.fn();
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'development',
            liveModeEnabled: true,
            compareModeEnabled: true,
            setActiveMode,
        } as never);

        render(<WorkflowModeSwitcher />);

        await user.click(screen.getByRole('button', { name: 'Live Database' }));
        await user.click(screen.getByRole('button', { name: 'Compare' }));

        expect(setActiveMode).toHaveBeenCalledWith('live');
        expect(setActiveMode).toHaveBeenCalledWith('compare');
    });
});
