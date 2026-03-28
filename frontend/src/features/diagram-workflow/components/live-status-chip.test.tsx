import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveStatusChip } from './live-status-chip';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';

vi.mock('../context/diagram-workflow-context', () => ({
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

        expect(screen.getByText('Connected: Warehouse')).toBeInTheDocument();
        expect(screen.getByText(/Last synced/)).toBeInTheDocument();
        expect(screen.getByText('Read-only')).toBeInTheDocument();
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

        expect(screen.getByText('Disconnected')).toBeInTheDocument();
        expect(screen.getByText('Live unavailable')).toBeInTheDocument();
        expect(screen.getByText('Editable')).toBeInTheDocument();
    });
});
