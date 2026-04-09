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
- `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL=http://localhost:4020` for local
  host-based development
- `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL=http://schema-sync-adapter:4020` for
  Docker Compose deployments

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
- `SCHEMADASH_SECRET_KEY` as an optional fallback secret source
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

To connect the main app to the local service outside Docker, set:

```dotenv
SCHEMADASH_SCHEMA_SYNC_ENABLED=true
SCHEMADASH_SCHEMA_SYNC_SERVICE_URL=http://localhost:4020
```

## Docker

Build the standalone image from the repository root so the workspace build can
see `shared/schema-sync-core`:

```bash
docker build -f services/schema-sync-service/Dockerfile -t schemadash-schema-sync-service .
```

Run it directly:

```bash
docker run --rm \
  -p 4020:4020 \
  -e NODE_ENV=production \
  -e SCHEMADASH_SECRET_KEY=replace-with-a-long-random-secret \
  -e SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR=/app/data \
  -v schemadash-schema-sync-data:/app/data \
  schemadash-schema-sync-service
```

The container stores its SQLite metadata database under `/app/data` by default.

## Docker Compose

The repository root compose file keeps the service behind the optional
`schema-sync` profile so disabled mode stays boring:

```bash
docker compose up --build -d
```

This starts `web`, `api`, and `postgres` with schema sync disabled by default.

To enable the standalone service in the compose stack:

```bash
COMPOSE_PROFILES=schema-sync \
SCHEMADASH_SCHEMA_SYNC_ENABLED=true \
docker compose up --build -d
```

When that profile is enabled:

- Compose starts `schema-sync-adapter`
- the main app reads `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL=http://schema-sync-adapter:4020`
- `api` does not hard-crash if the service is briefly unavailable
- `/api/readyz` on the main app reports schema sync as `down` until the service
  is healthy

This is intentional. The compose stack favors safe degraded startup for
unrelated SchemaDash features over hard startup coupling.

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

- `GET /livez`
- `GET /readyz`
- `GET /healthz`
- `GET /api/livez`
- `GET /api/readyz`
- `GET /api/health`

Probe guidance:

- `GET /livez` is process liveness and is suitable for simple liveness checks
- `GET /readyz` verifies the service can access its SQLite metadata database
- `GET /healthz` returns the fuller operational snapshot used for debugging

The container image healthcheck uses `GET /readyz`.

## Troubleshooting

- If the main app returns `schema_sync_disabled`, confirm
  `SCHEMADASH_SCHEMA_SYNC_ENABLED=true`.
- If the main app returns `schema_sync_service_unavailable`, confirm
  `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL` points to the reachable service host.
- In Docker Compose, remember to start the `schema-sync` profile when enabling
  schema sync.
- Check `GET /readyz` on the service first. If it returns `503`, the service
  metadata SQLite database is not ready.
- In containers, keep the service URL on `http://schema-sync-adapter:4020`.
  Use `http://localhost:4020` only when the main app runs outside Docker.

## Current Engine Support

Current runtime support:

- PostgreSQL only

The service folder structure is intentionally prepared for future engines under
`src/engines/`, but no other engine runtime is implemented in this task.
