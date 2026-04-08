import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteVersionDialog } from './delete-version-dialog';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { diagramWorkflowClient } from '@/lib/api/diagram-workflow-client';
import { captureDiagramWorkflowChangelogEntry } from '@/lib/diagram-workflow/capture-changelog-entry';

const toast = vi.fn();

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

vi.mock('@/lib/api/diagram-workflow-client', () => ({
    diagramWorkflowClient: {
        deleteVersion: vi.fn(),
    },
}));

vi.mock('@/lib/diagram-workflow/capture-changelog-entry', () => ({
    captureDiagramWorkflowChangelogEntry: vi.fn(),
}));

vi.mock('@/components/toast/use-toast', () => ({
    useToast: () => ({
        toast,
    }),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);
const mockedDeleteVersion = vi.mocked(diagramWorkflowClient.deleteVersion);
const mockedCaptureChangelogEntry = vi.mocked(
    captureDiagramWorkflowChangelogEntry
);

const version = {
    id: 'version-1',
    diagramId: 'diagram-1',
    snapshotId: 'snapshot-1',
    name: 'Stable release',
    description: null,
    versionLabel: 'Version 1',
    origin: 'manual' as const,
    pinned: false,
    createdAt: '2026-04-08T01:00:00.000Z',
    createdBy: null,
};

describe('delete version dialog', () => {
    beforeEach(() => {
        toast.mockReset();
        mockedUseOptionalDiagramWorkflow.mockReset();
        mockedDeleteVersion.mockReset();
        mockedCaptureChangelogEntry.mockReset();
        mockedCaptureChangelogEntry.mockResolvedValue({
            id: 'entry-1',
        } as never);
    });

    it('deletes the selected version and returns to Development', async () => {
        const user = userEvent.setup();
        const setVersions = vi.fn();
        const setActiveMode = vi.fn();
        const refreshWorkflow = vi.fn().mockResolvedValue(undefined);
        const onOpenChange = vi.fn();

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            developmentDiagram: {
                id: 'diagram-1',
                name: 'Development Diagram',
            },
            upsertChangelogEntry: vi.fn(),
            setVersions,
            setActiveMode,
            refreshWorkflow,
        } as never);
        mockedDeleteVersion.mockResolvedValue({
            result: {
                diagramId: 'diagram-1',
                deletedVersionId: 'version-1',
                versions: [],
            },
        });

        render(
            <DeleteVersionDialog
                open
                version={version}
                onOpenChange={onOpenChange}
            />
        );

        await user.click(
            screen.getByRole('button', { name: 'Delete Version' })
        );

        await waitFor(() => {
            expect(mockedDeleteVersion).toHaveBeenCalledWith(
                'diagram-1',
                'version-1'
            );
        });
        expect(setVersions).toHaveBeenCalledWith([]);
        expect(mockedCaptureChangelogEntry).toHaveBeenCalledWith(
            expect.objectContaining({
                diagramId: 'diagram-1',
                eventType: 'version_deleted',
                sourceLabel: 'Stable release',
            })
        );
        expect(setActiveMode).toHaveBeenCalledWith('development');
        expect(onOpenChange).toHaveBeenCalledWith(false);
        await waitFor(() => {
            expect(refreshWorkflow).toHaveBeenCalled();
        });
        expect(toast).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Version deleted',
            })
        );
    });

    it('shows an error toast when deletion fails', async () => {
        const user = userEvent.setup();

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            developmentDiagram: {
                id: 'diagram-1',
                name: 'Development Diagram',
            },
            upsertChangelogEntry: vi.fn(),
            setVersions: vi.fn(),
            setActiveMode: vi.fn(),
            refreshWorkflow: vi.fn(),
        } as never);
        mockedDeleteVersion.mockRejectedValue(new Error('Version not found.'));

        render(
            <DeleteVersionDialog
                open
                version={version}
                onOpenChange={vi.fn()}
            />
        );

        await user.click(
            screen.getByRole('button', { name: 'Delete Version' })
        );

        await waitFor(() => {
            expect(toast).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Delete failed',
                    description: 'Version not found.',
                    variant: 'destructive',
                })
            );
        });
    });
});
