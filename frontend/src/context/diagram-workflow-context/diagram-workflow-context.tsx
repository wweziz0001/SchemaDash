import { createContext, useContext } from 'react';
import type { Diagram } from '@/lib/domain/diagram';
import type {
    DiagramWorkflowChangelogRecord,
    DiagramWorkflowChangelogSummary,
    DiagramWorkflowCompareSourceKind,
    DiagramWorkflowRecord,
    DiagramWorkflowVersionRecord,
    DiagramWorkflowVersionSummary,
} from '@/lib/api/diagram-workflow-client';
import type { CompareRenderModel } from '@/lib/diagram-workflow/compare-render-model';

export type DiagramWorkflowMode =
    | 'development'
    | 'live'
    | 'compare'
    | 'version'
    | 'changelog';

export interface DiagramWorkflowContextValue {
    diagramId?: string;
    workflow?: DiagramWorkflowRecord;
    versions: DiagramWorkflowVersionSummary[];
    setVersions: (versions: DiagramWorkflowVersionSummary[]) => void;
    versionRecords: Record<string, DiagramWorkflowVersionRecord>;
    ensureVersionRecord: (
        versionId: string
    ) => Promise<DiagramWorkflowVersionRecord | undefined>;
    changelogEntries: DiagramWorkflowChangelogSummary[];
    setChangelogEntries: (entries: DiagramWorkflowChangelogSummary[]) => void;
    upsertChangelogEntry: (entry: DiagramWorkflowChangelogRecord) => void;
    changelogRecords: Record<string, DiagramWorkflowChangelogRecord>;
    ensureChangelogRecord: (
        entryId: string
    ) => Promise<DiagramWorkflowChangelogRecord | undefined>;
    developmentDiagram?: Diagram;
    setDevelopmentDiagram: (diagram?: Diagram) => void;
    loading: boolean;
    requestedMode: DiagramWorkflowMode;
    activeMode: DiagramWorkflowMode;
    liveDiagram?: Diagram;
    versionDiagram?: Diagram;
    changelogDiagram?: Diagram;
    compareRenderModel?: CompareRenderModel;
    compareSourceKind: DiagramWorkflowCompareSourceKind | null;
    compareVersion?: DiagramWorkflowVersionRecord;
    compareChangelogEntry?: DiagramWorkflowChangelogRecord;
    selectedVersion?: DiagramWorkflowVersionRecord;
    selectedChangelogEntry?: DiagramWorkflowChangelogRecord;
    liveModeEnabled: boolean;
    compareModeEnabled: boolean;
    refreshWorkflow: () => Promise<void>;
    setWorkflowRecord: (workflow?: DiagramWorkflowRecord) => void;
    setActiveMode: (mode: DiagramWorkflowMode) => void;
    openVersion: (versionId: string) => void;
    openChangelogEntry: (entryId: string) => void;
    compareVersionToDevelopment: (versionId: string) => void;
    compareChangelogToDevelopment: (entryId: string) => void;
}

export const diagramWorkflowContext = createContext<
    DiagramWorkflowContextValue | undefined
>(undefined);

export const useOptionalDiagramWorkflow = () =>
    useContext(diagramWorkflowContext);
