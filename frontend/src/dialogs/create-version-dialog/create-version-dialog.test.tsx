import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateVersionDialog } from './create-version-dialog';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { diagramWorkflowClient } from '@/lib/api/diagram-workflow-client';
import { captureDiagramWorkflowChangelogEntry } from '@/lib/diagram-workflow/capture-changelog-entry';
import { diagramToCanonicalSchema } from '@/lib/schema-sync/canonical-adapters';
import { serializeDiagram } from '@/lib/persistence/diagram-serialization';

const toast = vi.fn();

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

vi.mock('@/lib/api/diagram-workflow-client', () => ({
    diagramWorkflowClient: {
        createVersion: vi.fn(),
    },
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

vi.mock('@/components/toast/use-toast', () => ({
    useToast: () => ({
        toast,
    }),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);
const mockedCreateVersion = vi.mocked(diagramWorkflowClient.createVersion);
const mockedCaptureChangelogEntry = vi.mocked(
    captureDiagramWorkflowChangelogEntry
);
const mockedDiagramToCanonicalSchema = vi.mocked(diagramToCanonicalSchema);
const mockedSerializeDiagram = vi.mocked(serializeDiagram);

describe('create version dialog', () => {
    beforeEach(() => {
        toast.mockReset();
        mockedUseOptionalDiagramWorkflow.mockReset();
        mockedCreateVersion.mockReset();
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
        mockedSerializeDiagram.mockReturnValue({
            id: 'diagram-1',
            name: 'Development Diagram',
        } as never);
        mockedCaptureChangelogEntry.mockResolvedValue({
            id: 'entry-1',
        } as never);
    });

    it('creates a version and records a changelog event for it', async () => {
        const user = userEvent.setup();
        const refreshWorkflow = vi.fn().mockResolvedValue(undefined);
        const upsertChangelogEntry = vi.fn();
        const onOpenChange = vi.fn();

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            developmentDiagram: {
                id: 'diagram-1',
                name: 'Development Diagram',
            },
            workflow: {
                diagramAccess: 'owner',
            },
            refreshWorkflow,
            upsertChangelogEntry,
        } as never);
        mockedCreateVersion.mockResolvedValue({
            version: {
                id: 'version-1',
                name: 'Launch Candidate',
                versionLabel: 'Version 1',
            },
        } as never);

        render(<CreateVersionDialog open onOpenChange={onOpenChange} />);

        await user.type(screen.getByLabelText('Name'), 'Launch Candidate');
        await user.click(
            screen.getByRole('button', { name: 'Create Version' })
        );

        await waitFor(() => {
            expect(mockedCreateVersion).toHaveBeenCalledWith(
                'diagram-1',
                expect.objectContaining({
                    name: 'Launch Candidate',
                })
            );
        });
        expect(mockedCaptureChangelogEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                diagramId: 'diagram-1',
                eventType: 'version_created',
                sourceLabel: 'Launch Candidate',
            })
        );
        await waitFor(() => {
            expect(upsertChangelogEntry).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'entry-1' })
            );
        });
        expect(onOpenChange).toHaveBeenCalledWith(false);
    });
});
