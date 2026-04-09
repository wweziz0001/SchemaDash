# Codex Handoff

## 1. Project Overview

SchemaDash is a full-stack schema design and schema-sync product. The relevant system area for this task is the live schema sync and migration workflow that connects:

- frontend Development diagram editing
- shared canonical schema diff/compare logic
- backend live database introspection and safe apply orchestration

For the current MVP, PostgreSQL is the only supported live engine. The product already supports:

- saved live database connections
- live schema import into the editor
- canonical schema diff preview
- generated migration SQL preview
- destructive confirmation gating
- safe apply with drift checks
- audit trails and execution logs
- workflow-aware migration preview/validate/apply routes

Key concepts for understanding this area:

- `Development` remains the editable schema design in the frontend editor.
- `CanonicalSchema` is the shared schema representation used for compare, diff, preview, and audit snapshots.
- `ChangePlan` is the persisted preview artifact that currently carries canonical changes, warnings, and SQL statements.
- Migration fidelity means Development schema export, canonical planning, preview SQL, and apply execution must stay aligned.

## 2. Current Architectural Context

### Parts of the system that matter most

Read these first for follow-up work:

1. `docs/audits/schema-sync-postgres-coupling-audit.md`
2. `docs/multi-engine-schema-sync-architecture.md`
3. `docs/architecture/schema-sync-architecture.md`
4. `docs/live-workflow-release-readiness-checklist.md`
5. `packages/schema-sync-core/src/types.ts`
6. `packages/schema-sync-core/src/diff.ts`
7. `packages/schema-sync-core/src/sql.ts`
8. `frontend/src/lib/schema-sync/canonical-adapters.ts`
9. `backend/src/services/schema-sync-service.ts`
10. `backend/src/services/diagram-migration-service.ts`
11. `backend/src/services/apply-service.ts`
12. `backend/src/services/connections-service.ts`
13. `backend/src/postgres/introspection.ts`

### Important service and module boundaries

- `packages/schema-sync-core/`
  - Shared canonical schema contracts, diffing, compare logic, risk classification, and API schemas.
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
  - Converts canonical schemas to editor diagrams and editor diagrams back to canonical schemas.
  - High risk because it currently hard-codes PostgreSQL semantics for Development export/import.
- `backend/src/services/schema-sync-service.ts`
  - Direct operational import and diff orchestration.
- `backend/src/services/diagram-migration-service.ts`
  - Workflow-aware migration preview, validate, and apply orchestration.
- `backend/src/services/apply-service.ts`
  - Drift recheck, preflight validation, SQL execution, and audit/job persistence.
- `backend/src/postgres/introspection.ts`
  - Current PostgreSQL-specific live adapter in all but name.
- `backend/src/repositories/metadata-repository.ts`
  - Persists connections, snapshots, change plans, apply jobs, and audits in SQLite.

### High-risk files

- `packages/schema-sync-core/src/types.ts`
- `packages/schema-sync-core/src/diff.ts`
- `packages/schema-sync-core/src/sql.ts`
- `packages/schema-sync-core/src/type-normalization.ts`
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
- `backend/src/services/apply-service.ts`
- `backend/src/services/schema-sync-service.ts`
- `backend/src/services/diagram-migration-service.ts`
- `backend/src/services/connections-service.ts`
- `backend/src/postgres/introspection.ts`

### Frontend/backend/shared relationships

- The frontend exports Development diagram state into `CanonicalSchema`.
- The backend imports live database structure into `CanonicalSchema`.
- The shared core computes compare/diff behavior over canonical schema.
- The backend persists plans and executes apply using the stored preview artifact.

This cross-layer canonical boundary is the main strength to preserve in future work.

## 3. Task Completed

### Task goal

Design a concrete, repository-aware multi-engine schema sync architecture for SchemaDash without rushing into full MySQL, MariaDB, or SQL Server implementation.

### What was implemented

- Added a focused audit document:
  - `docs/audits/schema-sync-postgres-coupling-audit.md`
- Added the main design document:
  - `docs/multi-engine-schema-sync-architecture.md`
- Replaced this handoff with a task-specific handoff for future sessions.

### Decisions made

- The design keeps migration fidelity as the top priority.
- The design does not recommend a broad rewrite.
- The design keeps shared orchestration and audit persistence in central backend services.
- The design moves engine-specific behavior behind explicit adapters.
- The design treats frontend canonical export/import as part of the engine boundary, not just backend connectivity.
- The design recommends that preview persist the exact rendered execution plan that apply later executes.

### Approach intentionally avoided

- No full MySQL adapter implementation
- No MariaDB adapter implementation
- No SQL Server adapter implementation
- No broad refactor of unrelated editor or workflow systems
- No speculative code scaffolding that would commit the repo to an untested architecture too early

## 4. Files Changed

### Files created

- `docs/audits/schema-sync-postgres-coupling-audit.md`
  - Repository-specific audit of current PostgreSQL coupling across shared core, frontend, and backend.
- `docs/multi-engine-schema-sync-architecture.md`
  - Main architecture proposal for multi-engine schema sync adapters.

### Files modified

- `docs/codex-handoff.md`
  - Rewritten for this architecture/design task and for a future fresh Codex session.

### Important files intentionally not changed

- `packages/schema-sync-core/src/types.ts`
  - Intentionally not refactored yet; the audit/design docs explain how it should evolve.
- `packages/schema-sync-core/src/diff.ts`
  - Intentionally not refactored yet; current shared planning remains as-is until adapter seams are approved.
- `packages/schema-sync-core/src/sql.ts`
  - Intentionally not moved yet; the design recommends extracting SQL rendering from the shared core in a later implementation phase.
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
  - Intentionally not refactored yet; the design calls this out as a fidelity-critical future step.
- `backend/src/services/apply-service.ts`
  - Intentionally not refactored yet; no apply-path changes were made in this design-first task.
- `backend/src/postgres/introspection.ts`
  - Intentionally not moved yet; it remains the current PostgreSQL implementation to isolate later.

## 5. Data / API / Workflow Changes

### Data model changes

- None in code for this task.

### API changes

- None in code for this task.

### Workflow behavior changes

- None in runtime behavior for this task.

### Architectural/workflow guidance added

- Future multi-engine work should preserve alignment among:
  - Development schema export
  - canonical schema snapshots
  - migration preview rendering
  - apply execution
- Future plans should persist a richer rendered execution plan rather than treating `sqlStatements: string[]` as the whole engine contract.

### Migrations, env vars, config

- No database migrations added
- No environment variable changes
- No config changes

## 6. Validation Performed

### What was verified

- The requested branch was created and work was performed on `design/01-multi-engine-schema-sync-architecture`.
- The existing repository structure was audited directly from source files.
- The design was grounded in the actual code paths used today:
  - shared canonical core
  - frontend canonical adapters
  - backend connection/introspection services
  - apply orchestration
  - workflow migration orchestration
- The design explicitly preserves preview/apply fidelity as a first-class requirement.

### Manual validation done

- Read and traced the main schema-sync modules and relevant docs.
- Confirmed that the repository is currently on a PostgreSQL-only implementation path despite broader DB logos and types in the UI.
- Confirmed that both direct schema sync and workflow migration routes depend on the same PostgreSQL assumptions.

### What remains unverified

- No runtime behavior changed, so no tests were required for correctness changes.
- No build/typecheck/test run was necessary for the docs-only task.
- No experimental code scaffolding was added.

### Known limitations or risks

- The design is detailed, but it is still a design. The next implementation phase must prove the proposed seams with PostgreSQL first.
- `docs/codex-handoff.md` was rewritten for this task, so future sessions should treat older branch-specific handoff assumptions as superseded by this branch state.

## 7. Outstanding Work

### Not done yet

- No adapter registry exists yet.
- PostgreSQL is not yet encapsulated as a first-class adapter.
- Shared types are still PostgreSQL-shaped.
- Frontend Development canonical export/import is still PostgreSQL-only.
- SQL rendering is still embedded in the shared core.
- MySQL, MariaDB, and SQL Server adapters do not exist yet.

### Next recommended implementation phase

Implement Phase 1 and Phase 2 from `docs/multi-engine-schema-sync-architecture.md`:

1. extract engine contracts and capability types
2. add adapter registry
3. move current PostgreSQL connectivity and introspection behind the registry
4. move PostgreSQL SQL rendering and apply preflight policy behind the adapter boundary
5. add an engine-aware seam for frontend canonical export/import

### Blockers and dependencies

- The main dependency is architectural approval of the adapter shape and fidelity rules in the design doc.
- Future code work should avoid adding new engine behavior directly into current PostgreSQL-oriented shared files.

## 8. Instructions for the Next Codex Session

### Exact reading order

1. `docs/codex-handoff.md`
2. `docs/audits/schema-sync-postgres-coupling-audit.md`
3. `docs/multi-engine-schema-sync-architecture.md`
4. `docs/architecture/schema-sync-architecture.md`
5. `packages/schema-sync-core/src/types.ts`
6. `packages/schema-sync-core/src/diff.ts`
7. `packages/schema-sync-core/src/sql.ts`
8. `frontend/src/lib/schema-sync/canonical-adapters.ts`
9. `backend/src/services/connections-service.ts`
10. `backend/src/services/schema-sync-service.ts`
11. `backend/src/services/diagram-migration-service.ts`
12. `backend/src/services/apply-service.ts`
13. `backend/src/postgres/introspection.ts`

### What to avoid breaking

- Do not break current PostgreSQL preview/apply behavior while extracting adapter seams.
- Do not let frontend Development export remain PostgreSQL-specific if backend starts supporting multiple engines.
- Do not re-render SQL differently at apply time after preview has already been persisted.
- Do not split direct schema sync and workflow migration onto different engine semantics.
- Do not expand shared core files with large engine-specific `switch` branches as the long-term architecture.

### Where to continue implementation

- Start with backend adapter registry and PostgreSQL adapter extraction.
- Then address the shared `DatabaseEngine` and capability types.
- Then add the frontend engine-aware canonical mapping seam.

If the next session is implementation-focused, the first files to inspect should be:

1. `packages/schema-sync-core/src/types.ts`
2. `backend/src/services/connections-service.ts`
3. `backend/src/services/schema-sync-service.ts`
4. `backend/src/services/apply-service.ts`
5. `backend/src/postgres/introspection.ts`
6. `frontend/src/lib/schema-sync/canonical-adapters.ts`

## 9. Git Summary

- Working branch: `design/01-multi-engine-schema-sync-architecture`
- Pull request title: `Design multi-engine schema sync adapter architecture for SchemaDash`
- Commit list created for this task:
  - `chore: audit current postgres-oriented schema sync architecture`
    - Adds the repository-specific audit of existing PostgreSQL coupling.
  - `docs: add multi-engine schema sync architecture design`
    - Adds the main architecture design doc and updates this handoff for future sessions.

No minimal adapter groundwork files were added in this task because the design-first goal was better served by documentation without introducing premature runtime abstractions.
