import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewDropdown } from './review-dropdown';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';

vi.mock('../context/diagram-workflow-context', () => ({
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
        } as never);

        render(<ReviewDropdown />);

        expect(screen.queryByRole('button', { name: 'Review' })).toBeNull();
    });

    it('opens a menu with review changes and migration actions', async () => {
        const user = userEvent.setup();
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            compareModeEnabled: true,
        } as never);

        render(<ReviewDropdown />);

        await user.click(screen.getByRole('button', { name: 'Review' }));

        expect(
            screen.getByRole('menuitem', { name: 'Review Changes' })
        ).toBeTruthy();
        expect(
            screen.getByRole('menuitem', { name: 'Migration' })
        ).toBeTruthy();
    });
});
