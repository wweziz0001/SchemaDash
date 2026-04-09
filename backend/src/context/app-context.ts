import type { ServerEnv } from '../config/env.js';
import { AppRepository } from '../repositories/app-repository.js';
import { DiagramWorkflowRepository } from '../repositories/diagram-workflow-repository.js';
import { MetadataRepository } from '../repositories/metadata-repository.js';
import { ApplyService } from '../services/apply-service.js';
import { AdminService } from '../services/admin-service.js';
import { AuthService } from '../services/auth-service.js';
import { ConnectionsService } from '../services/connections-service.js';
import { DiagramChangelogService } from '../services/diagram-changelog-service.js';
import { DiagramMigrationService } from '../services/diagram-migration-service.js';
import { DiagramVersionRestoreService } from '../services/diagram-version-restore-service.js';
import { DiagramWorkflowService } from '../services/diagram-workflow-service.js';
import { DiagramCollaborationBroker } from '../services/diagram-collaboration-broker.js';
import type { OidcClientProvider } from '../services/oidc-provider.js';
import { PersistenceService } from '../services/persistence-service.js';
import { SchemaSyncService } from '../services/schema-sync-service.js';
import { createSchemaSyncAdapterRegistry } from '../engines/registry.js';

export interface AppContext {
    env: ServerEnv;
    metadataRepository: MetadataRepository;
    appRepository: AppRepository;
    authService: AuthService;
    adminService: AdminService;
    connectionsService: ConnectionsService;
    diagramCollaborationBroker: DiagramCollaborationBroker;
    schemaSyncService: SchemaSyncService;
    applyService: ApplyService;
    diagramMigrationService: DiagramMigrationService;
    persistenceService: PersistenceService;
    diagramWorkflowService: DiagramWorkflowService;
    diagramChangelogService: DiagramChangelogService;
    diagramVersionRestoreService: DiagramVersionRestoreService;
    close: () => void;
}

export const createAppContext = (
    env: ServerEnv,
    options?: {
        metadataRepository?: MetadataRepository;
        appRepository?: AppRepository;
        oidcProvider?: OidcClientProvider;
    }
): AppContext => {
    const metadataRepository =
        options?.metadataRepository ??
        new MetadataRepository(env.metadataDbPath);
    const appRepository =
        options?.appRepository ?? new AppRepository(env.appDbPath);
    const diagramWorkflowRepository = new DiagramWorkflowRepository(
        env.appDbPath
    );
    const authService = new AuthService(
        appRepository,
        env,
        options?.oidcProvider
    );
    const schemaSyncAdapterRegistry = createSchemaSyncAdapterRegistry();
    const diagramCollaborationBroker = new DiagramCollaborationBroker();
    const adminService = new AdminService(appRepository, authService, env);
    const connectionsService = new ConnectionsService(
        metadataRepository,
        env.encryptionKey,
        schemaSyncAdapterRegistry
    );
    const schemaSyncService = new SchemaSyncService(
        metadataRepository,
        connectionsService,
        schemaSyncAdapterRegistry
    );
    const applyService = new ApplyService(
        metadataRepository,
        connectionsService,
        schemaSyncService,
        schemaSyncAdapterRegistry
    );
    const persistenceService = new PersistenceService(
        appRepository,
        {
            defaultOwnerName: env.defaultOwnerName,
            defaultProjectName: env.defaultProjectName,
        },
        {
            authEnabled: env.authMode !== 'disabled',
            collaborationBroker: diagramCollaborationBroker,
        }
    );
    const diagramWorkflowService = new DiagramWorkflowService(
        diagramWorkflowRepository,
        metadataRepository,
        persistenceService,
        schemaSyncService
    );
    const diagramChangelogService = new DiagramChangelogService(
        diagramWorkflowRepository,
        persistenceService
    );
    const diagramVersionRestoreService = new DiagramVersionRestoreService(
        diagramWorkflowRepository,
        persistenceService,
        diagramChangelogService
    );
    const diagramMigrationService = new DiagramMigrationService(
        diagramWorkflowRepository,
        metadataRepository,
        persistenceService,
        connectionsService,
        applyService,
        schemaSyncAdapterRegistry
    );

    return {
        env,
        metadataRepository,
        appRepository,
        authService,
        adminService,
        connectionsService,
        diagramCollaborationBroker,
        schemaSyncService,
        applyService,
        diagramMigrationService,
        persistenceService,
        diagramWorkflowService,
        diagramChangelogService,
        diagramVersionRestoreService,
        close: () => {
            if (!options?.metadataRepository) {
                metadataRepository.close();
            }
            if (!options?.appRepository) {
                appRepository.close();
            }
            diagramWorkflowRepository.close();
        },
    };
};
