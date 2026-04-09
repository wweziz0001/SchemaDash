import type {
    CanonicalSchema,
    DatabaseEngine,
    SchemaEngineDefinition,
} from '@schemadash/schema-sync-core';
import { getSchemaEngineDefinition } from '@schemadash/schema-sync-core';
import type { Diagram } from '@/lib/domain';
import {
    canonicalSchemaToPostgresqlDiagram,
    diagramToPostgresqlCanonicalSchema,
} from './canonical-adapters.postgresql';

export interface DiagramSchemaSyncEngineDefinition extends SchemaEngineDefinition {
    canonicalMapping: {
        diagramToCanonicalSchema(diagram: Diagram): CanonicalSchema;
        canonicalSchemaToDiagram(input: {
            canonicalSchema: CanonicalSchema;
            diagramId?: string;
            diagramName?: string;
            schemaSync?: Diagram['schemaSync'];
        }): Diagram;
    };
}

const postgresqlEngineDefinition: DiagramSchemaSyncEngineDefinition = {
    ...getSchemaEngineDefinition('postgresql'),
    canonicalMapping: {
        diagramToCanonicalSchema: diagramToPostgresqlCanonicalSchema,
        canonicalSchemaToDiagram: canonicalSchemaToPostgresqlDiagram,
    },
};

const engineDefinitions: Partial<
    Record<DatabaseEngine, DiagramSchemaSyncEngineDefinition>
> = {
    postgresql: postgresqlEngineDefinition,
};

export const getDiagramSchemaSyncEngineDefinition = (
    engine: DatabaseEngine
): DiagramSchemaSyncEngineDefinition => {
    const definition = engineDefinitions[engine];
    if (!definition) {
        throw new Error(
            `Diagram schema sync engine definition for ${engine} is not available.`
        );
    }

    return definition;
};
