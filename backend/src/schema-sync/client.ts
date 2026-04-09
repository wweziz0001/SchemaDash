import { randomUUID } from 'node:crypto';
import type {
    ApplyJobResponse,
    ApplySchemaRequest,
    ApplySchemaResponse,
    AuditRecord,
    ConnectionSummary,
    ConnectionTestRequest,
    ConnectionTestResponse,
    ConnectionUpsert,
    DiffSchemaRequest,
    DiffSchemaResponse,
    ImportLiveSchemaRequest,
    ImportLiveSchemaResponse,
    SnapshotRecord,
} from '@schemadash/schema-sync-core';
import type { ServerEnv } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { getRequestId } from '../utils/request-context.js';

export type SchemaSyncRuntimeMode = 'disabled' | 'external-service';

export interface SchemaSyncClientConfig {
    enabled: boolean;
    mode: SchemaSyncRuntimeMode;
    serviceUrl: string | null;
}

export interface SchemaSyncServiceReadiness {
    enabled: boolean;
    mode: SchemaSyncRuntimeMode;
    serviceUrl: string | null;
    status: 'disabled' | 'ready' | 'not_ready' | 'unavailable';
    ok: boolean;
    error: string | null;
    errorCode: string | null;
    checkedAt: string;
}

export interface SchemaSyncClient {
    readonly config: SchemaSyncClientConfig;
    getReadiness(): Promise<SchemaSyncServiceReadiness>;
    listConnections(): Promise<ConnectionSummary[]>;
    getConnection(connectionId: string): Promise<ConnectionSummary | null>;
    createConnection(payload: ConnectionUpsert): Promise<ConnectionSummary>;
    updateConnection(
        connectionId: string,
        payload: ConnectionUpsert
    ): Promise<ConnectionSummary>;
    deleteConnection(connectionId: string): Promise<void>;
    testConnection(
        request: ConnectionTestRequest
    ): Promise<ConnectionTestResponse>;
    importLiveSchema(
        request: ImportLiveSchemaRequest
    ): Promise<ImportLiveSchemaResponse>;
    diffSchema(request: DiffSchemaRequest): Promise<DiffSchemaResponse>;
    applySchema(request: ApplySchemaRequest): Promise<ApplySchemaResponse>;
    getApplyJob(jobId: string): Promise<ApplyJobResponse | null>;
    getAudit(auditId: string): Promise<AuditRecord | null>;
    getLatestAuditForChangePlan(
        changePlanId: string
    ): Promise<AuditRecord | null>;
    getSnapshot(snapshotId: string): Promise<SnapshotRecord | null>;
}

export interface SchemaSyncClientLogger {
    info: (bindings: Record<string, unknown>, message: string) => void;
    warn: (bindings: Record<string, unknown>, message: string) => void;
    error: (bindings: Record<string, unknown>, message: string) => void;
}

interface CreateSchemaSyncClientOptions {
    logger?: SchemaSyncClientLogger;
}

type SchemaSyncOperation =
    | 'readiness'
    | 'list_connections'
    | 'get_connection'
    | 'create_connection'
    | 'update_connection'
    | 'delete_connection'
    | 'test_connection'
    | 'import_live_schema'
    | 'diff_schema'
    | 'apply_schema'
    | 'get_apply_job'
    | 'get_audit'
    | 'get_latest_audit'
    | 'get_snapshot';

interface SchemaSyncOperationPolicy {
    timeoutMs: number;
    maxRetries: number;
    allowEmptyResponse?: boolean;
}

interface RawSchemaSyncResponse {
    response: Response;
    payload: Record<string, unknown>;
    durationMs: number;
    attempt: number;
    callId: string;
}

const SCHEMA_SYNC_DISABLED_MESSAGE =
    'Schema sync is disabled for this deployment.';

const createSchemaSyncDisabledError = () =>
    new AppError(SCHEMA_SYNC_DISABLED_MESSAGE, 503, 'schema_sync_disabled');

const nullLogger: SchemaSyncClientLogger = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
};

const SCHEMA_SYNC_OPERATION_POLICIES: Record<
    SchemaSyncOperation,
    SchemaSyncOperationPolicy
> = {
    readiness: {
        timeoutMs: 2_000,
        maxRetries: 0,
    },
    list_connections: {
        timeoutMs: 5_000,
        maxRetries: 1,
    },
    get_connection: {
        timeoutMs: 5_000,
        maxRetries: 1,
    },
    create_connection: {
        timeoutMs: 5_000,
        maxRetries: 0,
    },
    update_connection: {
        timeoutMs: 5_000,
        maxRetries: 0,
    },
    delete_connection: {
        timeoutMs: 5_000,
        maxRetries: 0,
    },
    test_connection: {
        timeoutMs: 7_500,
        maxRetries: 1,
    },
    import_live_schema: {
        timeoutMs: 20_000,
        maxRetries: 0,
    },
    diff_schema: {
        timeoutMs: 20_000,
        maxRetries: 0,
    },
    apply_schema: {
        timeoutMs: 45_000,
        maxRetries: 0,
    },
    get_apply_job: {
        timeoutMs: 5_000,
        maxRetries: 1,
    },
    get_audit: {
        timeoutMs: 5_000,
        maxRetries: 1,
    },
    get_latest_audit: {
        timeoutMs: 5_000,
        maxRetries: 1,
    },
    get_snapshot: {
        timeoutMs: 5_000,
        maxRetries: 1,
    },
};

const OPERATION_ACTIONS: Record<SchemaSyncOperation, string> = {
    readiness: 'checking service readiness',
    list_connections: 'listing saved connections',
    get_connection: 'loading the saved connection',
    create_connection: 'creating the connection',
    update_connection: 'updating the connection',
    delete_connection: 'deleting the connection',
    test_connection: 'testing the database connection',
    import_live_schema: 'importing the live schema',
    diff_schema: 'generating the migration preview',
    apply_schema: 'applying the migration',
    get_apply_job: 'loading the apply job status',
    get_audit: 'loading the schema sync audit record',
    get_latest_audit: 'loading the latest schema sync audit record',
    get_snapshot: 'loading the schema sync snapshot',
};

const SUCCESS_LOG_OPERATIONS = new Set<SchemaSyncOperation>([
    'test_connection',
    'import_live_schema',
    'diff_schema',
    'apply_schema',
]);

const RETRY_DELAY_MS = 200;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const sleep = async (durationMs: number) => {
    await new Promise((resolve) => {
        setTimeout(resolve, durationMs);
    });
};

const isRetryableError = (error: unknown) =>
    error instanceof AppError &&
    (error.code === 'schema_sync_timeout' ||
        error.code === 'schema_sync_service_unavailable' ||
        error.code === 'schema_sync_service_not_ready');

class DisabledSchemaSyncClient implements SchemaSyncClient {
    readonly config: SchemaSyncClientConfig = {
        enabled: false,
        mode: 'disabled',
        serviceUrl: null,
    };

    private reject(): never {
        throw createSchemaSyncDisabledError();
    }

    async getReadiness(): Promise<SchemaSyncServiceReadiness> {
        return {
            enabled: false,
            mode: 'disabled',
            serviceUrl: null,
            status: 'disabled',
            ok: true,
            error: null,
            errorCode: null,
            checkedAt: new Date().toISOString(),
        };
    }

    async listConnections(): Promise<ConnectionSummary[]> {
        this.reject();
    }

    async getConnection(): Promise<ConnectionSummary | null> {
        this.reject();
    }

    async createConnection(): Promise<ConnectionSummary> {
        this.reject();
    }

    async updateConnection(): Promise<ConnectionSummary> {
        this.reject();
    }

    async deleteConnection(): Promise<void> {
        this.reject();
    }

    async testConnection(): Promise<ConnectionTestResponse> {
        this.reject();
    }

    async importLiveSchema(): Promise<ImportLiveSchemaResponse> {
        this.reject();
    }

    async diffSchema(): Promise<DiffSchemaResponse> {
        this.reject();
    }

    async applySchema(): Promise<ApplySchemaResponse> {
        this.reject();
    }

    async getApplyJob(): Promise<ApplyJobResponse | null> {
        this.reject();
    }

    async getAudit(): Promise<AuditRecord | null> {
        this.reject();
    }

    async getLatestAuditForChangePlan(): Promise<AuditRecord | null> {
        this.reject();
    }

    async getSnapshot(): Promise<SnapshotRecord | null> {
        this.reject();
    }
}

class HttpSchemaSyncClient implements SchemaSyncClient {
    readonly config: SchemaSyncClientConfig;

    constructor(
        serviceUrl: string,
        private readonly logger: SchemaSyncClientLogger = nullLogger
    ) {
        this.config = {
            enabled: true,
            mode: 'external-service',
            serviceUrl,
        };
    }

    private buildUrl(path: string) {
        return new URL(
            path.replace(/^\//, ''),
            `${this.config.serviceUrl!.replace(/\/+$/, '')}/`
        ).toString();
    }

    private buildHeaders(init?: RequestInit) {
        const headers = new Headers(init?.headers ?? {});
        const hasBody = init?.body !== undefined && init.body !== null;

        if (
            hasBody &&
            !(init?.body instanceof FormData) &&
            !headers.has('content-type')
        ) {
            headers.set('content-type', 'application/json');
        }

        const requestId = getRequestId();
        if (requestId && !headers.has('x-request-id')) {
            headers.set('x-request-id', requestId);
        }

        return headers;
    }

    private parsePayload(
        operation: SchemaSyncOperation,
        text: string,
        allowEmptyResponse: boolean
    ) {
        if (text.length === 0) {
            if (allowEmptyResponse) {
                return {};
            }

            throw new AppError(
                `Schema sync service returned an empty response while ${OPERATION_ACTIONS[operation]}.`,
                502,
                'schema_sync_invalid_response'
            );
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch {
            throw new AppError(
                `Schema sync service returned invalid JSON while ${OPERATION_ACTIONS[operation]}.`,
                502,
                'schema_sync_invalid_response'
            );
        }

        if (!isRecord(parsed)) {
            throw new AppError(
                `Schema sync service returned an invalid response while ${OPERATION_ACTIONS[operation]}.`,
                502,
                'schema_sync_invalid_response'
            );
        }

        return parsed;
    }

    private mapHttpError(
        operation: SchemaSyncOperation,
        path: string,
        statusCode: number,
        payload: Record<string, unknown>
    ) {
        const action = OPERATION_ACTIONS[operation];
        const upstreamMessage =
            typeof payload.error === 'string' ? payload.error : null;
        const upstreamCode =
            typeof payload.code === 'string' ? payload.code : undefined;

        if (statusCode === 503) {
            return new AppError(
                upstreamMessage ??
                    'Schema sync service is enabled but not ready yet.',
                503,
                upstreamCode ?? 'schema_sync_service_not_ready'
            );
        }

        if (upstreamMessage) {
            return new AppError(upstreamMessage, statusCode, upstreamCode);
        }

        if (statusCode >= 500) {
            return new AppError(
                `Schema sync service failed while ${action}.`,
                502,
                'schema_sync_service_error'
            );
        }

        return new AppError(
            `Schema sync service request to ${path} failed while ${action}.`,
            statusCode,
            upstreamCode
        );
    }

    private mapTransportError(
        operation: SchemaSyncOperation,
        error: unknown,
        didTimeout: boolean
    ) {
        if (error instanceof AppError) {
            return error;
        }

        if (didTimeout) {
            return new AppError(
                `Schema sync service timed out while ${OPERATION_ACTIONS[operation]}.`,
                504,
                'schema_sync_timeout'
            );
        }

        return new AppError(
            `Schema sync service is unavailable while ${OPERATION_ACTIONS[operation]}.`,
            502,
            'schema_sync_service_unavailable'
        );
    }

    private extractErrorDetails(error: unknown) {
        if (error instanceof AppError) {
            return {
                message: error.message,
                statusCode: error.statusCode,
                code: error.code ?? null,
            };
        }

        if (error instanceof Error) {
            return {
                message: error.message,
                statusCode: null,
                code: null,
            };
        }

        return {
            message: 'Unknown schema sync client failure.',
            statusCode: null,
            code: null,
        };
    }

    private logSuccess(
        operation: SchemaSyncOperation,
        bindings: Record<string, unknown>
    ) {
        if (SUCCESS_LOG_OPERATIONS.has(operation)) {
            this.logger.info(bindings, 'Schema sync remote call completed');
        }
    }

    private async executeRawRequest(
        operation: SchemaSyncOperation,
        path: string,
        init?: RequestInit,
        options?: {
            allowNotFound?: boolean;
            allowStatusCodes?: number[];
            allowEmptyResponse?: boolean;
        }
    ): Promise<RawSchemaSyncResponse | null> {
        const policy = SCHEMA_SYNC_OPERATION_POLICIES[operation];
        const url = this.buildUrl(path);
        const method = init?.method ?? 'GET';
        const requestId = getRequestId();
        const callId = randomUUID();

        for (let attempt = 1; attempt <= policy.maxRetries + 1; attempt += 1) {
            const startedAt = Date.now();
            const controller = new AbortController();
            const headers = this.buildHeaders(init);
            let didTimeout = false;
            const timeoutHandle = setTimeout(() => {
                didTimeout = true;
                controller.abort();
            }, policy.timeoutMs);

            try {
                const response = await fetch(url, {
                    ...init,
                    headers,
                    signal: controller.signal,
                });
                const durationMs = Date.now() - startedAt;
                const text = await response.text();

                if (options?.allowNotFound && response.status === 404) {
                    return null;
                }

                const payload = this.parsePayload(
                    operation,
                    text,
                    !response.ok ||
                        options?.allowEmptyResponse === true ||
                        policy.allowEmptyResponse === true
                );

                const statusAllowed =
                    response.ok ||
                    options?.allowStatusCodes?.includes(response.status) ===
                        true;
                if (!statusAllowed) {
                    throw this.mapHttpError(
                        operation,
                        path,
                        response.status,
                        payload
                    );
                }

                this.logSuccess(operation, {
                    schemaSync: {
                        callId,
                        requestId,
                        serviceUrl: this.config.serviceUrl,
                        path,
                        method,
                        operation,
                        timeoutMs: policy.timeoutMs,
                        attempt,
                        statusCode: response.status,
                        durationMs,
                    },
                });

                return {
                    response,
                    payload,
                    durationMs,
                    attempt,
                    callId,
                };
            } catch (error) {
                const mappedError = this.mapTransportError(
                    operation,
                    error,
                    didTimeout
                );
                const errorDetails = this.extractErrorDetails(mappedError);
                const canRetry =
                    attempt <= policy.maxRetries &&
                    isRetryableError(mappedError);

                if (canRetry) {
                    this.logger.warn(
                        {
                            schemaSync: {
                                callId,
                                requestId,
                                serviceUrl: this.config.serviceUrl,
                                path,
                                method,
                                operation,
                                timeoutMs: policy.timeoutMs,
                                attempt,
                                maxAttempts: policy.maxRetries + 1,
                                retryDelayMs: RETRY_DELAY_MS,
                                error: errorDetails,
                            },
                        },
                        'Retrying schema sync remote call after a transient failure'
                    );
                    await sleep(RETRY_DELAY_MS);
                    continue;
                }

                const logMethod =
                    errorDetails.code === 'schema_sync_invalid_response'
                        ? this.logger.error
                        : this.logger.warn;
                logMethod(
                    {
                        schemaSync: {
                            callId,
                            requestId,
                            serviceUrl: this.config.serviceUrl,
                            path,
                            method,
                            operation,
                            timeoutMs: policy.timeoutMs,
                            attempt,
                            maxAttempts: policy.maxRetries + 1,
                            error: errorDetails,
                        },
                    },
                    'Schema sync remote call failed'
                );
                throw mappedError;
            } finally {
                clearTimeout(timeoutHandle);
            }
        }

        throw new AppError(
            `Schema sync service request failed while ${OPERATION_ACTIONS[operation]}.`,
            502,
            'schema_sync_service_unavailable'
        );
    }

    private async request<T>(
        operation: SchemaSyncOperation,
        path: string,
        init?: RequestInit,
        options?: { allowNotFound?: boolean; allowEmptyResponse?: boolean }
    ): Promise<T | null> {
        const response = await this.executeRawRequest(operation, path, init, {
            allowNotFound: options?.allowNotFound,
            allowEmptyResponse: options?.allowEmptyResponse,
        });

        if (!response) {
            return null;
        }

        return response.payload as T;
    }

    async getReadiness(): Promise<SchemaSyncServiceReadiness> {
        const checkedAt = new Date().toISOString();

        try {
            const result = await this.executeRawRequest(
                'readiness',
                '/api/readyz',
                undefined,
                {
                    allowStatusCodes: [503],
                }
            );

            if (!result) {
                return {
                    enabled: true,
                    mode: 'external-service',
                    serviceUrl: this.config.serviceUrl,
                    status: 'unavailable',
                    ok: false,
                    error: 'Schema sync service readiness could not be verified.',
                    errorCode: 'schema_sync_service_unavailable',
                    checkedAt,
                };
            }

            if (result.response.ok) {
                return {
                    enabled: true,
                    mode: 'external-service',
                    serviceUrl: this.config.serviceUrl,
                    status: 'ready',
                    ok: true,
                    error: null,
                    errorCode: null,
                    checkedAt,
                };
            }

            const metadataCheck = isRecord(result.payload.checks)
                ? result.payload.checks.metadataDatabase
                : null;
            const metadataStatus =
                isRecord(metadataCheck) &&
                typeof metadataCheck.status === 'string'
                    ? metadataCheck.status
                    : null;

            return {
                enabled: true,
                mode: 'external-service',
                serviceUrl: this.config.serviceUrl,
                status: 'not_ready',
                ok: false,
                error:
                    metadataStatus === 'down'
                        ? 'Schema sync service is alive but not ready yet. The metadata database check is down.'
                        : 'Schema sync service is enabled but not ready yet.',
                errorCode: 'schema_sync_service_not_ready',
                checkedAt,
            };
        } catch (error) {
            return {
                enabled: true,
                mode: 'external-service',
                serviceUrl: this.config.serviceUrl,
                status:
                    error instanceof AppError &&
                    error.code === 'schema_sync_service_not_ready'
                        ? 'not_ready'
                        : 'unavailable',
                ok: false,
                error: error instanceof Error ? error.message : 'Unavailable',
                errorCode:
                    error instanceof AppError ? (error.code ?? null) : null,
                checkedAt,
            };
        }
    }

    async listConnections(): Promise<ConnectionSummary[]> {
        const response = await this.request<{ items: ConnectionSummary[] }>(
            'list_connections',
            '/api/connections'
        );
        return response?.items ?? [];
    }

    async getConnection(
        connectionId: string
    ): Promise<ConnectionSummary | null> {
        const response = await this.request<{ connection: ConnectionSummary }>(
            'get_connection',
            `/api/connections/${connectionId}`,
            undefined,
            { allowNotFound: true }
        );
        return response?.connection ?? null;
    }

    async createConnection(
        payload: ConnectionUpsert
    ): Promise<ConnectionSummary> {
        const response = await this.request<{ connection: ConnectionSummary }>(
            'create_connection',
            '/api/connections',
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        );
        if (!response?.connection) {
            throw new AppError(
                'Schema sync service returned an invalid create connection response.',
                502,
                'schema_sync_invalid_response'
            );
        }
        return response.connection;
    }

    async updateConnection(
        connectionId: string,
        payload: ConnectionUpsert
    ): Promise<ConnectionSummary> {
        const response = await this.request<{ connection: ConnectionSummary }>(
            'update_connection',
            `/api/connections/${connectionId}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }
        );
        if (!response?.connection) {
            throw new AppError(
                'Schema sync service returned an invalid update connection response.',
                502,
                'schema_sync_invalid_response'
            );
        }
        return response.connection;
    }

    async deleteConnection(connectionId: string): Promise<void> {
        await this.request<{ ok: boolean }>(
            'delete_connection',
            `/api/connections/${connectionId}`,
            {
                method: 'DELETE',
            }
        );
    }

    async testConnection(
        request: ConnectionTestRequest
    ): Promise<ConnectionTestResponse> {
        const response = await this.request<ConnectionTestResponse>(
            'test_connection',
            '/api/connections/test',
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
        if (!response || typeof response.ok !== 'boolean') {
            throw new AppError(
                'Schema sync service returned an invalid connection test response.',
                502,
                'schema_sync_invalid_response'
            );
        }
        return response;
    }

    async importLiveSchema(
        request: ImportLiveSchemaRequest
    ): Promise<ImportLiveSchemaResponse> {
        const response = await this.request<ImportLiveSchemaResponse>(
            'import_live_schema',
            '/api/schema/import-live',
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
        if (!response?.snapshotId || !response.fingerprint) {
            throw new AppError(
                'Schema sync service returned an invalid live import response.',
                502,
                'schema_sync_invalid_response'
            );
        }
        return response;
    }

    async diffSchema(request: DiffSchemaRequest): Promise<DiffSchemaResponse> {
        const response = await this.request<DiffSchemaResponse>(
            'diff_schema',
            '/api/schema/diff',
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
        if (!response?.plan) {
            throw new AppError(
                'Schema sync service returned an invalid migration preview response.',
                502,
                'schema_sync_invalid_response'
            );
        }
        return response;
    }

    async applySchema(
        request: ApplySchemaRequest
    ): Promise<ApplySchemaResponse> {
        const response = await this.request<ApplySchemaResponse>(
            'apply_schema',
            '/api/schema/apply',
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
        if (!response?.jobId || typeof response.status !== 'string') {
            throw new AppError(
                'Schema sync service returned an invalid apply response.',
                502,
                'schema_sync_invalid_response'
            );
        }
        return response;
    }

    async getApplyJob(jobId: string): Promise<ApplyJobResponse | null> {
        return await this.request<ApplyJobResponse>(
            'get_apply_job',
            `/api/schema/jobs/${jobId}`,
            undefined,
            { allowNotFound: true }
        );
    }

    async getAudit(auditId: string): Promise<AuditRecord | null> {
        return await this.request<AuditRecord>(
            'get_audit',
            `/api/audit/${auditId}`,
            undefined,
            {
                allowNotFound: true,
            }
        );
    }

    async getLatestAuditForChangePlan(
        changePlanId: string
    ): Promise<AuditRecord | null> {
        return await this.request<AuditRecord>(
            'get_latest_audit',
            `/api/schema/plans/${changePlanId}/latest-audit`,
            undefined,
            { allowNotFound: true }
        );
    }

    async getSnapshot(snapshotId: string): Promise<SnapshotRecord | null> {
        return await this.request<SnapshotRecord>(
            'get_snapshot',
            `/api/schema/snapshots/${snapshotId}`,
            undefined,
            { allowNotFound: true }
        );
    }
}

export const createSchemaSyncClient = (
    env: ServerEnv,
    options?: CreateSchemaSyncClientOptions
): SchemaSyncClient => {
    if (!env.schemaSyncEnabled || !env.schemaSyncServiceUrl) {
        return new DisabledSchemaSyncClient();
    }

    return new HttpSchemaSyncClient(env.schemaSyncServiceUrl, options?.logger);
};
