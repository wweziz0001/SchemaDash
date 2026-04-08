import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompareSummaryChip } from './compare-summary-chip';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';

vi.mock('@/context/diagram-workflow-context/diagram-workflow-context', () => ({
    useOptionalDiagramWorkflow: vi.fn(),
}));

const mockedUseOptionalDiagramWorkflow = vi.mocked(useOptionalDiagramWorkflow);

describe('compare summary chip', () => {
    beforeEach(() => {
        mockedUseOptionalDiagramWorkflow.mockReset();
    });

    it('shows the selected historical baseline against development', () => {
        mockedUseOptionalDiagramWorkflow.mockReturnValue({
            activeMode: 'compare',
            compareSourceKind: 'version',
            compareVersion: {
                id: 'version-2',
                versionLabel: 'Version 2',
                name: 'Release Candidate',
            },
            compareRenderModel: {
                compareResult: {
                    summary: {
                        tables: {
                            added: 1,
                            changed: 2,
                            removed: 0,
                            total: 3,
                        },
                        fields: {
                            added: 3,
                            changed: 1,
                            removed: 1,
                            total: 5,
                        },
                        relationships: {
                            added: 0,
                            changed: 1,
                            removed: 2,
                            total: 3,
                        },
                    },
                },
            },
        } as never);

        render(<CompareSummaryChip />);

        expect(screen.getByText('Viewing Diffs')).toBeTruthy();
        expect(screen.getByText('Release Candidate')).toBeTruthy();
        expect(screen.getByText('Development')).toBeTruthy();
        expect(screen.getByText('Added 4')).toBeTruthy();
        expect(screen.getByText('Changed 4')).toBeTruthy();
        expect(screen.getByText('Removed 3')).toBeTruthy();
    });
});
