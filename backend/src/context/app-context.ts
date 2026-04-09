import type { ServerEnv } from '../config/env.js';
import { AppRepository } from '../repositories/app-repository.js';
import { DiagramWorkflowRepository } from '../repositories/diagram-workflow-repository.js';
import { AdminService } from '../services/admin-service.js';
import { AuthService } from '../services/auth-service.js';
import { DiagramChangelogService } from '../services/diagram-changelog-service.js';
import { DiagramMigrationService } from '../services/diagram-migration-service.js';
import { DiagramVersionRestoreService } from '../services/diagram-version-restore-service.js';
import { DiagramWorkflowService } from '../services/diagram-workflow-service.js';
import { DiagramCollaborationBroker } from '../services/diagram-collaboration-broker.js';
import type { OidcClientProvider } from '../services/oidc-provider.js';
import { PersistenceService } from '../services/persistence-service.js';
import {
    createSchemaSyncClient,
    type SchemaSyncClient,
} from '../schema-sync/client.js';

export interface AppContext {
    env: ServerEnv;
    appRepository: AppRepository;
    authService: AuthService;
    adminService: AdminService;
    diagramCollaborationBroker: DiagramCollaborationBroker;
    schemaSyncClient: SchemaSyncClient;
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
        appRepository?: AppRepository;
        oidcProvider?: OidcClientProvider;
        schemaSyncClient?: SchemaSyncClient;
    }
): AppContext => {
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
    const schemaSyncClient =
        options?.schemaSyncClient ?? createSchemaSyncClient(env);
    const diagramCollaborationBroker = new DiagramCollaborationBroker();
    const adminService = new AdminService(appRepository, authService, env);
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
        persistenceService,
        schemaSyncClient
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
        persistenceService,
        schemaSyncClient
    );

    return {
        env,
        appRepository,
        authService,
        adminService,
        diagramCollaborationBroker,
        schemaSyncClient,
        diagramMigrationService,
        persistenceService,
        diagramWorkflowService,
        diagramChangelogService,
        diagramVersionRestoreService,
        close: () => {
            if (!options?.appRepository) {
                appRepository.close();
            }
            diagramWorkflowRepository.close();
        },
    };
};
