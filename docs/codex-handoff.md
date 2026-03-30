# Codex Handoff

## Project Overview

SchemaDash is a full-stack schema design and schema workflow product with:

- a React/Tailwind frontend for diagram editing and review
- a Fastify backend for persistence, collaboration, workflow state, migration, and schema-sync APIs
- a shared `packages/schema-sync-core` package for canonical schema types, hashing, diffing, compare, risk analysis, and SQL planning

Relevant product/architecture context for this task:

- `Development` is the only mutable head.
- `Live Database` is a stored read-only canonical snapshot bound to a saved connection.
- `Compare` is a derived read-only visualization between a baseline and Development.
- `Versions / Snapshots` are immutable historical captures.
- `Restore to Development` copies an immutable version back into Development instead of mutating the stored version.
- The repo still contains an older `Schema Sync` compatibility path that uses `diagram.schemaSync` metadata alongside the newer workflow state.

Key concepts needed for this system area:

- The authoritative editable diagram document still lives in app persistence and collaboration layers.
- Workflow state, workflow snapshots, and diagram versions live beside that diagram in the app DB through `diagram_workflow_state`, `diagram_workflow_snapshots`, and `diagram_versions`.
- Canonical schema integrity matters because compare, review, migration, version compare, and restore safety all depend on it.

## Current Architectural Context

Read these first for any future work in this area:

1. `docs/live-database-development-compare-versions-design.md`
2. `docs/live-db-compare-feature-map.md`
3. `docs/live-workflow-final-audit.md`
4. `docs/live-workflow-release-readiness-checklist.md`
5. `docs/codex-handoff.md`

Parts of the system that matter most:

- Backend workflow persistence and APIs:
  - `backend/src/repositories/diagram-workflow-repository.ts`
  - `backend/src/services/diagram-workflow-service.ts`
  - `backend/src/services/diagram-migration-service.ts`
  - `backend/src/services/diagram-version-restore-service.ts`
  - `backend/src/routes/diagram-workflow-routes.ts`
  - `backend/src/routes/diagram-migration-routes.ts`
  - `backend/src/routes/diagram-version-restore-routes.ts`
- Shared compare / canonical logic:
  - `packages/schema-sync-core/src/compare.ts`
  - `packages/schema-sync-core/src/compare-types.ts`
  - `packages/schema-sync-core/src/diff.ts`
- Frontend workflow state and UI:
  - `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
  - `frontend/src/features/diagram-workflow/lib/compare-render-model.ts`
  - `frontend/src/features/diagram-workflow/lib/review-grouping.ts`
  - `frontend/src/features/diagram-workflow/components/review-dropdown.tsx`
  - `frontend/src/features/diagram-workflow/components/review-changes-dialog.tsx`
  - `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
  - `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
  - `frontend/src/features/diagram-workflow/components/restore-version-dialog.tsx`
- Editor integration points:
  - `frontend/src/pages/editor-page/workflow-editor-page.tsx`
  - `frontend/src/pages/editor-page/editor-page.tsx`
  - `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
  - `frontend/src/pages/editor-page/top-navbar/top-navbar-mobile.tsx`
- Legacy compatibility path that still matters:
  - `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
  - `frontend/src/features/schema-sync/dialogs/schema-sync-dialog.tsx`

Important high-risk files:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`

Important service/module boundaries:

- `diagram-workflow-repository` owns workflow state, workflow snapshots, and version rows in the app DB.
- `diagram-workflow-service` owns workflow view, live binding/refresh, and version create/list/get.
- `diagram-migration-service` owns migration preview/validate/apply and workflow live-snapshot advancement after success.
- `diagram-version-restore-service` owns restore-only safety behavior.
- `schema-sync-context` is still the bridge to the older Schema Sync toolbar flow and updates `diagram.schemaSync` compatibility metadata.
- `diagram-workflow-context` drives mode selection and compare/version/live read-only data for the editor.

Relevant frontend/backend/shared package relationships:

- Frontend converts Development diagrams to canonical schema for compare, review, migration, version creation, and restore safety payloads.
- Backend persists workflow snapshots/versions and revalidates migration plans against live state.
- Shared compare/migration logic lives in `packages/schema-sync-core`; the backend and frontend both depend on it.

## Task Completed

What this task was trying to achieve:

- Perform a final release-readiness audit of the full live workflow implementation.
- Compare implementation against the design docs.
- Produce a concrete go/no-go assessment, prioritized backlog, and future-session handoff.

What was actually implemented:

- Added `docs/live-workflow-final-audit.md`
- Added `docs/live-workflow-release-readiness-checklist.md`
- Rewrote `docs/codex-handoff.md` for a future fresh Codex session
- Audited the integrated implementation across:
  - Live Database
  - Development
  - Compare
  - Review Changes
  - Migration
  - Versions / Snapshots
  - Restore to Development
- Ran targeted validation across shared core, backend workflow services, and frontend workflow UI/tests

Decisions made in this task:

- This was kept audit-first and documentation-first.
- No broad refactor was attempted.
- The audit recommends **beta / feature-flagged release only**, not a wide full release.
- The audit identifies two main full-release blockers:
  - workflow/legacy baseline drift after workflow migration apply
  - client-trusted canonical snapshot persistence for versions and restore safety snapshots

Approach intentionally avoided and why:

- Did not redesign the workflow architecture during the audit because the branch already has a mostly coherent layered implementation.
- Did not refactor editor-core or persistence-core files because the task was release-readiness assessment, not a rewrite.
- Did not invent missing behavior where the repo did not implement it; missing items were documented as confirmed gaps or inferred risks instead.

## Files Changed

Files created in this task:

- `docs/live-workflow-final-audit.md`
  - full release-readiness audit and architecture/product/safety assessment
- `docs/live-workflow-release-readiness-checklist.md`
  - condensed release status and blocker checklist

Files modified in this task:

- `docs/codex-handoff.md`
  - replaced older restore-focused handoff with an audit-focused workflow handoff for future sessions

Important files intentionally not changed:

- `backend/src/services/diagram-migration-service.ts`
- `backend/src/services/diagram-workflow-service.ts`
- `backend/src/services/diagram-version-restore-service.ts`
- `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
- `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`

Brief purpose of the important changed docs:

- `docs/live-workflow-final-audit.md`
  - source of truth for readiness decision, strengths, weaknesses, risks, and backlog
- `docs/live-workflow-release-readiness-checklist.md`
  - quick operator/reviewer summary of what passes, what is partial, and what blocks full release
- `docs/codex-handoff.md`
  - fresh-session continuation context for future Codex work in this area

## Data / API / Workflow Changes

This task did **not** add new models, routes, services, migrations, env vars, or config.

What changed instead:

- Documentation now records the current workflow architecture, current release posture, and the specific blockers/non-blockers found in the repository state.

Important workflow conclusions recorded by this task:

- Development remains the mutable head.
- Live / Compare / Version views remain layered around it.
- Versions are immutable.
- Restore copies into Development rather than mutating versions.
- The most important unfinished work is around state consistency and canonical snapshot integrity, not around the basic workflow model.

## Validation Performed

Targeted automated validation run during this task:

- `npm run test:ci -w @schemadash/schema-sync-core -- src/__tests__/compare.test.ts src/__tests__/diff-column-matching.test.ts`
- `npm run test:ci -w @schemadash/backend -- test/diagram-workflow-service.test.ts test/diagram-migration-service.test.ts test/diagram-version-restore-service.test.ts`
- `npm run test:web:ci -- frontend/src/features/diagram-workflow/components/workflow-mode-switcher.test.tsx frontend/src/features/diagram-workflow/components/live-status-chip.test.tsx frontend/src/features/diagram-workflow/components/review-dropdown.test.tsx frontend/src/features/diagram-workflow/components/review-changes-dialog.test.tsx frontend/src/features/diagram-workflow/components/migration-dialog.test.tsx frontend/src/features/diagram-workflow/components/versions-panel.test.tsx frontend/src/features/diagram-workflow/components/restore-version-dialog.test.tsx frontend/src/features/diagram-workflow/components/workflow-development-diagram-sync.test.tsx frontend/src/features/diagram-workflow/components/version-view-badge.test.tsx frontend/src/features/diagram-workflow/lib/compare-render-model.test.ts`

What was verified:

- compare classification and fallback matching behavior
- workflow bind/refresh/version creation behavior
- migration fallback hydration, success update, and failure log return behavior
- restore safety snapshot behavior and stale-base rejection
- frontend workflow mode, compare, review, migration, versions, and restore UI behavior

What remains unverified:

- full manual browser QA of the end-to-end workflow
- live database integration against a real PostgreSQL instance in this session
- full repo-wide build/test sweep on this branch

Known limitations / risks confirmed by the audit:

- workflow state and legacy `diagram.schemaSync` compatibility metadata can drift after workflow migration apply
- version and restore safety snapshot canonical data is client-trusted
- mobile workflow access is incomplete
- workflow backup/export portability is not implemented
- stored default compare source is not yet used by the frontend

## Outstanding Work

What is not done yet:

- full-release blocker fixes
- manual end-to-end workflow QA
- workflow backup/export portability
- compare default-baseline UX completion
- performance/scalability hardening for large diagrams and version histories

Next recommended implementation phase:

1. Fix workflow baseline consistency across migration and the still-visible legacy Schema Sync path.
2. Make version and safety snapshot canonical data server-authoritative or server-validated.
3. Close the workflow UX parity gap on mobile.
4. Decide and implement workflow snapshot/version backup behavior.
5. Then run a manual integrated QA pass over live sync, compare, review, migration, versions, and restore together.

Blockers, risks, or dependencies for the next phase:

- The biggest safety work spans both backend services and frontend compatibility state.
- Any canonical-integrity fix will likely need a server-safe diagram-to-canonical boundary or validation strategy.
- Removing or demoting the legacy Schema Sync path may require a product decision, not just code changes.

## Instructions for the Next Codex Session

Exact reading order for future work:

1. `docs/live-workflow-final-audit.md`
2. `docs/live-workflow-release-readiness-checklist.md`
3. `docs/live-database-development-compare-versions-design.md`
4. `docs/live-db-compare-feature-map.md`
5. `docs/codex-handoff.md`
6. `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
7. `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
8. `backend/src/services/diagram-migration-service.ts`
9. `backend/src/services/diagram-workflow-service.ts`
10. `backend/src/services/diagram-version-restore-service.ts`

What to inspect first if continuing implementation:

- For the P0 baseline-drift issue:
  - `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
  - `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
  - any legacy Schema Sync surfaces that still use `currentDiagram.schemaSync`
- For the canonical-integrity issue:
  - `backend/src/services/diagram-workflow-service.ts`
  - `backend/src/services/diagram-version-restore-service.ts`
  - canonical adapter boundaries in `frontend/src/features/schema-sync/lib/canonical-adapters.ts`

What to avoid breaking:

- Development must remain the only editable head.
- Compare, Live, and Version must remain read-only.
- Versions must remain immutable.
- Restore must continue creating a safety snapshot before replacing Development.
- Do not introduce a multi-head editor or broad persistence rewrite unless explicitly requested.

Where to continue implementation:

- Start with the P0 baseline consistency issue because it affects release safety most directly.
- If that is solved, move next to canonical snapshot integrity.

## Git Summary

- Working branch: `audit/live-workflow-final-review`
- Pull request title: `Audit live workflow feature set for readiness gaps risks and final improvements`
- Commit list created for this task:
  - None yet in the repository state at the time this handoff content was written; create the audit/docs commit first, then add any small audit-driven fix in a separate commit, then update the audit/handoff docs in a final docs commit if needed.

Brief explanation of the intended commit sequence:

- `docs: add final live workflow audit and readiness assessment`
  - add the audit, checklist, and updated handoff
- optional `fix: ...`
  - only for a very small audit-driven UX/safety correction
- optional `docs: ...`
  - update the audit/handoff/checklist with post-fix notes
