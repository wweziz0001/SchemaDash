# Schema Sync Standalone Service Conversion Audit

## Scope

This audit reflects the repository state on branch
`sync/02-schema-sync-standalone-service-only-on-top-of-postgres-extraction`
immediately after the PostgreSQL adapter extraction work from
`sync/01-extract-postgres-first-schema-sync-adapter`.

It exists to guide the next refactor:

- preserve the extracted PostgreSQL adapter seam
- avoid reverting to the pre-extraction design
- remove the remaining in-process runtime assumptions
- convert SchemaDash to support only:
  - schema sync disabled
  - schema sync enabled through an external standalone service

## Current State Summary

The current extraction is worth keeping.

What is already in a good state:

- `backend/src/engines/types.ts` defines runtime adapter contracts.
- `backend/src/engines/registry.ts` resolves adapters by engine id.
- `backend/src/engines/postgresql/*` isolates PostgreSQL runtime behavior for:
  - connection testing
  - introspection
  - plan rendering
  - apply preflight
  - transaction grouping
- backend services use the adapter registry instead of direct PostgreSQL module
  calls.

Why reverting is not recommended:

- the extraction is additive and localized
- preview/apply fidelity already routes through the extracted adapter seam
- future standalone service packaging is easier with runtime behavior already
  separated from the shared core package
- reverting would re-entangle orchestration and PostgreSQL execution concerns
  before the real boundary work is done

## Remaining Architectural Problem

The main app still behaves as if schema sync is an in-process subsystem.

That assumption currently exists in:

- `backend/src/context/app-context.ts`
  - instantiates the adapter registry directly
  - instantiates schema-sync runtime services directly
- `backend/src/routes/schema-sync-routes.ts`
  - calls local connection/import/diff/apply services directly
- `backend/src/services/diagram-workflow-service.ts`
  - imports live schema through the local runtime service
- `backend/src/services/diagram-migration-service.ts`
  - validates live state and applies plans through local runtime services
- `backend/src/routes/health-routes.ts`
  - reports schema sync as a local SQLite persistence concern

This is the core architectural gap, not the adapter extraction itself.

## Misleading PostgreSQL Leakage Still Present

The current branch still exposes PostgreSQL assumptions in files that now look
more engine-neutral than they really are.

Highest-priority examples:

- `backend/src/repositories/metadata-repository.ts`
  - stores an `engine` column but maps all connections back out as
    `'postgresql'`
- `packages/schema-sync-core/src/api.ts`
  - connection payloads still hardcode PostgreSQL as a literal engine
- `packages/schema-sync-core/src/types.ts`
  - default namespace assumptions still read as generic while reflecting
    PostgreSQL behavior
- `packages/schema-sync-core/src/diff.ts`
  - built-in type matching uses PostgreSQL type knowledge directly
- `packages/schema-sync-core/src/sql.ts`
  - shared SQL generation is still PostgreSQL-only
- `packages/schema-sync-core/src/type-normalization.ts`
  - alias normalization is PostgreSQL-specific
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
  - canonical import/export still assumes PostgreSQL data type semantics and
    default schema behavior

These should be made more honest before or during the standalone boundary work.

## Desired Runtime Model

Supported states should be reduced to exactly two:

1. Disabled
   - schema sync features are unavailable
   - the rest of SchemaDash continues working
   - schema-sync routes and workflow integrations fail safely
2. Enabled external service
   - the main app treats schema sync as a remote dependency
   - the standalone service owns runtime execution for:
     - saved connections
     - live schema import
     - diff preview state
     - apply jobs
     - audit records

Embedded in-process schema sync should not remain a supported runtime mode.

## Main App Responsibilities After Conversion

The main app should keep:

- frontend/API surface compatibility for the existing UI
- authentication and request access policy
- diagram workflow state and version history
- migration workflow orchestration that is specific to the main product
- proxy/client communication to the standalone schema-sync service

The standalone schema-sync service should own:

- schema-sync runtime configuration
- connection storage and secret handling
- engine registry and adapter runtime
- live introspection
- change planning persistence
- apply execution
- audit and apply job persistence

## High-Risk Conversion Areas

1. `backend/src/context/app-context.ts`
   - central place where in-process schema sync is still assumed
2. `backend/src/services/diagram-migration-service.ts`
   - most coupled product workflow path because it mixes workflow state with
     live database validation/apply
3. `backend/src/services/diagram-workflow-service.ts`
   - refresh-live flow must still update workflow snapshots while importing from
     a remote service
4. `backend/src/routes/schema-sync-routes.ts`
   - must degrade safely when disabled and proxy cleanly when enabled
5. `packages/schema-sync-core/src/sql.ts`
   - migration fidelity risk if behavior changes during service extraction

## Recommended Conversion Order

1. Add the standalone-service architecture document from the current branch
   state.
2. Remove the most misleading PostgreSQL leakage in shared/core and repository
   boundaries.
3. Introduce app-side enablement and remote client resolution.
4. Move schema-sync runtime code into a dedicated standalone-service-ready
   folder.
5. Rewire workflow and migration services to use the client boundary only.
6. Add docs, env notes, and test coverage for disabled vs external-service mode.

## Audit Conclusion

The extracted PostgreSQL adapter seam is a valid foundation and should remain.
The next step is not to undo it, but to finish the architectural separation by
removing local runtime assumptions and treating schema sync as either disabled
or externally hosted.
