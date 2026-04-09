import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotEnv } from 'dotenv';
import { z } from 'zod';

const serviceRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..'
);
const repoRoot = path.resolve(serviceRoot, '..', '..');

loadDotEnv({ path: path.join(repoRoot, '.env'), override: false, quiet: true });
loadDotEnv({
    path: path.join(serviceRoot, '.env'),
    override: false,
    quiet: true,
});

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .optional()
        .default('development'),
    SCHEMADASH_SCHEMA_SYNC_SERVICE_HOST: z
        .string()
        .optional()
        .default('0.0.0.0'),
    SCHEMADASH_SCHEMA_SYNC_SERVICE_PORT: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .default(4020),
    SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR: z.string().optional(),
    SCHEMADASH_SCHEMA_SYNC_METADATA_DB_PATH: z.string().optional(),
    SCHEMADASH_SCHEMA_SYNC_SECRET_KEY: z.string().optional(),
    SCHEMADASH_SCHEMA_SYNC_LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .optional()
        .default('info'),
});

const resolveSecretKey = (
    parsedEnv: z.infer<typeof envSchema>,
    nodeEnv: 'development' | 'test' | 'production'
) => {
    const provided = parsedEnv.SCHEMADASH_SCHEMA_SYNC_SECRET_KEY?.trim();
    if (provided) {
        return {
            value: provided,
            warnings: [] as string[],
        };
    }

    if (nodeEnv === 'production') {
        throw new Error(
            'SCHEMADASH_SCHEMA_SYNC_SECRET_KEY must be set in production.'
        );
    }

    return {
        value: randomBytes(32).toString('hex'),
        warnings: [
            'SCHEMADASH_SCHEMA_SYNC_SECRET_KEY is not configured. Using an ephemeral development key.',
        ],
    };
};

export interface SchemaSyncServiceEnv {
    nodeEnv: 'development' | 'test' | 'production';
    host: string;
    port: number;
    logLevel:
        | 'fatal'
        | 'error'
        | 'warn'
        | 'info'
        | 'debug'
        | 'trace'
        | 'silent';
    dataDir: string;
    metadataDbPath: string;
    encryptionKey: Buffer;
    runtimeWarnings?: string[];
}

export const parseSchemaSyncServiceEnv = (
    input: NodeJS.ProcessEnv = process.env
): SchemaSyncServiceEnv => {
    const normalizedInput = Object.fromEntries(
        Object.entries(input).map(([key, value]) => [
            key,
            typeof value === 'string' && value.trim().length === 0
                ? undefined
                : value,
        ])
    );
    const parsedEnv = envSchema.parse(normalizedInput);
    const dataDir = parsedEnv.SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR
        ? path.resolve(parsedEnv.SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR)
        : path.resolve(repoRoot, '.schemadash-schema-sync-service');

    mkdirSync(dataDir, { recursive: true });

    const resolvedSecretKey = resolveSecretKey(parsedEnv, parsedEnv.NODE_ENV);

    return {
        nodeEnv: parsedEnv.NODE_ENV,
        host: parsedEnv.SCHEMADASH_SCHEMA_SYNC_SERVICE_HOST,
        port: parsedEnv.SCHEMADASH_SCHEMA_SYNC_SERVICE_PORT,
        logLevel: parsedEnv.SCHEMADASH_SCHEMA_SYNC_LOG_LEVEL,
        dataDir,
        metadataDbPath: parsedEnv.SCHEMADASH_SCHEMA_SYNC_METADATA_DB_PATH
            ? path.resolve(parsedEnv.SCHEMADASH_SCHEMA_SYNC_METADATA_DB_PATH)
            : path.join(dataDir, 'schema-sync.sqlite'),
        encryptionKey: createHash('sha256')
            .update(resolvedSecretKey.value)
            .digest(),
        runtimeWarnings:
            resolvedSecretKey.warnings.length > 0
                ? resolvedSecretKey.warnings
                : undefined,
    };
};

export const schemaSyncServiceEnv = parseSchemaSyncServiceEnv();
