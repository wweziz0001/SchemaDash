import { useContext } from 'react';
import { diagramWorkflowContext } from './diagram-workflow-context';

export const useDiagramWorkflow = () => {
    const context = useContext(diagramWorkflowContext);

    if (!context) {
        throw new Error(
            'useDiagramWorkflow must be used within DiagramWorkflowProvider'
        );
    }

    return context;
};
