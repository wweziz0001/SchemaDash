import { describe, expect, it } from 'vitest';
import {
    buildVersionDifferenceSummary,
    getInitialVersionDifferenceSummary,
} from './version-difference-summary';

describe('version-difference-summary', () => {
    it('returns an initial-version message for the first snapshot', () => {
        expect(getInitialVersionDifferenceSummary()).toEqual({
            message: 'Initial version',
            segments: [],
        });
    });

    it('prefers table deltas when they exist', () => {
        expect(
            buildVersionDifferenceSummary({
                summary: {
                    tables: {
                        added: 1,
                        removed: 2,
                        changed: 0,
                        unchanged: 0,
                        total: 3,
                    },
                    fields: {
                        added: 3,
                        removed: 0,
                        changed: 0,
                        unchanged: 0,
                        total: 3,
                    },
                    relationships: {
                        added: 0,
                        removed: 0,
                        changed: 0,
                        unchanged: 0,
                        total: 0,
                    },
                },
            })
        ).toEqual({
            message: '+ 1 table - 2 tables',
            segments: [
                { tone: 'added', label: '+ 1 table' },
                { tone: 'removed', label: '- 2 tables' },
            ],
        });
    });

    it('falls back to relationship deltas when tables are unchanged', () => {
        expect(
            buildVersionDifferenceSummary({
                summary: {
                    tables: {
                        added: 0,
                        removed: 0,
                        changed: 0,
                        unchanged: 2,
                        total: 2,
                    },
                    fields: {
                        added: 0,
                        removed: 0,
                        changed: 0,
                        unchanged: 4,
                        total: 4,
                    },
                    relationships: {
                        added: 1,
                        removed: 0,
                        changed: 1,
                        unchanged: 0,
                        total: 2,
                    },
                },
            })
        ).toEqual({
            message: '+ 1 relationship ~ 1 relationship',
            segments: [
                { tone: 'added', label: '+ 1 relationship' },
                { tone: 'changed', label: '~ 1 relationship' },
            ],
        });
    });

    it('reports visual-only snapshots when schema deltas are absent', () => {
        expect(
            buildVersionDifferenceSummary({
                summary: {
                    tables: {
                        added: 0,
                        removed: 0,
                        changed: 0,
                        unchanged: 2,
                        total: 2,
                    },
                    fields: {
                        added: 0,
                        removed: 0,
                        changed: 0,
                        unchanged: 4,
                        total: 4,
                    },
                    relationships: {
                        added: 0,
                        removed: 0,
                        changed: 0,
                        unchanged: 1,
                        total: 1,
                    },
                },
            })
        ).toEqual({
            message: 'Only visual changes',
            segments: [],
        });
    });
});
