# Codex Handoff

## 1. Project Overview

SchemaDash is a full-stack schema design and migration workflow product.

- `frontend/` contains the React editor, including the Live Schema Sync dialog that previews and applies Development changes against a real PostgreSQL database.
- `backend/` contains Fastify APIs for database connections, live schema import, persisted preview plans, and guarded apply execution.
- `packages/schema-sync-core/` contains the shared canonical schema model, diff engine, SQL generation, and risk analysis used by both frontend and backend.

Relevant product context for this task:

- This task was intentionally scoped only to the Live Schema Sync MVP path that imports a live baseline, previews a migration from the current Development diagram, and applies the generated SQL directly to the real database.
- The key invariant for this area is: Development meaning -> canonical target schema -> persisted change plan -> SQL preview -> apply execution must all describe the same schema intent.
- Versions, Changelog, and unrelated workflow refactors were intentionally out of scope.

## 2. Current Architectural Context

Read these first for follow-up work in this area:

1. `docs/architecture/schema-sync-architecture.md`
2. `docs/codex-handoff.md`
3. `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx`
4. `frontend/src/lib/schema-sync/canonical-adapters.ts`
5. `packages/schema-sync-core/src/diff.ts`
6. `packages/schema-sync-core/src/sql.ts`
7. `backend/src/services/schema-sync-service.ts`
8. `backend/src/services/apply-service.ts`
9. `backend/src/postgres/introspection.ts`

Important service/module boundaries:

- `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx`
  - Live Schema Sync preview starts here. The dialog calls `diagramToCanonicalSchema(currentDiagram)` and sends that target schema to `/api/schema/diff`.
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
  - This is the critical Development-diagram-to-canonical-target adapter. If metadata is dropped here, preview and apply never see it.
- `backend/src/postgres/introspection.ts`
  - Produces the canonical live baseline imported from PostgreSQL. This path already preserves rich metadata including PKs, uniques, indexes, FKs, enum references, defaults, and identity detection.
- `packages/schema-sync-core/src/diff.ts`
  - Produces the persisted `ChangePlan`. Existing-table edits and brand-new tables are handled differently here.
- `packages/schema-sync-core/src/sql.ts`
  - Renders the preview SQL from the plan. `backend/src/services/apply-service.ts` later executes `plan.sqlStatements`, so this module affects both preview and apply.
- `backend/src/services/apply-service.ts`
  - Reuses the persisted plan SQL, performs drift detection and preflight checks, then executes the statements against PostgreSQL.

High-risk files:

- `frontend/src/lib/schema-sync/canonical-adapters.ts`
  - High risk because field/index/relationship metadata can be silently lost when building the target schema.
- `packages/schema-sync-core/src/diff.ts`
  - High risk because new tables previously emitted only `create_table`, which made brand-new table behavior diverge from existing-table diffs.
- `packages/schema-sync-core/src/sql.ts`
  - High risk because omissions here directly affect both preview fidelity and executed DDL.
- `backend/src/postgres/introspection.ts`
  - High risk because the imported live baseline must stay semantically compatible with the target-side canonical model.

## 3. Task Completed

Task objective:

- Fix the Live Schema Sync MVP migration path so schema metadata from Development is preserved through planning, SQL preview, and apply execution.

Root cause found:

- The frontend target adapter in `frontend/src/lib/schema-sync/canonical-adapters.ts` reconstructed canonical unique constraints only from table indexes. The editor also stores uniqueness directly on fields, so a newly created Development column could show as unique in review UI while the canonical target schema sent to Live Schema Sync omitted the unique constraint entirely.
- The planner in `packages/schema-sync-core/src/diff.ts` emitted only `create_table` for brand-new tables.
- The SQL renderer in `packages/schema-sync-core/src/sql.ts` rendered PK/unique/check metadata inside `CREATE TABLE`, but brand-new table foreign keys and non-constraint indexes were never emitted after table creation.

What was implemented:

- `diagramToCanonicalSchema(...)` now synthesizes canonical unique constraints from field-level `unique` flags as well as table-level unique indexes, with deduping by column set so imported metadata and newly authored metadata do not double-create the same constraint.
- New-table planning in `packages/schema-sync-core/src/diff.ts` now emits:
  - `create_table`
  - `add_index` for supported secondary indexes on the new table
  - `add_foreign_key` for foreign keys on the new table
- SQL generation in `packages/schema-sync-core/src/sql.ts` now:
  - resolves PK/unique/index/FK columns through the shared canonical column-name resolution path
  - renders new-table follow-up SQL using the newly emitted `add_index` and `add_foreign_key` changes
  - drops indexes with schema-qualified names for safer PostgreSQL behavior outside `public`

How preview and apply were aligned:

- No second SQL-generation path was introduced.
- The fix was made in the shared canonical target + plan + SQL pipeline.
- `backend/src/services/apply-service.ts` already executes `plan.sqlStatements`, so once the target schema and generated SQL were corrected, preview and apply became aligned automatically.

Approach intentionally avoided:

- No Versions or Changelog workflow changes.
- No broad UI redesign.
- No weakening of drift detection, destructive approvals, or apply preflight checks.
- No one-off patch for only a single sample table or column.

## 4. Files Changed

Files created:

- None.

Files modified:

- `docs/codex-handoff.md`
  - Rewritten from a stale Versions-focused handoff into a task-specific Live Schema Sync MVP handoff.
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
  - Preserves field-level uniqueness in the canonical target schema and dedupes unique constraints by column set.
- `frontend/src/lib/schema-sync/canonical-adapters.test.ts`
  - Added regression coverage for Development diagram -> canonical target fidelity on a brand-new live-sync table with PK, field-level unique, enum type, defaults, identity flag, secondary index, and FK.
- `packages/schema-sync-core/src/diff.ts`
  - Emits `add_index` and `add_foreign_key` changes for newly created tables so the plan contains the full supported DDL needed after `CREATE TABLE`.
- `packages/schema-sync-core/src/sql.ts`
  - Resolves canonical column references consistently for PK/unique/index/FK rendering and uses schema-qualified index drop SQL.
- `packages/schema-sync-core/src/__tests__/schema-sync-core.test.ts`
  - Added end-to-end regression coverage for canonical target -> change plan -> SQL preview fidelity on a new-table Live Schema Sync scenario.
- `backend/test/apply-service-audit.test.ts`
  - Added regression coverage proving apply executes the persisted preview SQL statements for the generated plan.

Important files intentionally not changed:

- `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx`
  - Behavior was already correct in using `diagramToCanonicalSchema(currentDiagram)` as the preview/apply source of truth.
- `backend/src/services/schema-sync-service.ts`
  - No architectural mismatch was found here; it already persists the target schema and generated plan correctly.
- `backend/src/services/apply-service.ts`
  - Apply already reused `plan.sqlStatements`, so no code change was needed once the shared planning/SQL path was corrected.
- `backend/src/postgres/introspection.ts`
  - Baseline import fidelity was not the root cause and was intentionally preserved.

## 5. Data / API / Workflow Changes

Workflow behavior changes:

- Live Schema Sync preview for brand-new tables now preserves supported metadata from Development through the actual migration plan instead of showing a partially faithful `CREATE TABLE`.
- Field-level `unique` intent from Development now produces canonical unique constraints even when the editor table has no explicit unique index entry.
- New-table plans now include supported follow-up DDL for:
  - secondary indexes
  - foreign keys

API/storage/config changes:

- No route changes.
- No request or response schema changes.
- No storage schema changes.
- No environment/config changes.

## 6. Validation Performed

Automated validation run:

- `npx vitest run --config frontend/vitest.config.ts frontend/src/lib/schema-sync/canonical-adapters.test.ts`
- `npm run test -w @schemadash/schema-sync-core -- --run src/__tests__/schema-sync-core.test.ts`
- `npm run test -w @schemadash/backend -- --run test/apply-service-audit.test.ts`

What was verified:

- Development diagram -> canonical target preserves:
  - primary key
  - field-level unique
  - enum/custom type linkage
  - not-null
  - defaults
  - identity flag
  - secondary index
  - foreign key
- Canonical baseline/target -> change plan now emits new-table follow-up changes for indexes and FKs.
- Change plan -> SQL preview now includes the intended DDL for enum creation, table creation, unique constraint, identity column, secondary index, and FK.
- Apply path executes the same persisted preview SQL statements.

What remains unverified:

- No live PostgreSQL manual apply run was executed in this session.
- The editor model still only captures a boolean autoincrement/identity intent, so richer authoring distinctions like `GENERATED ALWAYS` vs `BY DEFAULT` vs legacy serial remain limited by the current editor model rather than this fix.

Known limitations / risks:

- This fix improves the supported MVP fidelity path but does not add brand-new editor-side modeling for unsupported PostgreSQL custom types beyond the existing enum support.

## 7. Outstanding Work

- If future work needs stronger PostgreSQL identity fidelity, extend the editor-side model so Development can distinguish `GENERATED ALWAYS`, `GENERATED BY DEFAULT`, and legacy serial semantics explicitly.
- If manual QA is available, run a real end-to-end preview/apply against a disposable PostgreSQL database using a new table that includes:
  - PK
  - field-level unique
  - enum
  - default
  - identity/autoincrement
  - FK
  - secondary index

## 8. Instructions for the Next Codex Session

Exact reading order:

1. `docs/architecture/schema-sync-architecture.md`
2. `docs/codex-handoff.md`
3. `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx`
4. `frontend/src/lib/schema-sync/canonical-adapters.ts`
5. `packages/schema-sync-core/src/diff.ts`
6. `packages/schema-sync-core/src/sql.ts`
7. `frontend/src/lib/schema-sync/canonical-adapters.test.ts`
8. `packages/schema-sync-core/src/__tests__/schema-sync-core.test.ts`
9. `backend/test/apply-service-audit.test.ts`

What to avoid breaking:

- The invariant that apply executes persisted preview SQL, not a second regenerated SQL path.
- Live Schema Sync safety checks in `backend/src/services/apply-service.ts`.
- The PostgreSQL baseline import fidelity in `backend/src/postgres/introspection.ts`.
- Unrelated Versions/Changelog workflows.

Where to continue implementation:

- If more Live Schema Sync fidelity issues appear, inspect whether the missing meaning is lost in:
  1. `diagramToCanonicalSchema(...)`
  2. `createChangePlan(...)`
  3. `generateMigrationSql(...)`
  4. apply preflight/execution ordering

## 9. Git Summary

- Working branch: `fix/04-live-schema-sync-migration-fidelity`
- Pull request title: `Fix live schema sync migration preview and apply fidelity`
- Commit list created for this task:
  - `chore: audit live schema sync migration fidelity issue`
    - Replaced the stale handoff with a Live Schema Sync-specific audit and architecture summary.
  - `fix: preserve schema metadata across live migration planning pipeline`
    - Preserved field-level uniqueness in the canonical target and expanded new-table plans to include indexes/FKs.
  - `fix: align sql preview and apply behavior with canonical development schema`
    - Updated shared SQL generation so preview/apply use the corrected canonical references and render the new-table follow-up DDL faithfully.
  - `test: add regression coverage for live schema migration fidelity`
    - Added targeted frontend/core/backend regression coverage and finalized the task handoff.
