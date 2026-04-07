import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowModeSwitcher } from './workflow-mode-switcher';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { buildCompareRenderModel } from '@/lib/diagram-workflow/compare-render-model';
import { getAuthoritativeVersionCanonicalSchema } from '@/lib/diagram-workflow/version-canonical';

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

vi.mock('@/lib/diagram-workflow/compare-render-model', () => ({
    buildCompareRenderModel: vi.fn(),
}));

vi.mock('@/lib/diagram-workflow/version-canonical', () => ({
    getAuthoritativeVersionCanonicalSchema: vi.fn(),
}));

vi.mock('./workflow-actions-menu', () => ({
    WorkflowActionsMenu: () => <div>Workflow Actions</div>,
}));

vi.mock('@/dialogs/restore-version-dialog/restore-version-dialog', () => ({
    RestoreVersionDialog: () => null,
}));

vi.mock('@/dialogs/review-changes-dialog/review-changes-dialog', () => ({
    ReviewChangesDialog: () => null,
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);
const mockedBuildCompareRenderModel = vi.mocked(buildCompareRenderModel);
const mockedGetAuthoritativeVersionCanonicalSchema = vi.mocked(
    getAuthoritativeVersionCanonicalSchema
);

describe('workflow mode switcher', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
        mockedBuildCompareRenderModel.mockReset();
        mockedGetAuthoritativeVersionCanonicalSchema.mockReset();
        mockedBuildCompareRenderModel.mockReturnValue({
            compareResult: {
                summary: {
                    tables: {
                        added: 0,
                        changed: 0,
                        removed: 0,
                        unchanged: 0,
                        total: 0,
                    },
                    fields: {
                        added: 0,
                        changed: 0,
                        removed: 0,
                        unchanged: 0,
                        total: 0,
                    },
                    relationships: {
                        added: 0,
                        changed: 0,
                        removed: 0,
                        unchanged: 0,
                        total: 0,
                    },
                },
            },
        } as never);
        mockedGetAuthoritativeVersionCanonicalSchema.mockReturnValue(
            {} as never
        );
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
                        tables: {
                            added: 0,
                            changed: 1,
                            removed: 0,
                            unchanged: 0,
                            total: 1,
                        },
                        fields: {
                            added: 1,
                            changed: 0,
                            removed: 1,
                            unchanged: 0,
                            total: 2,
                        },
                        relationships: {
                            added: 0,
                            changed: 0,
                            removed: 1,
                            unchanged: 0,
                            total: 1,
                        },
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
                        tables: {
                            added: 1,
                            changed: 0,
                            removed: 0,
                            unchanged: 0,
                            total: 1,
                        },
                        fields: {
                            added: 0,
                            changed: 1,
                            removed: 0,
                            unchanged: 0,
                            total: 1,
                        },
                        relationships: {
                            added: 0,
                            changed: 0,
                            removed: 0,
                            unchanged: 0,
                            total: 0,
                        },
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
                        tables: {
                            added: 0,
                            changed: 1,
                            removed: 0,
                            unchanged: 0,
                            total: 1,
                        },
                        fields: {
                            added: 1,
                            changed: 0,
                            removed: 1,
                            unchanged: 0,
                            total: 2,
                        },
                        relationships: {
                            added: 0,
                            changed: 0,
                            removed: 1,
                            unchanged: 0,
                            total: 1,
                        },
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
        expect(screen.queryByRole('button', { name: 'Finish' })).toBeNull();
    });

    it('shows version workflow controls for a selected historical snapshot', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'version',
            compareModeEnabled: true,
            compareSourceKind: null,
            developmentDiagram: {
                id: 'development-diagram',
            },
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
        expect(screen.getByRole('button', { name: /Compare/ })).toBeTruthy();
        expect(
            screen.queryByRole('button', { name: 'Live Database' })
        ).toBeNull();
    });

    it('uses the selected version summary for counts while browsing versions', () => {
        mockedBuildCompareRenderModel.mockReturnValue({
            compareResult: {
                summary: {
                    tables: {
                        added: 1,
                        changed: 0,
                        removed: 0,
                        unchanged: 0,
                        total: 1,
                    },
                    fields: {
                        added: 0,
                        changed: 1,
                        removed: 0,
                        unchanged: 0,
                        total: 1,
                    },
                    relationships: {
                        added: 0,
                        changed: 0,
                        removed: 0,
                        unchanged: 0,
                        total: 0,
                    },
                },
            },
        } as never);

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'version',
            compareModeEnabled: true,
            compareSourceKind: null,
            developmentDiagram: {
                id: 'development-diagram',
            },
            compareRenderModel: {
                compareResult: {
                    summary: {
                        tables: {
                            added: 1,
                            changed: 1,
                            removed: 2,
                            unchanged: 0,
                            total: 4,
                        },
                        fields: {
                            added: 1,
                            changed: 1,
                            removed: 1,
                            unchanged: 0,
                            total: 3,
                        },
                        relationships: {
                            added: 1,
                            changed: 0,
                            removed: 1,
                            unchanged: 0,
                            total: 2,
                        },
                    },
                },
            },
            selectedVersion: {
                id: 'version-1',
                versionLabel: 'Version 3',
            },
            workflow: {
                diagramAccess: 'owner',
            },
            compareVersionToDevelopment: vi.fn(),
            setActiveMode: vi.fn(),
            openVersion: vi.fn(),
        } as never);

        render(<WorkflowModeSwitcher />);

        expect(
            screen.getByRole('button', { name: /Compare/ })
        ).toHaveTextContent('2');
        expect(mockedBuildCompareRenderModel).toHaveBeenCalledTimes(1);
    });

    it('finishes back to the selected snapshot when comparing against a version', async () => {
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
                        tables: {
                            added: 1,
                            changed: 0,
                            removed: 0,
                            unchanged: 0,
                            total: 1,
                        },
                        fields: {
                            added: 0,
                            changed: 1,
                            removed: 0,
                            unchanged: 0,
                            total: 1,
                        },
                        relationships: {
                            added: 0,
                            changed: 0,
                            removed: 0,
                            unchanged: 0,
                            total: 0,
                        },
                    },
                },
            },
            openVersion,
            setActiveMode: vi.fn(),
        } as never);

        render(<WorkflowModeSwitcher />);

        await user.click(screen.getByRole('button', { name: 'Finish' }));

        expect(openVersion).toHaveBeenCalledWith('version-2');
    });
});
