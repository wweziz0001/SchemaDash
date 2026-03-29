/* eslint-disable react-refresh/only-export-components */
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import type { Diagram } from '@/lib/domain/diagram';
import { useParams, useSearchParams } from 'react-router-dom';
import { canonicalSchemaToDiagram } from '@/features/schema-sync/lib/canonical-adapters';
import {
    deserializeDiagram,
    persistenceClient,
} from '@/features/persistence/api/persistence-client';
import {
    diagramWorkflowClient,
    type DiagramWorkflowRecord,
} from '../api/diagram-workflow-client';
import {
    buildCompareRenderModel,
    type CompareRenderModel,
} from '../lib/compare-render-model';

export type DiagramWorkflowMode = 'development' | 'live' | 'compare';

export interface DiagramWorkflowContextValue {
    diagramId?: string;
    workflow?: DiagramWorkflowRecord;
    developmentDiagram?: Diagram;
    loading: boolean;
    requestedMode: DiagramWorkflowMode;
    activeMode: DiagramWorkflowMode;
    liveDiagram?: Diagram;
    compareRenderModel?: CompareRenderModel;
    liveModeEnabled: boolean;
    compareModeEnabled: boolean;
    refreshWorkflow: () => Promise<void>;
    setWorkflowRecord: (workflow?: DiagramWorkflowRecord) => void;
    setActiveMode: (mode: DiagramWorkflowMode) => void;
}

const DiagramWorkflowContext = createContext<
    DiagramWorkflowContextValue | undefined
>(undefined);

const mergeWorkflowRecord = (
    current: DiagramWorkflowRecord | undefined,
    next: DiagramWorkflowRecord | undefined
) => {
    if (!next) {
        return next;
    }

    if (
        next.liveSnapshot ||
        !next.liveSnapshotId ||
        current?.liveSnapshot?.id !== next.liveSnapshotId
    ) {
        return next;
    }

    return {
        ...next,
        liveSnapshot: current.liveSnapshot,
    };
};

const buildLiveDiagram = (
    workflow: DiagramWorkflowRecord
): Diagram | undefined => {
    if (!workflow.liveSnapshot) {
        return undefined;
    }

    return canonicalSchemaToDiagram({
        canonicalSchema: workflow.liveSnapshot.canonicalSchema,
        diagramId: workflow.diagramId,
        diagramName: workflow.diagramName,
        schemaSync: {
            connectionId: workflow.connectionId ?? undefined,
            importedSchemas: workflow.importedSchemas,
            baselineFingerprint: workflow.liveFingerprint ?? undefined,
            lastImportedAt: workflow.lastSyncedAt ?? undefined,
        },
    });
};

export const DiagramWorkflowProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { diagramId } = useParams<{ diagramId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [workflow, setWorkflow] = useState<DiagramWorkflowRecord>();
    const [developmentDiagram, setDevelopmentDiagram] = useState<Diagram>();
    const [loading, setLoading] = useState(false);
    const requestedMode =
        searchParams.get('workflow') === 'live'
            ? 'live'
            : searchParams.get('workflow') === 'compare'
              ? 'compare'
              : 'development';

    const setWorkflowRecord = useCallback(
        (nextWorkflow?: DiagramWorkflowRecord) => {
            setWorkflow((current) =>
                mergeWorkflowRecord(current, nextWorkflow)
            );
        },
        []
    );

    const refreshWorkflow = useCallback(async () => {
        if (!diagramId) {
            setWorkflowRecord(undefined);
            setDevelopmentDiagram(undefined);
            return;
        }

        setLoading(true);
        try {
            const [workflowResponse, diagramResponse] = await Promise.all([
                diagramWorkflowClient.getWorkflow(diagramId),
                persistenceClient.getDiagram(diagramId),
            ]);

            setDevelopmentDiagram(deserializeDiagram(diagramResponse.diagram));
            setWorkflowRecord(workflowResponse.workflow);
        } finally {
            setLoading(false);
        }
    }, [diagramId, setWorkflowRecord]);

    useEffect(() => {
        void refreshWorkflow();
    }, [refreshWorkflow]);

    const setActiveMode = useCallback(
        (mode: DiagramWorkflowMode) => {
            const nextParams = new URLSearchParams(searchParams);

            if (mode === 'live') {
                nextParams.set('workflow', 'live');
            } else if (mode === 'compare') {
                nextParams.set('workflow', 'compare');
            } else {
                nextParams.delete('workflow');
            }

            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams]
    );

    const liveDiagram = useMemo(
        () => (workflow ? buildLiveDiagram(workflow) : undefined),
        [workflow]
    );
    const liveModeEnabled = !!workflow?.liveSnapshotId;
    const compareModeEnabled = !!workflow?.liveSnapshot && !!developmentDiagram;
    const compareRenderModel = useMemo(
        () =>
            requestedMode === 'compare' &&
            workflow?.liveSnapshot &&
            developmentDiagram
                ? buildCompareRenderModel({
                      baselineSchema: workflow.liveSnapshot.canonicalSchema,
                      developmentDiagram,
                  })
                : undefined,
        [developmentDiagram, requestedMode, workflow?.liveSnapshot]
    );
    const activeMode =
        requestedMode === 'compare' && compareModeEnabled
            ? 'compare'
            : requestedMode === 'live' && liveModeEnabled
              ? 'live'
              : 'development';

    const value = useMemo<DiagramWorkflowContextValue>(
        () => ({
            diagramId,
            workflow,
            developmentDiagram,
            loading,
            requestedMode,
            activeMode,
            liveDiagram,
            compareRenderModel,
            liveModeEnabled,
            compareModeEnabled,
            refreshWorkflow,
            setWorkflowRecord,
            setActiveMode,
        }),
        [
            activeMode,
            compareModeEnabled,
            compareRenderModel,
            developmentDiagram,
            diagramId,
            liveDiagram,
            liveModeEnabled,
            loading,
            refreshWorkflow,
            requestedMode,
            setActiveMode,
            setWorkflowRecord,
            workflow,
        ]
    );

    return (
        <DiagramWorkflowContext.Provider value={value}>
            {children}
        </DiagramWorkflowContext.Provider>
    );
};

export const useDiagramWorkflow = () => {
    const context = useContext(DiagramWorkflowContext);

    if (!context) {
        throw new Error(
            'useDiagramWorkflow must be used within DiagramWorkflowProvider'
        );
    }

    return context;
};

export const useOptionalDiagramWorkflow = () =>
    useContext(DiagramWorkflowContext);
