import { describe, expect, it } from 'vitest';
import { matchesSearch, normalizeSearchTerm } from '../search';

describe('search helpers', () => {
    it('normalizes whitespace and optional casing', () => {
        expect(normalizeSearchTerm('  Orders  ')).toBe('Orders');
        expect(
            normalizeSearchTerm('  Orders  ', {
                lowerCase: true,
            })
        ).toBe('orders');
        expect(normalizeSearchTerm('   ')).toBeUndefined();
    });

    it('matches values case-insensitively after normalization', () => {
        expect(matchesSearch(['Customer Ledger', 'Finance'], ' ledger ')).toBe(
            true
        );
        expect(
            matchesSearch(['Customer Ledger', 'Finance'], ' INVENTORY ')
        ).toBe(false);
        expect(matchesSearch(['Anything'], '   ')).toBe(true);
    });
});
