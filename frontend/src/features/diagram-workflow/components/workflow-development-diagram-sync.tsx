import type React from 'react';
import { useEffect } from 'react';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';

export const WorkflowDevelopmentDiagramSync: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const { currentDiagram } = useSchemaDash();

    useEffect(() => {
        if (!workflow) {
            return;
        }

        if (workflow.activeMode !== 'development') {
            return;
        }

        if (!workflow.diagramId || currentDiagram.id !== workflow.diagramId) {
            return;
        }

        workflow.setDevelopmentDiagram(currentDiagram);
    }, [
        currentDiagram,
        workflow,
        workflow?.activeMode,
        workflow?.diagramId,
        workflow?.setDevelopmentDiagram,
    ]);

    return null;
};
