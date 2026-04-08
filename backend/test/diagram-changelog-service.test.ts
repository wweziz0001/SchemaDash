import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { CanonicalSchema } from '@schemadash/schema-sync-core';
import { AppRepository } from '../src/repositories/app-repository.js';
import { DiagramWorkflowRepository } from '../src/repositories/diagram-workflow-repository.js';
import { DiagramChangelogService } from '../src/services/diagram-changelog-service.js';
import { PersistenceService } from '../src/services/persistence-service.js';

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
    importedAt: '2026-04-08T10:00:00.000Z',
});

const createHarness = () => {
    const dataDir = mkdtempSync(
        path.join(os.tmpdir(), 'schemadash-changelog-')
    );
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
                createdAt: '2026-04-08T09:00:00.000Z',
                updatedAt: '2026-04-08T09:00:00.000Z',
            },
        },
        bootstrap.user
    );

    const changelogService = new DiagramChangelogService(
        workflowRepository,
        persistenceService
    );

    return {
        actor: bootstrap.user,
        changelogService,
        workflowRepository,
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

describe('diagram changelog service', () => {
    it('stores Development history as immutable changelog entries backed by dedicated snapshots', () => {
        const { actor, changelogService, workflowRepository } = createHarness();

        const result = changelogService.captureEntry(
            'diagram-1',
            {
                eventType: 'save',
                sourceDocumentVersion: 2,
                summary: 'Saved Development changes.',
                canonicalSchema: createCanonicalSchema(
                    'draft_users',
                    'save-fingerprint'
                ),
                diagramDocument: {
                    id: 'diagram-1',
                    name: 'Development Diagram',
                    databaseType: 'postgresql',
                    tables: [{ id: 'dev-users', name: 'draft_users' }],
                    relationships: [],
                    dependencies: [],
                    areas: [],
                    customTypes: [],
                    notes: [],
                    createdAt: '2026-04-08T09:00:00.000Z',
                    updatedAt: '2026-04-08T09:05:00.000Z',
                },
            },
            actor
        );

        expect(result.created).toBe(true);
        expect(result.entry.eventType).toBe('save');
        expect(result.entry.snapshot.fingerprint).toBeTruthy();
        expect(result.entry.snapshot.fingerprint).not.toBe('save-fingerprint');
        expect(workflowRepository.getSnapshot(result.entry.snapshotId)).toEqual(
            expect.objectContaining({
                snapshotKind: 'changelog',
                sourceKind: 'development',
            })
        );
        expect(changelogService.listChangelog('diagram-1', actor)).toHaveLength(
            1
        );
    });

    it('deduplicates no-change auto checkpoints while still allowing a later manual save event', () => {
        const { actor, changelogService } = createHarness();
        const canonicalSchema = createCanonicalSchema(
            'draft_users',
            'checkpoint-fingerprint'
        );
        const diagramDocument = {
            id: 'diagram-1',
            name: 'Development Diagram',
            databaseType: 'postgresql',
            tables: [{ id: 'dev-users', name: 'draft_users' }],
            relationships: [],
            dependencies: [],
            areas: [],
            customTypes: [],
            notes: [],
            createdAt: '2026-04-08T09:00:00.000Z',
            updatedAt: '2026-04-08T09:05:00.000Z',
        };

        const firstCheckpoint = changelogService.captureEntry(
            'diagram-1',
            {
                eventType: 'auto_checkpoint',
                canonicalSchema,
                diagramDocument,
            },
            actor
        );
        const duplicateCheckpoint = changelogService.captureEntry(
            'diagram-1',
            {
                eventType: 'auto_checkpoint',
                canonicalSchema,
                diagramDocument,
            },
            actor
        );
        const manualSave = changelogService.captureEntry(
            'diagram-1',
            {
                eventType: 'save',
                sourceDocumentVersion: 3,
                canonicalSchema,
                diagramDocument,
            },
            actor
        );

        expect(firstCheckpoint.created).toBe(true);
        expect(duplicateCheckpoint.created).toBe(false);
        expect(manualSave.created).toBe(true);
        expect(
            changelogService
                .listChangelog('diagram-1', actor)
                .map((entry) => entry.eventType)
        ).toEqual(['save', 'auto_checkpoint']);
    });
});
