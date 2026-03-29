import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VersionsPanel } from './versions-panel';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';

vi.mock('../context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);

describe('versions panel', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
    });

    it('stays hidden until a workflow diagram is loaded', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue(undefined);

        render(<VersionsPanel />);

        expect(screen.queryByRole('button', { name: 'Versions' })).toBeNull();
    });

    it('lists versions and routes open and compare actions', async () => {
        const user = userEvent.setup();
        const openVersion = vi.fn();
        const compareVersionToDevelopment = vi.fn();

        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            diagramId: 'diagram-1',
            versions: [
                {
                    id: 'version-1',
                    diagramId: 'diagram-1',
                    snapshotId: 'snapshot-1',
                    name: null,
                    description: 'Before the refactor',
                    versionLabel: 'Version 1',
                    origin: 'manual',
                    pinned: false,
                    createdAt: '2026-03-29T15:00:00.000Z',
                    createdBy: {
                        id: 'user-1',
                        displayName: 'Test Owner',
                        email: 'owner@example.com',
                    },
                },
            ],
            workflow: {
                diagramAccess: 'edit',
            },
            activeMode: 'development',
            compareSourceKind: null,
            compareVersion: undefined,
            selectedVersion: undefined,
            openVersion,
            compareVersionToDevelopment,
            refreshWorkflow: vi.fn(),
        } as never);

        render(<VersionsPanel />);

        await user.click(screen.getByRole('button', { name: /Versions/i }));

        expect(screen.getByText('Version 1')).toBeTruthy();
        expect(screen.getByText('Before the refactor')).toBeTruthy();

        await user.click(
            screen.getByRole('button', { name: 'Open read-only' })
        );
        expect(openVersion).toHaveBeenCalledWith('version-1');

        await user.click(screen.getByRole('button', { name: /Versions/i }));
        await user.click(
            screen.getByRole('button', { name: 'Compare to Development' })
        );
        expect(compareVersionToDevelopment).toHaveBeenCalledWith('version-1');
    });
});
