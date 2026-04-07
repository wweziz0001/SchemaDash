import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowActionsMenu } from './workflow-actions-menu';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

vi.mock('@/dialogs/review-changes-dialog/review-changes-dialog', () => ({
    ReviewChangesDialog: ({ open }: { open: boolean }) =>
        open ? <div>Review Dialog</div> : null,
}));

vi.mock('@/dialogs/migration-dialog/migration-dialog', () => ({
    MigrationDialog: ({ open }: { open: boolean }) =>
        open ? <div>Migration Dialog</div> : null,
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);

describe('workflow actions menu', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
    });

    it('stays hidden until compare workflow data is available', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            compareModeEnabled: false,
            compareSourceKind: 'live',
            activeMode: 'development',
            compareRenderModel: {
                compareResult: {
                    summary: {
                        tables: { added: 0, changed: 1, removed: 0, unchanged: 0, total: 1 },
                        fields: { added: 1, changed: 0, removed: 1, unchanged: 0, total: 2 },
                        relationships: { added: 0, changed: 0, removed: 1, unchanged: 0, total: 1 },
                    },
                },
            },
        } as never);

        render(<WorkflowActionsMenu />);

        expect(screen.queryByRole('button', { name: 'Review' })).toBeNull();
    });

    it('opens review directly and exposes migration from options for live compare', async () => {
        const user = userEvent.setup();
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            compareModeEnabled: true,
            compareSourceKind: 'live',
            activeMode: 'compare',
            compareRenderModel: {
                compareResult: {
                    summary: {
                        tables: { added: 0, changed: 1, removed: 0, unchanged: 0, total: 1 },
                        fields: { added: 1, changed: 0, removed: 1, unchanged: 0, total: 2 },
                        relationships: { added: 0, changed: 0, removed: 1, unchanged: 0, total: 1 },
                    },
                },
            },
        } as never);

        render(<WorkflowActionsMenu />);

        expect(
            screen.getByRole('button', { name: 'Review' })
        ).toHaveTextContent('4');
        await user.click(screen.getByRole('button', { name: 'Review' }));
        await user.click(
            screen.getByRole('menuitem', { name: 'Review Changes' })
        );
        expect(screen.getByText('Review Dialog')).toBeTruthy();

        await user.click(screen.getByRole('button', { name: 'Review' }));
        expect(
            screen.getByRole('menuitem', { name: 'Migration' })
        ).toBeTruthy();
        await user.click(screen.getByRole('menuitem', { name: 'Migration' }));
        expect(screen.getByText('Migration Dialog')).toBeTruthy();
    });

    it('stays hidden when compare is based on a historical version', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            compareModeEnabled: true,
            compareSourceKind: 'version',
            activeMode: 'compare',
            compareRenderModel: {
                compareResult: {
                    summary: {
                        tables: { added: 0, changed: 1, removed: 0, unchanged: 0, total: 1 },
                        fields: { added: 1, changed: 0, removed: 1, unchanged: 0, total: 2 },
                        relationships: { added: 0, changed: 0, removed: 1, unchanged: 0, total: 1 },
                    },
                },
            },
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
            compareRenderModel: {
                compareResult: {
                    summary: {
                        tables: { added: 0, changed: 1, removed: 0, unchanged: 0, total: 1 },
                        fields: { added: 1, changed: 0, removed: 1, unchanged: 0, total: 2 },
                        relationships: { added: 0, changed: 0, removed: 1, unchanged: 0, total: 1 },
                    },
                },
            },
        } as never);

        render(<WorkflowActionsMenu />);

        expect(screen.queryByRole('button', { name: 'Review' })).toBeNull();
    });
});
