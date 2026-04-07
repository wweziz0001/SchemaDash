import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowModeSwitcher } from './workflow-mode-switcher';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

vi.mock('./workflow-actions-menu', () => ({
    WorkflowActionsMenu: () => <div>Workflow Actions</div>,
}));

vi.mock('@/dialogs/restore-version-dialog/restore-version-dialog', () => ({
    RestoreVersionDialog: () => null,
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
            compareRenderModel: {
                compareResult: {
                    summary: {
                        tables: { total: 1 },
                        fields: { total: 2 },
                        relationships: { total: 1 },
                    },
                },
            },
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
        expect(
            screen.getByRole('button', { name: 'Compare' })
        ).toHaveTextContent('4');
    });

    it('switches into Live Database mode when a synced snapshot is available', async () => {
        const user = userEvent.setup();
        const setActiveMode = vi.fn();
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'development',
            liveModeEnabled: true,
            compareModeEnabled: true,
            compareRenderModel: {
                compareResult: {
                    summary: {
                        tables: { total: 1 },
                        fields: { total: 1 },
                        relationships: { total: 0 },
                    },
                },
            },
            setActiveMode,
        } as never);

        render(<WorkflowModeSwitcher />);

        await user.click(screen.getByRole('button', { name: 'Live Database' }));
        await user.click(screen.getByRole('button', { name: 'Compare' }));

        expect(setActiveMode).toHaveBeenCalledWith('live');
        expect(setActiveMode).toHaveBeenCalledWith('compare');
    });

    it('shows compare review controls once the editor is already in compare mode', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'compare',
            liveModeEnabled: true,
            compareModeEnabled: true,
            compareSourceKind: 'live',
            compareRenderModel: {
                compareResult: {
                    summary: {
                        tables: { total: 1 },
                        fields: { total: 2 },
                        relationships: { total: 1 },
                    },
                },
            },
            setActiveMode: vi.fn(),
        } as never);

        render(<WorkflowModeSwitcher />);

        expect(screen.queryByRole('button', { name: 'Compare' })).toBeNull();
        expect(
            screen.getByRole('button', { name: 'Development' })
        ).toBeTruthy();
        expect(screen.getByText('Workflow Actions')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Finish' })).toBeTruthy();
    });

    it('shows version workflow controls for a selected historical snapshot', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'version',
            compareModeEnabled: true,
            compareSourceKind: null,
            selectedVersion: {
                id: 'version-1',
                versionLabel: 'Version 3',
            },
            workflow: {
                diagramAccess: 'owner',
            },
            compareVersionToDevelopment: vi.fn(),
            setActiveMode: vi.fn(),
        } as never);

        render(<WorkflowModeSwitcher />);

        expect(screen.getByRole('button', { name: 'Version 3' })).toBeTruthy();
        expect(
            screen.getByRole('button', { name: 'Development' })
        ).toBeTruthy();
        expect(screen.getByRole('button', { name: 'View Diffs' })).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Options' })).toBeTruthy();
        expect(
            screen.queryByRole('button', { name: 'Live Database' })
        ).toBeNull();
    });

    it('hides diffs back to the selected snapshot when comparing against a version', async () => {
        const user = userEvent.setup();
        const openVersion = vi.fn();

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'compare',
            compareModeEnabled: true,
            compareSourceKind: 'version',
            compareVersion: {
                id: 'version-2',
                versionLabel: 'Version 2',
            },
            compareRenderModel: {
                compareResult: {
                    summary: {
                        tables: { total: 1 },
                        fields: { total: 1 },
                        relationships: { total: 0 },
                    },
                },
            },
            openVersion,
            setActiveMode: vi.fn(),
        } as never);

        render(<WorkflowModeSwitcher />);

        await user.click(screen.getByRole('button', { name: 'Hide Diffs' }));

        expect(openVersion).toHaveBeenCalledWith('version-2');
    });
});
