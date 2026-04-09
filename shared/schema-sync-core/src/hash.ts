import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';
import type { CanonicalSchema } from './types.js';

const VOLATILE_SCHEMA_KEYS = new Set(['fingerprint', 'importedAt']);

const stableSort = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(stableSort);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .filter(([key]) => !VOLATILE_SCHEMA_KEYS.has(key))
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([key, child]) => [key, stableSort(child)])
        );
    }

    return value;
};

export const hashCanonicalSchema = (schema: CanonicalSchema): string => {
    const normalized = stableSort(schema);
    return bytesToHex(sha256(JSON.stringify(normalized)));
};
