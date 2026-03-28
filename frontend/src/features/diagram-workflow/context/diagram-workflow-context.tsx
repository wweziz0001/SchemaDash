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
    diagramWorkflowClient,
    type DiagramWorkflowRecord,
} from '../api/diagram-workflow-client';

export type DiagramWorkflowMode = 'development' | 'live';

export interface DiagramWorkflowContextValue {
    diagramId?: string;
    workflow?: DiagramWorkflowRecord;
    loading: boolean;
    requestedMode: DiagramWorkflowMode;
    activeMode: DiagramWorkflowMode;
    liveDiagram?: Diagram;
    liveModeEnabled: boolean;
    refreshWorkflow: () => Promise<void>;
    setActiveMode: (mode: DiagramWorkflowMode) => void;
}

const DiagramWorkflowContext = createContext<
    DiagramWorkflowContextValue | undefined
>(undefined);

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
    const [loading, setLoading] = useState(false);
    const requestedMode =
        searchParams.get('workflow') === 'live' ? 'live' : 'development';

    const refreshWorkflow = useCallback(async () => {
        if (!diagramId) {
            setWorkflow(undefined);
            return;
        }

        setLoading(true);
        try {
            const response = await diagramWorkflowClient.getWorkflow(diagramId);
            setWorkflow(response.workflow);
        } finally {
            setLoading(false);
        }
    }, [diagramId]);

    useEffect(() => {
        void refreshWorkflow();
    }, [refreshWorkflow]);

    const setActiveMode = useCallback(
        (mode: DiagramWorkflowMode) => {
            const nextParams = new URLSearchParams(searchParams);

            if (mode === 'live') {
                nextParams.set('workflow', 'live');
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
    const liveModeEnabled = !!workflow?.liveSnapshot;
    const activeMode =
        requestedMode === 'live' && liveModeEnabled ? 'live' : 'development';

    const value = useMemo<DiagramWorkflowContextValue>(
        () => ({
            diagramId,
            workflow,
            loading,
            requestedMode,
            activeMode,
            liveDiagram,
            liveModeEnabled,
            refreshWorkflow,
            setActiveMode,
        }),
        [
            activeMode,
            diagramId,
            liveDiagram,
            liveModeEnabled,
            loading,
            refreshWorkflow,
            requestedMode,
            setActiveMode,
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
