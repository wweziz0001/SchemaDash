import type { CanonicalSchema } from '@schemadash/schema-sync-core';
import type { Diagram } from '@/lib/domain';
import {
    canonicalSchemaToDiagram,
    diagramToCanonicalSchema,
} from './canonical-adapters';

export const canonicalSchemaToPostgresqlDiagram = (input: {
    canonicalSchema: CanonicalSchema;
    diagramId?: string;
    diagramName?: string;
    schemaSync?: Diagram['schemaSync'];
}) => canonicalSchemaToDiagram(input);

export const diagramToPostgresqlCanonicalSchema = (diagram: Diagram) =>
    diagramToCanonicalSchema(diagram);
