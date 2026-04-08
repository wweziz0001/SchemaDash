import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Diagram } from '@/lib/domain/diagram';
import { useParams, useSearchParams } from 'react-router-dom';
import { canonicalSchemaToDiagram } from '@/lib/schema-sync/canonical-adapters';
import { persistenceClient } from '@/lib/api/persistence-client';
import { deserializeDiagram } from '@/lib/persistence/diagram-serialization';
import {
    diagramWorkflowClient,
    type DiagramWorkflowChangelogRecord,
    type DiagramWorkflowChangelogSummary,
    type DiagramWorkflowRecord,
    type DiagramWorkflowVersionRecord,
    type DiagramWorkflowVersionSummary,
} from '@/lib/api/diagram-workflow-client';
import { buildCompareRenderModel } from '@/lib/diagram-workflow/compare-render-model';
import { getAuthoritativeChangelogCanonicalSchema } from '@/lib/diagram-workflow/changelog-entry-format';
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

const mergeVersionSummaries = ({
    currentVersions,
    nextVersions,
}: {
    currentVersions: DiagramWorkflowVersionSummary[];
    nextVersions: DiagramWorkflowVersionSummary[];
}) => {
    if (nextVersions.length === 0) {
        return currentVersions;
    }

    const versionMap = new Map<string, DiagramWorkflowVersionSummary>();

    currentVersions.forEach((version) => {
        versionMap.set(version.id, version);
    });
    nextVersions.forEach((version) => {
        versionMap.set(version.id, version);
    });

    return [...versionMap.values()].sort(
        (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
    );
};

const mergeChangelogSummaries = ({
    currentEntries,
    nextEntries,
}: {
    currentEntries: DiagramWorkflowChangelogSummary[];
    nextEntries: DiagramWorkflowChangelogSummary[];
}) => {
    if (nextEntries.length === 0) {
        return currentEntries;
    }

    const entryMap = new Map<string, DiagramWorkflowChangelogSummary>();

    currentEntries.forEach((entry) => {
        entryMap.set(entry.id, entry);
    });
    nextEntries.forEach((entry) => {
        entryMap.set(entry.id, entry);
    });

    return [...entryMap.values()].sort(
        (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
    );
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

const buildChangelogDiagram = ({
    workflow,
    entry,
}: {
    workflow?: DiagramWorkflowRecord;
    entry?: DiagramWorkflowChangelogRecord;
}): Diagram | undefined => {
    if (!entry) {
        return undefined;
    }

    if (entry.snapshot.diagramDocument) {
        return deserializeDiagram(entry.snapshot.diagramDocument);
    }

    return canonicalSchemaToDiagram({
        canonicalSchema: entry.snapshot.canonicalSchema,
        diagramId: workflow?.diagramId ?? entry.diagramId,
        diagramName: workflow?.diagramName ?? entry.summary,
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
    const [changelogEntries, setChangelogEntries] = useState<
        DiagramWorkflowChangelogSummary[]
    >([]);
    const [versionRecords, setVersionRecords] = useState<
        Record<string, DiagramWorkflowVersionRecord>
    >({});
    const [changelogRecords, setChangelogRecords] = useState<
        Record<string, DiagramWorkflowChangelogRecord>
    >({});
    const [developmentDiagram, setDevelopmentDiagram] = useState<Diagram>();
    const [loadingWorkflow, setLoadingWorkflow] = useState(false);
    const [loadingVersionRecord, setLoadingVersionRecord] = useState(false);
    const [loadingChangelogRecord, setLoadingChangelogRecord] = useState(false);
    const requestedWorkflow = searchParams.get('workflow');
    const requestedMode =
        requestedWorkflow === 'version' && searchParams.get('versionId')
            ? 'version'
            : requestedWorkflow === 'changelog' &&
                searchParams.get('changelogId')
              ? 'changelog'
              : requestedWorkflow === 'live'
                ? 'live'
                : requestedWorkflow === 'compare'
                  ? 'compare'
                  : 'development';
    const requestedVersionId =
        requestedMode === 'version' ? searchParams.get('versionId') : null;
    const requestedChangelogId =
        requestedMode === 'changelog' ? searchParams.get('changelogId') : null;
    const requestedCompareVersionId =
        requestedMode === 'compare'
            ? searchParams.get('compareVersionId')
            : null;
    const requestedCompareChangelogId =
        requestedMode === 'compare'
            ? searchParams.get('compareChangelogId')
            : null;
    const loading =
        loadingWorkflow || loadingVersionRecord || loadingChangelogRecord;

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
    const setVersionSummaries = useCallback(
        (nextVersions: DiagramWorkflowVersionSummary[]) => {
            const normalizedVersions = [...nextVersions].sort(
                (left, right) =>
                    new Date(right.createdAt).getTime() -
                    new Date(left.createdAt).getTime()
            );

            setVersions(normalizedVersions);
            setVersionRecords((currentRecords) => {
                const allowedIds = new Set(
                    normalizedVersions.map((version) => version.id)
                );

                return Object.fromEntries(
                    Object.entries(currentRecords).filter(([id]) =>
                        allowedIds.has(id)
                    )
                );
            });
        },
        []
    );
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
    const setChangelogSummaryRecords = useCallback(
        (nextEntries: DiagramWorkflowChangelogSummary[]) => {
            const normalizedEntries = [...nextEntries].sort(
                (left, right) =>
                    new Date(right.createdAt).getTime() -
                    new Date(left.createdAt).getTime()
            );

            setChangelogEntries(normalizedEntries);
            setChangelogRecords((currentRecords) => {
                const allowedIds = new Set(
                    normalizedEntries.map((entry) => entry.id)
                );

                return Object.fromEntries(
                    Object.entries(currentRecords).filter(([id]) =>
                        allowedIds.has(id)
                    )
                );
            });
        },
        []
    );
    const setChangelogRecord = useCallback(
        (nextEntry?: DiagramWorkflowChangelogRecord) => {
            if (!nextEntry) {
                return;
            }

            setChangelogRecords((current) => ({
                ...current,
                [nextEntry.id]: nextEntry,
            }));
            setChangelogEntries((currentEntries) =>
                mergeChangelogSummaries({
                    currentEntries,
                    nextEntries: [nextEntry],
                })
            );
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
    const ensureChangelogRecord = useCallback(
        async (entryId: string) => {
            if (!diagramId) {
                return undefined;
            }

            const cached = changelogRecords[entryId];
            if (cached) {
                return cached;
            }

            setLoadingChangelogRecord(true);
            try {
                const response = await diagramWorkflowClient.getChangelogEntry(
                    diagramId,
                    entryId
                );
                setChangelogRecord(response.entry);
                return response.entry;
            } finally {
                setLoadingChangelogRecord(false);
            }
        },
        [changelogRecords, diagramId, setChangelogRecord]
    );

    const refreshWorkflow = useCallback(async () => {
        if (!diagramId) {
            setWorkflowRecord(undefined);
            setVersions([]);
            setVersionRecords({});
            setChangelogEntries([]);
            setChangelogRecords({});
            setDevelopmentDiagram(undefined);
            return;
        }

        setLoadingWorkflow(true);
        try {
            const [
                workflowResponse,
                diagramResponse,
                versionsResponse,
                changelogResponse,
            ] = await Promise.all([
                diagramWorkflowClient.getWorkflow(diagramId),
                persistenceClient.getDiagram(diagramId),
                diagramWorkflowClient.listVersions(diagramId),
                diagramWorkflowClient.listChangelog(diagramId),
            ]);

            setDevelopmentDiagram(deserializeDiagram(diagramResponse.diagram));
            setWorkflowRecord(workflowResponse.workflow);
            setVersions((currentVersions) =>
                mergeVersionSummaries({
                    currentVersions,
                    nextVersions: versionsResponse.items,
                })
            );
            setChangelogEntries((currentEntries) =>
                mergeChangelogSummaries({
                    currentEntries,
                    nextEntries: changelogResponse.items,
                })
            );
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
    useEffect(() => {
        if (!requestedChangelogId) {
            return;
        }

        void ensureChangelogRecord(requestedChangelogId);
    }, [ensureChangelogRecord, requestedChangelogId]);
    useEffect(() => {
        if (!requestedCompareChangelogId) {
            return;
        }

        void ensureChangelogRecord(requestedCompareChangelogId);
    }, [ensureChangelogRecord, requestedCompareChangelogId]);

    const setActiveMode = useCallback(
        (mode: DiagramWorkflowMode) => {
            const nextParams = new URLSearchParams(searchParams);

            if (mode === 'live') {
                nextParams.set('workflow', 'live');
            } else if (mode === 'compare') {
                nextParams.set('workflow', 'compare');
                nextParams.delete('compareVersionId');
                nextParams.delete('compareChangelogId');
                nextParams.delete('versionId');
                nextParams.delete('changelogId');
            } else if (mode === 'version' && nextParams.get('versionId')) {
                nextParams.set('workflow', 'version');
            } else if (mode === 'changelog' && nextParams.get('changelogId')) {
                nextParams.set('workflow', 'changelog');
            } else {
                nextParams.delete('workflow');
            }

            if (mode !== 'compare') {
                nextParams.delete('compareVersionId');
                nextParams.delete('compareChangelogId');
            }

            if (mode !== 'version') {
                nextParams.delete('versionId');
            }

            if (mode !== 'changelog') {
                nextParams.delete('changelogId');
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
            nextParams.delete('compareChangelogId');
            nextParams.delete('changelogId');
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams]
    );
    const openChangelogEntry = useCallback(
        (entryId: string) => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('workflow', 'changelog');
            nextParams.set('changelogId', entryId);
            nextParams.delete('compareVersionId');
            nextParams.delete('compareChangelogId');
            nextParams.delete('versionId');
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams]
    );

    const compareVersionToDevelopment = useCallback(
        (versionId: string) => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('workflow', 'compare');
            nextParams.set('compareVersionId', versionId);
            nextParams.delete('compareChangelogId');
            nextParams.delete('versionId');
            nextParams.delete('changelogId');
            setSearchParams(nextParams, { replace: true });
        },
        [searchParams, setSearchParams]
    );
    const compareChangelogToDevelopment = useCallback(
        (entryId: string) => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set('workflow', 'compare');
            nextParams.set('compareChangelogId', entryId);
            nextParams.delete('compareVersionId');
            nextParams.delete('versionId');
            nextParams.delete('changelogId');
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
    const selectedChangelogEntry = requestedChangelogId
        ? changelogRecords[requestedChangelogId]
        : undefined;
    const compareVersion = requestedCompareVersionId
        ? versionRecords[requestedCompareVersionId]
        : undefined;
    const compareChangelogEntry = requestedCompareChangelogId
        ? changelogRecords[requestedCompareChangelogId]
        : undefined;
    const versionDiagram = useMemo(
        () =>
            buildVersionDiagram({
                workflow,
                version: selectedVersion,
            }),
        [selectedVersion, workflow]
    );
    const changelogDiagram = useMemo(
        () =>
            buildChangelogDiagram({
                workflow,
                entry: selectedChangelogEntry,
            }),
        [selectedChangelogEntry, workflow]
    );
    const liveModeEnabled = !!workflow?.liveSnapshotId;
    const compareSourceKind = requestedCompareChangelogId
        ? 'changelog'
        : requestedCompareVersionId
          ? 'version'
          : workflow?.liveSnapshot
            ? 'live'
            : null;
    const compareBaselineSchema = requestedCompareChangelogId
        ? getAuthoritativeChangelogCanonicalSchema(compareChangelogEntry)
        : requestedCompareVersionId
          ? getAuthoritativeVersionCanonicalSchema(compareVersion)
          : workflow?.liveSnapshot?.canonicalSchema;
    const compareModeEnabled = !!compareBaselineSchema && !!developmentDiagram;
    const compareRenderModel = useMemo(
        () =>
            compareBaselineSchema && developmentDiagram
                ? buildCompareRenderModel({
                      baselineSchema: compareBaselineSchema,
                      developmentDiagram,
                  })
                : undefined,
        [compareBaselineSchema, developmentDiagram]
    );
    const activeMode =
        requestedMode === 'version' && versionDiagram
            ? 'version'
            : requestedMode === 'changelog' && changelogDiagram
              ? 'changelog'
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
            setVersions: setVersionSummaries,
            versionRecords,
            ensureVersionRecord,
            changelogEntries,
            setChangelogEntries: setChangelogSummaryRecords,
            upsertChangelogEntry: setChangelogRecord,
            changelogRecords,
            ensureChangelogRecord,
            developmentDiagram,
            setDevelopmentDiagram: setDevelopmentDiagramRecord,
            loading,
            requestedMode,
            activeMode,
            liveDiagram,
            versionDiagram,
            changelogDiagram,
            compareRenderModel,
            compareSourceKind,
            compareVersion,
            compareChangelogEntry,
            selectedVersion,
            selectedChangelogEntry,
            liveModeEnabled,
            compareModeEnabled,
            refreshWorkflow,
            setWorkflowRecord,
            setActiveMode,
            openVersion,
            openChangelogEntry,
            compareVersionToDevelopment,
            compareChangelogToDevelopment,
        }),
        [
            activeMode,
            changelogDiagram,
            changelogEntries,
            changelogRecords,
            compareModeEnabled,
            compareRenderModel,
            compareChangelogEntry,
            compareSourceKind,
            compareVersion,
            developmentDiagram,
            diagramId,
            ensureChangelogRecord,
            ensureVersionRecord,
            liveDiagram,
            liveModeEnabled,
            loading,
            openChangelogEntry,
            openVersion,
            compareChangelogToDevelopment,
            compareVersionToDevelopment,
            refreshWorkflow,
            requestedMode,
            setActiveMode,
            setChangelogRecord,
            setChangelogSummaryRecords,
            setDevelopmentDiagramRecord,
            setVersionSummaries,
            setWorkflowRecord,
            selectedChangelogEntry,
            selectedVersion,
            versionDiagram,
            versionRecords,
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
