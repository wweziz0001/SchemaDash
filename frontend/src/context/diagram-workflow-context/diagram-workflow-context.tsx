import { createContext, useContext } from 'react';
import type { Diagram } from '@/lib/domain/diagram';
import type {
    DiagramWorkflowRecord,
    DiagramWorkflowVersionRecord,
    DiagramWorkflowVersionSummary,
} from '@/lib/api/diagram-workflow-client';
import type { CompareRenderModel } from '@/lib/diagram-workflow/compare-render-model';

export type DiagramWorkflowMode =
    | 'development'
    | 'live'
    | 'compare'
    | 'version';

export interface DiagramWorkflowContextValue {
    diagramId?: string;
    workflow?: DiagramWorkflowRecord;
    versions: DiagramWorkflowVersionSummary[];
    developmentDiagram?: Diagram;
    setDevelopmentDiagram: (diagram?: Diagram) => void;
    loading: boolean;
    requestedMode: DiagramWorkflowMode;
    activeMode: DiagramWorkflowMode;
    liveDiagram?: Diagram;
    versionDiagram?: Diagram;
    compareRenderModel?: CompareRenderModel;
    compareSourceKind: 'live' | 'version' | null;
    compareVersion?: DiagramWorkflowVersionRecord;
    selectedVersion?: DiagramWorkflowVersionRecord;
    liveModeEnabled: boolean;
    compareModeEnabled: boolean;
    refreshWorkflow: () => Promise<void>;
    setWorkflowRecord: (workflow?: DiagramWorkflowRecord) => void;
    setActiveMode: (mode: DiagramWorkflowMode) => void;
    openVersion: (versionId: string) => void;
    compareVersionToDevelopment: (versionId: string) => void;
}

export const diagramWorkflowContext = createContext<
    DiagramWorkflowContextValue | undefined
>(undefined);

export const useOptionalDiagramWorkflow = () =>
    useContext(diagramWorkflowContext);
