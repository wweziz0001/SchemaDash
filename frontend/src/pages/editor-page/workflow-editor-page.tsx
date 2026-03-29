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
        compareSourceKind,
        compareVersion,
        selectedVersion,
        versionDiagram,
        workflow,
    } = useDiagramWorkflow();

    const waitingForReadonlyTarget =
        (requestedMode === 'version' && !selectedVersion) ||
        (requestedMode === 'compare' &&
            compareSourceKind === 'version' &&
            !compareVersion) ||
        (requestedMode !== 'version' && !workflow);

    if (
        diagramId &&
        requestedMode !== 'development' &&
        loading &&
        waitingForReadonlyTarget
    ) {
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
                    : activeMode === 'version'
                      ? versionDiagram
                      : activeMode === 'compare'
                        ? compareRenderModel?.diagram
                        : undefined
            }
            readonly={
                activeMode === 'live' ||
                activeMode === 'compare' ||
                activeMode === 'version'
            }
            disableAuthoritativeSync={
                activeMode === 'live' ||
                activeMode === 'compare' ||
                activeMode === 'version'
            }
        />
    );
};

export const WorkflowEditorPage: React.FC = () => (
    <DiagramWorkflowProvider>
        <WorkflowEditorPageContent />
    </DiagramWorkflowProvider>
);
