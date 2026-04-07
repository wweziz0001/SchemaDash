import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveStatusChip } from './live-status-chip';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);

describe('live status chip', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
    });

    it('shows connected, last synced, and read-only state in live mode', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'live',
            workflow: {
                connectionId: 'connection-1',
                connectionName: 'Warehouse',
                connectionStatus: 'ok',
                liveSnapshotId: 'live-snapshot-1',
                syncStatus: 'in_sync',
                lastSyncedAt: '2026-03-28T15:30:00.000Z',
            },
        } as never);

        render(<LiveStatusChip />);

        expect(screen.queryByText('Warehouse linked')).not.toBeNull();
        expect(screen.queryByText(/Last synced/)).not.toBeNull();
        expect(screen.queryByText('Live read-only')).not.toBeNull();
        expect(screen.queryByText('Live snapshot')).not.toBeNull();
    });

    it('shows disconnected state before a live database is bound', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'development',
            workflow: {
                connectionId: null,
                connectionName: null,
                connectionStatus: 'unknown',
                liveSnapshotId: null,
                syncStatus: 'disconnected',
                lastSyncedAt: null,
            },
        } as never);

        render(<LiveStatusChip />);

        expect(screen.queryByText('Disconnected')).not.toBeNull();
        expect(screen.queryByText('Live unavailable')).not.toBeNull();
        expect(screen.queryByText('Development editable')).not.toBeNull();
    });

    it('shows compare read-only state while reviewing differences', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'compare',
            compareSourceKind: 'live',
            workflow: {
                connectionId: 'connection-1',
                connectionName: 'Warehouse',
                connectionStatus: 'ok',
                liveSnapshotId: 'live-snapshot-1',
                syncStatus: 'in_sync',
                lastSyncedAt: '2026-03-28T15:30:00.000Z',
            },
        } as never);

        render(<LiveStatusChip />);

        expect(screen.queryByText('Compare read-only')).not.toBeNull();
    });

    it('shows the historical diff surface when compare mode is sourced from a version', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            activeMode: 'compare',
            compareSourceKind: 'version',
            compareVersion: {
                id: 'version-2',
                versionLabel: 'Version 2',
                name: 'Release Candidate',
            },
            workflow: {
                connectionId: 'connection-1',
                connectionName: 'Warehouse',
                connectionStatus: 'ok',
                liveSnapshotId: 'live-snapshot-1',
                syncStatus: 'in_sync',
                lastSyncedAt: '2026-03-28T15:30:00.000Z',
            },
        } as never);

        render(<LiveStatusChip />);

        expect(screen.queryByText('Compare read-only')).not.toBeNull();
        expect(
            screen.queryByText('Release Candidate -> Development')
        ).not.toBeNull();
    });
});
