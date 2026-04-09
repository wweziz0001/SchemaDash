# Self-Hosting SchemaDash

SchemaDash can run as a lightweight self-hosted stack with a static web
container, a Fastify API, and local SQLite persistence for application
metadata.

The optional PostgreSQL container in `docker-compose.yml` is a convenience
service for local schema-sync testing. SchemaDash's own application state still
persists in SQLite unless you are connecting the schema-sync workflow to an
external live PostgreSQL database.

The standalone schema sync runtime now ships as its own container image and
compose service:

- `SCHEMADASH_SCHEMA_SYNC_ENABLED=false` keeps schema sync disabled and leaves
  unrelated SchemaDash features operating normally
- `SCHEMADASH_SCHEMA_SYNC_ENABLED=true` makes the main app call the standalone
  `schema-sync-adapter` service
- there is no embedded in-process schema sync runtime in the main app anymore

## Local run

Copy the example environment file and choose local secrets:

```bash
cp .env.example .env
```

At minimum, set:

```dotenv
SCHEMADASH_SECRET_KEY=replace-with-a-long-random-secret
SCHEMADASH_POSTGRES_PASSWORD=replace-with-a-local-dev-password
```

Run the app without Docker:

```bash
npm install
npm run dev:server
npm run dev:web
```

Vite serves the frontend on `http://localhost:5173` and proxies `/api` to `SCHEMADASH_API_PROXY`, which defaults to `http://localhost:4010`.

## Build and test

```bash
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

## Docker Compose

Start the default self-hosted stack with schema sync disabled:

```bash
docker compose up --build -d
```

This starts:

- `web` on `http://localhost:8080`
- `api` on `http://localhost:4010`
- `postgres` on `localhost:5432`

Enable the standalone schema sync service only when you want it:

```bash
COMPOSE_PROFILES=schema-sync \
SCHEMADASH_SCHEMA_SYNC_ENABLED=true \
docker compose up --build -d
```

That adds:

- `schema-sync-adapter` on `http://localhost:4020`

Compose intentionally does not hard-block `api` on `schema-sync-adapter`
startup. This keeps unrelated product features reachable while
`schema-sync-adapter` is starting or temporarily unavailable. When schema sync
is enabled, the main app surfaces the dependency state through `GET /api/readyz`
and `GET /api/health`.

Main app schema-sync readiness states:

- `disabled`: schema sync is intentionally off and does not affect readiness
- `ready`: the remote schema-sync service is reachable and its own `/api/readyz`
  check passed
- `not_ready`: the remote service process is reachable, but its readiness check
  is still failing
- `unavailable`: the main app could not reach the remote service or the request
  timed out

Useful follow-up commands:

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f schema-sync-adapter
docker compose down -v
```

Health endpoints:

- `GET /healthz` on the web container
- `GET /api/livez` for main app liveness
- `GET /api/readyz` for main app readiness, including schema sync dependency
  state when enabled
- `GET /api/health` for a detailed operational snapshot
- `GET /readyz` on `schema-sync-adapter` for standalone service readiness
- `GET /healthz` on `schema-sync-adapter` for standalone service diagnostics

Remote timeout and retry behavior:

- readiness checks use a short timeout and are not retried automatically
- connection tests use a moderate timeout and a single conservative retry on
  transport/readiness failures
- connection lookup, audit lookup, snapshot lookup, and apply-job lookup use a
  short timeout and a single conservative retry on transport/readiness failures
- live schema import, migration preview generation, and apply use longer bounded
  timeouts but are not retried automatically
- apply is never auto-retried by the main app because it is a high-trust
  operation and duplicate execution would be unsafe

## Environment variables

Frontend runtime variables:

- `VITE_API_BASE_URL`: optional public API base when the frontend is not proxying `/api` on the same origin
- `VITE_OPENAI_API_KEY`: optional browser-side OpenAI key for AI export flows
- `VITE_OPENAI_API_ENDPOINT`: optional OpenAI-compatible endpoint override
- `VITE_LLM_MODEL_NAME`: optional default model name for AI export flows
- `VITE_HIDE_SCHEMADASH_CLOUD`: hides cloud upsell entry points when `true`
- `VITE_DISABLE_ANALYTICS`: disables Fathom analytics when `true`

Backend runtime variables:

- `SCHEMADASH_API_HOST`: backend bind host, defaults to `0.0.0.0`
- `SCHEMADASH_API_PORT`: backend listen port, defaults to `4010`
- `SCHEMADASH_CORS_ORIGIN`: allowed browser origin for API access
- `SCHEMADASH_TRUST_PROXY`: `false`, `true`, or a positive hop count such as `1`
- `SCHEMADASH_SECRET_KEY`: required production secret used for encrypted PostgreSQL connection storage and signed auth flow state
- `SCHEMADASH_DATA_DIR`: directory for local SQLite files
- `SCHEMADASH_APP_DB_PATH`: optional explicit path for the app persistence SQLite database
- `SCHEMADASH_METADATA_DB_PATH`: optional explicit path for the schema-sync metadata SQLite database
- `SCHEMADASH_LOG_LEVEL`: Fastify/Pino level
- `SCHEMADASH_DEFAULT_PROJECT_NAME`: bootstrap default project name
- `SCHEMADASH_DEFAULT_OWNER_NAME`: bootstrap default owner display name
- `SCHEMADASH_SCHEMA_SYNC_ENABLED`: `true` enables the external standalone schema sync service
- `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL`: base URL for the standalone schema sync service

Authentication variables:

- `SCHEMADASH_AUTH_MODE`: `disabled`, `password`, or `oidc`
- `SCHEMADASH_AUTH_EMAIL`: optional environment-assisted first admin email for password mode
- `SCHEMADASH_AUTH_PASSWORD`: optional environment-assisted first admin password for password mode
- `SCHEMADASH_AUTH_DISPLAY_NAME`: display name for environment-assisted bootstrap
- `SCHEMADASH_BOOTSTRAP_SETUP_CODE`: optional operator-managed interactive bootstrap code
- `SCHEMADASH_BOOTSTRAP_ADMIN_EMAIL`: required first admin email for OIDC bootstrap
- `SCHEMADASH_SESSION_TTL_HOURS`: session lifetime
- `SCHEMADASH_SESSION_COOKIE_NAME`: session cookie name
- `SCHEMADASH_SESSION_COOKIE_SECURE`: optional cookie `Secure` override
- `SCHEMADASH_OIDC_ISSUER`: OIDC issuer URL
- `SCHEMADASH_OIDC_CLIENT_ID`: OIDC client id
- `SCHEMADASH_OIDC_CLIENT_SECRET`: optional OIDC client secret
- `SCHEMADASH_OIDC_REDIRECT_URL`: registered OIDC callback URL
- `SCHEMADASH_OIDC_LOGOUT_URL`: optional provider logout continuation URL
- `SCHEMADASH_OIDC_SCOPES`: optional OIDC scopes, defaults to `openid profile email`

Operational note:

- when `SCHEMADASH_AUTH_MODE` is `password` or `oidc`, live PostgreSQL connection management plus schema import/diff/apply routes are restricted to authenticated admins
- when auth is disabled, those routes remain available as part of the single-user/local-owner deployment model

Compose helper variables:

- `SCHEMADASH_WEB_PORT`: published web port, defaults to `8080`
- `SCHEMADASH_POSTGRES_PORT`: published PostgreSQL port, defaults to `5432`
- `SCHEMADASH_POSTGRES_DB`: local compose database name
- `SCHEMADASH_POSTGRES_USER`: local compose database user
- `SCHEMADASH_POSTGRES_PASSWORD`: local compose database password

Standalone schema sync service variables:

- `SCHEMADASH_SCHEMA_SYNC_SERVICE_HOST`: service bind host, defaults to `0.0.0.0`
- `SCHEMADASH_SCHEMA_SYNC_SERVICE_PORT`: service port, defaults to `4020`
- `SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR`: directory for service-local SQLite metadata
- `SCHEMADASH_SCHEMA_SYNC_METADATA_DB_PATH`: optional explicit path for the standalone service metadata SQLite database
- `SCHEMADASH_SCHEMA_SYNC_SECRET_KEY`: optional dedicated encryption key for service-stored connection secrets
- `SCHEMADASH_SECRET_KEY`: accepted by the service as a fallback secret source
- `SCHEMADASH_SCHEMA_SYNC_LOG_LEVEL`: service log level

## Reverse proxy notes

- Prefer serving the frontend and API from the same external origin and let the web container proxy `/api` internally.
- Set `SCHEMADASH_CORS_ORIGIN` to the exact public frontend origin when browsers call the API.
- Set `SCHEMADASH_TRUST_PROXY=1` only when SchemaDash is always behind one trusted reverse-proxy hop that sanitizes forwarded headers.
- Forward `Host`, `X-Forwarded-For`, `X-Forwarded-Proto`, and optionally `X-Request-Id`.
- Disable buffering for `/api/` when proxying because SchemaDash uses server-sent events for collaboration updates.
- When the frontend and API are split across origins, set `VITE_API_BASE_URL=https://api.example.com`.
- Keep `SCHEMADASH_OIDC_REDIRECT_URL` aligned with the externally visible callback URL when OIDC is enabled.

## Deployment basics

- Run the API with `NODE_ENV=production`.
- Mount `/app/data` on persistent storage when using the API container.
- Mount `/app/data` on persistent storage for `schema-sync-adapter` when the
  standalone service is enabled.
- Back up the SQLite files in `SCHEMADASH_DATA_DIR` regularly.
- Back up the standalone service SQLite database in
  `SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR` when schema sync is enabled.
- Keep API replicas at `1` today. SchemaDash currently uses SQLite plus in-memory collaboration state, so multi-replica API deployments need extra coordination work before they are safe.
- The web container is stateless and is compatible with future Kubernetes ingress or service-based routing.
- For Kubernetes, map probes to `/healthz`, `/api/livez`, `/api/readyz`, and
  the standalone service `/readyz`, and back the stateful pods with persistent
  volume claims.
- Review [Schema Sync Architecture](./schema-sync-architecture.md) before exposing live PostgreSQL apply in production, especially around enum/custom type limitations and destructive-change confirmations.

## Troubleshooting

- If `api` health is green but `/api/readyz` returns `503`, inspect the
  `schemaSyncService` check in `/api/health`.
- If `/api/health` reports `schemaSyncService.status=not_ready`, the remote
  service process is alive but its own readiness check is failing. Inspect
  `GET /readyz` on `schema-sync-adapter` and the service logs.
- If `/api/health` reports `schemaSyncService.status=unavailable`, the main app
  could not reach the remote service or timed out before it responded. Confirm
  DNS/network reachability, container startup, and the configured
  `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL`.
- If schema sync is intentionally off, leave
  `SCHEMADASH_SCHEMA_SYNC_ENABLED=false`; the rest of SchemaDash should keep
  functioning normally.
- If schema sync is enabled in Compose, make sure the `schema-sync` profile is
  active and `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL` stays on
  `http://schema-sync-adapter:4020`.
- If `schema-sync-adapter` fails readiness, check the mounted service data
  directory, secret configuration, and service logs.
- If migration preview fails with a timeout or invalid-response error, treat it
  as a remote-service problem first rather than assuming the diagram state is
  bad.
- If apply reports that the outcome could not be confirmed, do not retry
  immediately. Inspect the latest remote audit and service logs first so you do
  not double-apply a high-trust operation.
- When running the service outside Docker, switch the main app URL to
  `http://localhost:4020`.
