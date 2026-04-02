import {
    hashCanonicalSchema,
    type CanonicalSchema,
} from '@schemadash/schema-sync-core';
import { diagramToCanonicalSchema } from '@/lib/schema-sync/canonical-adapters';
import { deserializeDiagram } from '@/lib/persistence/diagram-serialization';
import type { DiagramWorkflowVersionRecord } from '@/lib/api/diagram-workflow-client';

export const getAuthoritativeVersionCanonicalSchema = (
    version?: DiagramWorkflowVersionRecord
): CanonicalSchema | undefined => {
    if (!version) {
        return undefined;
    }

    if (!version.snapshot.diagramDocument) {
        return version.snapshot.canonicalSchema;
    }

    const canonicalFromDocument = diagramToCanonicalSchema(
        deserializeDiagram(version.snapshot.diagramDocument)
    );

    return {
        ...canonicalFromDocument,
        fingerprint: hashCanonicalSchema(canonicalFromDocument),
        importedAt: version.snapshot.createdAt,
    };
};
