import React from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowDevelopmentChangelogSync } from './workflow-development-changelog-sync';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { captureDiagramWorkflowChangelogEntry } from '@/lib/diagram-workflow/capture-changelog-entry';
import { diagramToCanonicalSchema } from '@/lib/schema-sync/canonical-adapters';
import { serializeDiagram } from '@/lib/persistence/diagram-serialization';

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

vi.mock('@/hooks/use-schemadash', () => ({
    useSchemaDash: vi.fn(),
}));

vi.mock('@/lib/diagram-workflow/capture-changelog-entry', () => ({
    captureDiagramWorkflowChangelogEntry: vi.fn(),
}));

vi.mock('@/lib/schema-sync/canonical-adapters', () => ({
    diagramToCanonicalSchema: vi.fn(),
}));

vi.mock('@/lib/persistence/diagram-serialization', () => ({
    serializeDiagram: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);
const mockedUseSchemaDash = vi.mocked(useSchemaDash);
const mockedCaptureChangelogEntry = vi.mocked(
    captureDiagramWorkflowChangelogEntry
);
const mockedDiagramToCanonicalSchema = vi.mocked(diagramToCanonicalSchema);
const mockedSerializeDiagram = vi.mocked(serializeDiagram);

describe('workflow development changelog sync', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-08T10:00:00.000Z'));
        mockedUseOptionalDiagramWorkflow.mockReset();
        mockedUseSchemaDash.mockReset();
        mockedCaptureChangelogEntry.mockReset();
        mockedDiagramToCanonicalSchema.mockReset();
        mockedSerializeDiagram.mockReset();

        mockedDiagramToCanonicalSchema.mockReturnValue({
            engine: 'postgresql',
            databaseName: 'Development Diagram',
            defaultSchemaName: 'public',
            schemaNames: ['public'],
            tables: [],
            customTypes: [],
        } as never);
        mockedSerializeDiagram.mockReturnValue({ id: 'diagram-1' } as never);
        mockedCaptureChangelogEntry.mockResolvedValue({
            id: 'entry-1',
        } as never);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('captures a save changelog entry after the current session saves Development', async () => {
        const upsertChangelogEntry = vi.fn();
        const currentDiagram = {
            id: 'diagram-1',
            name: 'Development Diagram',
            updatedAt: new Date('2026-04-08T10:00:05.000Z'),
        };

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'development',
            workflow: {
                diagramAccess: 'owner',
            },
            changelogEntries: [],
            upsertChangelogEntry,
        } as never);
        mockedUseSchemaDash.mockReturnValue({
            currentDiagram,
            readonly: false,
            diagramSession: {
                session: { id: 'session-1' },
                collaboration: {
                    document: {
                        version: 7,
                        lastSavedSessionId: 'session-1',
                    },
                },
            },
        } as never);

        render(<WorkflowDevelopmentChangelogSync />);

        await act(async () => {
            await Promise.resolve();
        });

        expect(mockedCaptureChangelogEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                diagramId: 'diagram-1',
                eventType: 'save',
                sessionId: 'session-1',
                sourceDocumentVersion: 7,
            })
        );
        expect(upsertChangelogEntry).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'entry-1' })
        );
    });

    it('creates an automatic checkpoint on interval only after meaningful local change time has elapsed', async () => {
        const upsertChangelogEntry = vi.fn();
        const currentDiagram = {
            id: 'diagram-1',
            name: 'Development Diagram',
            updatedAt: new Date('2026-04-08T10:00:01.000Z'),
        };

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'development',
            workflow: {
                diagramAccess: 'owner',
            },
            changelogEntries: [
                {
                    id: 'entry-previous',
                    fingerprint: 'different-fingerprint',
                    createdAt: '2026-04-08T09:00:00.000Z',
                },
            ],
            upsertChangelogEntry,
        } as never);
        mockedUseSchemaDash.mockReturnValue({
            currentDiagram,
            readonly: false,
            diagramSession: undefined,
        } as never);

        render(<WorkflowDevelopmentChangelogSync />);

        await act(async () => {
            vi.advanceTimersByTime(2 * 60 * 1000 + 30 * 1000);
            await Promise.resolve();
        });

        expect(mockedCaptureChangelogEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                diagramId: 'diagram-1',
                eventType: 'auto_checkpoint',
            })
        );
        expect(upsertChangelogEntry).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'entry-1' })
        );
    });

    it('captures direct Development changes even when no save session marker is present yet', async () => {
        const upsertChangelogEntry = vi.fn();
        let serializedDiagram = {
            id: 'diagram-1',
            name: 'Development Diagram',
            tables: [{ id: 'table-1', name: 'users' }],
        };

        mockedSerializeDiagram.mockImplementation(
            () => serializedDiagram as never
        );
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'development',
            workflow: {
                diagramAccess: 'owner',
            },
            changelogEntries: [],
            upsertChangelogEntry,
        } as never);
        mockedUseSchemaDash.mockReturnValue({
            currentDiagram: {
                id: 'diagram-1',
                name: 'Development Diagram',
                updatedAt: new Date('2026-04-08T10:00:00.000Z'),
            },
            readonly: false,
            diagramSession: undefined,
        } as never);

        const rendered = render(<WorkflowDevelopmentChangelogSync />);

        serializedDiagram = {
            id: 'diagram-1',
            name: 'Renamed Development Diagram',
            tables: [
                { id: 'table-1', name: 'users' },
                { id: 'table-2', name: 'orders' },
            ],
        };
        mockedUseSchemaDash.mockReturnValue({
            currentDiagram: {
                id: 'diagram-1',
                name: 'Renamed Development Diagram',
                updatedAt: new Date('2026-04-08T10:00:10.000Z'),
            },
            readonly: false,
            diagramSession: undefined,
        } as never);

        rendered.rerender(<WorkflowDevelopmentChangelogSync />);

        await act(async () => {
            vi.advanceTimersByTime(4 * 1000);
            await Promise.resolve();
        });

        expect(mockedCaptureChangelogEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                diagramId: 'diagram-1',
                eventType: 'change',
                summary: 'Captured Development changes.',
            })
        );
        expect(upsertChangelogEntry).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'entry-1' })
        );
    });
});
