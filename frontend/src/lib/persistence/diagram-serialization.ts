import type { Diagram } from '@/lib/domain/diagram';
import type { DiagramDto } from './persistence-types';

export const serializeDiagram = (diagram: Diagram): DiagramDto => ({
    ...diagram,
    createdAt: diagram.createdAt.toISOString(),
    updatedAt: diagram.updatedAt.toISOString(),
});

export const deserializeDiagram = (diagram: DiagramDto): Diagram => ({
    ...diagram,
    createdAt: new Date(diagram.createdAt),
    updatedAt: new Date(diagram.updatedAt),
});
