import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
    ApplySchemaResponse,
    ChangePlan,
    ConnectionSummary,
    ConnectionTestResponse,
    ConnectionUpsert,
} from '@schemadash/schema-sync-core';
import { schemaSyncClient } from '../api/schema-sync-client';
import { diagramToCanonicalSchema } from '../lib/canonical-adapters';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useToast } from '@/components/toast/use-toast';
import {
    SchemaSyncContext,
    type SchemaSyncContextValue,
} from './schema-sync-context-object';
import { diagramWorkflowClient } from '@/lib/api/diagram-workflow-client';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';

export const SchemaSyncProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [open, setOpen] = useState(false);
    const [connections, setConnections] = useState<ConnectionSummary[]>([]);
    const [connectionsLoading, setConnectionsLoading] = useState(false);
    const [selectedConnectionId, setSelectedConnectionIdState] = useState<
        string | undefined
    >();
    const [previewPlan, setPreviewPlan] = useState<ChangePlan>();
    const [applyResult, setApplyResult] = useState<ApplySchemaResponse>();
    const [lastConnectionTest, setLastConnectionTest] =
        useState<ConnectionTestResponse>();
    const { currentDiagram, updateDiagramData } = useSchemaDash();
    const { toast } = useToast();
    const workflow = useOptionalDiagramWorkflow();

    const refreshConnections = useCallback(async () => {
        setConnectionsLoading(true);
        try {
            const response = await schemaSyncClient.getConnections();
            setConnections(response.items);
            setSelectedConnectionIdState((current) => {
                return (
                    response.items.find(
                        (connection) => connection.id === current
                    )?.id ?? response.items[0]?.id
                );
            });
        } finally {
            setConnectionsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshConnections();
    }, [refreshConnections]);

    const setSelectedConnectionId = useCallback((connectionId?: string) => {
        setSelectedConnectionIdState(connectionId);
    }, []);

    const updateDiagramSyncMetadata = useCallback(
        async (
            attributes: Partial<NonNullable<typeof currentDiagram.schemaSync>>
        ) => {
            await updateDiagramData(
                {
                    ...currentDiagram,
                    schemaSync: {
                        ...(currentDiagram.schemaSync ?? {}),
                        ...attributes,
                    },
                    updatedAt: new Date(),
                },
                { forceUpdateStorage: true }
            );
        },
        [currentDiagram, updateDiagramData]
    );

    const saveConnection = useCallback(
        async (payload: ConnectionUpsert, connectionId?: string) => {
            if (connectionId) {
                const response = await schemaSyncClient.updateConnection(
                    connectionId,
                    payload
                );
                setSelectedConnectionIdState(response.connection.id);
                toast({
                    title: 'Connection updated',
                    description: `${response.connection.name} is ready to use.`,
                });
            } else {
                const response =
                    await schemaSyncClient.createConnection(payload);
                setSelectedConnectionIdState(response.connection.id);
                toast({
                    title: 'Connection saved',
                    description: `${response.connection.name} is ready to use.`,
                });
            }

            await refreshConnections();
        },
        [refreshConnections, toast]
    );

    const deleteConnection = useCallback(
        async (connectionId: string) => {
            await schemaSyncClient.deleteConnection(connectionId);
            setSelectedConnectionIdState((current) =>
                current === connectionId ? undefined : current
            );
            setPreviewPlan(undefined);
            setApplyResult(undefined);
            toast({
                title: 'Connection removed',
            });
            await refreshConnections();
        },
        [refreshConnections, toast]
    );

    const testConnectionDraft = useCallback(
        async (payload: ConnectionUpsert, connectionId?: string) => {
            const result =
                connectionId && payload.secret.password.length === 0
                    ? await schemaSyncClient.testConnection({
                          connectionId,
                      })
                    : await schemaSyncClient.testConnection({
                          connection: payload,
                      });
            setLastConnectionTest(result);
        },
        []
    );

    const syncLiveDatabase = useCallback(
        async ({
            connectionId,
            schemas,
        }: {
            connectionId: string;
            schemas: string[];
        }) => {
            if (!currentDiagram.id) {
                throw new Error('Open a diagram before syncing live state.');
            }

            const normalizedSchemas = schemas.length > 0 ? schemas : ['public'];

            await diagramWorkflowClient.bindConnection(currentDiagram.id, {
                connectionId,
                importedSchemas: normalizedSchemas,
            });
            const response = await diagramWorkflowClient.refreshLiveSnapshot(
                currentDiagram.id
            );

            await updateDiagramSyncMetadata({
                connectionId: response.compatibilitySync.connectionId,
                baselineSnapshotId:
                    response.compatibilitySync.baselineSnapshotId,
                baselineFingerprint:
                    response.compatibilitySync.baselineFingerprint,
                importedSchemas: response.compatibilitySync.importedSchemas,
                lastImportedAt: response.compatibilitySync.lastImportedAt,
                lastPreviewPlanId: null,
                lastPreviewedAt: null,
                lastAuditId: null,
                lastPostApplySnapshotId: null,
            });

            setSelectedConnectionIdState(connectionId);
            setPreviewPlan(undefined);
            setApplyResult(undefined);
            workflow?.setWorkflowRecord(response.workflow);
            toast({
                title: 'Live database synced',
                description:
                    'Development stayed editable while Live Database updated separately.',
            });
        },
        [currentDiagram.id, toast, updateDiagramSyncMetadata, workflow]
    );

    const refreshFromDatabase = useCallback(async () => {
        const connectionId =
            currentDiagram.schemaSync?.connectionId ?? selectedConnectionId;
        if (!connectionId) {
            throw new Error('Choose a connection before refreshing.');
        }
        await syncLiveDatabase({
            connectionId,
            schemas: currentDiagram.schemaSync?.importedSchemas ?? ['public'],
        });
    }, [currentDiagram.schemaSync, selectedConnectionId, syncLiveDatabase]);

    const previewChanges = useCallback(async () => {
        if (!currentDiagram.schemaSync?.baselineSnapshotId) {
            throw new Error(
                'Import a live baseline before previewing changes.'
            );
        }

        const targetSchema = diagramToCanonicalSchema(currentDiagram);
        const response = await schemaSyncClient.previewChanges({
            baselineSnapshotId: currentDiagram.schemaSync.baselineSnapshotId,
            targetSchema,
        });
        setPreviewPlan(response.plan);
        setApplyResult(undefined);
        await updateDiagramSyncMetadata({
            lastPreviewPlanId: response.plan.id,
            lastPreviewedAt: new Date().toISOString(),
        });
        toast({
            title: 'Preview generated',
            description: `${response.plan.summary.totalChanges} change(s) analyzed.`,
        });
    }, [currentDiagram, toast, updateDiagramSyncMetadata]);

    const applyChanges = useCallback(
        async (confirmationText: string) => {
            if (!previewPlan) {
                throw new Error('Preview changes before applying them.');
            }

            const result = await schemaSyncClient.applyChanges({
                planId: previewPlan.id,
                destructiveApproval: {
                    confirmed: true,
                    confirmationText,
                },
            });
            setApplyResult(result);
            const nextImportedAt = new Date().toISOString();
            await updateDiagramSyncMetadata(
                result.status === 'succeeded' && result.postApplySnapshotId
                    ? {
                          baselineSnapshotId: result.postApplySnapshotId,
                          baselineFingerprint: previewPlan.targetFingerprint,
                          lastImportedAt: nextImportedAt,
                          lastPreviewPlanId: null,
                          lastAuditId: result.auditId,
                          lastPostApplySnapshotId: result.postApplySnapshotId,
                      }
                    : {
                          lastAuditId: result.auditId,
                          lastPostApplySnapshotId:
                              result.postApplySnapshotId ?? null,
                      }
            );
            if (result.status === 'succeeded') {
                setPreviewPlan(undefined);
            }
            toast({
                title:
                    result.status === 'succeeded'
                        ? 'Schema applied'
                        : 'Schema apply failed',
                description:
                    result.status === 'succeeded'
                        ? 'Baseline advanced to the applied schema snapshot.'
                        : (result.error ?? 'The apply job did not succeed.'),
            });
        },
        [previewPlan, toast, updateDiagramSyncMetadata]
    );

    const value = useMemo<SchemaSyncContextValue>(
        () => ({
            open,
            setOpen,
            connections,
            connectionsLoading,
            selectedConnectionId,
            setSelectedConnectionId,
            previewPlan,
            applyResult,
            lastConnectionTest,
            refreshConnections,
            saveConnection,
            deleteConnection,
            testConnectionDraft,
            syncLiveDatabase,
            refreshFromDatabase,
            previewChanges,
            applyChanges,
        }),
        [
            open,
            connections,
            connectionsLoading,
            selectedConnectionId,
            previewPlan,
            applyResult,
            lastConnectionTest,
            refreshConnections,
            saveConnection,
            deleteConnection,
            testConnectionDraft,
            syncLiveDatabase,
            refreshFromDatabase,
            previewChanges,
            applyChanges,
            setSelectedConnectionId,
        ]
    );

    return (
        <SchemaSyncContext.Provider value={value}>
            {children}
        </SchemaSyncContext.Provider>
    );
};
