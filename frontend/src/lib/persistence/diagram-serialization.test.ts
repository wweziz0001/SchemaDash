import { describe, expect, it } from 'vitest';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import { deserializeDiagram, serializeDiagram } from './diagram-serialization';

describe('diagram serialization', () => {
    it('round-trips createdAt and updatedAt as Date instances', () => {
        const diagram: Diagram = {
            id: 'diagram-1',
            name: 'Orders',
            databaseType: DatabaseType.POSTGRESQL,
            tables: [],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
            notes: [],
            createdAt: new Date('2026-03-30T10:00:00.000Z'),
            updatedAt: new Date('2026-03-31T12:30:00.000Z'),
        };

        const serialized = serializeDiagram(diagram);
        const deserialized = deserializeDiagram(serialized);

        expect(serialized.createdAt).toBe('2026-03-30T10:00:00.000Z');
        expect(serialized.updatedAt).toBe('2026-03-31T12:30:00.000Z');
        expect(deserialized.createdAt).toEqual(diagram.createdAt);
        expect(deserialized.updatedAt).toEqual(diagram.updatedAt);
        expect(deserialized).toEqual(diagram);
    });
});
