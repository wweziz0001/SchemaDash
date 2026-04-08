import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { hashCanonicalSchema } from '@schemadash/schema-sync-core';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { captureDiagramWorkflowChangelogEntry } from '@/lib/diagram-workflow/capture-changelog-entry';
import { serializeDiagram } from '@/lib/persistence/diagram-serialization';
import { diagramToCanonicalSchema } from '@/lib/schema-sync/canonical-adapters';

const CHANGE_CAPTURE_DEBOUNCE_MS = 4 * 1000;
const AUTO_CHECKPOINT_INTERVAL_MS = 2 * 60 * 1000;
const AUTO_CHECKPOINT_POLL_MS = 30 * 1000;

export const WorkflowDevelopmentChangelogSync: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const { currentDiagram, diagramSession, readonly } = useSchemaDash();
    const processedChangeKeyRef = useRef<string | null>(null);
    const processedSaveKeyRef = useRef<string | null>(null);
    const autoCheckpointInFlightRef = useRef(false);
    const trackingStartedAtRef = useRef(Date.now());
    const observedDiagramKeyRef = useRef<string | null>(null);

    const serializedDiagram = useMemo(
        () => serializeDiagram(currentDiagram),
        [currentDiagram]
    );
    const serializedDiagramKey = useMemo(
        () => JSON.stringify(serializedDiagram),
        [serializedDiagram]
    );

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
        processedChangeKeyRef.current = null;
        processedSaveKeyRef.current = null;
        observedDiagramKeyRef.current = null;
    }, [workflow?.diagramId]);

    useEffect(() => {
        if (
            !workflow?.diagramId ||
            readonly ||
            currentDiagram.id !== workflow.diagramId ||
            workflow.activeMode !== 'development' ||
            (workflow.workflow?.diagramAccess !== 'edit' &&
                workflow.workflow?.diagramAccess !== 'owner')
        ) {
            return;
        }

        const sourceDocumentVersion =
            diagramSession?.collaboration.document.version;
        const changeKey = sourceDocumentVersion
            ? `${workflow.diagramId}:change:${sourceDocumentVersion}:${serializedDiagramKey}`
            : `${workflow.diagramId}:change:${serializedDiagramKey}`;

        if (observedDiagramKeyRef.current === null) {
            observedDiagramKeyRef.current = serializedDiagramKey;
            return;
        }

        if (
            observedDiagramKeyRef.current === serializedDiagramKey ||
            processedChangeKeyRef.current === changeKey
        ) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            processedChangeKeyRef.current = changeKey;

            void captureDiagramWorkflowChangelogEntry({
                diagramId: workflow.diagramId,
                diagram: currentDiagram,
                eventType: 'change',
                sourceDocumentVersion,
                summary: 'Captured Development changes.',
            })
                .then((entry) => {
                    if (entry) {
                        observedDiagramKeyRef.current = serializedDiagramKey;
                        workflow.upsertChangelogEntry(entry);
                    }
                })
                .catch(() => {
                    processedChangeKeyRef.current = null;
                });
        }, CHANGE_CAPTURE_DEBOUNCE_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        currentDiagram,
        diagramSession?.collaboration.document.version,
        readonly,
        serializedDiagramKey,
        workflow,
    ]);

    useEffect(() => {
        if (
            !workflow?.diagramId ||
            readonly ||
            currentDiagram.id !== workflow.diagramId ||
            workflow.activeMode !== 'development' ||
            (workflow.workflow?.diagramAccess !== 'edit' &&
                workflow.workflow?.diagramAccess !== 'owner')
        ) {
            return;
        }

        const sessionId = diagramSession?.session.id;
        const sourceDocumentVersion =
            diagramSession?.collaboration.document.version;

        if (!sourceDocumentVersion) {
            return;
        }

        const saveKey = `${workflow.diagramId}:${sourceDocumentVersion}`;
        if (processedSaveKeyRef.current === saveKey) {
            return;
        }

        processedSaveKeyRef.current = saveKey;

        void captureDiagramWorkflowChangelogEntry({
            diagramId: workflow.diagramId,
            diagram: currentDiagram,
            eventType: 'save',
            sessionId,
            sourceDocumentVersion,
            summary: 'Saved Development changes.',
        })
            .then((entry) => {
                if (entry) {
                    workflow.upsertChangelogEntry(entry);
                }
            })
            .catch(() => {
                processedSaveKeyRef.current = null;
            });
    }, [
        currentDiagram,
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

            void captureDiagramWorkflowChangelogEntry({
                diagramId: workflow.diagramId,
                diagram: currentDiagram,
                eventType: 'auto_checkpoint',
                summary: 'Captured an automatic Development checkpoint.',
            })
                .then((entry) => {
                    if (entry) {
                        workflow.upsertChangelogEntry(entry);
                    }
                })
                .finally(() => {
                    autoCheckpointInFlightRef.current = false;
                });
        }, AUTO_CHECKPOINT_POLL_MS);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [currentDiagram, currentFingerprint, latestEntry, readonly, workflow]);

    return null;
};
