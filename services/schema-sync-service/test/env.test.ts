import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseSchemaSyncServiceEnv } from '../src/config/env.js';

const tempDirs: string[] = [];

const createTempDir = () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'schemadash-sync-env-'));
    tempDirs.push(dir);
    return dir;
};

afterEach(() => {
    while (tempDirs.length > 0) {
        const dir = tempDirs.pop();
        if (dir) {
            rmSync(dir, { recursive: true, force: true });
        }
    }
});

describe('parseSchemaSyncServiceEnv', () => {
    it('uses the main app secret as a fallback for the standalone service', () => {
        const env = parseSchemaSyncServiceEnv({
            NODE_ENV: 'production',
            SCHEMADASH_SECRET_KEY: 'shared-deployment-secret',
            SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR: createTempDir(),
        });

        expect(env.encryptionKey).toEqual(
            createHash('sha256').update('shared-deployment-secret').digest()
        );
    });

    it('rejects placeholder-only secrets in production', () => {
        expect(() =>
            parseSchemaSyncServiceEnv({
                NODE_ENV: 'production',
                SCHEMADASH_SECRET_KEY: 'change-me-before-production',
                SCHEMADASH_SCHEMA_SYNC_SECRET_KEY:
                    'change-me-before-production',
                SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR: createTempDir(),
            })
        ).toThrow(
            /SCHEMADASH_SCHEMA_SYNC_SECRET_KEY or SCHEMADASH_SECRET_KEY must be set to a non-placeholder value in production/
        );
    });

    it('creates an ephemeral secret for non-production development runs', () => {
        const env = parseSchemaSyncServiceEnv({
            NODE_ENV: 'development',
            SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR: createTempDir(),
        });

        expect(env.encryptionKey.byteLength).toBeGreaterThan(0);
        expect(env.runtimeWarnings).toContain(
            'SCHEMADASH_SCHEMA_SYNC_SECRET_KEY is not configured. Using an ephemeral development key.'
        );
    });
});
