import Database from 'better-sqlite3';
import type { CanonicalSchema } from '@schemadash/schema-sync-core';
import {
    diagramWorkflowCompareSourceKindSchema,
    diagramWorkflowConnectionStatusSchema,
    diagramWorkflowLayoutSourceSchema,
    diagramWorkflowSnapshotKindSchema,
    diagramWorkflowSnapshotSourceKindSchema,
    diagramWorkflowSyncStatusSchema,
    type DiagramWorkflowCompareSourceKind,
    type DiagramWorkflowConnectionStatus,
    type DiagramWorkflowLayoutSource,
    type DiagramWorkflowSnapshotKind,
    type DiagramWorkflowSnapshotSourceKind,
    type DiagramWorkflowSyncStatus,
} from '../schemas/diagram-workflow.js';

export interface DiagramWorkflowStateRecord {
    diagramId: string;
    connectionId: string | null;
    connectionNameCache: string | null;
    connectionEngine: string | null;
    importedSchemas: string[];
    liveSnapshotId: string | null;
    liveFingerprint: string | null;
    syncStatus: DiagramWorkflowSyncStatus;
    connectionStatus: DiagramWorkflowConnectionStatus;
    lastConnectedAt: string | null;
    lastSyncedAt: string | null;
    lastSyncError: string | null;
    defaultCompareSourceKind: DiagramWorkflowCompareSourceKind | null;
    defaultCompareSourceId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface DiagramWorkflowSnapshotRecord {
    id: string;
    diagramId: string;
    snapshotKind: DiagramWorkflowSnapshotKind;
    sourceKind: DiagramWorkflowSnapshotSourceKind;
    connectionId: string | null;
    fingerprint: string;
    canonicalSchema: CanonicalSchema;
    diagramDocument: Record<string, unknown> | null;
    layoutSource: DiagramWorkflowLayoutSource;
    basedOnSnapshotId: string | null;
    createdByUserId: string | null;
    createdAt: string;
}

const parseJson = <T>(value: string | null, fallback: T): T =>
    value ? (JSON.parse(value) as T) : fallback;

export class DiagramWorkflowRepository {
    private readonly db: Database.Database;

    constructor(filename: string) {
        this.db = new Database(filename);
        this.initialize();
    }

    close() {
        this.db.close();
    }

    private initialize() {
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS app_migrations (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL
            );
        `);

        const appliedVersions = new Set(
            (
                this.db
                    .prepare(
                        `SELECT version FROM app_migrations ORDER BY version ASC`
                    )
                    .all() as Array<{ version: number }>
            ).map((row) => row.version)
        );

        const migrationVersion = 9;
        if (appliedVersions.has(migrationVersion)) {
            return;
        }

        const now = new Date().toISOString();
        const applyMigration = this.db.transaction(() => {
            this.db.exec(`
                CREATE TABLE IF NOT EXISTS diagram_workflow_state (
                    diagram_id TEXT PRIMARY KEY,
                    connection_id TEXT,
                    connection_name_cache TEXT,
                    connection_engine TEXT,
                    imported_schemas_json TEXT NOT NULL DEFAULT '[]',
                    live_snapshot_id TEXT,
                    live_fingerprint TEXT,
                    sync_status TEXT NOT NULL DEFAULT 'disconnected',
                    connection_status TEXT NOT NULL DEFAULT 'unknown',
                    last_connected_at TEXT,
                    last_synced_at TEXT,
                    last_sync_error TEXT,
                    default_compare_source_kind TEXT,
                    default_compare_source_id TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(diagram_id) REFERENCES app_diagrams(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS diagram_workflow_snapshots (
                    id TEXT PRIMARY KEY,
                    diagram_id TEXT NOT NULL,
                    snapshot_kind TEXT NOT NULL,
                    source_kind TEXT NOT NULL,
                    connection_id TEXT,
                    fingerprint TEXT NOT NULL,
                    canonical_schema_json TEXT NOT NULL,
                    diagram_document_json TEXT,
                    layout_source TEXT NOT NULL DEFAULT 'derived',
                    based_on_snapshot_id TEXT,
                    created_by_user_id TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(diagram_id) REFERENCES app_diagrams(id) ON DELETE CASCADE,
                    FOREIGN KEY(created_by_user_id) REFERENCES app_users(id) ON DELETE SET NULL
                );

                CREATE INDEX IF NOT EXISTS idx_diagram_workflow_snapshots_diagram_kind_created
                ON diagram_workflow_snapshots(diagram_id, snapshot_kind, created_at DESC);
            `);

            this.db
                .prepare(
                    `
                    INSERT INTO app_migrations (version, applied_at)
                    VALUES (?, ?)
                    `
                )
                .run(migrationVersion, now);
        });

        applyMigration();
    }

    getState(diagramId: string): DiagramWorkflowStateRecord | undefined {
        const row = this.db
            .prepare(
                `
                SELECT
                    diagram_id,
                    connection_id,
                    connection_name_cache,
                    connection_engine,
                    imported_schemas_json,
                    live_snapshot_id,
                    live_fingerprint,
                    sync_status,
                    connection_status,
                    last_connected_at,
                    last_synced_at,
                    last_sync_error,
                    default_compare_source_kind,
                    default_compare_source_id,
                    created_at,
                    updated_at
                FROM diagram_workflow_state
                WHERE diagram_id = ?
                `
            )
            .get(diagramId) as Record<string, unknown> | undefined;

        return row ? this.mapState(row) : undefined;
    }

    putState(state: DiagramWorkflowStateRecord) {
        this.db
            .prepare(
                `
                INSERT INTO diagram_workflow_state (
                    diagram_id,
                    connection_id,
                    connection_name_cache,
                    connection_engine,
                    imported_schemas_json,
                    live_snapshot_id,
                    live_fingerprint,
                    sync_status,
                    connection_status,
                    last_connected_at,
                    last_synced_at,
                    last_sync_error,
                    default_compare_source_kind,
                    default_compare_source_id,
                    created_at,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(diagram_id) DO UPDATE SET
                    connection_id = excluded.connection_id,
                    connection_name_cache = excluded.connection_name_cache,
                    connection_engine = excluded.connection_engine,
                    imported_schemas_json = excluded.imported_schemas_json,
                    live_snapshot_id = excluded.live_snapshot_id,
                    live_fingerprint = excluded.live_fingerprint,
                    sync_status = excluded.sync_status,
                    connection_status = excluded.connection_status,
                    last_connected_at = excluded.last_connected_at,
                    last_synced_at = excluded.last_synced_at,
                    last_sync_error = excluded.last_sync_error,
                    default_compare_source_kind = excluded.default_compare_source_kind,
                    default_compare_source_id = excluded.default_compare_source_id,
                    updated_at = excluded.updated_at
                `
            )
            .run(
                state.diagramId,
                state.connectionId,
                state.connectionNameCache,
                state.connectionEngine,
                JSON.stringify(state.importedSchemas),
                state.liveSnapshotId,
                state.liveFingerprint,
                state.syncStatus,
                state.connectionStatus,
                state.lastConnectedAt,
                state.lastSyncedAt,
                state.lastSyncError,
                state.defaultCompareSourceKind,
                state.defaultCompareSourceId,
                state.createdAt,
                state.updatedAt
            );
    }

    putSnapshot(snapshot: DiagramWorkflowSnapshotRecord) {
        this.db
            .prepare(
                `
                INSERT INTO diagram_workflow_snapshots (
                    id,
                    diagram_id,
                    snapshot_kind,
                    source_kind,
                    connection_id,
                    fingerprint,
                    canonical_schema_json,
                    diagram_document_json,
                    layout_source,
                    based_on_snapshot_id,
                    created_by_user_id,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `
            )
            .run(
                snapshot.id,
                snapshot.diagramId,
                snapshot.snapshotKind,
                snapshot.sourceKind,
                snapshot.connectionId,
                snapshot.fingerprint,
                JSON.stringify(snapshot.canonicalSchema),
                snapshot.diagramDocument
                    ? JSON.stringify(snapshot.diagramDocument)
                    : null,
                snapshot.layoutSource,
                snapshot.basedOnSnapshotId,
                snapshot.createdByUserId,
                snapshot.createdAt
            );
    }

    getSnapshot(snapshotId: string): DiagramWorkflowSnapshotRecord | undefined {
        const row = this.db
            .prepare(
                `
                SELECT
                    id,
                    diagram_id,
                    snapshot_kind,
                    source_kind,
                    connection_id,
                    fingerprint,
                    canonical_schema_json,
                    diagram_document_json,
                    layout_source,
                    based_on_snapshot_id,
                    created_by_user_id,
                    created_at
                FROM diagram_workflow_snapshots
                WHERE id = ?
                `
            )
            .get(snapshotId) as Record<string, unknown> | undefined;

        return row ? this.mapSnapshot(row) : undefined;
    }

    private mapState(row: Record<string, unknown>): DiagramWorkflowStateRecord {
        return {
            diagramId: String(row.diagram_id),
            connectionId: row.connection_id ? String(row.connection_id) : null,
            connectionNameCache: row.connection_name_cache
                ? String(row.connection_name_cache)
                : null,
            connectionEngine: row.connection_engine
                ? String(row.connection_engine)
                : null,
            importedSchemas: parseJson<string[]>(
                String(row.imported_schemas_json),
                []
            ),
            liveSnapshotId: row.live_snapshot_id
                ? String(row.live_snapshot_id)
                : null,
            liveFingerprint: row.live_fingerprint
                ? String(row.live_fingerprint)
                : null,
            syncStatus: diagramWorkflowSyncStatusSchema.parse(row.sync_status),
            connectionStatus: diagramWorkflowConnectionStatusSchema.parse(
                row.connection_status
            ),
            lastConnectedAt: row.last_connected_at
                ? String(row.last_connected_at)
                : null,
            lastSyncedAt: row.last_synced_at
                ? String(row.last_synced_at)
                : null,
            lastSyncError: row.last_sync_error
                ? String(row.last_sync_error)
                : null,
            defaultCompareSourceKind: row.default_compare_source_kind
                ? diagramWorkflowCompareSourceKindSchema.parse(
                      row.default_compare_source_kind
                  )
                : null,
            defaultCompareSourceId: row.default_compare_source_id
                ? String(row.default_compare_source_id)
                : null,
            createdAt: String(row.created_at),
            updatedAt: String(row.updated_at),
        };
    }

    private mapSnapshot(
        row: Record<string, unknown>
    ): DiagramWorkflowSnapshotRecord {
        return {
            id: String(row.id),
            diagramId: String(row.diagram_id),
            snapshotKind: diagramWorkflowSnapshotKindSchema.parse(
                row.snapshot_kind
            ),
            sourceKind: diagramWorkflowSnapshotSourceKindSchema.parse(
                row.source_kind
            ),
            connectionId: row.connection_id ? String(row.connection_id) : null,
            fingerprint: String(row.fingerprint),
            canonicalSchema: JSON.parse(
                String(row.canonical_schema_json)
            ) as CanonicalSchema,
            diagramDocument: parseJson<Record<string, unknown> | null>(
                row.diagram_document_json
                    ? String(row.diagram_document_json)
                    : null,
                null
            ),
            layoutSource: diagramWorkflowLayoutSourceSchema.parse(
                row.layout_source
            ),
            basedOnSnapshotId: row.based_on_snapshot_id
                ? String(row.based_on_snapshot_id)
                : null,
            createdByUserId: row.created_by_user_id
                ? String(row.created_by_user_id)
                : null,
            createdAt: String(row.created_at),
        };
    }
}
