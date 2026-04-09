# Schema Sync Service Architecture

## Purpose

This document defines the next architecture for SchemaDash live schema sync on
top of the existing PostgreSQL adapter extraction branch.

The target runtime model is intentionally narrow:

- schema sync disabled
- schema sync enabled through a standalone external service

Embedded in-process schema sync is intentionally not retained as a supported
runtime mode.

## Why The Current PostgreSQL Extraction Is Preserved

The PostgreSQL adapter extraction already completed on the parent branch should
stay in place.

Why it should be preserved:

- it separated runtime engine behavior from the higher-level orchestration path
- it introduced explicit registry and adapter contracts
- it reduced the blast radius for PostgreSQL-specific introspection and apply
  behavior
- it is the right base for packaging schema sync into an external service

Why reverting is not recommended:

- reverting would re-couple orchestration and PostgreSQL runtime behavior
- it would make future service packaging harder, not easier
- it would throw away already-tested additive seams without solving the real
  architectural problem
- the real remaining issue is shared/core PostgreSQL leakage and the app's
  assumption that schema sync always runs locally

## Why Embedded Mode Is Removed

SchemaDash should not keep three runtime states:

- disabled
- embedded local runtime
- external service

That model creates unclear ownership and unnecessary operational complexity.

Reasons embedded mode is intentionally removed:

- the main app should not need live database drivers, engine registries, and
  apply runtime wiring to function normally
- Dockerization and future scaling are simpler when schema sync is its own
  deployable service
- support and documentation are clearer when there is one enabled mode instead
  of parallel local and remote implementations
- future engine growth should happen inside the schema-sync service boundary,
  not inside the main product server

## Runtime Modes

### 1. Disabled

When disabled:

- the main app does not instantiate local schema-sync runtime services
- schema-sync routes return a safe unavailable response
- workflow/migration actions that depend on live schema sync fail with a clear
  disabled message
- the rest of SchemaDash continues to work:
  - diagram editing
  - persistence
  - sharing
  - auth
  - versions
  - changelog
  - non-sync compare/review flows

### 2. Enabled External Service

When enabled:

- the main app resolves a remote schema-sync service URL from environment
- the main app communicates with that service through an explicit client
  boundary
- the standalone service owns runtime execution and schema-sync metadata
- the main app keeps product-level workflow state and uses the remote service
  for live sync operations

## Environment Variable Contract

The service boundary is controlled by two environment variables on the main app:

- `SCHEMADASH_SCHEMA_SYNC_ENABLED=true|false`
- `SCHEMADASH_SCHEMA_SYNC_SERVICE_URL=http://localhost:4020`

Behavior:

- if `SCHEMADASH_SCHEMA_SYNC_ENABLED=false`, schema sync is disabled and the
  service URL is ignored
- if `SCHEMADASH_SCHEMA_SYNC_ENABLED=true`, the service URL is required
- there is no fallback to an in-process implementation

The standalone schema-sync service can use its own env contract for host, port,
data directory, and secrets, but the main app only needs the enabled flag and
service URL.

## Boundary Definition

### What Remains In The Main App

- auth, sessions, route access, and request identity
- persistence and project/diagram storage
- diagram workflow state and version history
- diagram migration orchestration that is specific to SchemaDash workflows
- UI-facing routes under the existing app API surface
- remote client/proxy integration to the schema-sync service

### What Moves Into The Standalone Schema Sync Service Area

- schema-sync service entrypoint
- schema-sync service env/config parsing
- transport layer for connections, import, diff, apply, audit, and job reads
- metadata persistence for connections, snapshots, plans, jobs, and audits
- engine registry
- engine adapter implementations
- PostgreSQL runtime behavior
- future engine runtime locations
- schema-sync planning and apply execution services

## Proposed Repository Organization

Recommended dedicated area:

- `services/schema-sync-service/`

Inside that area:

- `src/index.ts`
  - standalone service startup
- `src/app.ts`
  - Fastify app factory for the schema-sync service
- `src/config/*`
  - service env and logger handling
- `src/context/*`
  - service-local dependency assembly
- `src/routes/*`
  - transport/API routes
- `src/repositories/*`
  - schema-sync metadata persistence
- `src/services/*`
  - connection/import/diff/apply orchestration
- `src/engines/*`
  - engine contracts and implementations
- `src/clients/*`
  - optional internal transport helpers if needed later

This structure is intentionally deployable on its own and straightforward to
containerize later.

## API Shape And Compatibility

The main app should keep the existing UI-facing schema-sync endpoints when
possible, but the implementation changes:

- the main app routes become a client/proxy boundary
- workflow services call a remote schema-sync client instead of local runtime
  services
- direct local runtime imports from the main app are removed

This preserves frontend behavior while changing where execution happens.

## Shared/Core Cleanup Principles

The shared package `packages/schema-sync-core/` should remain shared, but it
must become more honest about engine specialization.

Required cleanup direction:

- keep canonical schema and request/response contracts shared
- stop hardcoding PostgreSQL values in generic-looking boundaries
- make PostgreSQL-only behavior explicit where it still exists
- avoid pretending unsupported engines are fully implemented

Examples:

- engine values in connection DTOs should not be hardcoded to PostgreSQL
- metadata storage should round-trip the stored engine value honestly
- SQL generation and type normalization should explicitly acknowledge their
  PostgreSQL-only implementation status

## Rollout Strategy From The Current Branch State

### Phase 1. Preserve And Document

- keep the current extracted PostgreSQL runtime seam
- document why that seam remains
- document the standalone-only target architecture

### Phase 2. Remove Misleading Leakage

- fix the highest-value shared/core PostgreSQL leaks
- make storage and DTO boundaries reflect true engine ownership more honestly

### Phase 3. Introduce Main-App Boundary

- add enablement parsing and service URL parsing
- add a schema-sync client boundary in the main app
- add a disabled implementation for safe degradation
- remove local runtime assembly from the main app context

### Phase 4. Move Runtime Into Dedicated Service Area

- relocate schema-sync runtime code into `services/schema-sync-service/`
- add a standalone app entrypoint and service-specific env handling

### Phase 5. Preserve PostgreSQL Fidelity

- make the standalone service preserve current PostgreSQL behavior for:
  - connection test
  - live import
  - diff
  - preview SQL
  - apply
  - drift detection
  - audits and jobs

### Phase 6. Add Lightweight Operations Scaffolding

- add service README
- add env example or startup notes
- add a placeholder Dockerfile if useful

## Migration Notes

This architecture change does not require reverting the current branch history.
It is a follow-up refinement on top of the extraction.

The main migration concern is ownership:

- the main app should stop owning live schema-sync runtime
- the standalone service should become the only enabled runtime owner

The frontend does not need a brand-new API model for this change. Existing app
routes can remain stable while the backend implementation switches from local
execution to remote communication.

## Success Criteria

The architecture is considered successful when:

- the PostgreSQL extraction remains intact
- embedded runtime mode is gone
- only disabled and external-service-enabled modes remain
- the main app no longer assumes local schema-sync execution
- the standalone service area can run independently
- current PostgreSQL migration fidelity is preserved
- future Dockerization is materially easier than on the parent branch
