import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Diagram } from '@/lib/domain/diagram';
import { useParams, useSearchParams } from 'react-router-dom';
import { canonicalSchemaToDiagram } from '@/lib/schema-sync/canonical-adapters';
import {
    deserializeDiagram,
    persistenceClient,
} from '@/features/persistence/api/persistence-client';
import {
    diagramWorkflowClient,
    type DiagramWorkflowRecord,
    type DiagramWorkflowVersionRecord,
    type DiagramWorkflowVersionSummary,
} from '@/lib/api/diagram-workflow-client';
import { buildCompareRenderModel } from '@/lib/diagram-workflow/compare-render-model';
import { getAuthoritativeVersionCanonicalSchema } from '@/lib/diagram-workflow/version-canonical';
import {
    type DiagramWorkflowContextValue,
    type DiagramWorkflowMode,
    diagramWorkflowContext,
} from './diagram-workflow-context';

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

const buildVersionDiagram = ({
    workflow,
    version,
}: {
    workflow?: DiagramWorkflowRecord;
    version?: DiagramWorkflowVersionRecord;
}): Diagram | undefined => {
    if (!version) {
        return undefined;
    }

    if (version.snapshot.diagramDocument) {
        return deserializeDiagram(version.snapshot.diagramDocument);
    }

    return canonicalSchemaToDiagram({
        canonicalSchema: version.snapshot.canonicalSchema,
        diagramId: workflow?.diagramId ?? version.diagramId,
        diagramName:
            workflow?.diagramName ?? version.name ?? version.versionLabel,
    });
};

export const DiagramWorkflowProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { diagramId } = useParams<{ diagramId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [workflow, setWorkflow] = useState<DiagramWorkflowRecord>();
    const [versions, setVersions] = useState<DiagramWorkflowVersionSummary[]>(
        []
    );
    const [versionRecords, setVersionRecords] = useState<
        Record<string, DiagramWorkflowVersionRecord>
    >({});
    const [developmentDiagram, setDevelopmentDiagram] = useState<Diagram>();
    const [loadingWorkflow, setLoadingWorkflow] = useState(false);
    const [loadingVersionRecord, setLoadingVersionRecord] = useState(false);
    const requestedWorkflow = searchParams.get('workflow');
    const requestedMode =
        requestedWorkflow === 'version' && searchParams.get('versionId')
            ? 'version'
            : requestedWorkflow === 'live'
              ? 'live'
              : requestedWorkflow === 'compare'
                ? 'compare'
                : 'development';
    const requestedVersionId =
        requestedMode === 'version' ? searchParams.get('versionId') : null;
    const requestedCompareVersionId =
        requestedMode === 'compare'
            ? searchParams.get('compareVersionId')
            : null;
    const loading = loadingWorkflow || loadingVersionRecord;

    const setWorkflowRecord = useCallback(
        (nextWorkflow?: DiagramWorkflowRecord) => {
            setWorkflow((current) =>
                mergeWorkflowRecord(current, nextWorkflow)
            );
        },
        []
    );
    const setDevelopmentDiagramRecord = useCallback((nextDiagram?: Diagram) => {
        setDevelopmentDiagram(nextDiagram);
    }, []);
    const setVersionRecord = useCallback(
        (nextVersion?: DiagramWorkflowVersionRecord) => {
            if (!nextVersion) {
                return;
            }

            setVersionRecords((current) => ({
                ...current,
                [nextVersion.id]: nextVersion,
            }));
        },
        []
    );

    const ensureVersionRecord = useCallback(
        async (versionId: string) => {
            if (!diagramId) {
                return undefined;
            }

            const cached = versionRecords[versionId];
            if (cached) {
                return cached;
            }

            setLoadingVersionRecord(true);
            try {
                const response = await diagramWorkflowClient.getVersion(
                    diagramId,
                    versionId
                );
                setVersionRecord(response.version);
                return response.version;
            } finally {
                setLoadingVersionRecord(false);
            }
        },
        [diagramId, setVersionRecord, versionRecords]
    );

    const refreshWorkflow = useCallback(async () => {
        if (!diagramId) {
            setWorkflowRecord(undefined);
            setVersions([]);
            setVersionRecords({});
            setDevelopmentDiagram(undefined);
            return;
        }

        setLoadingWorkflow(true);
        try {
            const [workflowResponse, diagramResponse, versionsResponse] =
                await Promise.all([
                    diagramWorkflowClient.getWorkflow(diagramId),
                    persistenceClient.getDiagram(diagramId),
                    diagramWorkflowClient.listVersions(diagramId),
                ]);

            setDevelopmentDiagram(deserializeDiagram(diagramResponse.diagram));
            setWorkflowRecord(workflowResponse.workflow);
            setVersions(versionsResponse.items);
        } finally {
            setLoadingWorkflow(false);
        }
    }, [diagramId, setWorkflowRecord]);

    useEffect(() => {
        void refreshWorkflow();
    }, [refreshWorkflow]);

    useEffect(() => {
        if (!requestedVersionId) {
            return;
        }

        void ensureVersionRecord(requestedVersionId);
    }, [ensureVersionRecord, requestedVersionId]);

    useEffect(() => {
        if (!requestedCompareVersionId) {
            return;
        }

        void ensureVersionRecord(requestedCompareVersionId);
    }, [ensureVersionRecord, requestedCompareVersionId]);

    const setActiveMode = useCallback(
        (mode: DiagramWorkflowMode) => {
            const nextParams = new URLSearchParams(searchParams);

            if (mode === 'live') {
                nextParams.set('workflow', 'live');
            } else if (mode === 'compare') {
                nextParams.set('workflow', 'compare');
                nextParams.delete('compareVersionId');
                nextParams.delete('versionId');
            } else if (mode === 'version' && nextParams.get('versionId')) {
                nextParams.set('workflow', 'version');
            } else {
                nextParams.delete('workflow');
            }

            if (mode !== 'compare') {
                nextParams.delete('compareVersionId');
            }

            if (mode !== 'version') {
                nextParams.delete('versionId');
            }

            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams]
    );

    const openVersion = useCallback(
        (versionId: string) => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('workflow', 'version');
            nextParams.set('versionId', versionId);
            nextParams.delete('compareVersionId');
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams]
    );

    const compareVersionToDevelopment = useCallback(
        (versionId: string) => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('workflow', 'compare');
            nextParams.set('compareVersionId', versionId);
            nextParams.delete('versionId');
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams]
    );

    const liveDiagram = useMemo(
        () => (workflow ? buildLiveDiagram(workflow) : undefined),
        [workflow]
    );
    const selectedVersion = requestedVersionId
        ? versionRecords[requestedVersionId]
        : undefined;
    const compareVersion = requestedCompareVersionId
        ? versionRecords[requestedCompareVersionId]
        : undefined;
    const versionDiagram = useMemo(
        () =>
            buildVersionDiagram({
                workflow,
                version: selectedVersion,
            }),
        [selectedVersion, workflow]
    );
    const liveModeEnabled = !!workflow?.liveSnapshotId;
    const compareSourceKind = requestedCompareVersionId
        ? 'version'
        : workflow?.liveSnapshot
          ? 'live'
          : null;
    const compareBaselineSchema = requestedCompareVersionId
        ? getAuthoritativeVersionCanonicalSchema(compareVersion)
        : workflow?.liveSnapshot?.canonicalSchema;
    const compareModeEnabled = !!compareBaselineSchema && !!developmentDiagram;
    const compareRenderModel = useMemo(
        () =>
            requestedMode === 'compare' &&
            compareBaselineSchema &&
            developmentDiagram
                ? buildCompareRenderModel({
                      baselineSchema: compareBaselineSchema,
                      developmentDiagram,
                  })
                : undefined,
        [compareBaselineSchema, developmentDiagram, requestedMode]
    );
    const activeMode =
        requestedMode === 'version' && versionDiagram
            ? 'version'
            : requestedMode === 'compare' && compareModeEnabled
              ? 'compare'
              : requestedMode === 'live' && liveModeEnabled
                ? 'live'
                : 'development';

    const value = useMemo<DiagramWorkflowContextValue>(
        () => ({
            diagramId,
            workflow,
            versions,
            developmentDiagram,
            setDevelopmentDiagram: setDevelopmentDiagramRecord,
            loading,
            requestedMode,
            activeMode,
            liveDiagram,
            versionDiagram,
            compareRenderModel,
            compareSourceKind,
            compareVersion,
            selectedVersion,
            liveModeEnabled,
            compareModeEnabled,
            refreshWorkflow,
            setWorkflowRecord,
            setActiveMode,
            openVersion,
            compareVersionToDevelopment,
        }),
        [
            activeMode,
            compareModeEnabled,
            compareRenderModel,
            compareSourceKind,
            compareVersion,
            developmentDiagram,
            diagramId,
            liveDiagram,
            liveModeEnabled,
            loading,
            openVersion,
            compareVersionToDevelopment,
            refreshWorkflow,
            requestedMode,
            setActiveMode,
            setDevelopmentDiagramRecord,
            setWorkflowRecord,
            selectedVersion,
            versionDiagram,
            versions,
            workflow,
        ]
    );

    return (
        <diagramWorkflowContext.Provider value={value}>
            {children}
        </diagramWorkflowContext.Provider>
    );
};
