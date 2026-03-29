import React from 'react';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowDevelopmentDiagramSync } from './workflow-development-diagram-sync';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import { useSchemaDash } from '@/hooks/use-schemadash';

vi.mock('../context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

vi.mock('@/hooks/use-schemadash', () => ({
    useSchemaDash: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);
const mockedUseSchemaDash = vi.mocked(useSchemaDash);

describe('workflow development diagram sync', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
        mockedUseSchemaDash.mockReset();
    });

    it('syncs the live development head into workflow state while editing', () => {
        const setDevelopmentDiagram = vi.fn();
        const currentDiagram = {
            id: 'diagram-1',
            name: 'Development',
        };

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'development',
            setDevelopmentDiagram,
        } as never);
        mockedUseSchemaDash.mockReturnValue({
            currentDiagram,
        } as never);

        render(<WorkflowDevelopmentDiagramSync />);

        expect(setDevelopmentDiagram).toHaveBeenCalledWith(currentDiagram);
    });

    it('does not sync compare mode back into the development source', () => {
        const setDevelopmentDiagram = vi.fn();

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'compare',
            setDevelopmentDiagram,
        } as never);
        mockedUseSchemaDash.mockReturnValue({
            currentDiagram: {
                id: 'diagram-1',
                name: 'Compare',
            },
        } as never);

        render(<WorkflowDevelopmentDiagramSync />);

        expect(setDevelopmentDiagram).not.toHaveBeenCalled();
    });
});
