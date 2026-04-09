# Schema Sync PostgreSQL Coupling Audit

## Purpose

This audit documents where SchemaDash's live schema sync system is already engine-agnostic and where it is still coupled to PostgreSQL behavior. It is the foundation for the multi-engine adapter architecture work tracked in [docs/multi-engine-schema-sync-architecture.md](/root/data/SchemaDash/docs/multi-engine-schema-sync-architecture.md).

The audit is intentionally repository-specific. It reflects the code on branch `design/01-multi-engine-schema-sync-architecture`, not a generic future-state design.

## Scope Reviewed

- `packages/schema-sync-core/src/*`
- `backend/src/postgres/introspection.ts`
- `backend/src/services/connections-service.ts`
- `backend/src/services/schema-sync-service.ts`
- `backend/src/services/apply-service.ts`
- `backend/src/services/diagram-migration-service.ts`
- `backend/src/routes/schema-sync-routes.ts`
- `backend/src/routes/diagram-migration-routes.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
- Existing docs that describe the live workflow and schema sync system

## Current Flow Summary

The current MVP is operationally solid for PostgreSQL:

1. A saved connection is created and encrypted in the backend metadata database.
2. The backend tests connectivity through PostgreSQL-specific logic.
3. The backend introspects PostgreSQL system catalogs into `CanonicalSchema`.
4. The frontend converts Development diagram state into the same canonical schema shape.
5. `packages/schema-sync-core` computes changes, warnings, and SQL preview.
6. Apply re-checks live drift, runs preflight checks, and executes the persisted preview SQL.
7. Audit records, apply jobs, and snapshots keep preview/apply traceability.

The biggest design strength is that preview and apply already share one canonical plan pipeline. The biggest design weakness is that the pipeline only stays aligned because nearly every participating layer assumes PostgreSQL.

## What Is Already Engine-Agnostic

### Shared canonical diff workflow

The strongest reusable base already exists in `packages/schema-sync-core/`:

- `src/diff.ts`
  - Produces a change plan from baseline and target canonical schemas.
- `src/compare.ts`
  - Produces compare/review output from two canonical schemas.
- `src/hash.ts`
  - Provides schema fingerprinting for drift detection.
- `src/risk.ts`
  - Adds risk classification over abstract schema changes.

This is the right conceptual home for engine-agnostic planning, but the current implementation still embeds PostgreSQL-specific assumptions inside those shared modules.

### Operational persistence and orchestration shape

The backend service layout is already separated from the editor:

- `backend/src/services/schema-sync-service.ts`
  - Import + diff orchestration.
- `backend/src/services/apply-service.ts`
  - Apply orchestration, audit logging, pre/post snapshots.
- `backend/src/services/diagram-migration-service.ts`
  - Workflow-aware preview/validate/apply on top of the same canonical plan model.
- `backend/src/repositories/metadata-repository.ts`
  - Stores connections, snapshots, plans, jobs, and audits without being tightly tied to PostgreSQL catalogs.

This separation is valuable and should be preserved. A future adapter system should plug into these service boundaries instead of replacing them.

### Canonical boundary between live DB and editor

There is already an explicit canonical boundary:

- Live import path:
  - database -> backend introspection -> `CanonicalSchema` -> frontend diagram
- Development path:
  - frontend diagram -> `CanonicalSchema` -> backend diff/apply

That boundary is the correct place to preserve migration fidelity across engines.

## PostgreSQL-Specific Coupling

### 1. Shared schema-sync types are hard-coded to PostgreSQL

`packages/schema-sync-core/src/types.ts` currently bakes PostgreSQL assumptions into the contract layer:

- `databaseEngineSchema` only allows `'postgresql'`
- `CanonicalSchema.engine` therefore only accepts PostgreSQL
- canonical custom types only model PostgreSQL-style `enum` and `composite`
- change kinds include PostgreSQL-specific operations:
  - `create_enum_type`
  - `add_enum_value`
- column identity semantics use PostgreSQL wording:
  - `identityGeneration: 'ALWAYS' | 'BY DEFAULT'`

This means the shared type system is not just "missing other engines"; it is already shaped by PostgreSQL DDL concepts.

### 2. Shared connection contracts are PostgreSQL-shaped

`packages/schema-sync-core/src/api.ts` is also PostgreSQL-specific:

- `databaseConnectionSecretSchema` assumes:
  - host
  - port default `5432`
  - database
  - username
  - password
  - PostgreSQL-style SSL modes
- connection payloads default `engine: 'postgresql'`
- connection summaries only expose a PostgreSQL-style connection model
- schema selection is named `defaultSchemas`, which fits PostgreSQL and SQL Server better than MySQL/MariaDB catalogs

This is important because multi-engine support needs per-engine connection schemas, not a single secret DTO with optional fields bolted on later.

### 3. Shared diff logic contains PostgreSQL type rules

`packages/schema-sync-core/src/diff.ts` is nominally shared, but it includes PostgreSQL-only logic:

- `BUILTIN_POSTGRES_TYPES`
- PostgreSQL-specific custom type detection and blocking rules
- warnings that explicitly say "PostgreSQL requires ..."
- enum-additive logic tied to PostgreSQL custom type handling

This means the current diff layer mixes:

- engine-agnostic structural planning
- PostgreSQL semantic validation
- PostgreSQL capability blocking

Those need to be separated before other adapters are added.

### 4. Shared SQL generation is a PostgreSQL renderer

`packages/schema-sync-core/src/sql.ts` is entirely PostgreSQL SQL generation:

- PostgreSQL identifier quoting
- `CREATE SCHEMA IF NOT EXISTS`
- `CREATE TYPE ... AS ENUM`
- `ALTER TYPE ... ADD VALUE`
- `ALTER COLUMN ... TYPE ... USING column::type`
- PostgreSQL identity syntax
- PostgreSQL array type syntax

This file is effectively `postgresql-sql-renderer.ts` living in the shared core package.

### 5. Shared type normalization is PostgreSQL-biased

`packages/schema-sync-core/src/type-normalization.ts` normalizes PostgreSQL aliases like:

- `varchar -> character varying`
- `timestamptz -> timestamp with time zone`
- `int4 -> integer`

This is useful for PostgreSQL compare fidelity, but it is not an engine-neutral type-normalization strategy.

### 6. Live introspection is fully PostgreSQL-specific

`backend/src/postgres/introspection.ts` is a direct PostgreSQL adapter, though it is not yet framed as one:

- uses `pg.Client`
- queries `pg_class`, `pg_namespace`, `pg_attribute`, `pg_constraint`, `pg_type`
- parses PostgreSQL array/text catalog formats
- derives PostgreSQL enum/composite metadata
- derives PostgreSQL identity/default/type formatting

This is expected for the first engine, but the rest of the backend calls it directly instead of through an adapter boundary.

### 7. Services directly import PostgreSQL behavior

Several services call PostgreSQL-specific functions directly:

- `backend/src/services/connections-service.ts`
  - imports `testPostgresConnection`
  - creates connections with `engine: 'postgresql'`
- `backend/src/services/schema-sync-service.ts`
  - imports `introspectPostgresSchema`
- `backend/src/services/diagram-migration-service.ts`
  - imports `introspectPostgresSchema`
- `backend/src/services/apply-service.ts`
  - imports `introspectPostgresSchema`
  - uses `pg.Client` directly

This is the most immediate backend coupling that should be isolated first.

### 8. Apply semantics are tuned to PostgreSQL execution behavior

`backend/src/services/apply-service.ts` preserves preview/apply fidelity well, but it assumes PostgreSQL apply rules:

- creates a PostgreSQL client directly
- treats `ALTER TYPE ... ADD VALUE` as non-transactional
- runs PostgreSQL SQL statements from the plan as-is
- performs `SET NOT NULL` preflight using PostgreSQL-ready table qualification and SQL syntax

A future multi-engine design should keep the same safety model while moving engine-specific preflight and transactional grouping into adapters.

### 9. Frontend canonical conversion is PostgreSQL-only

`frontend/src/lib/schema-sync/canonical-adapters.ts` is one of the most important findings in this audit.

It hard-codes PostgreSQL in both directions:

- `DatabaseType.POSTGRESQL`
- PostgreSQL default schema assumptions (`public`)
- PostgreSQL type synonym lookups
- PostgreSQL field suffix rendering
- `CanonicalSchema.engine = 'postgresql'`
- PostgreSQL-style custom type and array handling
- PostgreSQL naming conventions such as `_pkey`, `_key`, `_fkey`

This means future adapter work is not only a backend problem. Development schema export is currently PostgreSQL-targeted too.

### 10. Two migration entrypoints depend on the same PostgreSQL assumptions

SchemaDash currently has two apply-related paths:

- direct schema sync routes in `backend/src/routes/schema-sync-routes.ts`
- workflow-aware migration routes in `backend/src/routes/diagram-migration-routes.ts`

Both eventually depend on the same PostgreSQL-only canonical export, diff, SQL rendering, and introspection logic. This matters because multi-engine support must keep both surfaces aligned, not just the direct operational API.

## Existing Canonical Boundaries Worth Preserving

The following boundaries are real strengths and should survive the refactor:

- `CanonicalSchema` as the compare/diff/apply source of truth
- `ChangePlan` as the persisted preview artifact
- drift detection based on canonical fingerprints
- audit records and execution logs tied to a stored plan
- workflow migration using the same canonical planning concept as direct schema sync

These are the pieces that make preview/apply fidelity credible today.

## Fidelity Risks If New Engines Are Added Without Architecture First

### Development schema drift from live import semantics

If MySQL or SQL Server support is added only on the backend, the frontend would still export PostgreSQL-shaped target schemas. That would break the alignment between:

- Development diagram state
- canonical target schema
- preview SQL
- apply execution

### Shared core becoming a pile of engine conditionals

If new engines are added by extending the current files with `if (engine === ...)`, the following files will become high-risk quickly:

- `packages/schema-sync-core/src/types.ts`
- `packages/schema-sync-core/src/diff.ts`
- `packages/schema-sync-core/src/sql.ts`
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
- `backend/src/services/apply-service.ts`

That would make correctness regressions more likely with every new engine.

### Preview/apply mismatch per engine

Today apply executes persisted preview SQL. That is good. But if future engines re-render SQL at apply time using slightly different semantics, preview/apply fidelity will regress immediately.

The engine abstraction must therefore own:

- rendering
- preflight rules
- transactional grouping
- execution semantics

as one coherent adapter output.

## High-Risk Files for the Migration

- `packages/schema-sync-core/src/types.ts`
  - central contract file that currently mixes engine, canonical, change, apply, and connection DTOs
- `packages/schema-sync-core/src/diff.ts`
  - shared planner with embedded PostgreSQL validation logic
- `packages/schema-sync-core/src/sql.ts`
  - currently PostgreSQL-only SQL generation hidden as shared SQL generation
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
  - controls Development-to-canonical fidelity and is fully PostgreSQL-oriented
- `backend/src/services/apply-service.ts`
  - preview/apply fidelity critical path
- `backend/src/services/schema-sync-service.ts`
  - direct import/diff path currently wired to PostgreSQL introspection
- `backend/src/services/diagram-migration-service.ts`
  - workflow migration path currently wired to PostgreSQL introspection
- `backend/src/services/connections-service.ts`
  - central place for introducing engine-aware connection validation and routing

## Audit Conclusion

SchemaDash is not starting from zero. It already has:

- a real canonical schema boundary
- persisted preview plans
- safe apply orchestration
- drift detection
- audit traces
- a shared compare/diff core

But it is still a PostgreSQL-oriented system at every important seam:

- shared contracts
- frontend canonical export
- backend introspection
- validation rules
- SQL rendering
- apply behavior

The next step should not be "implement MySQL." The next step should be to introduce explicit engine boundaries so PostgreSQL becomes the first adapter rather than the hidden default behavior of the whole system.
