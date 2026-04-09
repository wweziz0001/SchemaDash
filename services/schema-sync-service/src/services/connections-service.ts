import type {
    ConnectionSummary,
    ConnectionTestRequest,
    ConnectionTestResponse,
    ConnectionUpsert,
    DatabaseConnectionSecret,
} from '@schemadash/schema-sync-core';
import { decryptJson, encryptJson } from '../security/encryption.js';
import type { MetadataRepository } from '../repositories/metadata-repository.js';
import { generateId } from '../utils/id.js';
import { AppError } from '../utils/app-error.js';
import type { SchemaSyncAdapterRegistry } from '../engines/registry.js';

export class ConnectionsService {
    constructor(
        private readonly repository: MetadataRepository,
        private readonly encryptionKey: Buffer,
        private readonly adapterRegistry: SchemaSyncAdapterRegistry
    ) {}

    listConnections(): ConnectionSummary[] {
        return this.repository.listConnections();
    }

    getDecryptedSecret(connectionId: string): DatabaseConnectionSecret {
        const connection = this.getConnection(connectionId);
        if (!connection) {
            throw new AppError(
                `Connection ${connectionId} not found.`,
                404,
                'connection_not_found'
            );
        }
        return decryptJson<DatabaseConnectionSecret>(
            connection.secretCiphertext,
            this.encryptionKey
        );
    }

    getConnection(connectionId: string) {
        return this.repository.getConnection(connectionId);
    }

    createConnection(payload: ConnectionUpsert): ConnectionSummary {
        const now = new Date().toISOString();
        const id = generateId();
        this.repository.putConnection({
            id,
            name: payload.name,
            engine: payload.engine,
            defaultSchemas: payload.defaultSchemas,
            host: payload.secret.host,
            port: payload.secret.port,
            database: payload.secret.database,
            username: payload.secret.username,
            secretCiphertext: encryptJson(payload.secret, this.encryptionKey),
            createdAt: now,
            updatedAt: now,
        });

        return this.repository
            .listConnections()
            .find((item) => item.id === id)!;
    }

    updateConnection(id: string, payload: ConnectionUpsert): ConnectionSummary {
        const existing = this.repository.getConnection(id);
        if (!existing) {
            throw new AppError(
                `Connection ${id} not found.`,
                404,
                'connection_not_found'
            );
        }

        this.repository.putConnection({
            ...existing,
            name: payload.name,
            engine: payload.engine,
            defaultSchemas: payload.defaultSchemas,
            host: payload.secret.host,
            port: payload.secret.port,
            database: payload.secret.database,
            username: payload.secret.username,
            secretCiphertext: encryptJson(payload.secret, this.encryptionKey),
            updatedAt: new Date().toISOString(),
        });

        return this.repository
            .listConnections()
            .find((item) => item.id === id)!;
    }

    deleteConnection(id: string) {
        const existing = this.repository.getConnection(id);
        if (!existing) {
            throw new AppError(
                `Connection ${id} not found.`,
                404,
                'connection_not_found'
            );
        }

        this.repository.deleteConnection(id);
    }

    async testConnection(
        request: ConnectionTestRequest
    ): Promise<ConnectionTestResponse> {
        const connection = request.connectionId
            ? this.getConnection(request.connectionId)
            : null;
        const secret = connection
            ? this.getDecryptedSecret(request.connectionId!)
            : request.connection?.secret;
        const engine = connection?.engine ?? request.connection?.engine;

        if (!secret || !engine) {
            return {
                ok: false,
                error: 'Connection details are required.',
                availableSchemas: [],
            };
        }

        try {
            const adapter = this.adapterRegistry.resolve(engine);
            const result = await adapter.testConnection(secret);
            return result;
        } catch (error) {
            return {
                ok: false,
                availableSchemas: [],
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unable to connect to the database.',
            };
        }
    }
}
