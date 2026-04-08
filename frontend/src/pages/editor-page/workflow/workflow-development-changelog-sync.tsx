import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { hashCanonicalSchema } from '@schemadash/schema-sync-core';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { diagramWorkflowClient } from '@/lib/api/diagram-workflow-client';
import { serializeDiagram } from '@/lib/persistence/diagram-serialization';
import { diagramToCanonicalSchema } from '@/lib/schema-sync/canonical-adapters';

const AUTO_CHECKPOINT_INTERVAL_MS = 2 * 60 * 1000;
const AUTO_CHECKPOINT_POLL_MS = 30 * 1000;

export const WorkflowDevelopmentChangelogSync: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const { currentDiagram, diagramSession, readonly } = useSchemaDash();
    const processedSaveKeyRef = useRef<string | null>(null);
    const autoCheckpointInFlightRef = useRef(false);
    const trackingStartedAtRef = useRef(Date.now());

    const canonicalSchema = useMemo(
        () => diagramToCanonicalSchema(currentDiagram),
        [currentDiagram]
    );
    const currentFingerprint = useMemo(
        () => hashCanonicalSchema(canonicalSchema),
        [canonicalSchema]
    );
    const latestEntry = workflow?.changelogEntries[0];

    useEffect(() => {
        trackingStartedAtRef.current = Date.now();
        processedSaveKeyRef.current = null;
    }, [workflow?.diagramId]);

    useEffect(() => {
        if (
            !workflow?.diagramId ||
            readonly ||
            currentDiagram.id !== workflow.diagramId
        ) {
            return;
        }

        const sessionId = diagramSession?.session.id;
        const lastSavedSessionId =
            diagramSession?.collaboration.document.lastSavedSessionId;
        const sourceDocumentVersion =
            diagramSession?.collaboration.document.version;

        if (
            !sessionId ||
            !sourceDocumentVersion ||
            lastSavedSessionId !== sessionId
        ) {
            return;
        }

        const saveKey = `${workflow.diagramId}:${sourceDocumentVersion}`;
        if (processedSaveKeyRef.current === saveKey) {
            return;
        }

        processedSaveKeyRef.current = saveKey;

        void diagramWorkflowClient
            .captureChangelogEntry(workflow.diagramId, {
                eventType: 'save',
                sessionId,
                sourceDocumentVersion,
                summary: 'Saved Development changes.',
                canonicalSchema,
                diagramDocument: serializeDiagram(currentDiagram),
            })
            .then((response) => {
                workflow.upsertChangelogEntry(response.result.entry);
            })
            .catch(() => {
                processedSaveKeyRef.current = null;
            });
    }, [
        canonicalSchema,
        currentDiagram,
        diagramSession?.collaboration.document.lastSavedSessionId,
        diagramSession?.collaboration.document.version,
        diagramSession?.session.id,
        readonly,
        workflow,
    ]);

    useEffect(() => {
        if (
            !workflow?.diagramId ||
            !workflow.workflow ||
            readonly ||
            currentDiagram.id !== workflow.diagramId ||
            workflow.activeMode !== 'development' ||
            (workflow.workflow.diagramAccess !== 'edit' &&
                workflow.workflow.diagramAccess !== 'owner')
        ) {
            return;
        }

        const intervalId = window.setInterval(() => {
            if (autoCheckpointInFlightRef.current) {
                return;
            }

            if (latestEntry?.fingerprint === currentFingerprint) {
                return;
            }

            const currentUpdatedAt = new Date(
                currentDiagram.updatedAt
            ).getTime();
            const latestEntryCreatedAt = latestEntry
                ? new Date(latestEntry.createdAt).getTime()
                : null;

            if (
                (!latestEntry &&
                    currentUpdatedAt <= trackingStartedAtRef.current) ||
                (latestEntryCreatedAt !== null &&
                    currentUpdatedAt <= latestEntryCreatedAt)
            ) {
                return;
            }

            const eligibleAt =
                Math.max(trackingStartedAtRef.current, currentUpdatedAt) +
                AUTO_CHECKPOINT_INTERVAL_MS;

            if (Date.now() < eligibleAt) {
                return;
            }

            autoCheckpointInFlightRef.current = true;

            void diagramWorkflowClient
                .captureChangelogEntry(workflow.diagramId!, {
                    eventType: 'auto_checkpoint',
                    summary: 'Captured an automatic Development checkpoint.',
                    canonicalSchema,
                    diagramDocument: serializeDiagram(currentDiagram),
                })
                .then((response) => {
                    workflow.upsertChangelogEntry(response.result.entry);
                })
                .finally(() => {
                    autoCheckpointInFlightRef.current = false;
                });
        }, AUTO_CHECKPOINT_POLL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [
        canonicalSchema,
        currentDiagram,
        currentFingerprint,
        latestEntry,
        readonly,
        workflow,
    ]);

    return null;
};
