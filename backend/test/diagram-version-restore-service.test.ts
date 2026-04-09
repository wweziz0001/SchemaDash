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
import { DiagramChangelogService } from '../src/services/diagram-changelog-service.js';
import { PersistenceService } from '../src/services/persistence-service.js';
import { DiagramWorkflowService } from '../src/services/diagram-workflow-service.js';
import { DiagramVersionRestoreService } from '../src/services/diagram-version-restore-service.js';
import type { SchemaSyncClient } from '../src/schema-sync/client.js';

const tempDirs: string[] = [];

const createCanonicalSchema = (
    tableName: string,
    fingerprint: string
): CanonicalSchema => ({
    engine: 'postgresql',
    databaseName: 'warehouse',
    defaultSchemaName: 'public',
    schemaNames: ['public'],
    tables: [
        {
            id: `public.${tableName}`,
            schemaName: 'public',
            name: tableName,
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
    fingerprint,
    importedAt: '2026-03-29T14:00:00.000Z',
});

const createHarness = () => {
    const dataDir = mkdtempSync(path.join(os.tmpdir(), 'schemadash-restore-'));
    tempDirs.push(dataDir);

    const appDbPath = path.join(dataDir, 'app.sqlite');
    const appRepository = new AppRepository(appDbPath);
    const workflowRepository = new DiagramWorkflowRepository(appDbPath);
    const persistenceService = new PersistenceService(appRepository, {
        defaultOwnerName: 'Test Owner',
        defaultProjectName: 'Test Project',
    });
    const bootstrap = persistenceService.bootstrap();

    persistenceService.upsertDiagram(
        'diagram-1',
        {
            projectId: bootstrap.defaultProject.id,
            ownerUserId: bootstrap.user.id,
            diagram: {
                id: 'ignored',
                name: 'Development Diagram',
                databaseType: 'postgresql',
                tables: [{ id: 'dev-users', name: 'draft_users' }],
                createdAt: '2026-03-29T10:00:00.000Z',
                updatedAt: '2026-03-29T10:00:00.000Z',
            },
        },
        bootstrap.user
    );

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
            status: 'up',
            ok: true,
            error: null,
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
            createdAt: '2026-03-29T09:00:00.000Z',
            updatedAt: '2026-03-29T09:00:00.000Z',
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
    const changelogService = new DiagramChangelogService(
        workflowRepository,
        persistenceService
    );
    const restoreService = new DiagramVersionRestoreService(
        workflowRepository,
        persistenceService,
        changelogService
    );

    return {
        actor: bootstrap.user,
        appRepository,
        changelogService,
        defaultProjectId: bootstrap.defaultProject.id,
        persistenceService,
        restoreService,
        workflowRepository,
        workflowService,
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

describe('diagram version restore service', () => {
    it('creates a safety snapshot and restores an immutable version into Development', () => {
        const {
            actor,
            appRepository,
            changelogService,
            defaultProjectId,
            persistenceService,
            restoreService,
            workflowRepository,
            workflowService,
        } = createHarness();
        const originalDocument =
            appRepository.getDiagram('diagram-1')?.document ?? null;

        expect(originalDocument).toBeTruthy();

        const version = workflowService.createVersion(
            'diagram-1',
            {
                name: 'Stable release',
                description: 'Saved before the refactor',
                origin: 'manual',
                canonicalSchema: createCanonicalSchema(
                    'draft_users',
                    'original-fingerprint'
                ),
                diagramDocument: originalDocument,
            },
            actor
        );

        const updatedDiagram = persistenceService.upsertDiagram(
            'diagram-1',
            {
                projectId: defaultProjectId,
                ownerUserId: actor.id,
                baseVersion: 1,
                diagram: {
                    id: 'diagram-1',
                    name: 'Refactored Development',
                    databaseType: 'postgresql',
                    tables: [{ id: 'dev-users', name: 'users_v2' }],
                    createdAt: '2026-03-29T10:00:00.000Z',
                    updatedAt: '2026-03-29T11:30:00.000Z',
                },
            },
            actor
        );

        const restoreResult = restoreService.restoreVersionToDevelopment(
            'diagram-1',
            version.id,
            {
                baseVersion: updatedDiagram.collaboration.document.version,
                sessionId: 'session-1',
                currentDevelopmentCanonicalSchema: createCanonicalSchema(
                    'users_v2',
                    'refactor-fingerprint'
                ),
            },
            actor
        );

        expect(restoreResult.restoredVersion.id).toBe(version.id);
        expect(restoreResult.safetySnapshotVersion.origin).toBe(
            'before_restore'
        );
        expect(restoreResult.createdChangelogEntry.eventType).toBe('restore');
        expect(restoreResult.createdChangelogEntry.sourceLabel).toBe(
            'Stable release'
        );
        expect(restoreResult.changelog).toHaveLength(1);
        expect(restoreResult.versions).toHaveLength(2);
        expect(restoreResult.versions.map((item) => item.id)).toEqual(
            expect.arrayContaining([
                version.id,
                restoreResult.safetySnapshotVersion.id,
            ])
        );
        expect(restoreResult.development.name).toBe(
            originalDocument?.name ?? 'Development Diagram'
        );
        expect(restoreResult.development.documentVersion).toBe(3);

        const restoredDocument =
            appRepository.getDiagram('diagram-1')?.document;
        expect(restoredDocument).toEqual(
            expect.objectContaining({
                name: originalDocument?.name,
                tables: originalDocument?.tables,
            })
        );

        const safetySnapshot = workflowRepository.getSnapshot(
            restoreResult.safetySnapshotVersion.snapshotId
        );
        expect(safetySnapshot).toEqual(
            expect.objectContaining({
                snapshotKind: 'system',
                sourceKind: 'development',
                diagramDocument: expect.objectContaining({
                    name: 'Refactored Development',
                    tables: [{ id: 'dev-users', name: 'users_v2' }],
                }),
            })
        );

        const reopenedVersion = workflowService.getVersion(
            'diagram-1',
            version.id,
            actor
        );
        expect(reopenedVersion.snapshot.diagramDocument).toEqual(
            expect.objectContaining({
                name: originalDocument?.name,
                tables: originalDocument?.tables,
            })
        );
        expect(workflowService.listVersions('diagram-1', actor)).toHaveLength(
            2
        );
        expect(changelogService.listChangelog('diagram-1', actor)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    eventType: 'restore',
                    sourceLabel: 'Stable release',
                }),
            ])
        );
    });

    it('reverts Development from a changelog entry while preserving immutable history', () => {
        const {
            actor,
            appRepository,
            changelogService,
            defaultProjectId,
            persistenceService,
            restoreService,
        } = createHarness();

        persistenceService.upsertDiagram(
            'diagram-1',
            {
                projectId: defaultProjectId,
                ownerUserId: actor.id,
                baseVersion: 1,
                diagram: {
                    id: 'diagram-1',
                    name: 'Current Development',
                    databaseType: 'postgresql',
                    tables: [{ id: 'dev-users', name: 'users_live' }],
                    createdAt: '2026-03-29T10:00:00.000Z',
                    updatedAt: '2026-03-29T11:30:00.000Z',
                },
            },
            actor
        );

        const changelogEntry = changelogService.captureEntry(
            'diagram-1',
            {
                eventType: 'save',
                sourceDocumentVersion: 2,
                sourceLabel: 'Before risky refactor',
                canonicalSchema: createCanonicalSchema(
                    'users_v1',
                    'historical-fingerprint'
                ),
                diagramDocument: {
                    id: 'diagram-1',
                    name: 'Historical Development',
                    databaseType: 'postgresql',
                    tables: [{ id: 'dev-users', name: 'users_v1' }],
                    relationships: [],
                    dependencies: [],
                    areas: [],
                    customTypes: [],
                    notes: [],
                    createdAt: '2026-03-29T10:00:00.000Z',
                    updatedAt: '2026-03-29T10:30:00.000Z',
                },
            },
            actor
        ).entry;

        const reverted = restoreService.restoreChangelogEntryToDevelopment(
            'diagram-1',
            changelogEntry.id,
            {
                baseVersion: 2,
                currentDevelopmentCanonicalSchema: createCanonicalSchema(
                    'users_live',
                    'current-fingerprint'
                ),
            },
            actor
        );

        expect(reverted.revertedEntry.id).toBe(changelogEntry.id);
        expect(reverted.createdEntry.eventType).toBe('revert');
        expect(reverted.safetySnapshotVersion.origin).toBe('before_restore');
        expect(reverted.changelog[0]?.eventType).toBe('revert');
        expect(appRepository.getDiagram('diagram-1')?.document).toEqual(
            expect.objectContaining({
                name: 'Historical Development',
                tables: [{ id: 'dev-users', name: 'users_v1' }],
            })
        );
    });

    it('rejects stale restores before mutating Development or creating a safety snapshot', () => {
        const {
            actor,
            appRepository,
            defaultProjectId,
            persistenceService,
            restoreService,
            workflowService,
        } = createHarness();
        const originalDocument =
            appRepository.getDiagram('diagram-1')?.document ?? null;
        const version = workflowService.createVersion(
            'diagram-1',
            {
                name: null,
                description: null,
                origin: 'manual',
                canonicalSchema: createCanonicalSchema(
                    'draft_users',
                    'original-fingerprint'
                ),
                diagramDocument: originalDocument,
            },
            actor
        );

        persistenceService.upsertDiagram(
            'diagram-1',
            {
                projectId: defaultProjectId,
                ownerUserId: actor.id,
                baseVersion: 1,
                diagram: {
                    id: 'diagram-1',
                    name: 'Changed Development',
                    databaseType: 'postgresql',
                    tables: [{ id: 'dev-users', name: 'users_v2' }],
                    createdAt: '2026-03-29T10:00:00.000Z',
                    updatedAt: '2026-03-29T11:30:00.000Z',
                },
            },
            actor
        );

        expect(() =>
            restoreService.restoreVersionToDevelopment(
                'diagram-1',
                version.id,
                {
                    baseVersion: 1,
                    currentDevelopmentCanonicalSchema: createCanonicalSchema(
                        'draft_users',
                        'stale-fingerprint'
                    ),
                },
                actor
            )
        ).toThrowError(/reload the editor/i);

        expect(appRepository.getDiagram('diagram-1')?.document).toEqual(
            expect.objectContaining({
                name: 'Changed Development',
            })
        );
        expect(workflowService.listVersions('diagram-1', actor)).toHaveLength(
            1
        );
    });
});
