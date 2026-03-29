# Codex Handoff

## Project Overview

SchemaDash is a full-stack schema design and synchronization product with:

- a React/Tailwind frontend for canvas-based schema editing
- a Fastify backend for persistence, collaboration, workflow state, and operational schema-sync routes
- a shared `packages/schema-sync-core` package for canonical schema types, diffing, risk analysis, SQL generation, compare results, and apply planning

Relevant product context for this task:

- `Development` is still the editable head and the authoritative mutable diagram.
- `Live Database` is a read-only workflow snapshot attached to the diagram.
- `Compare` is a derived read-only visualization between the live snapshot and the current development schema.
- This task adds the next layer after Compare:
    - a `Review` toolbar control
    - a read-only structured review surface
    - a migration preview / validation / explicit apply workflow based on canonical live vs development state

Key concepts needed for this area:

- Canonical schema is the source of truth for review and migration logic.
- The compare canvas overlay is not the source of truth for execution.
- The workflow layer keeps live snapshot state beside the diagram instead of replacing the editable diagram document.
- The migration path should reuse schema-sync diff/apply primitives, not invent a separate execution engine.

## Current Architectural Context

Read these first:

1. `docs/live-database-development-compare-versions-design.md`
2. `docs/live-db-compare-feature-map.md`
3. `docs/codex-handoff.md`

System areas that matter for this task:

- Frontend workflow state and compare/live mode wiring:
    - `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
    - `frontend/src/pages/editor-page/workflow-editor-page.tsx`
    - `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
- Frontend review and migration surfaces:
    - `frontend/src/features/diagram-workflow/components/review-dropdown.tsx`
    - `frontend/src/features/diagram-workflow/components/review-changes-dialog.tsx`
    - `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
    - `frontend/src/features/diagram-workflow/components/migration-summary.tsx`
    - `frontend/src/features/diagram-workflow/components/migration-warning-list.tsx`
    - `frontend/src/features/diagram-workflow/lib/review-grouping.ts`
- Frontend canonical adapters and API clients:
    - `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
    - `frontend/src/features/diagram-workflow/api/diagram-workflow-client.ts`
    - `frontend/src/features/diagram-workflow/api/diagram-migration-client.ts`
- Backend workflow and migration services:
    - `backend/src/services/diagram-workflow-service.ts`
    - `backend/src/services/diagram-migration-service.ts`
    - `backend/src/routes/diagram-workflow-routes.ts`
    - `backend/src/routes/diagram-migration-routes.ts`
    - `backend/src/context/app-context.ts`
    - `backend/src/app.ts`
- Existing schema-sync/apply foundations reused here:
    - `backend/src/services/schema-sync-service.ts`
    - `backend/src/services/apply-service.ts`
    - `backend/src/repositories/metadata-repository.ts`
    - `packages/schema-sync-core/src/diff.ts`
    - `packages/schema-sync-core/src/types.ts`

Important service/module boundaries:

- `diagram-workflow-service` manages diagram-scoped live binding and stored live snapshots.
- `diagram-migration-service` now owns migration preview, validation, and explicit apply orchestration for the workflow layer.
- `apply-service` remains the lower-level execution primitive that performs drift checks, preflight checks, SQL execution, and audit persistence.
- `review-grouping.ts` is frontend-only and builds the structured review view from canonical compare results plus supplemental change-plan signals.
- `migration-dialog.tsx` is UI orchestration only; it calls backend routes and never uses compare overlay state as execution input.

Important high-risk files:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `packages/schema-sync-core/src/types.ts`

Frontend/backend/shared relationships:

- Frontend derives `targetSchema` from the current in-memory development diagram via `diagramToCanonicalSchema(...)`.
- Backend uses the stored live workflow snapshot as baseline and the client-provided canonical target as the migration source of truth.
- `schema-sync-core` still owns change planning, risk classification, and SQL generation.

## Task Completed

What this task was trying to achieve:

- Add a Review button to the editor chrome for compare-capable diagrams.
- Keep Review Changes read-only and structured for large diffs.
- Add a migration workflow that separates preview, validation/preflight, execution, and result reporting.
- Keep execution explicit and safe.
- Avoid broad editor rewrites and avoid using compare overlay state as the execution source.

What was actually implemented:

- Added a `Review` dropdown in the top toolbar when compare baseline data exists.
- Added dropdown actions:
    - `Review Changes`
    - `Migration`
- Built a structured `Review Changes` dialog that shows:
    - summary cards for tables, fields, and relationships
    - grouped `added` / `removed` / `changed` buckets
    - item-level detail lines for changed properties
    - supplemental migration-backed signals for constraints, indexes, and custom types when available
- Built a `Migration` dialog that shows:
    - migration preview generated from canonical live baseline vs current development canonical schema
    - warnings / blockers / informational notes
    - explicit preflight validation step
    - explicit apply step with destructive confirmation handling
    - success / failure result reporting with logs and executed SQL output
- Added backend migration routes for:
    - preview
    - validate
    - apply
- Added backend `diagram-migration-service` to:
    - generate change plans from workflow live snapshot + canonical target schema
    - perform validation checks
    - call the existing `apply-service`
    - update the workflow live snapshot after successful apply so Compare reflects the new live state

Key decisions made:

- Review Changes stays separate from Migration and remains read-only.
- Migration preview/validation/apply all operate on canonical schemas, not compare canvas artifacts.
- The frontend sends canonical target schema to the backend so preview/validation/apply use the current development head, including unsaved editor state.
- Apply failures are surfaced back to the UI as structured result payloads with logs instead of only relying on thrown request errors.

Approach intentionally avoided and why:

- Did not overload the compare overlay model to drive execution because the design docs explicitly reject that.
- Did not rewrite storage providers or persistence services because this workflow can be added without moving the development head.
- Did not mix Versions/Restore work into this phase.

## Files Changed

Files created:

- `frontend/src/features/diagram-workflow/components/review-dropdown.tsx`
    - toolbar Review button and dropdown entry point
- `frontend/src/features/diagram-workflow/components/review-changes-dialog.tsx`
    - structured read-only review surface
- `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
    - migration preview / validation / apply dialog
- `frontend/src/features/diagram-workflow/components/migration-summary.tsx`
    - summary cards and categorized change breakdown for migration preview
- `frontend/src/features/diagram-workflow/components/migration-warning-list.tsx`
    - reusable issue list for notes, warnings, and blockers
- `frontend/src/features/diagram-workflow/lib/review-grouping.ts`
    - transforms compare results and supplemental plan data into review-friendly grouped sections
- `frontend/src/features/diagram-workflow/api/diagram-migration-client.ts`
    - frontend client for preview / validate / apply migration routes
- `frontend/src/features/diagram-workflow/components/review-dropdown.test.tsx`
- `frontend/src/features/diagram-workflow/components/review-changes-dialog.test.tsx`
- `frontend/src/features/diagram-workflow/components/migration-dialog.test.tsx`
- `frontend/src/features/diagram-workflow/lib/review-grouping.test.ts`
- `backend/src/services/diagram-migration-service.ts`
    - backend orchestration for preview / validate / apply
- `backend/src/routes/diagram-migration-routes.ts`
    - Fastify routes for migration workflow
- `backend/test/diagram-migration-service.test.ts`
    - backend tests for apply result handling and workflow live snapshot updates

Files modified:

- `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
    - adds Review dropdown to editor chrome
- `backend/src/context/app-context.ts`
    - registers `diagramMigrationService`
- `backend/src/app.ts`
    - registers migration routes

Important files intentionally not changed:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `packages/schema-sync-core/src/types.ts`

Why those avoided files matter:

- They are core persistence/state layers with high blast radius.
- This task could be completed additively by using existing workflow and schema-sync seams.

## Data / API / Workflow Changes

New backend routes:

- `POST /api/diagrams/:id/migration/preview`
    - input: canonical target schema + optional expected live snapshot id
    - output: generated plan, warnings/blockers, fingerprints, validation eligibility
- `POST /api/diagrams/:id/migration/validate`
    - input: canonical target schema + optional expected live snapshot id
    - output: refreshed plan, validation checks, warnings/blockers, ready-to-apply boolean
- `POST /api/diagrams/:id/migration/apply`
    - input: canonical target schema + optional expected live snapshot id + destructive approval payload
    - output: validation payload plus structured success/failure apply result

New workflow behavior:

- Review button appears when compare-capable workflow data exists.
- Review Changes can be opened even outside compare mode as long as the compare baseline exists.
- Migration preview is generated from:
    - baseline: workflow live snapshot canonical schema
    - target: current development canonical schema
- Validation checks currently include:
    - connection reachable
    - live baseline still matches expected baseline
    - plan has no blocking canonical errors
- Successful apply writes a new workflow live snapshot with source kind `apply` and updates workflow state to point Compare/Live Database at the new post-apply snapshot.

Storage / compatibility notes:

- No env var changes.
- No database schema migration changes were needed for this task.
- Metadata repository usage expanded through existing tables only; no new metadata tables were introduced.

## Validation Performed

What was tested:

- Frontend targeted workflow tests:
    - `npm run test:web -- review-dropdown review-changes-dialog migration-dialog review-grouping`
- Backend targeted workflow tests:
    - `npm run test -w @schemadash/backend -- diagram-migration-service diagram-workflow-service`
- Backend compile check:
    - `npm run typecheck -w @schemadash/backend`
- Targeted eslint runs on all touched workflow/migration files

What these checks verified:

- Review dropdown visibility and actions
- Structured review dialog rendering
- Review grouping logic
- Migration preview rendering
- Validation step rendering
- Destructive confirmation gating
- Failed apply result reporting
- Successful apply result reporting and workflow refresh callback
- Backend apply orchestration updates workflow live snapshot after success
- Backend apply failures surface stored audit logs

What remains unverified:

- Full browser/manual QA against a real PostgreSQL database connection
- End-to-end validation of preview/validate/apply through the actual UI with live credentials
- Repo-wide frontend typecheck

Known limitations / risks:

- Root `npm run typecheck` is still not clean because of pre-existing unrelated frontend typing issues that were already present on the branch before this task. Backend typecheck is clean.
- Migration preview currently creates fresh metadata baseline/change-plan records each time preview/validate/apply is run. This is acceptable for now but could be optimized later if metadata churn becomes a concern.

## Outstanding Work

Not done yet:

- Versions UI
- Restore to Development
- Compare against historical snapshots
- End-to-end manual QA with a live PostgreSQL instance
- Audit/history browsing UI for past migration runs

Next recommended implementation phase:

- Run end-to-end browser QA against a real database and decide whether to add migration history / audit inspection UI or move next to Versions/Snapshots, depending on product priority.

Dependencies / risks for future work:

- Do not change the rule that canonical schema is the execution source of truth.
- Do not make apply depend on compare overlay state.
- Keep high-risk persistence/provider files untouched unless the next phase genuinely requires them.
- If future work touches restore/versioning, keep Development as the only mutable head.

## Instructions for the Next Codex Session

Read in this order:

1. `docs/live-database-development-compare-versions-design.md`
2. `docs/live-db-compare-feature-map.md`
3. `docs/codex-handoff.md`
4. `frontend/src/features/diagram-workflow/components/review-dropdown.tsx`
5. `frontend/src/features/diagram-workflow/components/review-changes-dialog.tsx`
6. `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
7. `frontend/src/features/diagram-workflow/lib/review-grouping.ts`
8. `backend/src/services/diagram-migration-service.ts`
9. `backend/src/routes/diagram-migration-routes.ts`
10. `backend/src/services/apply-service.ts`

Inspect next if continuing this workflow:

- `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `backend/src/services/diagram-workflow-service.ts`
- `backend/test/diagram-migration-service.test.ts`
- `frontend/src/features/diagram-workflow/components/migration-dialog.test.tsx`

What to avoid breaking:

- Development must stay editable and authoritative.
- Compare must stay read-only.
- Review Changes must stay read-only.
- Migration apply must stay explicit and must continue updating the workflow live snapshot only after success.

Where to continue implementation:

- If improving UX: continue in `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
- If improving safety/execution semantics: continue in `backend/src/services/diagram-migration-service.ts`
- If extending review categorization: continue in `frontend/src/features/diagram-workflow/lib/review-grouping.ts`

## Git Summary

Working branch:

- `feature/review-and-migration-workflow`

Pull request title:

- `Add review and migration workflow after compare mode`

Commits created for this task:

- `feat: add review dropdown and workflow entry points`
    - adds the Review button, dropdown actions, and initial dialog entry points
- `feat: add structured review changes UI and grouping`
    - builds the grouped read-only review experience and supplemental change-plan signals
- `feat: add migration planning validation and preview flow`
    - adds backend preview/validate routes and frontend migration preview UI
- `feat: add migration execution UX and result handling`
    - adds explicit apply handling, confirmation, result logs, and workflow live snapshot refresh after success
- `test: validate review and migration workflow behavior`
    - adds focused frontend/backend tests for review and migration behavior and updates this handoff document
