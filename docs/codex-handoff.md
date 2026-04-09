# Codex Handoff

## 1. Project Overview

SchemaDash is a self-hostable database diagramming application with optional
live PostgreSQL schema sync. The product still revolves around the frontend
editor, saved projects, sharing, authentication, versions, and collaboration.
This task only operationalized the already-extracted standalone schema sync
service.

The key runtime model for this area is now:

- `SCHEMADASH_SCHEMA_SYNC_ENABLED=false`: schema sync is disabled and the rest
  of SchemaDash should keep working normally
- `SCHEMADASH_SCHEMA_SYNC_ENABLED=true`: the main app calls the standalone
  schema sync service over HTTP
- there is no supported embedded/in-process schema sync mode in the main app

Important concepts:

- `backend/` is the main Fastify API used by the frontend
- `services/schema-sync-service/` is the standalone schema sync runtime
- `shared/schema-sync-core/` contains the shared canonical schema contracts and
  PostgreSQL diff/apply primitives
- PostgreSQL is still the only live schema sync engine implemented

## 2. Current Architectural Context

Read these first for future work:

1. [docs/codex-handoff.md](/root/data/SchemaDash/docs/codex-handoff.md)
2. [docs/schema-sync-service-architecture.md](/root/data/SchemaDash/docs/schema-sync-service-architecture.md)
3. [docs/operations/self-hosting.md](/root/data/SchemaDash/docs/operations/self-hosting.md)
4. [services/schema-sync-service/README.md](/root/data/SchemaDash/services/schema-sync-service/README.md)
5. [docker-compose.yml](/root/data/SchemaDash/docker-compose.yml)
6. [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
7. [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
8. [services/schema-sync-service/src/config/env.ts](/root/data/SchemaDash/services/schema-sync-service/src/config/env.ts)
9. [services/schema-sync-service/src/routes/health-routes.ts](/root/data/SchemaDash/services/schema-sync-service/src/routes/health-routes.ts)
10. [services/schema-sync-service/Dockerfile](/root/data/SchemaDash/services/schema-sync-service/Dockerfile)

Important boundaries:

- Main app runtime:
  [backend/src/config/env.ts](/root/data/SchemaDash/backend/src/config/env.ts),
  [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts),
  [backend/src/routes/schema-sync-routes.ts](/root/data/SchemaDash/backend/src/routes/schema-sync-routes.ts),
  [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
- Standalone service runtime:
  [services/schema-sync-service/src/app.ts](/root/data/SchemaDash/services/schema-sync-service/src/app.ts),
  [services/schema-sync-service/src/context/service-context.ts](/root/data/SchemaDash/services/schema-sync-service/src/context/service-context.ts),
  [services/schema-sync-service/src/routes/schema-sync-routes.ts](/root/data/SchemaDash/services/schema-sync-service/src/routes/schema-sync-routes.ts),
  [services/schema-sync-service/src/routes/health-routes.ts](/root/data/SchemaDash/services/schema-sync-service/src/routes/health-routes.ts)
- Deployment/runtime files:
  [services/schema-sync-service/Dockerfile](/root/data/SchemaDash/services/schema-sync-service/Dockerfile),
  [backend/Dockerfile](/root/data/SchemaDash/backend/Dockerfile),
  [docker-compose.yml](/root/data/SchemaDash/docker-compose.yml),
  [.env.example](/root/data/SchemaDash/.env.example)

High-risk files:

- [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
  because every enabled schema-sync call flows through this client
- [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
  because deployment readiness and degraded-state reporting live here
- [services/schema-sync-service/src/config/env.ts](/root/data/SchemaDash/services/schema-sync-service/src/config/env.ts)
  because compose/runtime secret behavior depends on it
- [docker-compose.yml](/root/data/SchemaDash/docker-compose.yml)
  because disabled-mode safety depends on not hard-coupling the main app to the
  optional standalone service profile

## 3. Task Completed

This task was meant to make the standalone schema sync service deployment-ready
without changing the already-extracted runtime model or adding new engines.

What was implemented:

- added a dedicated standalone image build at
  [services/schema-sync-service/Dockerfile](/root/data/SchemaDash/services/schema-sync-service/Dockerfile)
- added container healthcheck support for the standalone service
- added simple root health aliases on the standalone service:
  `/livez`, `/readyz`, `/healthz`
- kept the existing `/api/livez`, `/api/readyz`, and `/api/health` routes for
  compatibility
- changed the API container healthcheck to probe `/api/livez` instead of
  `/api/readyz` so unrelated app features are not marked dead just because the
  schema sync dependency is degraded
- integrated `schema-sync-adapter` into
  [docker-compose.yml](/root/data/SchemaDash/docker-compose.yml) behind the
  optional `schema-sync` profile
- wired compose-time API env defaults for:
  `SCHEMADASH_SCHEMA_SYNC_ENABLED` and
  `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL=http://schema-sync-adapter:4020`
- intentionally avoided hard `depends_on` coupling from `api` to
  `schema-sync-adapter` so disabled mode stays safe and enabled-but-unavailable
  mode stays degraded instead of crashing
- allowed the standalone service to reuse `SCHEMADASH_SECRET_KEY` as a fallback
  secret source when a dedicated `SCHEMADASH_SCHEMA_SYNC_SECRET_KEY` is not set
- documented local runs, direct Docker runs, compose profile usage, health
  semantics, and troubleshooting
- added targeted validation for service env parsing, service health endpoints,
  and deployment-file wiring

Approach intentionally avoided:

- no new database engines
- no reintroduction of embedded schema sync mode
- no broad refactor of existing PostgreSQL schema-sync services
- no change to frontend-to-main-app routing

## 4. Files Changed

Files created in this task:

- [services/schema-sync-service/Dockerfile](/root/data/SchemaDash/services/schema-sync-service/Dockerfile)
  standalone service container build
- [services/schema-sync-service/test/env.test.ts](/root/data/SchemaDash/services/schema-sync-service/test/env.test.ts)
  env parsing validation for shared-secret fallback and production safety
- [services/schema-sync-service/test/health-routes.test.ts](/root/data/SchemaDash/services/schema-sync-service/test/health-routes.test.ts)
  standalone service liveness/readiness validation
- [tests/validate-schema-sync-deployment.mjs](/root/data/SchemaDash/tests/validate-schema-sync-deployment.mjs)
  static deployment validation plus optional Docker/Compose smoke hooks

Files modified in this task:

- [.gitignore](/root/data/SchemaDash/.gitignore)
  ignores local standalone service SQLite state from git status
- [.dockerignore](/root/data/SchemaDash/.dockerignore)
  excludes local schema-sync SQLite state from Docker build context
- [backend/Dockerfile](/root/data/SchemaDash/backend/Dockerfile)
  main API image healthcheck now uses `/api/livez`
- [docker-compose.yml](/root/data/SchemaDash/docker-compose.yml)
  adds `schema-sync-adapter`, healthchecks, volume wiring, and compose env
  defaults
- [.env.example](/root/data/SchemaDash/.env.example)
  compose-friendly schema sync URL and operator notes
- [services/schema-sync-service/src/config/env.ts](/root/data/SchemaDash/services/schema-sync-service/src/config/env.ts)
  shared-secret fallback and production placeholder rejection
- [services/schema-sync-service/src/routes/health-routes.ts](/root/data/SchemaDash/services/schema-sync-service/src/routes/health-routes.ts)
  root health aliases plus existing API health routes
- [services/schema-sync-service/README.md](/root/data/SchemaDash/services/schema-sync-service/README.md)
  standalone service runtime, Docker, Compose, and troubleshooting docs
- [docs/operations/self-hosting.md](/root/data/SchemaDash/docs/operations/self-hosting.md)
  self-hosted deployment instructions for disabled/enabled schema sync
- [README.md](/root/data/SchemaDash/README.md)
  top-level Docker usage notes for optional schema sync profile
- [package.json](/root/data/SchemaDash/package.json)
  adds `npm run test:deployment`

Important files intentionally not changed:

- [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
  the external-service boundary already matched the required runtime model
- [backend/src/routes/schema-sync-routes.ts](/root/data/SchemaDash/backend/src/routes/schema-sync-routes.ts)
  no behavior change was needed beyond preserving disabled and enabled paths
- [services/schema-sync-service/src/services/schema-sync-service.ts](/root/data/SchemaDash/services/schema-sync-service/src/services/schema-sync-service.ts)
  PostgreSQL import/diff/apply behavior was intentionally preserved
- [services/schema-sync-service/src/engines/postgresql/](/root/data/SchemaDash/services/schema-sync-service/src/engines/postgresql)
  engine behavior was left alone to avoid breaking migration fidelity

## 5. Data / API / Workflow Changes

Runtime/deployment changes:

- main app compose env now supports:
  `SCHEMADASH_SCHEMA_SYNC_ENABLED` and
  `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL`
- standalone service accepts either:
  `SCHEMADASH_SCHEMA_SYNC_SECRET_KEY` or `SCHEMADASH_SECRET_KEY`
- compose adds the optional `schema-sync-adapter` service profile
- compose adds the persistent named volume `schemadash-schema-sync-data`

Health/API changes:

- standalone service now exposes both root and API-prefixed health routes
- standalone service readiness is still tied to its SQLite metadata repository
- API `/api/readyz` still reports schema-sync dependency status when schema sync
  is enabled
- API container liveness now intentionally ignores schema-sync dependency state

Behavior changes:

- disabled mode remains healthy and does not require the standalone service
- enabled mode uses the standalone service URL
- enabled-but-unavailable mode degrades via readiness/reporting and route
  errors instead of crashing unrelated features
- current PostgreSQL remote schema sync behavior was intentionally preserved

## 6. Validation Performed

Validated in this session:

- `npm run build -w @schemadash/schema-sync-core`
- `npm run build -w @schemadash/backend`
- `npm run build -w @schemadash/schema-sync-service`
- `npm run test -w @schemadash/schema-sync-service -- env.test.ts health-routes.test.ts schema-sync-adapter-registry.test.ts postgresql-introspection.test.ts apply-service-audit.test.ts`
- `npm run test -w @schemadash/backend -- env.test.ts health-routes.test.ts schema-sync-routes.test.ts`
- `npm run test:deployment`

What those checks verified:

- service env parsing still supports development and production safely
- service health and readiness endpoints behave correctly
- backend disabled mode still returns the expected schema-sync-disabled behavior
- backend health endpoints still represent disabled and degraded dependency
  states
- compose wiring, internal service URL defaults, and service Dockerfile shape
  are consistent

What remains unverified here:

- real `docker build` and `docker compose config/up` execution
- live container-to-container startup behavior under Docker
- full end-to-end PostgreSQL schema sync smoke run in containers

Known limitation of this session:

- Docker was not installed in the execution environment, so
  [tests/validate-schema-sync-deployment.mjs](/root/data/SchemaDash/tests/validate-schema-sync-deployment.mjs)
  only ran static assertions and skipped the optional dynamic Docker checks

## 7. Outstanding Work

Not done yet:

- run the new deployment validation with Docker available so the dynamic
  `docker build` and `docker compose config` paths execute for real
- add CI coverage for the standalone service container build and compose smoke
  path
- decide whether the frontend should hide schema-sync entry points when the
  feature is disabled rather than relying only on backend-safe degradation

Recommended next phase:

1. Add CI or local runner coverage for the Docker build and compose profile.
2. Perform a real compose smoke test with `COMPOSE_PROFILES=schema-sync`.
3. If desired, tighten operator UX around disabled mode in the frontend.

Blockers / risks:

- deployment confidence is still strongest in code-level validation, not in a
  live Docker runtime, because Docker was unavailable in this session
- changing API readiness semantics or adding hard compose dependencies can
  easily break the disabled-mode safety requirement

## 8. Instructions for the Next Codex Session

Read in this exact order:

1. [docs/codex-handoff.md](/root/data/SchemaDash/docs/codex-handoff.md)
2. [docs/operations/self-hosting.md](/root/data/SchemaDash/docs/operations/self-hosting.md)
3. [services/schema-sync-service/README.md](/root/data/SchemaDash/services/schema-sync-service/README.md)
4. [docker-compose.yml](/root/data/SchemaDash/docker-compose.yml)
5. [services/schema-sync-service/Dockerfile](/root/data/SchemaDash/services/schema-sync-service/Dockerfile)
6. [services/schema-sync-service/src/config/env.ts](/root/data/SchemaDash/services/schema-sync-service/src/config/env.ts)
7. [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
8. [tests/validate-schema-sync-deployment.mjs](/root/data/SchemaDash/tests/validate-schema-sync-deployment.mjs)

Avoid breaking:

- disabled mode safety
- the `SCHEMADASH_SCHEMA_SYNC_ENABLED` external-service-only contract
- the compose internal hostname `http://schema-sync-adapter:4020`
- API liveness being independent from schema-sync dependency health
- PostgreSQL diff/apply/import behavior in the standalone service

Where to continue:

- deployment validation and CI:
  [tests/validate-schema-sync-deployment.mjs](/root/data/SchemaDash/tests/validate-schema-sync-deployment.mjs)
- standalone service runtime docs and operator flow:
  [services/schema-sync-service/README.md](/root/data/SchemaDash/services/schema-sync-service/README.md)
- compose/runtime integration:
  [docker-compose.yml](/root/data/SchemaDash/docker-compose.yml)
- dependency health semantics:
  [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts),
  [services/schema-sync-service/src/routes/health-routes.ts](/root/data/SchemaDash/services/schema-sync-service/src/routes/health-routes.ts)

## 9. Git Summary

Working branch:

- `sync/03-dockerize-schema-sync-standalone-service`

Pull request title:

- `Dockerize standalone schema sync service with compose integration and health checks`

Commit list created for this task:

1. `b1673cb5` `feat: add docker build for standalone schema sync service`
2. `459ac610` `feat: add health endpoint and container healthcheck support`
3. `39615594` `feat: integrate standalone schema sync service into compose configuration`
4. `5aa7eb9d` `docs: add standalone schema sync docker and env usage notes`
5. `test: validate dockerized schema sync service and compose integration` in
   this final validation commit

What each commit did:

1. added the standalone service Dockerfile and Docker build-context ignores
2. added root health aliases and image/container healthcheck behavior
3. wired the standalone service into compose and simplified env/secret
   integration
4. documented local, Docker, Compose, health, and troubleshooting flows
5. added focused validation coverage and refreshed this handoff for the final
   branch state
