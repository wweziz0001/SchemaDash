import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VersionViewBadge } from './version-view-badge';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);

describe('version view badge', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
    });

    it('only renders in read-only version mode', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            activeMode: 'development',
            selectedVersion: undefined,
        } as never);

        render(<VersionViewBadge />);

        expect(screen.queryByText('Immutable Snapshot')).toBeNull();
    });

    it('shows immutable version metadata when a snapshot is open', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            activeMode: 'version',
            selectedVersion: {
                id: 'version-1',
                diagramId: 'diagram-1',
                snapshotId: 'snapshot-1',
                name: 'Milestone: Q2 schema',
                description: null,
                versionLabel: 'Version 3',
                origin: 'manual',
                pinned: false,
                createdAt: '2026-03-29T15:00:00.000Z',
                createdBy: {
                    id: 'user-1',
                    displayName: 'Test Owner',
                    email: 'owner@example.com',
                },
            },
        } as never);

        render(<VersionViewBadge />);

        expect(screen.getByText('Immutable Snapshot')).toBeTruthy();
        expect(screen.getByText('Milestone: Q2 schema')).toBeTruthy();
        expect(screen.getByText('Test Owner')).toBeTruthy();
    });
});
