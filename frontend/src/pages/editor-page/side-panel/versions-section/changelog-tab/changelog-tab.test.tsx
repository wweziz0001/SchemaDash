import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangelogTab } from './changelog-tab';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);

describe('changelog tab', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
    });

    it('renders the workflow timeline with development and immutable snapshots', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            activeMode: 'compare',
            compareSourceKind: 'version',
            compareVersion: {
                id: 'version-2',
                versionLabel: 'Version 2',
                name: 'Release Candidate',
            },
            versions: [
                {
                    id: 'version-2',
                    versionLabel: 'Version 2',
                    name: 'Release Candidate',
                    description: 'Candidate before launch',
                    origin: 'manual',
                    createdAt: '2026-03-29T12:00:00.000Z',
                    createdBy: {
                        id: 'user-1',
                        displayName: 'Test Owner',
                    },
                },
                {
                    id: 'version-1',
                    versionLabel: 'Version 1',
                    name: 'Initial schema',
                    description: 'First saved version',
                    origin: 'milestone',
                    createdAt: '2026-03-28T12:00:00.000Z',
                    createdBy: {
                        id: 'user-1',
                        displayName: 'Test Owner',
                    },
                },
            ],
        } as never);

        render(<ChangelogTab />);

        expect(screen.getByText('Workflow Timeline')).toBeTruthy();
        expect(screen.getByText('Development')).toBeTruthy();
        expect(screen.getByText('Release Candidate')).toBeTruthy();
        expect(screen.getByText('Initial schema')).toBeTruthy();
        expect(screen.getByText('Diff source')).toBeTruthy();
    });
});
