import { describe, expect, it } from 'vitest';
import { normalizePostgresqlStringArray } from '../src/engines/postgresql/introspection.js';

describe('normalizePostgresqlStringArray', () => {
    it('returns arrays unchanged', () => {
        expect(normalizePostgresqlStringArray(['id', 'status'])).toEqual([
            'id',
            'status',
        ]);
    });

    it('parses raw postgres array strings', () => {
        expect(normalizePostgresqlStringArray('{"id","status"}')).toEqual([
            'id',
            'status',
        ]);
    });

    it('parses quoted values containing commas', () => {
        expect(
            normalizePostgresqlStringArray('{"user,id","display name"}')
        ).toEqual(['user,id', 'display name']);
    });

    it('returns an empty array for nullish values', () => {
        expect(normalizePostgresqlStringArray(null)).toEqual([]);
        expect(normalizePostgresqlStringArray(undefined)).toEqual([]);
    });
});
