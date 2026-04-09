import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    hashCanonicalSchema,
    type CanonicalSchema,
    type ChangePlan,
} from '@schemadash/schema-sync-core';
import { AppRepository } from '../src/repositories/app-repository.js';
import { DiagramWorkflowRepository } from '../src/repositories/diagram-workflow-repository.js';
import { DiagramMigrationService } from '../src/services/diagram-migration-service.js';
import { PersistenceService } from '../src/services/persistence-service.js';
import type { SchemaSyncClient } from '../src/schema-sync/client.js';

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

const createPlan = (): ChangePlan => ({
    id: 'plan-1',
    baselineSnapshotId: 'baseline-snapshot-1',
    connectionId: 'connection-1',
    engine: 'postgresql',
    baselineFingerprint: hashCanonicalSchema(baselineSchema),
    targetFingerprint: hashCanonicalSchema(targetSchema),
    changes: [
        {
            id: 'add-column:users.display_name',
            kind: 'add_column',
            tableId: 'users',
            schemaName: 'public',
            tableName: 'users',
            column: {
                id: 'users.display_name',
                name: 'display_name',
                dataType: 'text',
                nullable: true,
            },
        },
    ],
    warnings: [],
    sqlStatements: [
        'ALTER TABLE "public"."users" ADD COLUMN "display_name" text;',
    ],
    summary: {
        totalChanges: 1,
        safeChanges: 1,
        warningChanges: 0,
        destructiveChanges: 0,
        blockedChanges: 0,
    },
    requiresConfirmation: false,
    blocked: false,
    createdAt: '2026-03-29T18:00:00.000Z',
});

const createHarness = (options?: { includeWorkflowState?: boolean }) => {
    const dataDir = mkdtempSync(
        path.join(os.tmpdir(), 'schemadash-migration-service-')
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
    persistenceService.upsertDiagram('diagram-1', {
        projectId: bootstrap.defaultProject.id,
        ownerUserId: bootstrap.user.id,
        diagram: {
            id: 'ignored',
            name: 'Development Diagram',
            databaseType: 'postgresql',
            tables: [{ id: 'dev-users', name: 'users' }],
            schemaSync: {
                connectionId: 'connection-1',
                baselineSnapshotId: 'baseline-snapshot-1',
                baselineFingerprint: hashCanonicalSchema(baselineSchema),
                importedSchemas: ['public'],
            },
            createdAt: '2026-03-28T10:00:00.000Z',
            updatedAt: '2026-03-28T10:00:00.000Z',
        },
    });

    if (options?.includeWorkflowState !== false) {
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
    }

    const plan = createPlan();
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
            createdAt: '2026-03-28T09:00:00.000Z',
            updatedAt: '2026-03-28T09:00:00.000Z',
        }),
        diffSchema: vi.fn().mockResolvedValue({ plan }),
        testConnection: vi.fn().mockResolvedValue({
            ok: true,
            databaseName: 'warehouse',
            availableSchemas: ['public'],
        }),
        importLiveSchema: vi.fn().mockResolvedValue({
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
            snapshotId: 'live-check-1',
            fingerprint: hashCanonicalSchema(baselineSchema),
            canonicalSchema: baselineSchema,
        }),
        applySchema: vi.fn(),
        getLatestAuditForChangePlan: vi.fn().mockResolvedValue(null),
        getSnapshot: vi.fn().mockResolvedValue(null),
        listConnections: vi.fn(),
        createConnection: vi.fn(),
        updateConnection: vi.fn(),
        deleteConnection: vi.fn(),
        getApplyJob: vi.fn(),
        getAudit: vi.fn(),
    } as unknown as SchemaSyncClient;
    const migrationService = new DiagramMigrationService(
        workflowRepository,
        persistenceService,
        schemaSyncClient
    );

    return {
        bootstrap,
        workflowRepository,
        migrationService,
        schemaSyncClient: {
            diffSchema: vi.mocked(schemaSyncClient.diffSchema),
            testConnection: vi.mocked(schemaSyncClient.testConnection),
            importLiveSchema: vi.mocked(schemaSyncClient.importLiveSchema),
            applySchema: vi.mocked(schemaSyncClient.applySchema),
            getLatestAuditForChangePlan: vi.mocked(
                schemaSyncClient.getLatestAuditForChangePlan
            ),
            getSnapshot: vi.mocked(schemaSyncClient.getSnapshot),
        },
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

describe('diagram migration service', () => {
    it('hydrates missing workflow state from the migration fallback payload', async () => {
        const { workflowRepository, migrationService } = createHarness({
            includeWorkflowState: false,
        });

        const preview = await migrationService.previewMigration('diagram-1', {
            targetSchema,
            expectedLiveSnapshotId: 'workflow-live-1',
            workflowFallback: {
                connectionId: 'connection-1',
                connectionName: 'Warehouse',
                connectionEngine: 'postgresql',
                importedSchemas: ['public'],
                liveSnapshot: {
                    id: 'workflow-live-1',
                    fingerprint: hashCanonicalSchema(baselineSchema),
                    createdAt: '2026-03-28T11:00:00.000Z',
                    canonicalSchema: baselineSchema,
                },
            },
        });

        expect(preview.plan).not.toBeNull();
        expect(workflowRepository.getState('diagram-1')?.connectionId).toBe(
            'connection-1'
        );
        expect(workflowRepository.getState('diagram-1')?.liveSnapshotId).toBe(
            'workflow-live-1'
        );
    });

    it('validates and applies through the schema sync client, then updates the workflow live snapshot', async () => {
        const { workflowRepository, migrationService, schemaSyncClient } =
            createHarness();
        schemaSyncClient.applySchema.mockResolvedValue({
            jobId: 'job-1',
            status: 'succeeded',
            executedStatements: [
                'ALTER TABLE "public"."users" ADD COLUMN "display_name" text;',
            ],
            logs: ['Transaction committed'],
            error: null,
            auditId: 'audit-1',
            postApplySnapshotId: 'post-apply-1',
        });
        schemaSyncClient.getSnapshot.mockResolvedValue({
            id: 'post-apply-1',
            connectionId: 'connection-1',
            kind: 'post_apply',
            fingerprint: hashCanonicalSchema(targetSchema),
            importedSchemas: ['public'],
            schema: targetSchema,
            createdAt: '2026-03-29T18:05:00.000Z',
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

        expect(schemaSyncClient.diffSchema).toHaveBeenCalled();
        expect(schemaSyncClient.testConnection).toHaveBeenCalledWith({
            connectionId: 'connection-1',
        });
        expect(schemaSyncClient.importLiveSchema).toHaveBeenCalledWith({
            connectionId: 'connection-1',
            schemas: ['public'],
        });
        expect(schemaSyncClient.applySchema).toHaveBeenCalledWith({
            planId: 'plan-1',
            actor: 'admin:owner@example.com',
            destructiveApproval: {
                confirmed: true,
                confirmationText: '',
            },
        });
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

    it('returns stored remote audit logs when apply fails', async () => {
        const { migrationService, schemaSyncClient } = createHarness();
        schemaSyncClient.applySchema.mockRejectedValue(
            new Error('Constraint validation failed.')
        );
        schemaSyncClient.getLatestAuditForChangePlan.mockResolvedValue({
            id: 'audit-1',
            actor: 'admin:owner@example.com',
            connectionId: 'connection-1',
            baselineSnapshotId: 'baseline-snapshot-1',
            targetSnapshotId: null,
            preApplySnapshotId: null,
            postApplySnapshotId: null,
            changePlanId: 'plan-1',
            sqlStatements: [
                'ALTER TABLE "public"."users" ADD COLUMN "display_name" text;',
            ],
            warnings: [],
            status: 'failed',
            logs: ['Apply requested', 'Transaction rolled back'],
            error: 'Constraint validation failed.',
            createdAt: '2026-03-29T18:10:00.000Z',
            updatedAt: '2026-03-29T18:10:00.000Z',
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
