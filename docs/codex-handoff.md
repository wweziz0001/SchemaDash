# Codex Handoff

## 1. Project Overview

SchemaDash is a diagram-first database design tool with optional live schema
sync. The core product still centers on diagram editing, persistence, sharing,
auth, versions, and changelog workflows, but this task focused on the live
schema sync subsystem and its runtime boundary.

Relevant concepts for this task:

- `CanonicalSchema` in `packages/schema-sync-core/` is the shared schema format
  used for import, diff, workflow compare, and apply planning.
- the main app is the Fastify server under `backend/`
- the standalone schema sync runtime now lives under
  `services/schema-sync-service/`
- PostgreSQL remains the only implemented live schema sync engine
- the main app now supports only two schema sync runtime states:
    - disabled
    - enabled through the external standalone schema sync service

This task intentionally removed supported embedded/in-process schema sync mode
from the main app architecture.

## 2. Current Architectural Context

Read these first in this order:

1. [docs/schema-sync-service-architecture.md](/root/data/SchemaDash/docs/schema-sync-service-architecture.md)
2. [docs/audits/schema-sync-standalone-service-conversion-audit.md](/root/data/SchemaDash/docs/audits/schema-sync-standalone-service-conversion-audit.md)
3. [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
4. [services/schema-sync-service/src/app.ts](/root/data/SchemaDash/services/schema-sync-service/src/app.ts)
5. [services/schema-sync-service/src/context/service-context.ts](/root/data/SchemaDash/services/schema-sync-service/src/context/service-context.ts)
6. [services/schema-sync-service/src/routes/schema-sync-routes.ts](/root/data/SchemaDash/services/schema-sync-service/src/routes/schema-sync-routes.ts)
7. [backend/src/services/diagram-workflow-service.ts](/root/data/SchemaDash/backend/src/services/diagram-workflow-service.ts)
8. [backend/src/services/diagram-migration-service.ts](/root/data/SchemaDash/backend/src/services/diagram-migration-service.ts)

Important boundaries now:

- main app boundary:
    - [backend/src/config/env.ts](/root/data/SchemaDash/backend/src/config/env.ts)
    - [backend/src/context/app-context.ts](/root/data/SchemaDash/backend/src/context/app-context.ts)
    - [backend/src/routes/schema-sync-routes.ts](/root/data/SchemaDash/backend/src/routes/schema-sync-routes.ts)
    - [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
- standalone service runtime:
    - [services/schema-sync-service/src/services/connections-service.ts](/root/data/SchemaDash/services/schema-sync-service/src/services/connections-service.ts)
    - [services/schema-sync-service/src/services/schema-sync-service.ts](/root/data/SchemaDash/services/schema-sync-service/src/services/schema-sync-service.ts)
    - [services/schema-sync-service/src/services/apply-service.ts](/root/data/SchemaDash/services/schema-sync-service/src/services/apply-service.ts)
    - [services/schema-sync-service/src/repositories/metadata-repository.ts](/root/data/SchemaDash/services/schema-sync-service/src/repositories/metadata-repository.ts)
    - [services/schema-sync-service/src/engines/postgresql/adapter.ts](/root/data/SchemaDash/services/schema-sync-service/src/engines/postgresql/adapter.ts)
- shared/core contracts:
    - [packages/schema-sync-core/src/api.ts](/root/data/SchemaDash/packages/schema-sync-core/src/api.ts)
    - [packages/schema-sync-core/src/types.ts](/root/data/SchemaDash/packages/schema-sync-core/src/types.ts)
    - [packages/schema-sync-core/src/diff.ts](/root/data/SchemaDash/packages/schema-sync-core/src/diff.ts)
    - [packages/schema-sync-core/src/sql.ts](/root/data/SchemaDash/packages/schema-sync-core/src/sql.ts)
    - [packages/schema-sync-core/src/type-normalization.ts](/root/data/SchemaDash/packages/schema-sync-core/src/type-normalization.ts)

High-risk files for future work:

- [backend/src/services/diagram-migration-service.ts](/root/data/SchemaDash/backend/src/services/diagram-migration-service.ts)
  because it now bridges workflow state with the external service plan/apply
  boundary.
- [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
  because every main-app schema-sync operation now depends on this client.
- [services/schema-sync-service/src/routes/schema-sync-routes.ts](/root/data/SchemaDash/services/schema-sync-service/src/routes/schema-sync-routes.ts)
  because the main app depends on both public and internal support routes here.
- [packages/schema-sync-core/src/sql.ts](/root/data/SchemaDash/packages/schema-sync-core/src/sql.ts)
  because SQL rendering is still PostgreSQL-only even though it is now more
  honest about that fact.

Frontend/backend/shared relationships that matter:

- frontend still talks to the main app, not directly to the standalone service
- the main app proxies direct schema-sync routes and uses the same remote client
  for workflow refresh and migration validation/apply
- the standalone service owns connections, snapshots, plans, jobs, and audits
- workflow live snapshots and version/changelog state remain in the main app

## 3. Task Completed

Goal of this task:

- keep the extracted PostgreSQL adapter seam
- stop treating schema sync as an in-process subsystem of the main app
- support only disabled mode or external-service-enabled mode
- move the runtime into a dedicated standalone-service-ready workspace

What was implemented:

- preserved the existing PostgreSQL adapter extraction and documented why it
  stays
- added the standalone-service architecture doc and conversion audit
- removed misleading hardcoded PostgreSQL leakage in shared/core and storage
  boundaries
- added main-app env parsing for:
    - `SCHEMADASH_SCHEMA_SYNC_ENABLED`
    - `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL`
- added the main-app remote client boundary in
  [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
- changed the main app context to stop assembling local schema sync runtime
- changed schema-sync routes in the main app to proxy through the client
- changed workflow refresh and migration validation/apply to use the remote
  client instead of local runtime services
- moved the runtime into
  [services/schema-sync-service/](/root/data/SchemaDash/services/schema-sync-service)
- added a standalone service app, env parser, context, health routes, and
  schema sync transport routes
- moved runtime-specific tests into the service workspace
- updated focused backend tests to validate disabled mode, route proxying,
  workflow refresh, and migration preview/apply through the service boundary

Key decisions made:

- no embedded runtime fallback in the main app
- the standalone service owns schema-sync metadata persistence
- the main app keeps workflow-local live snapshot copies for compare/version UX
- direct main-app schema sync routes retain their external API shape where
  practical

Approach intentionally avoided:

- no revert to pre-extraction architecture
- no fake multi-engine implementation beyond PostgreSQL
- no broad redesign of versions, changelog, or compare workflows
- no direct frontend-to-service communication bypassing the main app

## 4. Files Changed

Files created:

- [docs/audits/schema-sync-standalone-service-conversion-audit.md](/root/data/SchemaDash/docs/audits/schema-sync-standalone-service-conversion-audit.md)
  audit of the current seam and conversion scope
- [docs/schema-sync-service-architecture.md](/root/data/SchemaDash/docs/schema-sync-service-architecture.md)
  target architecture and rollout plan
- [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
  main-app remote/disabled schema sync boundary
- [services/schema-sync-service/package.json](/root/data/SchemaDash/services/schema-sync-service/package.json)
  standalone service workspace package
- [services/schema-sync-service/tsconfig.json](/root/data/SchemaDash/services/schema-sync-service/tsconfig.json)
- [services/schema-sync-service/src/app.ts](/root/data/SchemaDash/services/schema-sync-service/src/app.ts)
- [services/schema-sync-service/src/index.ts](/root/data/SchemaDash/services/schema-sync-service/src/index.ts)
- [services/schema-sync-service/src/config/env.ts](/root/data/SchemaDash/services/schema-sync-service/src/config/env.ts)
- [services/schema-sync-service/src/context/service-context.ts](/root/data/SchemaDash/services/schema-sync-service/src/context/service-context.ts)
- [services/schema-sync-service/src/routes/schema-sync-routes.ts](/root/data/SchemaDash/services/schema-sync-service/src/routes/schema-sync-routes.ts)
- [services/schema-sync-service/src/routes/health-routes.ts](/root/data/SchemaDash/services/schema-sync-service/src/routes/health-routes.ts)
- [services/schema-sync-service/src/security/encryption.ts](/root/data/SchemaDash/services/schema-sync-service/src/security/encryption.ts)
- [services/schema-sync-service/README.md](/root/data/SchemaDash/services/schema-sync-service/README.md)
- [services/schema-sync-service/.env.example](/root/data/SchemaDash/services/schema-sync-service/.env.example)
- [services/schema-sync-service/test/apply-service-audit.test.ts](/root/data/SchemaDash/services/schema-sync-service/test/apply-service-audit.test.ts)
- [services/schema-sync-service/test/schema-sync-adapter-registry.test.ts](/root/data/SchemaDash/services/schema-sync-service/test/schema-sync-adapter-registry.test.ts)
- [services/schema-sync-service/test/postgresql-introspection.test.ts](/root/data/SchemaDash/services/schema-sync-service/test/postgresql-introspection.test.ts)

Important files modified:

- [packages/schema-sync-core/src/api.ts](/root/data/SchemaDash/packages/schema-sync-core/src/api.ts)
  engine-aware defaults and snapshot contract
- [packages/schema-sync-core/src/types.ts](/root/data/SchemaDash/packages/schema-sync-core/src/types.ts)
  engine-derived default schema handling
- [packages/schema-sync-core/src/diff.ts](/root/data/SchemaDash/packages/schema-sync-core/src/diff.ts)
  engine-aware builtin-type handling
- [packages/schema-sync-core/src/sql.ts](/root/data/SchemaDash/packages/schema-sync-core/src/sql.ts)
  explicit engine-gated SQL generation
- [packages/schema-sync-core/src/type-normalization.ts](/root/data/SchemaDash/packages/schema-sync-core/src/type-normalization.ts)
  explicit engine-aware normalization
- [packages/schema-sync-core/src/engines.ts](/root/data/SchemaDash/packages/schema-sync-core/src/engines.ts)
  default namespace helper
- [frontend/src/lib/schema-sync/canonical-adapters.ts](/root/data/SchemaDash/frontend/src/lib/schema-sync/canonical-adapters.ts)
  more honest engine/default-schema resolution
- [frontend/src/lib/admin/admin-overview.ts](/root/data/SchemaDash/frontend/src/lib/admin/admin-overview.ts)
  admin display now understands `disabled` vs `external-service`
- [backend/src/config/env.ts](/root/data/SchemaDash/backend/src/config/env.ts)
  standalone service env contract
- [backend/src/context/app-context.ts](/root/data/SchemaDash/backend/src/context/app-context.ts)
  removed local runtime assembly
- [backend/src/routes/schema-sync-routes.ts](/root/data/SchemaDash/backend/src/routes/schema-sync-routes.ts)
  proxy boundary
- [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
  readiness now includes external service status
- [backend/src/services/diagram-workflow-service.ts](/root/data/SchemaDash/backend/src/services/diagram-workflow-service.ts)
  remote connection/import flow
- [backend/src/services/diagram-migration-service.ts](/root/data/SchemaDash/backend/src/services/diagram-migration-service.ts)
  remote diff/test/import/apply/audit/snapshot flow
- [backend/test/env.test.ts](/root/data/SchemaDash/backend/test/env.test.ts)
- [backend/test/health-routes.test.ts](/root/data/SchemaDash/backend/test/health-routes.test.ts)
- [backend/test/schema-sync-routes.test.ts](/root/data/SchemaDash/backend/test/schema-sync-routes.test.ts)
- [backend/test/diagram-workflow-service.test.ts](/root/data/SchemaDash/backend/test/diagram-workflow-service.test.ts)
- [backend/test/diagram-migration-service.test.ts](/root/data/SchemaDash/backend/test/diagram-migration-service.test.ts)
- [backend/test/diagram-version-restore-service.test.ts](/root/data/SchemaDash/backend/test/diagram-version-restore-service.test.ts)
- [package.json](/root/data/SchemaDash/package.json)
  workspace/scripts now include the service package

Important files intentionally not changed:

- [frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx](/root/data/SchemaDash/frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx)
  UI behavior was left mostly intact; the backend now degrades safely when
  schema sync is disabled.
- [frontend/src/lib/api/schema-sync-client.ts](/root/data/SchemaDash/frontend/src/lib/api/schema-sync-client.ts)
  frontend still talks to the main app routes.
- [docs/multi-engine-schema-sync-architecture.md](/root/data/SchemaDash/docs/multi-engine-schema-sync-architecture.md)
  preserved as the broader multi-engine strategy doc.
- no Dockerfile was added for the service in this task
  because the folder, env example, and startup notes were enough to make future
  containerization straightforward without expanding scope further.

## 5. Data / API / Workflow Changes

New env/config behavior:

- main app:
    - `SCHEMADASH_SCHEMA_SYNC_ENABLED`
    - `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL`
- standalone service:
    - `SCHEMADASH_SCHEMA_SYNC_SERVICE_HOST`
    - `SCHEMADASH_SCHEMA_SYNC_SERVICE_PORT`
    - `SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR`
    - `SCHEMADASH_SCHEMA_SYNC_METADATA_DB_PATH`
    - `SCHEMADASH_SCHEMA_SYNC_SECRET_KEY`
    - `SCHEMADASH_SCHEMA_SYNC_LOG_LEVEL`

Behavior changes:

- disabled mode:
    - main app returns `503` with `code: schema_sync_disabled` for schema-sync
      routes
    - health/readiness report schema sync as `disabled` instead of pretending
      local SQLite runtime is active
- enabled mode:
    - main app expects the external service URL
    - main app proxies direct schema-sync routes through the client
    - workflow refresh and migration validation/apply use the same client
- standalone service owns:
    - connections
    - snapshots
    - change plans
    - apply jobs
    - audits
- main app still owns:
    - workflow live snapshot copies
    - diagram version/changelog state
    - product auth/access control

API additions for the service boundary:

- `GET /api/connections/:id`
- `GET /api/schema/snapshots/:id`
- `GET /api/schema/plans/:id/latest-audit`

Compatibility notes:

- main app frontend route surface remains largely unchanged
- PostgreSQL remains the only implemented engine
- SQL rendering and type normalization are still PostgreSQL-only, but that is
  now explicit instead of looking generic

## 6. Validation Performed

Validated during this session:

- `npm run build -w @schemadash/schema-sync-core`
- `npm run build -w @schemadash/backend`
- `npm run build -w @schemadash/schema-sync-service`
- `npx vitest run --config frontend/vitest.config.ts frontend/src/lib/schema-sync/canonical-adapters.test.ts`
- `npm run test -w @schemadash/backend -- env.test.ts health-routes.test.ts schema-sync-routes.test.ts diagram-workflow-service.test.ts diagram-migration-service.test.ts diagram-version-restore-service.test.ts`
- `npm run test -w @schemadash/schema-sync-service -- schema-sync-adapter-registry.test.ts apply-service-audit.test.ts postgresql-introspection.test.ts`

What was verified:

- env parsing supports disabled vs external-service-enabled behavior
- main-app health/readiness reflects disabled and external-service-down states
- direct schema-sync routes proxy through the client and reject spoofed actors
- workflow connection binding and refresh now use the remote client boundary
- migration preview/apply uses remote diff/test/import/apply/audit/snapshot
  calls and still updates workflow live snapshots correctly
- service-side PostgreSQL registry routing, apply audit reuse, and array
  normalization still work

Unverified / known limitations:

- no manual end-to-end run with both processes live against a real PostgreSQL
  database was executed in this session
- full repository-wide frontend/backend test suites were not run after this
  refactor; focused schema-sync-related slices were run instead
- the service package is ready for Dockerization, but no Dockerfile was added

## 7. Outstanding Work

Not done yet:

- add a real Dockerfile / compose wiring for `services/schema-sync-service`
- decide whether the frontend should proactively hide the schema-sync button
  when disabled instead of relying on backend-safe degradation
- broaden CI coverage so the service workspace is exercised in the normal
  repository pipeline everywhere
- continue reducing PostgreSQL-specific logic inside
  [packages/schema-sync-core/src/sql.ts](/root/data/SchemaDash/packages/schema-sync-core/src/sql.ts)
  and
  [packages/schema-sync-core/src/type-normalization.ts](/root/data/SchemaDash/packages/schema-sync-core/src/type-normalization.ts)

Recommended next phase:

1. Add container/runtime packaging for the standalone service.
2. Run a true two-process integration test against PostgreSQL.
3. Decide whether the service’s internal support routes should remain internal
   only or be formalized further in shared contracts.
4. Continue splitting PostgreSQL-only planner/renderer behavior away from the
   generic-looking shared core.

Risks / dependencies:

- migration correctness still depends on the PostgreSQL-only planner and SQL
  renderer staying aligned
- the main app now depends operationally on the service being reachable when
  schema sync is enabled

## 8. Instructions for the Next Codex Session

Read in this order:

1. [docs/codex-handoff.md](/root/data/SchemaDash/docs/codex-handoff.md)
2. [docs/schema-sync-service-architecture.md](/root/data/SchemaDash/docs/schema-sync-service-architecture.md)
3. [services/schema-sync-service/README.md](/root/data/SchemaDash/services/schema-sync-service/README.md)
4. [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
5. [services/schema-sync-service/src/routes/schema-sync-routes.ts](/root/data/SchemaDash/services/schema-sync-service/src/routes/schema-sync-routes.ts)
6. [backend/src/services/diagram-migration-service.ts](/root/data/SchemaDash/backend/src/services/diagram-migration-service.ts)

Avoid breaking:

- the disabled-vs-external-service-only contract
- actor rewriting on main-app diff/apply routes
- workflow live snapshot updates after migration apply
- service support routes required by the main-app client:
    - `/api/connections/:id`
    - `/api/schema/snapshots/:id`
    - `/api/schema/plans/:id/latest-audit`

Where to continue:

- service packaging and deployment work:
  [services/schema-sync-service/README.md](/root/data/SchemaDash/services/schema-sync-service/README.md)
- client and health integration:
  [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
  and
  [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
- remaining shared-core cleanup:
  [packages/schema-sync-core/src/sql.ts](/root/data/SchemaDash/packages/schema-sync-core/src/sql.ts)
  and
  [packages/schema-sync-core/src/type-normalization.ts](/root/data/SchemaDash/packages/schema-sync-core/src/type-normalization.ts)

## 9. Git Summary

Working branch:

- `sync/02-schema-sync-standalone-service-only-on-top-of-postgres-extraction`

Pull request title:

- `Convert extracted postgres schema sync adapter into standalone-service-only architecture`

Commit list created for this task:

1. `3a276b63` `chore: audit current extracted postgres seam for standalone-service-only conversion`
2. `df01f4fe` `docs: add standalone schema sync service architecture design from current branch state`
3. `8f0cc068` `fix: remove hardcoded postgres engine leakage in shared/core boundaries`
4. `f0ec362c` `refactor: introduce standalone schema sync service client and enablement boundary`
5. `fd0fcfc2` `refactor: move schema sync into dedicated standalone-service-ready folder`
6. `ce76f1f3` `fix: preserve postgres live schema sync behavior through service-oriented boundary`
7. `acf9e3ac` `docs: add env configuration and standalone service deployment notes`
8. `pending current commit` `test: validate disabled and standalone-service-enabled schema sync behavior`

What each commit did:

1. recorded the conversion audit and preserved-seam rationale
2. defined the standalone-service-only target architecture
3. removed the most misleading hardcoded PostgreSQL leakage in shared/core and
   repository boundaries
4. introduced the main-app disabled/remote client boundary and removed local
   runtime assembly from app context
5. moved the runtime into the new `services/schema-sync-service/` workspace
6. tightened service-oriented behavior with service-aware readiness and
   repository scripts
7. added service README, env example, and deployment notes
8. updates tests and final handoff for the completed branch state
