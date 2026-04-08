import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagramName } from './diagram-name';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { captureDiagramWorkflowChangelogEntry } from '@/lib/diagram-workflow/capture-changelog-entry';
import { TooltipProvider } from '@/components/tooltip/tooltip';

vi.mock('@/hooks/use-schemadash', () => ({
    useSchemaDash: vi.fn(),
}));

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

vi.mock('@/lib/diagram-workflow/capture-changelog-entry', () => ({
    captureDiagramWorkflowChangelogEntry: vi.fn(),
}));

vi.mock('@/hooks/use-dialog', () => ({
    useDialog: () => ({
        openOpenDiagramDialog: vi.fn(),
    }),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('react-use', () => ({
    useClickAway: vi.fn(),
    useKeyPressEvent: vi.fn(),
}));

const mockedUseSchemaDash = vi.mocked(useSchemaDash);
const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);
const mockedCaptureChangelogEntry = vi.mocked(
    captureDiagramWorkflowChangelogEntry
);

describe('diagram name readonly behavior', () => {
    beforeEach(() => {
        mockedUseSchemaDash.mockReset();
        mockedUseOptionalDiagramWorkflow.mockReset();
        mockedCaptureChangelogEntry.mockReset();
        mockedUseOptionalDiagramWorkflow.mockReturnValue(undefined);
        mockedCaptureChangelogEntry.mockResolvedValue(undefined);
    });

    it('shows a view-only badge and blocks inline renaming for viewers', () => {
        mockedUseSchemaDash.mockReturnValue({
            diagramName: 'Shared Diagram',
            updateDiagramName: vi.fn(),
            currentDiagram: {
                id: 'diagram-1',
                name: 'Shared Diagram',
                databaseType: 'postgresql',
                databaseEdition: null,
            },
            diagramSession: undefined,
            readonly: true,
        } as never);

        render(
            <TooltipProvider>
                <DiagramName />
            </TooltipProvider>
        );

        fireEvent.doubleClick(screen.getByText('Shared Diagram'));

        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('still allows inline renaming for editors', async () => {
        const updateDiagramName = vi.fn().mockResolvedValue(undefined);

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-2',
            developmentDiagram: {
                id: 'diagram-2',
                name: 'Editable Diagram',
            },
            upsertChangelogEntry: vi.fn(),
        } as never);
        mockedUseSchemaDash.mockReturnValue({
            diagramName: 'Editable Diagram',
            updateDiagramName,
            currentDiagram: {
                id: 'diagram-2',
                name: 'Editable Diagram',
                databaseType: 'postgresql',
                databaseEdition: null,
            },
            diagramSession: undefined,
            readonly: false,
        } as never);

        render(
            <TooltipProvider>
                <DiagramName />
            </TooltipProvider>
        );

        fireEvent.doubleClick(screen.getByText('Editable Diagram'));

        expect(screen.getByRole('textbox')).toBeInTheDocument();

        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: 'Renamed Diagram' },
        });
        fireEvent.click(screen.getAllByRole('button')[0]);

        await waitFor(() => {
            expect(updateDiagramName).toHaveBeenCalledWith('Renamed Diagram');
        });
    });
});
