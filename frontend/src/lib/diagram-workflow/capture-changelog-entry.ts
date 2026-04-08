import type { Diagram } from '@/lib/domain/diagram';
import type {
    DiagramWorkflowChangelogEventType,
    DiagramWorkflowChangelogRecord,
} from '@/lib/api/diagram-workflow-client';
import { diagramWorkflowClient } from '@/lib/api/diagram-workflow-client';
import { serializeDiagram } from '@/lib/persistence/diagram-serialization';
import { diagramToCanonicalSchema } from '@/lib/schema-sync/canonical-adapters';

export const captureDiagramWorkflowChangelogEntry = async ({
    diagramId,
    diagram,
    eventType,
    sessionId,
    sourceDocumentVersion,
    sourceLabel,
    summary,
}: {
    diagramId?: string;
    diagram?: Diagram;
    eventType: DiagramWorkflowChangelogEventType;
    sessionId?: string | null;
    sourceDocumentVersion?: number | null;
    sourceLabel?: string | null;
    summary?: string | null;
}): Promise<DiagramWorkflowChangelogRecord | undefined> => {
    if (!diagramId || !diagram) {
        return undefined;
    }

    const response = await diagramWorkflowClient.captureChangelogEntry(
        diagramId,
        {
            eventType,
            sessionId,
            sourceDocumentVersion,
            sourceLabel,
            summary,
            canonicalSchema: diagramToCanonicalSchema(diagram),
            diagramDocument: serializeDiagram(diagram),
        }
    );

    return response.result.entry;
};
