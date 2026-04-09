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
    status: 'disabled' | 'up' | 'down';
    ok: boolean;
    error: string | null;
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

const SCHEMA_SYNC_DISABLED_MESSAGE =
    'Schema sync is disabled for this deployment.';

const createSchemaSyncDisabledError = () =>
    new AppError(SCHEMA_SYNC_DISABLED_MESSAGE, 503, 'schema_sync_disabled');

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

    constructor(serviceUrl: string) {
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

    private async request<T>(
        path: string,
        init?: RequestInit,
        options?: { allowNotFound?: boolean }
    ): Promise<T | null> {
        try {
            const headers = new Headers(init?.headers ?? {});
            if (!headers.has('content-type')) {
                headers.set('content-type', 'application/json');
            }
            const response = await fetch(this.buildUrl(path), {
                ...init,
                headers,
            });
            const text = await response.text();
            const payload = text
                ? (JSON.parse(text) as Record<string, unknown>)
                : {};

            if (options?.allowNotFound && response.status === 404) {
                return null;
            }

            if (!response.ok) {
                const message =
                    typeof payload.error === 'string'
                        ? payload.error
                        : `Schema sync service request to ${path} failed.`;
                throw new AppError(
                    message,
                    response.status,
                    typeof payload.code === 'string' ? payload.code : undefined
                );
            }

            return payload as T;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                'Schema sync service is unavailable.',
                502,
                'schema_sync_service_unavailable'
            );
        }
    }

    async getReadiness(): Promise<SchemaSyncServiceReadiness> {
        try {
            await this.request<{ ok: boolean }>('/api/readyz');
            return {
                enabled: true,
                mode: 'external-service',
                serviceUrl: this.config.serviceUrl,
                status: 'up',
                ok: true,
                error: null,
            };
        } catch (error) {
            return {
                enabled: true,
                mode: 'external-service',
                serviceUrl: this.config.serviceUrl,
                status: 'down',
                ok: false,
                error: error instanceof Error ? error.message : 'Unavailable',
            };
        }
    }

    async listConnections(): Promise<ConnectionSummary[]> {
        const response = await this.request<{ items: ConnectionSummary[] }>(
            '/api/connections'
        );
        return response?.items ?? [];
    }

    async getConnection(
        connectionId: string
    ): Promise<ConnectionSummary | null> {
        const response = await this.request<{ connection: ConnectionSummary }>(
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
            '/api/connections',
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        );
        if (!response) {
            throw new AppError(
                'Schema sync service returned an empty create connection response.',
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
            `/api/connections/${connectionId}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }
        );
        if (!response) {
            throw new AppError(
                'Schema sync service returned an empty update connection response.',
                502,
                'schema_sync_invalid_response'
            );
        }
        return response.connection;
    }

    async deleteConnection(connectionId: string): Promise<void> {
        await this.request<{ ok: boolean }>(
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
            '/api/connections/test',
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
        if (!response) {
            throw new AppError(
                'Schema sync service returned an empty connection test response.',
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
            '/api/schema/import-live',
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
        if (!response) {
            throw new AppError(
                'Schema sync service returned an empty import response.',
                502,
                'schema_sync_invalid_response'
            );
        }
        return response;
    }

    async diffSchema(request: DiffSchemaRequest): Promise<DiffSchemaResponse> {
        const response = await this.request<DiffSchemaResponse>(
            '/api/schema/diff',
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
        if (!response) {
            throw new AppError(
                'Schema sync service returned an empty diff response.',
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
            '/api/schema/apply',
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
        if (!response) {
            throw new AppError(
                'Schema sync service returned an empty apply response.',
                502,
                'schema_sync_invalid_response'
            );
        }
        return response;
    }

    async getApplyJob(jobId: string): Promise<ApplyJobResponse | null> {
        return await this.request<ApplyJobResponse>(
            `/api/schema/jobs/${jobId}`,
            undefined,
            { allowNotFound: true }
        );
    }

    async getAudit(auditId: string): Promise<AuditRecord | null> {
        return await this.request<AuditRecord>(
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
            `/api/schema/plans/${changePlanId}/latest-audit`,
            undefined,
            { allowNotFound: true }
        );
    }

    async getSnapshot(snapshotId: string): Promise<SnapshotRecord | null> {
        return await this.request<SnapshotRecord>(
            `/api/schema/snapshots/${snapshotId}`,
            undefined,
            { allowNotFound: true }
        );
    }
}

export const createSchemaSyncClient = (env: ServerEnv): SchemaSyncClient => {
    if (!env.schemaSyncEnabled || !env.schemaSyncServiceUrl) {
        return new DisabledSchemaSyncClient();
    }

    return new HttpSchemaSyncClient(env.schemaSyncServiceUrl);
};
