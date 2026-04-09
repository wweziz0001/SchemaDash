# SchemaDash Schema Sync Service

This workspace contains the standalone schema sync runtime for SchemaDash.

It is responsible for:

- saved live database connections
- live PostgreSQL schema import
- diff plan generation
- apply execution
- audit records
- apply job state
- schema-sync metadata persistence

The main app now supports only two schema sync modes:

- disabled
- enabled through this external service

There is no supported embedded in-process mode in the main app.

## Main App Configuration

For the full stack, use the repository root
[`/.env.example`](/root/data/SchemaDash/.env.example) as the canonical env
reference.

Configure the main SchemaDash app with:

- `SCHEMADASH_SCHEMA_SYNC_ENABLED=true`
- `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL=http://localhost:4020`

If `SCHEMADASH_SCHEMA_SYNC_ENABLED=false`, the main app keeps running without
schema sync.

## Service Configuration

For service-only local runs, use
[`services/schema-sync-service/.env.example`](/root/data/SchemaDash/services/schema-sync-service/.env.example)
as the focused service-local reference.

The service reads these variables:

- `SCHEMADASH_SCHEMA_SYNC_SERVICE_HOST`
- `SCHEMADASH_SCHEMA_SYNC_SERVICE_PORT`
- `SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR`
- `SCHEMADASH_SCHEMA_SYNC_METADATA_DB_PATH`
- `SCHEMADASH_SCHEMA_SYNC_SECRET_KEY`
- `SCHEMADASH_SCHEMA_SYNC_LOG_LEVEL`

Defaults:

- host: `0.0.0.0`
- port: `4020`
- data dir: `.schemadash-schema-sync-service/`
- metadata DB path: `<data-dir>/schema-sync.sqlite`

## Local Development

Build shared contracts first:

```bash
npm run build -w @schemadash/schema-sync-core
```

Start the service:

```bash
npm run dev -w @schemadash/schema-sync-service
```

Or from the repo root:

```bash
npm run dev:schema-sync-service
```

## Routes

Primary routes:

- `GET /api/connections`
- `GET /api/connections/:id`
- `POST /api/connections`
- `PATCH /api/connections/:id`
- `DELETE /api/connections/:id`
- `POST /api/connections/test`
- `POST /api/schema/import-live`
- `POST /api/schema/diff`
- `POST /api/schema/apply`
- `GET /api/schema/jobs/:id`
- `GET /api/audit/:id`

Internal support routes used by the main app boundary:

- `GET /api/schema/snapshots/:id`
- `GET /api/schema/plans/:id/latest-audit`

Health routes:

- `GET /api/livez`
- `GET /api/readyz`
- `GET /api/health`

## Current Engine Support

Current runtime support:

- PostgreSQL only

The service folder structure is intentionally prepared for future engines under
`src/engines/`, but no other engine runtime is implemented in this task.
