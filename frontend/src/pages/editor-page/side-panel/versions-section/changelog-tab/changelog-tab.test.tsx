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

    it('renders Development and real changelog timeline entries instead of versions copy', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            activeMode: 'changelog',
            compareSourceKind: 'changelog',
            selectedChangelogEntry: {
                id: 'entry-2',
            },
            compareChangelogEntry: {
                id: 'entry-1',
            },
            changelogEntries: [
                {
                    id: 'entry-2',
                    diagramId: 'diagram-1',
                    snapshotId: 'snapshot-2',
                    eventType: 'save',
                    sessionId: 'session-1',
                    sourceDocumentVersion: 9,
                    sourceLabel: 'Development save',
                    summary: 'Saved Development changes.',
                    changeSummary: {
                        tables: {
                            added: 1,
                            removed: 0,
                            changed: 0,
                            unchanged: 0,
                            total: 1,
                        },
                        fields: {
                            added: 2,
                            removed: 0,
                            changed: 0,
                            unchanged: 0,
                            total: 2,
                        },
                        relationships: {
                            added: 0,
                            removed: 0,
                            changed: 0,
                            unchanged: 0,
                            total: 0,
                        },
                        totalChanges: 3,
                        hasChanges: true,
                    },
                    fingerprint: 'fingerprint-2',
                    createdAt: '2026-04-08T10:00:00.000Z',
                    createdBy: {
                        id: 'user-1',
                        displayName: 'Test Owner',
                        email: 'owner@example.com',
                    },
                },
                {
                    id: 'entry-1',
                    diagramId: 'diagram-1',
                    snapshotId: 'snapshot-1',
                    eventType: 'auto_checkpoint',
                    sessionId: null,
                    sourceDocumentVersion: null,
                    sourceLabel: null,
                    summary: 'Captured an automatic Development checkpoint.',
                    changeSummary: null,
                    fingerprint: 'fingerprint-1',
                    createdAt: '2026-04-08T09:57:00.000Z',
                    createdBy: null,
                },
            ],
            changelogRecords: {
                'entry-1': { id: 'entry-1' },
                'entry-2': { id: 'entry-2' },
            },
            ensureChangelogRecord: vi.fn(),
            setActiveMode: vi.fn(),
            openChangelogEntry: vi.fn(),
            compareChangelogToDevelopment: vi.fn(),
        } as never);

        render(<ChangelogTab />);

        expect(
            screen.getByText('A timeline of actual Development history.')
        ).toBeInTheDocument();
        expect(
            screen.getByText('Current Development Version')
        ).toBeInTheDocument();
        expect(screen.getAllByText('Saved Development changes.')).toHaveLength(
            2
        );
        expect(
            screen.getAllByText('Captured an automatic Development checkpoint.')
        ).toHaveLength(2);
        expect(screen.getAllByText('Viewing').length).toBeGreaterThan(0);
        expect(screen.getByText('Diff baseline')).toBeInTheDocument();
    });
});
