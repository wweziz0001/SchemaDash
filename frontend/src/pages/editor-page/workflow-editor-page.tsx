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
        compareRenderModel,
        diagramId,
        liveDiagram,
        loading,
        requestedMode,
        workflow,
    } = useDiagramWorkflow();

    if (diagramId && requestedMode !== 'development' && loading && !workflow) {
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
            key={`${diagramId ?? 'workspace'}:${activeMode}:${workflow?.liveSnapshotId ?? 'none'}:${compareRenderModel?.compareResult.summary.tables.total ?? 0}`}
            initialDiagram={
                activeMode === 'live'
                    ? liveDiagram
                    : activeMode === 'compare'
                      ? compareRenderModel?.diagram
                      : undefined
            }
            readonly={activeMode === 'live' || activeMode === 'compare'}
            disableAuthoritativeSync={
                activeMode === 'live' || activeMode === 'compare'
            }
        />
    );
};

export const WorkflowEditorPage: React.FC = () => (
    <DiagramWorkflowProvider>
        <WorkflowEditorPageContent />
    </DiagramWorkflowProvider>
);
