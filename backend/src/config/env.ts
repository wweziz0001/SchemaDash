import { createHash, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotEnv } from 'dotenv';
import { z } from 'zod';

const serverRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..'
);
const repoRoot = path.resolve(serverRoot, '..');

loadDotEnv({ path: path.join(repoRoot, '.env'), override: false, quiet: true });
loadDotEnv({
    path: path.join(serverRoot, '.env'),
    override: false,
    quiet: true,
});

const legacyServerEnvAliases = {
    SCHEMADASH_API_HOST: 'CHARTDB_API_HOST',
    SCHEMADASH_API_PORT: 'CHARTDB_API_PORT',
    SCHEMADASH_CORS_ORIGIN: 'CHARTDB_CORS_ORIGIN',
    SCHEMADASH_TRUST_PROXY: 'CHARTDB_TRUST_PROXY',
    SCHEMADASH_DATA_DIR: 'CHARTDB_DATA_DIR',
    SCHEMADASH_METADATA_DB_PATH: 'CHARTDB_METADATA_DB_PATH',
    SCHEMADASH_APP_DB_PATH: 'CHARTDB_APP_DB_PATH',
    SCHEMADASH_SECRET_KEY: 'CHARTDB_SECRET_KEY',
    SCHEMADASH_LOG_LEVEL: 'CHARTDB_LOG_LEVEL',
    SCHEMADASH_AUTH_MODE: 'CHARTDB_AUTH_MODE',
    SCHEMADASH_AUTH_EMAIL: 'CHARTDB_AUTH_EMAIL',
    SCHEMADASH_AUTH_PASSWORD: 'CHARTDB_AUTH_PASSWORD',
    SCHEMADASH_AUTH_DISPLAY_NAME: 'CHARTDB_AUTH_DISPLAY_NAME',
    SCHEMADASH_BOOTSTRAP_SETUP_CODE: 'CHARTDB_BOOTSTRAP_SETUP_CODE',
    SCHEMADASH_BOOTSTRAP_SETUP_CODE_TTL_MS:
        'CHARTDB_BOOTSTRAP_SETUP_CODE_TTL_MS',
    SCHEMADASH_BOOTSTRAP_SETUP_CODE_MAX_ATTEMPTS:
        'CHARTDB_BOOTSTRAP_SETUP_CODE_MAX_ATTEMPTS',
    SCHEMADASH_BOOTSTRAP_ADMIN_EMAIL: 'CHARTDB_BOOTSTRAP_ADMIN_EMAIL',
    SCHEMADASH_SESSION_TTL_HOURS: 'CHARTDB_SESSION_TTL_HOURS',
    SCHEMADASH_SESSION_COOKIE_NAME: 'CHARTDB_SESSION_COOKIE_NAME',
    SCHEMADASH_SESSION_COOKIE_SECURE: 'CHARTDB_SESSION_COOKIE_SECURE',
    SCHEMADASH_OIDC_ISSUER: 'CHARTDB_OIDC_ISSUER',
    SCHEMADASH_OIDC_CLIENT_ID: 'CHARTDB_OIDC_CLIENT_ID',
    SCHEMADASH_OIDC_CLIENT_SECRET: 'CHARTDB_OIDC_CLIENT_SECRET',
    SCHEMADASH_OIDC_REDIRECT_URL: 'CHARTDB_OIDC_REDIRECT_URL',
    SCHEMADASH_OIDC_LOGOUT_URL: 'CHARTDB_OIDC_LOGOUT_URL',
    SCHEMADASH_OIDC_SCOPES: 'CHARTDB_OIDC_SCOPES',
    SCHEMADASH_DEFAULT_PROJECT_NAME: 'CHARTDB_DEFAULT_PROJECT_NAME',
    SCHEMADASH_DEFAULT_OWNER_NAME: 'CHARTDB_DEFAULT_OWNER_NAME',
} as const;

const applyLegacyServerEnvAliases = (
    input: Record<string, string | undefined>
): {
    resolvedInput: Record<string, string | undefined>;
    warnings: string[];
} => {
    const resolvedInput = { ...input };
    const warnings: string[] = [];

    for (const [modernKey, legacyKey] of Object.entries(
        legacyServerEnvAliases
    )) {
        if (resolvedInput[modernKey] !== undefined) {
            continue;
        }

        const legacyValue = resolvedInput[legacyKey];
        if (legacyValue === undefined) {
            continue;
        }

        resolvedInput[modernKey] = legacyValue;
        warnings.push(`${legacyKey} is deprecated. Prefer ${modernKey}.`);
    }

    return {
        resolvedInput,
        warnings,
    };
};

const envSchema = z.object({
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .optional()
        .default('development'),
    SCHEMADASH_API_HOST: z.string().optional().default('0.0.0.0'),
    SCHEMADASH_API_PORT: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .default(4010),
    SCHEMADASH_CORS_ORIGIN: z.string().optional().default('*'),
    SCHEMADASH_TRUST_PROXY: z.string().trim().optional().default('false'),
    SCHEMADASH_DATA_DIR: z.string().optional(),
    SCHEMADASH_METADATA_DB_PATH: z.string().optional(),
    SCHEMADASH_APP_DB_PATH: z.string().optional(),
    SCHEMADASH_SECRET_KEY: z.string().optional(),
    SCHEMADASH_LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .optional()
        .default('info'),
    SCHEMADASH_AUTH_MODE: z
        .enum(['disabled', 'password', 'oidc'])
        .optional()
        .default('disabled'),
    SCHEMADASH_AUTH_EMAIL: z.string().trim().email().optional(),
    SCHEMADASH_AUTH_PASSWORD: z.string().min(8).optional(),
    SCHEMADASH_AUTH_DISPLAY_NAME: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .optional()
        .default('SchemaDash Owner'),
    SCHEMADASH_BOOTSTRAP_SETUP_CODE: z
        .string()
        .trim()
        .min(8)
        .max(120)
        .optional(),
    SCHEMADASH_BOOTSTRAP_SETUP_CODE_TTL_MS: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .default(15 * 60 * 1000),
    SCHEMADASH_BOOTSTRAP_SETUP_CODE_MAX_ATTEMPTS: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .default(10),
    SCHEMADASH_BOOTSTRAP_ADMIN_EMAIL: z.string().trim().email().optional(),
    SCHEMADASH_SESSION_TTL_HOURS: z.coerce
        .number()
        .int()
        .positive()
        .optional()
        .default(24 * 7),
    SCHEMADASH_SESSION_COOKIE_NAME: z
        .string()
        .trim()
        .min(1)
        .max(120)
        .optional()
        .default('schemadash_session'),
    SCHEMADASH_SESSION_COOKIE_SECURE: z.enum(['true', 'false']).optional(),
    SCHEMADASH_OIDC_ISSUER: z.string().trim().url().optional(),
    SCHEMADASH_OIDC_CLIENT_ID: z.string().trim().min(1).max(255).optional(),
    SCHEMADASH_OIDC_CLIENT_SECRET: z.string().min(1).optional(),
    SCHEMADASH_OIDC_REDIRECT_URL: z.string().trim().url().optional(),
    SCHEMADASH_OIDC_LOGOUT_URL: z.string().trim().url().optional(),
    SCHEMADASH_OIDC_SCOPES: z
        .string()
        .trim()
        .min(1)
        .optional()
        .default('openid profile email'),
    SCHEMADASH_SCHEMA_SYNC_ENABLED: z
        .enum(['true', 'false'])
        .optional()
        .default('false'),
    SCHEMADASH_SCHEMA_SYNC_SERVICE_URL: z.string().trim().url().optional(),
    SCHEMADASH_DEFAULT_PROJECT_NAME: z
        .string()
        .optional()
        .default('My Diagrams'),
    SCHEMADASH_DEFAULT_OWNER_NAME: z.string().optional().default('Local Owner'),
});

const resolveSecretKey = (
    parsedEnv: z.infer<typeof envSchema>,
    nodeEnv: 'development' | 'test' | 'production'
): { value: string; warnings: string[] } => {
    const provided = parsedEnv.SCHEMADASH_SECRET_KEY?.trim();
    const isPlaceholder =
        !provided || provided === 'change-me-before-production';

    if (!isPlaceholder) {
        return {
            value: provided,
            warnings: [],
        };
    }

    if (nodeEnv === 'production') {
        throw new Error(
            'SCHEMADASH_SECRET_KEY must be set to a non-placeholder value in production.'
        );
    }

    return {
        value: randomBytes(32).toString('hex'),
        warnings: [
            'SCHEMADASH_SECRET_KEY is not configured. Using an ephemeral development key.',
        ],
    };
};

const parseTrustProxy = (value: string): boolean | number => {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue || normalizedValue === 'false') {
        return false;
    }

    if (normalizedValue === 'true') {
        return true;
    }

    if (/^\d+$/.test(normalizedValue)) {
        const hops = Number(normalizedValue);
        if (hops === 0) {
            return false;
        }
        return hops;
    }

    throw new Error(
        'SCHEMADASH_TRUST_PROXY must be set to true, false, or a positive hop count.'
    );
};

export interface ServerEnv {
    nodeEnv: 'development' | 'test' | 'production';
    host: string;
    port: number;
    corsOrigin: string;
    trustProxy?: boolean | number;
    logLevel:
        | 'fatal'
        | 'error'
        | 'warn'
        | 'info'
        | 'debug'
        | 'trace'
        | 'silent';
    authMode: 'disabled' | 'password' | 'oidc';
    authEmail: string | null;
    authPassword: string | null;
    authDisplayName: string;
    bootstrapSetupCode: string | null;
    bootstrapSetupCodeTtlMs: number;
    bootstrapSetupCodeMaxAttempts: number;
    bootstrapAdminEmail: string | null;
    sessionTtlHours: number;
    sessionCookieName: string;
    sessionCookieSecure: boolean;
    oidcIssuer: string | null;
    oidcClientId: string | null;
    oidcClientSecret: string | null;
    oidcRedirectUrl: string | null;
    oidcLogoutUrl: string | null;
    oidcScopes: string;
    schemaSyncEnabled: boolean;
    schemaSyncMode: 'disabled' | 'external-service';
    schemaSyncServiceUrl: string | null;
    dataDir: string;
    metadataDbPath: string;
    appDbPath: string;
    encryptionKey: Buffer;
    defaultProjectName: string;
    defaultOwnerName: string;
    runtimeWarnings?: string[];
}

export const parseServerEnv = (
    input: NodeJS.ProcessEnv = process.env
): ServerEnv => {
    const normalizedInput = Object.fromEntries(
        Object.entries(input).map(([key, value]) => [
            key,
            typeof value === 'string' && value.trim().length === 0
                ? undefined
                : value,
        ])
    );
    const { resolvedInput, warnings: legacyWarnings } =
        applyLegacyServerEnvAliases(normalizedInput);
    const parsedEnv = envSchema.parse(resolvedInput);
    const dataDir = parsedEnv.SCHEMADASH_DATA_DIR
        ? path.resolve(parsedEnv.SCHEMADASH_DATA_DIR)
        : path.resolve(repoRoot, '.schemadash-data');

    mkdirSync(dataDir, { recursive: true });

    const authCookieSecure =
        parsedEnv.SCHEMADASH_SESSION_COOKIE_SECURE === undefined
            ? parsedEnv.NODE_ENV === 'production'
            : parsedEnv.SCHEMADASH_SESSION_COOKIE_SECURE === 'true';

    const hasBootstrapEmail = Boolean(parsedEnv.SCHEMADASH_AUTH_EMAIL);
    const hasBootstrapPassword = Boolean(parsedEnv.SCHEMADASH_AUTH_PASSWORD);

    if (
        parsedEnv.SCHEMADASH_AUTH_MODE === 'password' &&
        hasBootstrapEmail !== hasBootstrapPassword
    ) {
        throw new Error(
            'SCHEMADASH_AUTH_EMAIL and SCHEMADASH_AUTH_PASSWORD must be set together when using environment-assisted password bootstrap.'
        );
    }

    if (parsedEnv.SCHEMADASH_AUTH_MODE === 'oidc') {
        const missing = [
            ['SCHEMADASH_OIDC_ISSUER', parsedEnv.SCHEMADASH_OIDC_ISSUER],
            ['SCHEMADASH_OIDC_CLIENT_ID', parsedEnv.SCHEMADASH_OIDC_CLIENT_ID],
            [
                'SCHEMADASH_OIDC_REDIRECT_URL',
                parsedEnv.SCHEMADASH_OIDC_REDIRECT_URL,
            ],
        ]
            .filter(([, value]) => !value)
            .map(([name]) => name);

        if (missing.length > 0) {
            throw new Error(
                `SCHEMADASH_AUTH_MODE=oidc requires OIDC configuration. Missing: ${missing.join(
                    ', '
                )}`
            );
        }
    }

    if (
        parsedEnv.SCHEMADASH_AUTH_MODE !== 'disabled' &&
        parsedEnv.NODE_ENV === 'production' &&
        parsedEnv.SCHEMADASH_CORS_ORIGIN === '*'
    ) {
        throw new Error(
            'SCHEMADASH_CORS_ORIGIN must be set to an explicit origin in production when authentication is enabled.'
        );
    }

    if (
        parsedEnv.SCHEMADASH_AUTH_MODE === 'oidc' &&
        parsedEnv.NODE_ENV === 'production' &&
        parsedEnv.SCHEMADASH_OIDC_REDIRECT_URL &&
        !/^https:\/\//i.test(parsedEnv.SCHEMADASH_OIDC_REDIRECT_URL)
    ) {
        throw new Error(
            'SCHEMADASH_OIDC_REDIRECT_URL must use HTTPS in production.'
        );
    }

    if (
        parsedEnv.NODE_ENV === 'production' &&
        parsedEnv.SCHEMADASH_OIDC_LOGOUT_URL &&
        !/^https:\/\//i.test(parsedEnv.SCHEMADASH_OIDC_LOGOUT_URL)
    ) {
        throw new Error(
            'SCHEMADASH_OIDC_LOGOUT_URL must use HTTPS in production.'
        );
    }

    const schemaSyncEnabled =
        parsedEnv.SCHEMADASH_SCHEMA_SYNC_ENABLED === 'true';
    if (schemaSyncEnabled && !parsedEnv.SCHEMADASH_SCHEMA_SYNC_SERVICE_URL) {
        throw new Error(
            'SCHEMADASH_SCHEMA_SYNC_SERVICE_URL must be set when SCHEMADASH_SCHEMA_SYNC_ENABLED=true.'
        );
    }

    const resolvedSecretKey = resolveSecretKey(parsedEnv, parsedEnv.NODE_ENV);
    const runtimeWarnings = [...legacyWarnings, ...resolvedSecretKey.warnings];

    return {
        nodeEnv: parsedEnv.NODE_ENV,
        host: parsedEnv.SCHEMADASH_API_HOST,
        port: parsedEnv.SCHEMADASH_API_PORT,
        corsOrigin: parsedEnv.SCHEMADASH_CORS_ORIGIN,
        trustProxy: parseTrustProxy(parsedEnv.SCHEMADASH_TRUST_PROXY),
        logLevel: parsedEnv.SCHEMADASH_LOG_LEVEL,
        authMode: parsedEnv.SCHEMADASH_AUTH_MODE,
        authEmail: parsedEnv.SCHEMADASH_AUTH_EMAIL?.toLowerCase() ?? null,
        authPassword: parsedEnv.SCHEMADASH_AUTH_PASSWORD ?? null,
        authDisplayName: parsedEnv.SCHEMADASH_AUTH_DISPLAY_NAME,
        bootstrapSetupCode: parsedEnv.SCHEMADASH_BOOTSTRAP_SETUP_CODE ?? null,
        bootstrapSetupCodeTtlMs:
            parsedEnv.SCHEMADASH_BOOTSTRAP_SETUP_CODE_TTL_MS,
        bootstrapSetupCodeMaxAttempts:
            parsedEnv.SCHEMADASH_BOOTSTRAP_SETUP_CODE_MAX_ATTEMPTS,
        bootstrapAdminEmail:
            parsedEnv.SCHEMADASH_BOOTSTRAP_ADMIN_EMAIL?.toLowerCase() ?? null,
        sessionTtlHours: parsedEnv.SCHEMADASH_SESSION_TTL_HOURS,
        sessionCookieName: parsedEnv.SCHEMADASH_SESSION_COOKIE_NAME,
        sessionCookieSecure: authCookieSecure,
        oidcIssuer: parsedEnv.SCHEMADASH_OIDC_ISSUER ?? null,
        oidcClientId: parsedEnv.SCHEMADASH_OIDC_CLIENT_ID ?? null,
        oidcClientSecret: parsedEnv.SCHEMADASH_OIDC_CLIENT_SECRET ?? null,
        oidcRedirectUrl: parsedEnv.SCHEMADASH_OIDC_REDIRECT_URL ?? null,
        oidcLogoutUrl: parsedEnv.SCHEMADASH_OIDC_LOGOUT_URL ?? null,
        oidcScopes: parsedEnv.SCHEMADASH_OIDC_SCOPES,
        schemaSyncEnabled,
        schemaSyncMode: schemaSyncEnabled ? 'external-service' : 'disabled',
        schemaSyncServiceUrl:
            parsedEnv.SCHEMADASH_SCHEMA_SYNC_SERVICE_URL ?? null,
        dataDir,
        metadataDbPath: parsedEnv.SCHEMADASH_METADATA_DB_PATH
            ? path.resolve(parsedEnv.SCHEMADASH_METADATA_DB_PATH)
            : path.join(dataDir, 'schema-sync.sqlite'),
        appDbPath: parsedEnv.SCHEMADASH_APP_DB_PATH
            ? path.resolve(parsedEnv.SCHEMADASH_APP_DB_PATH)
            : path.join(dataDir, 'schemadash-app.sqlite'),
        encryptionKey: createHash('sha256')
            .update(resolvedSecretKey.value)
            .digest(),
        defaultProjectName: parsedEnv.SCHEMADASH_DEFAULT_PROJECT_NAME,
        defaultOwnerName: parsedEnv.SCHEMADASH_DEFAULT_OWNER_NAME,
        runtimeWarnings:
            runtimeWarnings.length > 0 ? runtimeWarnings : undefined,
    };
};

export const serverEnv: ServerEnv = parseServerEnv();
