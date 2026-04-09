# Codex Handoff

## 1. Project Overview

SchemaDash is a diagram-first database design tool with a Live Schema Sync MVP.
The product can store database connections, introspect a live PostgreSQL
database into a canonical schema, diff that live baseline against the editor's
Development schema, preview migration SQL, and safely apply the persisted plan
with drift detection, audit logs, and apply jobs.

The system area touched by this task is the schema-sync pipeline:

- frontend Development diagram -> canonical schema export
- backend live database introspection -> canonical schema import
- shared canonical diff/change-plan generation
- backend preview/apply orchestration
- metadata persistence for connections, snapshots, plans, jobs, and audits

Key concepts:

- `CanonicalSchema`: the shared schema representation used across frontend and
  backend
- `ChangePlan`: the persisted preview/apply contract containing changes,
  warnings, and SQL statements
- Live Schema Sync fidelity: the preview SQL and apply execution must stay
  aligned
- adapter architecture: shared orchestration with engine-specific runtime
  behavior hidden behind explicit contracts

## 2. Current Architectural Context

Read these first:

1. [docs/multi-engine-schema-sync-architecture.md](/root/data/SchemaDash/docs/multi-engine-schema-sync-architecture.md)
2. [docs/audits/schema-sync-postgres-coupling-audit.md](/root/data/SchemaDash/docs/audits/schema-sync-postgres-coupling-audit.md)
3. [backend/src/engines/types.ts](/root/data/SchemaDash/backend/src/engines/types.ts)
4. [backend/src/engines/registry.ts](/root/data/SchemaDash/backend/src/engines/registry.ts)
5. [backend/src/engines/postgresql/adapter.ts](/root/data/SchemaDash/backend/src/engines/postgresql/adapter.ts)
6. [backend/src/services/schema-sync-service.ts](/root/data/SchemaDash/backend/src/services/schema-sync-service.ts)
7. [backend/src/services/apply-service.ts](/root/data/SchemaDash/backend/src/services/apply-service.ts)

Important high-risk files and boundaries:

- [packages/schema-sync-core/src/diff.ts](/root/data/SchemaDash/packages/schema-sync-core/src/diff.ts)
  Shared structural planner, but still contains PostgreSQL-shaped validation and
  warning language.
- [packages/schema-sync-core/src/sql.ts](/root/data/SchemaDash/packages/schema-sync-core/src/sql.ts)
  Still the legacy PostgreSQL SQL renderer. Live preview/apply now call it
  through the PostgreSQL adapter wrapper to preserve behavior.
- [packages/schema-sync-core/src/type-normalization.ts](/root/data/SchemaDash/packages/schema-sync-core/src/type-normalization.ts)
  Still PostgreSQL-biased.
- [backend/src/services/schema-sync-service.ts](/root/data/SchemaDash/backend/src/services/schema-sync-service.ts)
  Imports live schema through the adapter registry and re-renders persisted plan
  SQL through the resolved adapter.
- [backend/src/services/diagram-migration-service.ts](/root/data/SchemaDash/backend/src/services/diagram-migration-service.ts)
  Uses the same adapter path for migration preview/validation.
- [backend/src/services/apply-service.ts](/root/data/SchemaDash/backend/src/services/apply-service.ts)
  Uses adapter-owned introspection, client creation, preflight checks, and
  transaction grouping.
- [frontend/src/lib/schema-sync/canonical-adapters.ts](/root/data/SchemaDash/frontend/src/lib/schema-sync/canonical-adapters.ts)
  Still contains the concrete PostgreSQL canonical mapping logic.
- [frontend/src/lib/schema-sync/engine-definitions.ts](/root/data/SchemaDash/frontend/src/lib/schema-sync/engine-definitions.ts)
  Lightweight seam added in this task so future engines have an explicit place
  to plug in.

Frontend/backend/shared relationship:

- `packages/schema-sync-core` owns shared engine ids/capabilities, canonical
  schema types, change planning, hashing, and the legacy SQL renderer.
- `backend/src/engines/*` now owns runtime engine behavior for live sync.
- `frontend/src/lib/schema-sync/*` still uses PostgreSQL-only mapping logic, but
  now also has an engine-definition seam for future adapters.

## 3. Task Completed

Goal of this task:

- extract PostgreSQL into the first formal schema sync adapter
- keep current PostgreSQL Live Schema Sync behavior intact
- make the runtime architecture ready for MySQL, MariaDB, and SQL Server later

What was implemented:

- added shared engine ids and capability types in
  [packages/schema-sync-core/src/engines.ts](/root/data/SchemaDash/packages/schema-sync-core/src/engines.ts)
- added backend adapter contracts in
  [backend/src/engines/types.ts](/root/data/SchemaDash/backend/src/engines/types.ts)
- extracted PostgreSQL runtime logic into:
  - [backend/src/engines/postgresql/connection.ts](/root/data/SchemaDash/backend/src/engines/postgresql/connection.ts)
  - [backend/src/engines/postgresql/introspection.ts](/root/data/SchemaDash/backend/src/engines/postgresql/introspection.ts)
  - [backend/src/engines/postgresql/renderer.ts](/root/data/SchemaDash/backend/src/engines/postgresql/renderer.ts)
  - [backend/src/engines/postgresql/apply.ts](/root/data/SchemaDash/backend/src/engines/postgresql/apply.ts)
  - [backend/src/engines/postgresql/capabilities.ts](/root/data/SchemaDash/backend/src/engines/postgresql/capabilities.ts)
  - [backend/src/engines/postgresql/adapter.ts](/root/data/SchemaDash/backend/src/engines/postgresql/adapter.ts)
- added adapter registry and change-plan rendering helper:
  - [backend/src/engines/registry.ts](/root/data/SchemaDash/backend/src/engines/registry.ts)
  - [backend/src/engines/plan.ts](/root/data/SchemaDash/backend/src/engines/plan.ts)
- routed backend services through adapter resolution instead of direct
  PostgreSQL imports
- kept [backend/src/postgres/introspection.ts](/root/data/SchemaDash/backend/src/postgres/introspection.ts)
  as a compatibility shim
- added a lightweight frontend engine-definition seam:
  - [frontend/src/lib/schema-sync/engine-definitions.ts](/root/data/SchemaDash/frontend/src/lib/schema-sync/engine-definitions.ts)
  - [frontend/src/lib/schema-sync/canonical-adapters.postgresql.ts](/root/data/SchemaDash/frontend/src/lib/schema-sync/canonical-adapters.postgresql.ts)

Decisions made:

- preserve the existing PostgreSQL SQL renderer by wrapping it from the adapter
  instead of rewriting it during the extraction
- keep connection request DTOs PostgreSQL-shaped for now to avoid mixing this
  adapter refactor with premature multi-engine connection API changes
- keep the persisted `ChangePlan` shape unchanged so preview/apply fidelity and
  audit compatibility remain stable

Approach intentionally avoided:

- no MySQL, MariaDB, or SQL Server runtime implementation
- no repository-wide type/generalization sweep
- no destructive change to the current PostgreSQL preview/apply flow just to
  make the abstraction look cleaner

## 4. Files Changed

Files created:

- [packages/schema-sync-core/src/engines.ts](/root/data/SchemaDash/packages/schema-sync-core/src/engines.ts)
  Shared engine ids, capability types, and static engine metadata.
- [backend/src/engines/types.ts](/root/data/SchemaDash/backend/src/engines/types.ts)
  Backend adapter contract for connection testing, introspection, rendering, and
  apply semantics.
- [backend/src/engines/registry.ts](/root/data/SchemaDash/backend/src/engines/registry.ts)
  Adapter resolution entrypoint.
- [backend/src/engines/plan.ts](/root/data/SchemaDash/backend/src/engines/plan.ts)
  Helper to render persisted `ChangePlan.sqlStatements` through the resolved
  adapter.
- [backend/src/engines/postgresql/adapter.ts](/root/data/SchemaDash/backend/src/engines/postgresql/adapter.ts)
- [backend/src/engines/postgresql/apply.ts](/root/data/SchemaDash/backend/src/engines/postgresql/apply.ts)
- [backend/src/engines/postgresql/capabilities.ts](/root/data/SchemaDash/backend/src/engines/postgresql/capabilities.ts)
- [backend/src/engines/postgresql/connection.ts](/root/data/SchemaDash/backend/src/engines/postgresql/connection.ts)
- [backend/src/engines/postgresql/introspection.ts](/root/data/SchemaDash/backend/src/engines/postgresql/introspection.ts)
- [backend/src/engines/postgresql/renderer.ts](/root/data/SchemaDash/backend/src/engines/postgresql/renderer.ts)
- [backend/test/schema-sync-adapter-registry.test.ts](/root/data/SchemaDash/backend/test/schema-sync-adapter-registry.test.ts)
  Registry/capability/connection-routing coverage.
- [frontend/src/lib/schema-sync/canonical-adapters.postgresql.ts](/root/data/SchemaDash/frontend/src/lib/schema-sync/canonical-adapters.postgresql.ts)
  PostgreSQL canonical adapter wrapper for the new frontend seam.
- [frontend/src/lib/schema-sync/engine-definitions.ts](/root/data/SchemaDash/frontend/src/lib/schema-sync/engine-definitions.ts)
  Frontend engine-definition lookup.

Files modified:

- [packages/schema-sync-core/src/types.ts](/root/data/SchemaDash/packages/schema-sync-core/src/types.ts)
- [packages/schema-sync-core/src/api.ts](/root/data/SchemaDash/packages/schema-sync-core/src/api.ts)
- [packages/schema-sync-core/src/index.ts](/root/data/SchemaDash/packages/schema-sync-core/src/index.ts)
- [backend/src/postgres/introspection.ts](/root/data/SchemaDash/backend/src/postgres/introspection.ts)
- [backend/src/context/app-context.ts](/root/data/SchemaDash/backend/src/context/app-context.ts)
- [backend/src/services/connections-service.ts](/root/data/SchemaDash/backend/src/services/connections-service.ts)
- [backend/src/services/schema-sync-service.ts](/root/data/SchemaDash/backend/src/services/schema-sync-service.ts)
- [backend/src/services/diagram-migration-service.ts](/root/data/SchemaDash/backend/src/services/diagram-migration-service.ts)
- [backend/src/services/apply-service.ts](/root/data/SchemaDash/backend/src/services/apply-service.ts)
- [backend/test/apply-service-audit.test.ts](/root/data/SchemaDash/backend/test/apply-service-audit.test.ts)
- [backend/test/diagram-migration-service.test.ts](/root/data/SchemaDash/backend/test/diagram-migration-service.test.ts)
- [backend/test/schema-sync-routes.test.ts](/root/data/SchemaDash/backend/test/schema-sync-routes.test.ts)
- [frontend/src/lib/schema-sync/canonical-adapters.test.ts](/root/data/SchemaDash/frontend/src/lib/schema-sync/canonical-adapters.test.ts)
- [docs/multi-engine-schema-sync-architecture.md](/root/data/SchemaDash/docs/multi-engine-schema-sync-architecture.md)

Important files intentionally not changed:

- [packages/schema-sync-core/src/diff.ts](/root/data/SchemaDash/packages/schema-sync-core/src/diff.ts)
  Still shared and still partly PostgreSQL-shaped. Avoided in this task to keep
  runtime extraction low-risk.
- [packages/schema-sync-core/src/sql.ts](/root/data/SchemaDash/packages/schema-sync-core/src/sql.ts)
  Still the legacy PostgreSQL renderer. Adapter currently wraps it.
- [packages/schema-sync-core/src/type-normalization.ts](/root/data/SchemaDash/packages/schema-sync-core/src/type-normalization.ts)
  Still PostgreSQL-biased.
- [backend/src/repositories/metadata-repository.ts](/root/data/SchemaDash/backend/src/repositories/metadata-repository.ts)
  No schema/storage changes were needed for this extraction.

## 5. Data / API / Workflow Changes

No database migration or metadata schema migration was added.

Behavioral/runtime changes:

- `ConnectionSummary.engine` can now represent any shared `DatabaseEngine`
  value, though only PostgreSQL is currently supported by the backend registry.
- backend services now resolve an engine adapter from the stored connection or
  persisted plan engine before:
  - testing connections
  - introspecting live schema
  - rendering preview SQL into `ChangePlan.sqlStatements`
  - validating apply preflights
  - grouping statements into transactional vs non-transactional execution
- `ChangePlan` storage format is unchanged
- audit and apply-job storage behavior is unchanged
- connection request payloads are intentionally still PostgreSQL-shaped

## 6. Validation Performed

Validated:

- `npm run build -w @schemadash/schema-sync-core`
- `npm run build -w @schemadash/backend`
- `npm run test -w @schemadash/schema-sync-core`
- `npm run test -w @schemadash/backend`
- `npx vitest run --config frontend/vitest.config.ts frontend/src/lib/schema-sync/canonical-adapters.test.ts`

What was verified:

- backend registry resolves PostgreSQL and exposes the expected capability
  profile
- draft connection testing routes through the resolved adapter
- import/diff/apply service tests still pass under adapter injection
- diagram migration preview/validation/apply tests still pass
- audit reuse and preview/apply SQL alignment tests still pass
- frontend canonical adapter behavior is unchanged and now has an engine
  definition seam

Unverified / remaining risk:

- no manual end-to-end test against a real PostgreSQL database was run in this
  session
- no full frontend test suite run was performed, only the canonical adapter test
- multi-engine connection DTO changes and richer rendered execution-plan storage
  remain future work

## 7. Outstanding Work

Not done yet:

- move PostgreSQL-specific validation/warning logic out of
  [packages/schema-sync-core/src/diff.ts](/root/data/SchemaDash/packages/schema-sync-core/src/diff.ts)
- replace the legacy shared PostgreSQL renderer in
  [packages/schema-sync-core/src/sql.ts](/root/data/SchemaDash/packages/schema-sync-core/src/sql.ts)
  with fully adapter-owned rendering
- split connection payload schemas by engine
- add real MySQL, MariaDB, or SQL Server adapters
- persist richer rendered execution plans beyond `sqlStatements: string[]`

Recommended next phase:

1. Extract PostgreSQL-shaped validation and warning logic from the shared diff
   layer into adapter-aware plan validation.
2. Keep PostgreSQL behavior identical while introducing an explicit rendered-plan
   object owned by the adapter.
3. After that, begin MySQL compare/review/import support behind the same
   registry.

Blockers / risks:

- touching `diff.ts` and `sql.ts` can easily break preview/apply fidelity if the
  persisted plan contract changes carelessly
- future connection DTO work should not be mixed with adapter semantics unless
  tests cover all route validation paths

## 8. Instructions for the Next Codex Session

Read in this order:

1. [docs/codex-handoff.md](/root/data/SchemaDash/docs/codex-handoff.md)
2. [docs/multi-engine-schema-sync-architecture.md](/root/data/SchemaDash/docs/multi-engine-schema-sync-architecture.md)
3. [backend/src/engines/types.ts](/root/data/SchemaDash/backend/src/engines/types.ts)
4. [backend/src/engines/postgresql/adapter.ts](/root/data/SchemaDash/backend/src/engines/postgresql/adapter.ts)
5. [backend/src/services/schema-sync-service.ts](/root/data/SchemaDash/backend/src/services/schema-sync-service.ts)
6. [backend/src/services/apply-service.ts](/root/data/SchemaDash/backend/src/services/apply-service.ts)
7. [packages/schema-sync-core/src/diff.ts](/root/data/SchemaDash/packages/schema-sync-core/src/diff.ts)
8. [packages/schema-sync-core/src/sql.ts](/root/data/SchemaDash/packages/schema-sync-core/src/sql.ts)

Avoid breaking:

- persisted `ChangePlan.sqlStatements` preview/apply alignment
- PostgreSQL non-transactional statement handling
- audit record reuse for preview -> apply
- drift detection before apply

Where to continue:

- start in `packages/schema-sync-core/src/diff.ts` and identify the
  PostgreSQL-shaped validation blocks that should move behind adapter-owned plan
  validation
- then design the rendered-plan contract before attempting MySQL support

## 9. Git Summary

- Working branch: `sync/01-extract-postgres-first-schema-sync-adapter`
- Pull request title: `Extract PostgreSQL into the first formal schema sync adapter`

Commits created for this task:

- `63eca637` `chore: introduce shared schema sync engine contracts and capability model`
  Added shared engine ids/capabilities and backend adapter interface contracts.
- `ac860f43` `refactor: extract postgres-specific schema sync logic into formal adapter modules`
  Moved PostgreSQL runtime behavior into formal adapter modules and left a
  compatibility shim at the old import path.
- `73ca6ae2` `refactor: route live schema sync through postgres adapter resolution path`
  Routed connection testing, live import, preview rendering, validation drift
  checks, and apply execution through the adapter registry.
- `c2be1f99` `test: validate postgres live schema sync behavior under adapter architecture`
  Updated tests for the injected registry path, added registry/capability
  coverage, and added the lightweight frontend engine-definition seam.
- `docs: update multi-engine architecture notes with postgres extraction status`
  Updates the architecture doc and adds this handoff for future sessions.
