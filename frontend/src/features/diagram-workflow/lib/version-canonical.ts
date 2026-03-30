import {
    hashCanonicalSchema,
    type CanonicalSchema,
} from '@schemadash/schema-sync-core';
import { diagramToCanonicalSchema } from '@/features/schema-sync/lib/canonical-adapters';
import { deserializeDiagram } from '@/features/persistence/api/persistence-client';
import type { DiagramWorkflowVersionRecord } from '../api/diagram-workflow-client';

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
