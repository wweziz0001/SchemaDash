import Database from 'better-sqlite3';
import type { CanonicalSchema } from '@schemadash/schema-sync-core';
import {
    diagramWorkflowCompareSourceKindSchema,
    diagramWorkflowCompareSummarySchema,
    diagramWorkflowChangelogEventTypeSchema,
    diagramWorkflowConnectionStatusSchema,
    diagramWorkflowLayoutSourceSchema,
    diagramWorkflowSnapshotKindSchema,
    diagramWorkflowSnapshotSourceKindSchema,
    diagramWorkflowSyncStatusSchema,
    diagramWorkflowVersionOriginSchema,
    type DiagramWorkflowCompareSourceKind,
    type DiagramWorkflowCompareSummary,
    type DiagramWorkflowChangelogEventType,
    type DiagramWorkflowConnectionStatus,
    type DiagramWorkflowLayoutSource,
    type DiagramWorkflowSnapshotKind,
    type DiagramWorkflowSnapshotSourceKind,
    type DiagramWorkflowSyncStatus,
    type DiagramWorkflowVersionOrigin,
} from '../schemas/diagram-workflow.js';
import type { DiagramDocument } from '../schemas/persistence.js';

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
    diagramDocument: DiagramDocument | null;
    layoutSource: DiagramWorkflowLayoutSource;
    basedOnSnapshotId: string | null;
    createdByUserId: string | null;
    createdAt: string;
}

export interface DiagramWorkflowVersionRecord {
    id: string;
    diagramId: string;
    snapshotId: string;
    name: string | null;
    description: string | null;
    versionLabel: string;
    pinned: boolean;
    origin: DiagramWorkflowVersionOrigin;
    createdByUserId: string | null;
    createdByDisplayName: string | null;
    createdByEmail: string | null;
    createdAt: string;
}

export interface DiagramWorkflowChangelogRecord {
    id: string;
    diagramId: string;
    snapshotId: string;
    eventType: DiagramWorkflowChangelogEventType;
    sessionId: string | null;
    sourceDocumentVersion: number | null;
    sourceLabel: string | null;
    summary: string;
    changeSummary: DiagramWorkflowCompareSummary | null;
    createdByUserId: string | null;
    createdByDisplayName: string | null;
    createdByEmail: string | null;
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

    transaction<T>(callback: () => T): T {
        return this.db.transaction(callback)();
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

        if (!appliedVersions.has(9)) {
            const now = new Date().toISOString();
            this.db.transaction(() => {
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
                    .run(9, now);
            })();
        }

        if (!appliedVersions.has(10)) {
            const now = new Date().toISOString();
            this.db.transaction(() => {
                this.db.exec(`
                    CREATE TABLE IF NOT EXISTS diagram_versions (
                        id TEXT PRIMARY KEY,
                        diagram_id TEXT NOT NULL,
                        snapshot_id TEXT NOT NULL,
                        name TEXT,
                        description TEXT,
                        version_label TEXT NOT NULL,
                        pinned INTEGER NOT NULL DEFAULT 0,
                        origin TEXT NOT NULL DEFAULT 'manual',
                        created_by_user_id TEXT,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY(diagram_id) REFERENCES app_diagrams(id) ON DELETE CASCADE,
                        FOREIGN KEY(snapshot_id) REFERENCES diagram_workflow_snapshots(id) ON DELETE CASCADE,
                        FOREIGN KEY(created_by_user_id) REFERENCES app_users(id) ON DELETE SET NULL
                    );

                    CREATE INDEX IF NOT EXISTS idx_diagram_versions_diagram_created
                    ON diagram_versions(diagram_id, created_at DESC);

                    CREATE INDEX IF NOT EXISTS idx_diagram_versions_snapshot
                    ON diagram_versions(snapshot_id);
                `);

                this.db
                    .prepare(
                        `
                        INSERT INTO app_migrations (version, applied_at)
                        VALUES (?, ?)
                        `
                    )
                    .run(10, now);
            })();
        }

        if (!appliedVersions.has(11)) {
            const now = new Date().toISOString();
            this.db.transaction(() => {
                this.db.exec(`
                    CREATE TABLE IF NOT EXISTS diagram_changelog_entries (
                        id TEXT PRIMARY KEY,
                        diagram_id TEXT NOT NULL,
                        snapshot_id TEXT NOT NULL,
                        event_type TEXT NOT NULL,
                        session_id TEXT,
                        source_document_version INTEGER,
                        source_label TEXT,
                        summary TEXT NOT NULL,
                        change_summary_json TEXT,
                        created_by_user_id TEXT,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY(diagram_id) REFERENCES app_diagrams(id) ON DELETE CASCADE,
                        FOREIGN KEY(snapshot_id) REFERENCES diagram_workflow_snapshots(id) ON DELETE CASCADE,
                        FOREIGN KEY(created_by_user_id) REFERENCES app_users(id) ON DELETE SET NULL
                    );

                    CREATE INDEX IF NOT EXISTS idx_diagram_changelog_entries_diagram_created
                    ON diagram_changelog_entries(diagram_id, created_at DESC);

                    CREATE INDEX IF NOT EXISTS idx_diagram_changelog_entries_snapshot
                    ON diagram_changelog_entries(snapshot_id);
                `);

                this.db
                    .prepare(
                        `
                        INSERT INTO app_migrations (version, applied_at)
                        VALUES (?, ?)
                        `
                    )
                    .run(11, now);
            })();
        }
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

    putVersion(version: DiagramWorkflowVersionRecord) {
        this.db
            .prepare(
                `
                INSERT INTO diagram_versions (
                    id,
                    diagram_id,
                    snapshot_id,
                    name,
                    description,
                    version_label,
                    pinned,
                    origin,
                    created_by_user_id,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `
            )
            .run(
                version.id,
                version.diagramId,
                version.snapshotId,
                version.name,
                version.description,
                version.versionLabel,
                version.pinned ? 1 : 0,
                version.origin,
                version.createdByUserId,
                version.createdAt
            );
    }

    putChangelogEntry(entry: DiagramWorkflowChangelogRecord) {
        this.db
            .prepare(
                `
                INSERT INTO diagram_changelog_entries (
                    id,
                    diagram_id,
                    snapshot_id,
                    event_type,
                    session_id,
                    source_document_version,
                    source_label,
                    summary,
                    change_summary_json,
                    created_by_user_id,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `
            )
            .run(
                entry.id,
                entry.diagramId,
                entry.snapshotId,
                entry.eventType,
                entry.sessionId,
                entry.sourceDocumentVersion,
                entry.sourceLabel,
                entry.summary,
                entry.changeSummary
                    ? JSON.stringify(entry.changeSummary)
                    : null,
                entry.createdByUserId,
                entry.createdAt
            );
    }

    deleteVersion(versionId: string) {
        this.db
            .prepare(
                `
                DELETE FROM diagram_versions
                WHERE id = ?
                `
            )
            .run(versionId);
    }

    deleteSnapshot(snapshotId: string) {
        this.db
            .prepare(
                `
                DELETE FROM diagram_workflow_snapshots
                WHERE id = ?
                `
            )
            .run(snapshotId);
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

    getVersion(versionId: string): DiagramWorkflowVersionRecord | undefined {
        const row = this.db
            .prepare(
                `
                SELECT
                    version.id,
                    version.diagram_id,
                    version.snapshot_id,
                    version.name,
                    version.description,
                    version.version_label,
                    version.pinned,
                    version.origin,
                    version.created_by_user_id,
                    version.created_at,
                    user.display_name AS created_by_display_name,
                    user.email AS created_by_email
                FROM diagram_versions AS version
                LEFT JOIN app_users AS user
                    ON user.id = version.created_by_user_id
                WHERE version.id = ?
                `
            )
            .get(versionId) as Record<string, unknown> | undefined;

        return row ? this.mapVersion(row) : undefined;
    }

    getChangelogEntry(
        entryId: string
    ): DiagramWorkflowChangelogRecord | undefined {
        const row = this.db
            .prepare(
                `
                SELECT
                    entry.id,
                    entry.diagram_id,
                    entry.snapshot_id,
                    entry.event_type,
                    entry.session_id,
                    entry.source_document_version,
                    entry.source_label,
                    entry.summary,
                    entry.change_summary_json,
                    entry.created_by_user_id,
                    entry.created_at,
                    user.display_name AS created_by_display_name,
                    user.email AS created_by_email
                FROM diagram_changelog_entries AS entry
                LEFT JOIN app_users AS user
                    ON user.id = entry.created_by_user_id
                WHERE entry.id = ?
                `
            )
            .get(entryId) as Record<string, unknown> | undefined;

        return row ? this.mapChangelogEntry(row) : undefined;
    }

    listVersions(diagramId: string): DiagramWorkflowVersionRecord[] {
        const rows = this.db
            .prepare(
                `
                SELECT
                    version.id,
                    version.diagram_id,
                    version.snapshot_id,
                    version.name,
                    version.description,
                    version.version_label,
                    version.pinned,
                    version.origin,
                    version.created_by_user_id,
                    version.created_at,
                    user.display_name AS created_by_display_name,
                    user.email AS created_by_email
                FROM diagram_versions AS version
                LEFT JOIN app_users AS user
                    ON user.id = version.created_by_user_id
                WHERE version.diagram_id = ?
                ORDER BY version.created_at DESC
                `
            )
            .all(diagramId) as Array<Record<string, unknown>>;

        return rows.map((row) => this.mapVersion(row));
    }

    listChangelogEntries(diagramId: string): DiagramWorkflowChangelogRecord[] {
        const rows = this.db
            .prepare(
                `
                SELECT
                    entry.id,
                    entry.diagram_id,
                    entry.snapshot_id,
                    entry.event_type,
                    entry.session_id,
                    entry.source_document_version,
                    entry.source_label,
                    entry.summary,
                    entry.change_summary_json,
                    entry.created_by_user_id,
                    entry.created_at,
                    user.display_name AS created_by_display_name,
                    user.email AS created_by_email
                FROM diagram_changelog_entries AS entry
                LEFT JOIN app_users AS user
                    ON user.id = entry.created_by_user_id
                WHERE entry.diagram_id = ?
                ORDER BY entry.created_at DESC
                `
            )
            .all(diagramId) as Array<Record<string, unknown>>;

        return rows.map((row) => this.mapChangelogEntry(row));
    }

    getLatestChangelogEntry(
        diagramId: string
    ): DiagramWorkflowChangelogRecord | undefined {
        const row = this.db
            .prepare(
                `
                SELECT
                    entry.id,
                    entry.diagram_id,
                    entry.snapshot_id,
                    entry.event_type,
                    entry.session_id,
                    entry.source_document_version,
                    entry.source_label,
                    entry.summary,
                    entry.change_summary_json,
                    entry.created_by_user_id,
                    entry.created_at,
                    user.display_name AS created_by_display_name,
                    user.email AS created_by_email
                FROM diagram_changelog_entries AS entry
                LEFT JOIN app_users AS user
                    ON user.id = entry.created_by_user_id
                WHERE entry.diagram_id = ?
                ORDER BY entry.created_at DESC
                LIMIT 1
                `
            )
            .get(diagramId) as Record<string, unknown> | undefined;

        return row ? this.mapChangelogEntry(row) : undefined;
    }

    countVersions(diagramId: string): number {
        const row = this.db
            .prepare(
                `
                SELECT COUNT(*) AS count
                FROM diagram_versions
                WHERE diagram_id = ?
                `
            )
            .get(diagramId) as { count: number };

        return row.count;
    }

    countVersionsBySnapshot(snapshotId: string): number {
        const row = this.db
            .prepare(
                `
                SELECT COUNT(*) AS count
                FROM diagram_versions
                WHERE snapshot_id = ?
                `
            )
            .get(snapshotId) as { count: number };

        return row.count;
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
            diagramDocument: parseJson<DiagramDocument | null>(
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

    private mapVersion(
        row: Record<string, unknown>
    ): DiagramWorkflowVersionRecord {
        return {
            id: String(row.id),
            diagramId: String(row.diagram_id),
            snapshotId: String(row.snapshot_id),
            name: row.name ? String(row.name) : null,
            description: row.description ? String(row.description) : null,
            versionLabel: String(row.version_label),
            pinned: Number(row.pinned) === 1,
            origin: diagramWorkflowVersionOriginSchema.parse(row.origin),
            createdByUserId: row.created_by_user_id
                ? String(row.created_by_user_id)
                : null,
            createdByDisplayName: row.created_by_display_name
                ? String(row.created_by_display_name)
                : null,
            createdByEmail: row.created_by_email
                ? String(row.created_by_email)
                : null,
            createdAt: String(row.created_at),
        };
    }

    private mapChangelogEntry(
        row: Record<string, unknown>
    ): DiagramWorkflowChangelogRecord {
        return {
            id: String(row.id),
            diagramId: String(row.diagram_id),
            snapshotId: String(row.snapshot_id),
            eventType: diagramWorkflowChangelogEventTypeSchema.parse(
                row.event_type
            ),
            sessionId: row.session_id ? String(row.session_id) : null,
            sourceDocumentVersion:
                row.source_document_version === null ||
                row.source_document_version === undefined
                    ? null
                    : Number(row.source_document_version),
            sourceLabel: row.source_label ? String(row.source_label) : null,
            summary: String(row.summary),
            changeSummary: row.change_summary_json
                ? diagramWorkflowCompareSummarySchema.parse(
                      JSON.parse(String(row.change_summary_json))
                  )
                : null,
            createdByUserId: row.created_by_user_id
                ? String(row.created_by_user_id)
                : null,
            createdByDisplayName: row.created_by_display_name
                ? String(row.created_by_display_name)
                : null,
            createdByEmail: row.created_by_email
                ? String(row.created_by_email)
                : null,
            createdAt: String(row.created_at),
        };
    }
}
