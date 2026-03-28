import React from 'react';
import { Spinner } from '@/components/spinner/spinner';
import {
    DiagramWorkflowProvider,
    useDiagramWorkflow,
} from '@/features/diagram-workflow/context/diagram-workflow-context';
import { EditorPage } from './editor-page';
import { TopNavbarMock } from './top-navbar/top-navbar-mock';

const WorkflowEditorPageContent: React.FC = () => {
    const {
        activeMode,
        diagramId,
        liveDiagram,
        loading,
        requestedMode,
        workflow,
    } = useDiagramWorkflow();

    if (diagramId && requestedMode === 'live' && loading && !workflow) {
        return (
            <section className="flex h-screen w-screen flex-col overflow-hidden bg-background">
                <TopNavbarMock />
                <div className="flex flex-1 items-center justify-center">
                    <Spinner size="large" />
                </div>
            </section>
        );
    }

    return (
        <EditorPage
            key={`${diagramId ?? 'workspace'}:${activeMode}:${workflow?.liveSnapshotId ?? 'none'}`}
            initialDiagram={activeMode === 'live' ? liveDiagram : undefined}
            readonly={activeMode === 'live'}
            disableAuthoritativeSync={activeMode === 'live'}
        />
    );
};

export const WorkflowEditorPage: React.FC = () => (
    <DiagramWorkflowProvider>
        <WorkflowEditorPageContent />
    </DiagramWorkflowProvider>
);
