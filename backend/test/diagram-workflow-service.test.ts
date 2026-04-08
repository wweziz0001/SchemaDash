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
import { MetadataRepository } from '../src/repositories/metadata-repository.js';
import { PersistenceService } from '../src/services/persistence-service.js';
import { DiagramWorkflowService } from '../src/services/diagram-workflow-service.js';
import type { SchemaSyncService } from '../src/services/schema-sync-service.js';

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
    const metadataDbPath = path.join(dataDir, 'metadata.sqlite');
    const appRepository = new AppRepository(appDbPath);
    const workflowRepository = new DiagramWorkflowRepository(appDbPath);
    const metadataRepository = new MetadataRepository(metadataDbPath);
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

    metadataRepository.putConnection({
        id: 'connection-1',
        name: 'Warehouse',
        engine: 'postgresql',
        defaultSchemas: ['public'],
        host: 'localhost',
        port: 5432,
        database: 'warehouse',
        username: 'postgres',
        secretCiphertext: 'ciphertext',
        createdAt: '2026-03-28T09:00:00.000Z',
        updatedAt: '2026-03-28T09:00:00.000Z',
    });

    const importLiveSchema =
        vi.fn<
            (request: {
                connectionId: string;
                schemas: string[];
            }) => Promise<ImportLiveSchemaResponse>
        >();
    const schemaSyncService = {
        importLiveSchema,
    } as unknown as SchemaSyncService;
    const workflowService = new DiagramWorkflowService(
        workflowRepository,
        metadataRepository,
        persistenceService,
        schemaSyncService
    );

    return {
        appRepository,
        actor: bootstrap.user,
        defaultProjectId: bootstrap.defaultProject.id,
        workflowRepository,
        metadataRepository,
        persistenceService,
        workflowService,
        importLiveSchema,
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
    it('binds a diagram to a saved connection without replacing Development', () => {
        const { appRepository, workflowService } = createHarness();

        const beforeDocument = appRepository.getDiagram('diagram-1')?.document;
        const workflow = workflowService.bindConnection('diagram-1', {
            connectionId: 'connection-1',
            importedSchemas: ['public', 'analytics'],
        });

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
            fingerprint: liveSchema.fingerprint,
            canonicalSchema: liveSchema,
        });

        workflowService.bindConnection('diagram-1', {
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

    it('creates immutable version snapshots that can be listed and opened later', () => {
        const {
            actor,
            appRepository,
            defaultProjectId,
            persistenceService,
            workflowRepository,
            workflowService,
        } = createHarness();
        const developmentDocument =
            appRepository.getDiagram('diagram-1')?.document ?? null;

        expect(developmentDocument).toBeTruthy();

        const createdVersion = workflowService.createVersion(
            'diagram-1',
            {
                name: null,
                description: 'Before the rename',
                origin: 'manual',
                canonicalSchema: createCanonicalSchema(),
                diagramDocument: developmentDocument,
            },
            actor
        );

        expect(createdVersion.versionLabel).toBe('Version 1');
        expect(createdVersion.description).toBe('Before the rename');
        expect(createdVersion.createdBy?.displayName).toBe('Test Owner');
        expect(createdVersion.snapshot.diagramDocument).toEqual(
            developmentDocument
        );
        expect(
            workflowRepository.getSnapshot(createdVersion.snapshotId)
        ).toEqual(
            expect.objectContaining({
                snapshotKind: 'version',
                sourceKind: 'development',
            })
        );

        const listedVersions = workflowService.listVersions('diagram-1', actor);
        expect(listedVersions).toHaveLength(1);
        expect(listedVersions[0]).toEqual(
            expect.objectContaining({
                id: createdVersion.id,
                description: 'Before the rename',
                versionLabel: 'Version 1',
            })
        );

        persistenceService.upsertDiagram('diagram-1', {
            projectId: defaultProjectId,
            ownerUserId: actor.id,
            diagram: {
                ...developmentDocument!,
                name: 'Renamed Development Diagram',
                updatedAt: '2026-03-28T12:00:00.000Z',
            },
        });

        const reopenedVersion = workflowService.getVersion(
            'diagram-1',
            createdVersion.id,
            actor
        );

        expect(reopenedVersion.snapshot.diagramDocument?.name).toBe(
            'Development Diagram'
        );
        expect(appRepository.getDiagram('diagram-1')?.document.name).toBe(
            'Renamed Development Diagram'
        );
    });

    it('deletes a saved version and removes its snapshot from history', () => {
        const { actor, appRepository, workflowRepository, workflowService } =
            createHarness();
        const developmentDocument =
            appRepository.getDiagram('diagram-1')?.document ?? null;

        const versionOne = workflowService.createVersion(
            'diagram-1',
            {
                name: 'Version One',
                description: null,
                origin: 'manual',
                canonicalSchema: createCanonicalSchema(),
                diagramDocument: developmentDocument,
            },
            actor
        );
        const versionTwo = workflowService.createVersion(
            'diagram-1',
            {
                name: 'Version Two',
                description: null,
                origin: 'manual',
                canonicalSchema: createCanonicalSchema(),
                diagramDocument: developmentDocument,
            },
            actor
        );

        const result = workflowService.deleteVersion(
            'diagram-1',
            versionOne.id,
            actor
        );

        expect(result.deletedVersionId).toBe(versionOne.id);
        expect(result.versions).toHaveLength(1);
        expect(result.versions[0]?.id).toBe(versionTwo.id);
        expect(workflowRepository.getVersion(versionOne.id)).toBeUndefined();
        expect(
            workflowRepository.getSnapshot(versionOne.snapshotId)
        ).toBeUndefined();
        expect(workflowService.listVersions('diagram-1', actor)).toHaveLength(
            1
        );
    });
});
