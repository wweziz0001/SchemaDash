import type { SchemaSyncServiceEnv } from '../config/env.js';
import { createSchemaSyncAdapterRegistry } from '../engines/registry.js';
import { MetadataRepository } from '../repositories/metadata-repository.js';
import { ApplyService } from '../services/apply-service.js';
import { ConnectionsService } from '../services/connections-service.js';
import { SchemaSyncService } from '../services/schema-sync-service.js';

export interface SchemaSyncServiceContext {
    env: SchemaSyncServiceEnv;
    metadataRepository: MetadataRepository;
    connectionsService: ConnectionsService;
    schemaSyncService: SchemaSyncService;
    applyService: ApplyService;
    close: () => void;
}

export const createSchemaSyncServiceContext = (
    env: SchemaSyncServiceEnv,
    options?: {
        metadataRepository?: MetadataRepository;
    }
): SchemaSyncServiceContext => {
    const metadataRepository =
        options?.metadataRepository ??
        new MetadataRepository(env.metadataDbPath);
    const adapterRegistry = createSchemaSyncAdapterRegistry();
    const connectionsService = new ConnectionsService(
        metadataRepository,
        env.encryptionKey,
        adapterRegistry
    );
    const schemaSyncService = new SchemaSyncService(
        metadataRepository,
        connectionsService,
        adapterRegistry
    );
    const applyService = new ApplyService(
        metadataRepository,
        connectionsService,
        schemaSyncService,
        adapterRegistry
    );

    return {
        env,
        metadataRepository,
        connectionsService,
        schemaSyncService,
        applyService,
        close: () => {
            if (!options?.metadataRepository) {
                metadataRepository.close();
            }
        },
    };
};
