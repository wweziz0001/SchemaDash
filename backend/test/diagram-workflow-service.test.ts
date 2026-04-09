import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
    CanonicalSchema,
    ImportLiveSchemaResponse,
} from '@schemadash/schema-sync-core';
import { AppRepository } from '../src/repositories/app-repository.js';
import { DiagramWorkflowRepository } from '../src/repositories/diagram-workflow-repository.js';
import { PersistenceService } from '../src/services/persistence-service.js';
import { DiagramWorkflowService } from '../src/services/diagram-workflow-service.js';
import type { SchemaSyncClient } from '../src/schema-sync/client.js';

const tempDirs: string[] = [];

const createCanonicalSchema = (): CanonicalSchema => ({
    engine: 'postgresql',
    databaseName: 'warehouse',
    defaultSchemaName: 'public',
    schemaNames: ['public'],
    tables: [
        {
            id: 'live-users',
            schemaName: 'public',
            name: 'users',
            columns: [],
            primaryKey: null,
            uniqueConstraints: [],
            indexes: [],
            checkConstraints: [],
            foreignKeys: [],
            comment: null,
            kind: 'table',
        },
    ],
    customTypes: [],
    fingerprint: 'live-fingerprint',
    importedAt: '2026-03-28T14:00:00.000Z',
});

const createHarness = () => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), 'schemadash-workflow-'));
    tempDirs.push(dataDir);

    const appDbPath = path.join(dataDir, 'app.sqlite');
    const appRepository = new AppRepository(appDbPath);
    const workflowRepository = new DiagramWorkflowRepository(appDbPath);
    const persistenceService = new PersistenceService(appRepository, {
        defaultOwnerName: 'Test Owner',
        defaultProjectName: 'Test Project',
    });
    const bootstrap = persistenceService.bootstrap();
    persistenceService.upsertDiagram('diagram-1', {
        projectId: bootstrap.defaultProject.id,
        ownerUserId: bootstrap.user.id,
        diagram: {
            id: 'ignored',
            name: 'Development Diagram',
            databaseType: 'postgresql',
            tables: [{ id: 'dev-users', name: 'draft_users' }],
            createdAt: '2026-03-28T10:00:00.000Z',
            updatedAt: '2026-03-28T10:00:00.000Z',
        },
    });

    const importLiveSchema =
        vi.fn<
            (request: {
                connectionId: string;
                schemas: string[];
            }) => Promise<ImportLiveSchemaResponse>
        >();
    const schemaSyncClient = {
        config: {
            enabled: true,
            mode: 'external-service',
            serviceUrl: 'http://schema-sync.test',
        },
        getReadiness: vi.fn().mockResolvedValue({
            enabled: true,
            mode: 'external-service',
            serviceUrl: 'http://schema-sync.test',
            status: 'ready',
            ok: true,
            error: null,
            errorCode: null,
            checkedAt: '2026-04-09T00:00:00.000Z',
        }),
        getConnection: vi.fn().mockResolvedValue({
            id: 'connection-1',
            name: 'Warehouse',
            engine: 'postgresql',
            defaultSchemas: ['public'],
            host: 'localhost',
            port: 5432,
            database: 'warehouse',
            username: 'postgres',
            createdAt: '2026-03-28T09:00:00.000Z',
            updatedAt: '2026-03-28T09:00:00.000Z',
        }),
        importLiveSchema,
        listConnections: vi.fn(),
        createConnection: vi.fn(),
        updateConnection: vi.fn(),
        deleteConnection: vi.fn(),
        testConnection: vi.fn(),
        diffSchema: vi.fn(),
        applySchema: vi.fn(),
        getApplyJob: vi.fn(),
        getAudit: vi.fn(),
        getLatestAuditForChangePlan: vi.fn(),
        getSnapshot: vi.fn(),
    } as unknown as SchemaSyncClient;
    const workflowService = new DiagramWorkflowService(
        workflowRepository,
        persistenceService,
        schemaSyncClient
    );

    return {
        appRepository,
        actor: bootstrap.user,
        workflowRepository,
        workflowService,
        importLiveSchema,
        getConnection: vi.mocked(schemaSyncClient.getConnection),
    };
};

afterEach(() => {
    while (tempDirs.length > 0) {
        const dir = tempDirs.pop();
        if (dir) {
            rmSync(dir, { recursive: true, force: true });
        }
    }
});

describe('diagram workflow service', () => {
    it('binds a diagram to a saved remote connection without replacing Development', async () => {
        const { appRepository, workflowService, getConnection } =
            createHarness();

        const beforeDocument = appRepository.getDiagram('diagram-1')?.document;
        const workflow = await workflowService.bindConnection('diagram-1', {
            connectionId: 'connection-1',
            importedSchemas: ['public', 'analytics'],
        });

        expect(getConnection).toHaveBeenCalledWith('connection-1');
        expect(workflow.connectionId).toBe('connection-1');
        expect(workflow.importedSchemas).toEqual(['public', 'analytics']);
        expect(workflow.liveSnapshotId).toBeNull();
        expect(workflow.syncStatus).toBe('connected');
        expect(workflow.connectionStatus).toBe('unknown');
        expect(appRepository.getDiagram('diagram-1')?.document).toEqual(
            beforeDocument
        );
    });

    it('stores the live snapshot separately and keeps Development editable state intact during refresh', async () => {
        const {
            appRepository,
            workflowRepository,
            workflowService,
            importLiveSchema,
        } = createHarness();
        const liveSchema = createCanonicalSchema();
        importLiveSchema.mockResolvedValue({
            connection: {
                id: 'connection-1',
                name: 'Warehouse',
                engine: 'postgresql',
                defaultSchemas: ['public'],
                host: 'localhost',
                port: 5432,
                database: 'warehouse',
                username: 'postgres',
                createdAt: '2026-03-28T09:00:00.000Z',
                updatedAt: '2026-03-28T09:00:00.000Z',
            },
            snapshotId: 'metadata-baseline-1',
            fingerprint: liveSchema.fingerprint!,
            canonicalSchema: liveSchema,
        });

        await workflowService.bindConnection('diagram-1', {
            connectionId: 'connection-1',
            importedSchemas: ['public'],
        });
        const beforeDocument = appRepository.getDiagram('diagram-1')?.document;

        const result = await workflowService.refreshLiveSnapshot('diagram-1');

        expect(importLiveSchema).toHaveBeenCalledWith({
            connectionId: 'connection-1',
            schemas: ['public'],
        });
        expect(result.workflow.liveSnapshotId).toBeTruthy();
        expect(result.workflow.liveSnapshot?.canonicalSchema.tables).toEqual(
            liveSchema.tables
        );
        expect(result.workflow.syncStatus).toBe('in_sync');
        expect(result.workflow.connectionStatus).toBe('ok');
        expect(result.compatibilitySync.baselineSnapshotId).toBe(
            'metadata-baseline-1'
        );
        expect(result.compatibilitySync.baselineFingerprint).toBe(
            liveSchema.fingerprint
        );
        expect(
            workflowRepository.getSnapshot(result.workflow.liveSnapshotId!)
        ).toEqual(
            expect.objectContaining({
                snapshotKind: 'live',
                fingerprint: liveSchema.fingerprint,
                canonicalSchema: liveSchema,
            })
        );
        expect(appRepository.getDiagram('diagram-1')?.document).toEqual(
            beforeDocument
        );
    });
});
