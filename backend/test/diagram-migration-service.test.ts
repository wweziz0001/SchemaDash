import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    hashCanonicalSchema,
    type AuditRecord,
    type CanonicalSchema,
} from '@schemadash/schema-sync-core';
import { introspectPostgresSchema } from '../src/postgres/introspection.js';
import { AppRepository } from '../src/repositories/app-repository.js';
import { DiagramWorkflowRepository } from '../src/repositories/diagram-workflow-repository.js';
import { MetadataRepository } from '../src/repositories/metadata-repository.js';
import { DiagramMigrationService } from '../src/services/diagram-migration-service.js';
import type { ApplyService } from '../src/services/apply-service.js';
import type { ConnectionsService } from '../src/services/connections-service.js';
import { PersistenceService } from '../src/services/persistence-service.js';

vi.mock('../src/postgres/introspection.js', () => ({
    introspectPostgresSchema: vi.fn(),
}));

const mockedIntrospectPostgresSchema = vi.mocked(introspectPostgresSchema);
const tempDirs: string[] = [];

const baselineSchema: CanonicalSchema = {
    engine: 'postgresql',
    databaseName: 'warehouse',
    defaultSchemaName: 'public',
    schemaNames: ['public'],
    customTypes: [],
    tables: [
        {
            id: 'users',
            schemaName: 'public',
            name: 'users',
            kind: 'table',
            columns: [
                {
                    id: 'users.id',
                    name: 'id',
                    dataType: 'uuid',
                    nullable: false,
                },
            ],
            primaryKey: {
                id: 'users_pkey',
                name: 'users_pkey',
                columnIds: ['users.id'],
            },
            uniqueConstraints: [],
            indexes: [],
            foreignKeys: [],
            checkConstraints: [],
        },
    ],
};

const targetSchema: CanonicalSchema = {
    ...baselineSchema,
    tables: [
        {
            ...baselineSchema.tables[0],
            columns: [
                ...baselineSchema.tables[0].columns,
                {
                    id: 'users.display_name',
                    name: 'display_name',
                    dataType: 'text',
                    nullable: true,
                },
            ],
        },
    ],
};

const createHarness = () => {
    const dataDir = mkdtempSync(
        path.join(os.tmpdir(), 'schemadash-migration-service-')
    );
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
            tables: [{ id: 'dev-users', name: 'users' }],
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

    workflowRepository.putSnapshot({
        id: 'workflow-live-1',
        diagramId: 'diagram-1',
        snapshotKind: 'live',
        sourceKind: 'introspection',
        connectionId: 'connection-1',
        fingerprint: hashCanonicalSchema(baselineSchema),
        canonicalSchema: baselineSchema,
        diagramDocument: null,
        layoutSource: 'derived',
        basedOnSnapshotId: null,
        createdByUserId: bootstrap.user.id,
        createdAt: '2026-03-28T11:00:00.000Z',
    });
    workflowRepository.putState({
        diagramId: 'diagram-1',
        connectionId: 'connection-1',
        connectionNameCache: 'Warehouse',
        connectionEngine: 'postgresql',
        importedSchemas: ['public'],
        liveSnapshotId: 'workflow-live-1',
        liveFingerprint: hashCanonicalSchema(baselineSchema),
        syncStatus: 'in_sync',
        connectionStatus: 'ok',
        lastConnectedAt: '2026-03-28T11:00:00.000Z',
        lastSyncedAt: '2026-03-28T11:00:00.000Z',
        lastSyncError: null,
        defaultCompareSourceKind: 'live',
        defaultCompareSourceId: 'workflow-live-1',
        createdAt: '2026-03-28T11:00:00.000Z',
        updatedAt: '2026-03-28T11:00:00.000Z',
    });

    const connectionsService = {
        testConnection: vi.fn().mockResolvedValue({
            ok: true,
            databaseName: 'warehouse',
            availableSchemas: ['public'],
        }),
        getDecryptedSecret: vi.fn().mockReturnValue({
            host: 'localhost',
            port: 5432,
            database: 'warehouse',
            username: 'postgres',
            password: 'postgres',
            sslMode: 'disable',
        }),
    } as unknown as ConnectionsService;
    const applyService = {
        applyPlan: vi.fn(),
    } as unknown as ApplyService;
    const migrationService = new DiagramMigrationService(
        workflowRepository,
        metadataRepository,
        persistenceService,
        connectionsService,
        applyService
    );

    return {
        bootstrap,
        workflowRepository,
        metadataRepository,
        migrationService,
        applyPlan: vi.mocked(applyService.applyPlan),
    };
};

beforeEach(() => {
    mockedIntrospectPostgresSchema.mockReset();
});

afterEach(() => {
    while (tempDirs.length > 0) {
        const dir = tempDirs.pop();
        if (dir) {
            rmSync(dir, { recursive: true, force: true });
        }
    }
});

describe('diagram migration service', () => {
    it('updates the workflow live snapshot after a successful apply', async () => {
        const {
            workflowRepository,
            metadataRepository,
            migrationService,
            applyPlan,
        } = createHarness();
        mockedIntrospectPostgresSchema.mockResolvedValue(baselineSchema);
        metadataRepository.putSnapshot({
            id: 'post-apply-1',
            connectionId: 'connection-1',
            kind: 'post_apply',
            fingerprint: hashCanonicalSchema(targetSchema),
            importedSchemas: ['public'],
            schema: targetSchema,
            createdAt: '2026-03-29T18:05:00.000Z',
        });
        applyPlan.mockResolvedValue({
            jobId: 'job-1',
            status: 'succeeded',
            executedStatements: [
                'ALTER TABLE "users" ADD COLUMN "display_name" text;',
            ],
            logs: ['Transaction committed'],
            error: null,
            auditId: 'audit-1',
            postApplySnapshotId: 'post-apply-1',
        });

        const result = await migrationService.applyMigration(
            'diagram-1',
            {
                targetSchema,
                destructiveApproval: {
                    confirmed: true,
                    confirmationText: '',
                },
            },
            null,
            'admin:owner@example.com'
        );

        expect(result.result.status).toBe('succeeded');
        expect(result.result.updatedLiveSnapshotId).toBeTruthy();
        expect(workflowRepository.getState('diagram-1')?.liveFingerprint).toBe(
            hashCanonicalSchema(targetSchema)
        );
        expect(
            workflowRepository.getSnapshot(result.result.updatedLiveSnapshotId!)
                ?.canonicalSchema.tables
        ).toEqual(targetSchema.tables);
    });

    it('returns stored audit logs when apply fails', async () => {
        const { metadataRepository, migrationService, applyPlan } =
            createHarness();
        mockedIntrospectPostgresSchema.mockResolvedValue(baselineSchema);
        applyPlan.mockImplementation(async ({ planId }) => {
            const plan = metadataRepository.getChangePlan(planId)!;
            const audit: AuditRecord = {
                id: 'audit-1',
                actor: 'admin:owner@example.com',
                connectionId: 'connection-1',
                baselineSnapshotId: plan.baselineSnapshotId,
                targetSnapshotId: null,
                preApplySnapshotId: null,
                postApplySnapshotId: null,
                changePlanId: plan.id,
                sqlStatements: plan.sqlStatements,
                warnings: plan.warnings,
                status: 'failed',
                logs: ['Apply requested', 'Transaction rolled back'],
                error: 'Constraint validation failed.',
                createdAt: '2026-03-29T18:10:00.000Z',
                updatedAt: '2026-03-29T18:10:00.000Z',
            };
            metadataRepository.putAudit(audit);
            throw new Error('Constraint validation failed.');
        });

        const result = await migrationService.applyMigration(
            'diagram-1',
            {
                targetSchema,
                destructiveApproval: {
                    confirmed: true,
                    confirmationText: '',
                },
            },
            null,
            'admin:owner@example.com'
        );

        expect(result.result.status).toBe('failed');
        expect(result.result.error).toBe('Constraint validation failed.');
        expect(result.result.logs).toContain('Transaction rolled back');
    });
});
