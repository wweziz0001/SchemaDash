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

- Implement only the P0 and P1 hardening fixes from the final live workflow audit.
- Preserve the existing workflow architecture while reducing release-critical and near-release-critical risk.
- Leave P2/P3 work out of scope unless a tiny prerequisite was unavoidable.

What was actually implemented:

- Added `docs/live-workflow-p0-p1-fixes.md` to track the exact hardening scope and the implemented/deferred items.
- Implemented P0 baseline-consistency hardening in `frontend/src/features/diagram-workflow/components/migration-dialog.tsx` so workflow apply now advances the older `diagram.schemaSync` compatibility metadata instead of leaving the legacy Schema Sync toolbar path stale.
- Implemented P0 canonical-integrity hardening by adding `frontend/src/features/diagram-workflow/lib/version-canonical.ts` and switching version compare in `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx` to prefer canonical schema derived from the immutable stored `diagramDocument` when available.
- Implemented P1 traceability improvements by surfacing migration execution identifiers in `frontend/src/features/diagram-workflow/components/migration-dialog.tsx` and by improving restore success messaging in `frontend/src/features/diagram-workflow/lib/restore-messages.ts`.
- Updated `docs/codex-handoff.md` for a future fresh Codex session after the hardening work.

Decisions made in this task:

- The hardening work stayed limited to the P0/P1 items that could be addressed safely in-repo.
- No broad refactor was attempted.
- The highest-risk editor/storage/persistence files were intentionally avoided.
- The client-supplied canonical snapshot payload is no longer treated as the authoritative version compare source when an immutable stored diagram document exists.
- Legacy compatibility metadata was kept alive on purpose for this phase; it was synchronized instead of being removed because removing it would be a broader architectural change.

Approach intentionally avoided and why:

- Did not redesign versions, restore, migration, or compare architecture.
- Did not refactor `storage-provider`, `schemadash-provider`, `persistence-service`, `app-repository`, or `metadata-repository`.
- Did not implement P2/P3 items such as backup/export support or default compare-source UX.
- Did not move canonical conversion into the backend; instead, the product now prefers immutable stored diagram documents as the authoritative compare source where available.

## Files Changed

Files created in this task:

- `docs/live-workflow-p0-p1-fixes.md`
  - records the implemented P0/P1 items, deferred work, and residual risk
- `frontend/src/features/diagram-workflow/lib/version-canonical.ts`
  - derives authoritative version compare baselines from immutable stored diagram documents when available
- `frontend/src/features/diagram-workflow/lib/version-canonical.test.ts`
  - regression coverage for document-backed version compare baselines

Files modified in this task:

- `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
  - synchronizes legacy compatibility metadata after workflow apply and surfaces execution trace identifiers
- `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
  - uses document-derived canonical schema for version compare baselines
- `frontend/src/features/diagram-workflow/lib/restore-messages.ts`
  - adds resulting Development document version to restore success messaging
- `frontend/src/features/diagram-workflow/components/migration-dialog.test.tsx`
  - validates compatibility metadata sync and migration traceability rendering
- `frontend/src/features/diagram-workflow/components/restore-version-dialog.test.tsx`
  - validates the stronger restore success trace messaging
- `docs/codex-handoff.md`
  - updated for the P0/P1 hardening task

Important files intentionally not changed:

- `backend/src/services/diagram-migration-service.ts`
- `backend/src/services/diagram-workflow-service.ts`
- `backend/src/services/diagram-version-restore-service.ts`
- `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`

Brief purpose of the important changed docs/files:

- `docs/live-workflow-p0-p1-fixes.md`
  - source of truth for what this hardening pass actually implemented
- `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
  - central hardening point for apply-result compatibility sync and workflow traceability
- `frontend/src/features/diagram-workflow/lib/version-canonical.ts`
  - encapsulates the document-backed version-baseline authority rule
- `docs/codex-handoff.md`
  - fresh-session continuation context for future Codex work in this area

## Data / API / Workflow Changes

This task did **not** add new backend models, routes, services, migrations, env vars, or config.

What changed instead:

- Frontend workflow migration apply now also persists the older `diagram.schemaSync` compatibility baseline/audit fields so the legacy Schema Sync path does not continue from stale state after a hardened workflow apply.
- Version compare now derives canonical schema from the immutable stored version document when available, instead of treating the stored canonical payload as the authoritative compare truth.
- Migration execution UI now shows operator-useful trace identifiers: job ID, audit ID, post-apply snapshot ID, and updated workflow live snapshot ID.
- Restore success messaging now includes the resulting Development document version.

Important workflow conclusions recorded by this task:

- Development remains the mutable head.
- Live / Compare / Version views remain layered around it.
- Versions remain immutable.
- Restore still copies into Development rather than mutating versions.
- The main remaining risks have shifted away from the original P0 blockers and toward deferred portability/product-completeness/manual-QA work.

## Validation Performed

Targeted automated validation run during this task:

- `npm run test:ci -w @schemadash/schema-sync-core -- src/__tests__/compare.test.ts src/__tests__/diff-column-matching.test.ts`
- `npm run test:ci -w @schemadash/backend -- test/diagram-workflow-service.test.ts test/diagram-migration-service.test.ts test/diagram-version-restore-service.test.ts`
- `npm run test:web:ci -- frontend/src/features/diagram-workflow/components/migration-dialog.test.tsx frontend/src/features/diagram-workflow/components/restore-version-dialog.test.tsx frontend/src/features/diagram-workflow/lib/version-canonical.test.ts frontend/src/features/diagram-workflow/components/review-dropdown.test.tsx frontend/src/features/diagram-workflow/components/workflow-mode-switcher.test.tsx frontend/src/features/diagram-workflow/components/workflow-development-diagram-sync.test.tsx frontend/src/features/diagram-workflow/lib/compare-render-model.test.ts`

What was verified:

- compare classification and fallback matching behavior
- workflow bind/refresh/version creation behavior
- migration fallback hydration, success update, and failure log return behavior
- workflow migration apply now advances the legacy compatibility metadata
- version compare now prefers immutable stored document baselines when available
- migration execution traceability renders expected identifiers
- restore success messaging now includes the resulting Development document version
- frontend workflow mode, compare, review, migration, versions, and restore UI behavior

What remains unverified:

- full manual browser QA of the end-to-end workflow
- live database integration against a real PostgreSQL instance in this session
- full repo-wide build/test sweep on this branch

Known limitations / risks confirmed by the audit:

- mobile workflow entry parity improved, but real-device QA is still pending
- workflow backup/export portability is still not implemented
- stored default compare source is still not used by the frontend
- snapshots without stored diagram documents still fall back to the stored canonical payload
- restore/workflow traceability is improved, but there is still no dedicated restore-history screen

## Outstanding Work

What is not done yet:

- manual end-to-end workflow QA
- workflow backup/export portability
- compare default-baseline UX completion
- performance/scalability hardening for large diagrams and version histories
- optional deeper restore audit/history UI if operators need more than versions + result messaging

Next recommended implementation phase:

1. Run a manual integrated QA pass over live sync, compare, review, migration, versions, and restore together, including mobile.
2. Decide and implement workflow snapshot/version backup behavior.
3. Address stored default compare-source UX if product completeness becomes a near-release need.
4. Revisit whether snapshots without stored diagram documents need stronger integrity handling.

Blockers, risks, or dependencies for the next phase:

- Backup/export support still requires broader persistence/product decisions.
- Default compare-source UX is still intentionally out of scope.
- A fully backend-authoritative canonical conversion path is still absent; the current hardening instead prefers immutable stored diagram documents where they exist.

## Instructions for the Next Codex Session

Exact reading order for future work:

1. `docs/live-workflow-p0-p1-fixes.md`
2. `docs/live-workflow-final-audit.md`
3. `docs/live-workflow-release-readiness-checklist.md`
4. `docs/live-database-development-compare-versions-design.md`
5. `docs/live-db-compare-feature-map.md`
6. `docs/codex-handoff.md`
7. `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
8. `frontend/src/features/diagram-workflow/lib/version-canonical.ts`
9. `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
10. `frontend/src/features/diagram-workflow/lib/restore-messages.ts`

What to inspect first if continuing implementation:

- For compatibility-metadata follow-up work:
  - `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
  - `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
- For version/snapshot integrity follow-up work:
  - `frontend/src/features/diagram-workflow/lib/version-canonical.ts`
  - `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
  - canonical adapter boundaries in `frontend/src/features/schema-sync/lib/canonical-adapters.ts`

What to avoid breaking:

- Development must remain the only editable head.
- Compare, Live, and Version must remain read-only.
- Versions must remain immutable.
- Restore must continue creating a safety snapshot before replacing Development.
- Do not introduce a multi-head editor or broad persistence rewrite unless explicitly requested.

Where to continue implementation:

- Start with manual integrated QA of the hardened flows.
- If additional integrity work is needed afterward, inspect snapshots without stored diagram documents and the deferred backup/export/default-compare items.

## Git Summary

- Working branch: `hardening/live-workflow-p0-p1-fixes`
- Pull request title: `Implement P0 and P1 hardening fixes for live workflow release readiness`
- Commit list created for this task:
  - `chore: extract and document live workflow p0 and p1 hardening scope`
  - `fix: implement p0 safety and integrity fixes for live workflow`
  - `fix: implement p1 correctness reliability and UX safety fixes`
  - `docs: document completed p0/p1 fixes and residual release risks`
  - `test: validate hardened live workflow behavior`

Brief explanation of the commit sequence:

- `chore: extract and document live workflow p0 and p1 hardening scope`
  - freeze the hardening scope before code changes
- `fix: implement p0 safety and integrity fixes for live workflow`
  - synchronize legacy compatibility metadata after workflow apply and prefer immutable document-backed version compare baselines
- `fix: implement p1 correctness reliability and UX safety fixes`
  - add workflow execution traceability details and stronger restore success trace messaging
- `docs: document completed p0/p1 fixes and residual release risks`
  - record implemented items, deferred items, and remaining risk
- `test: validate hardened live workflow behavior`
  - add/adjust regression coverage and record the targeted validation slice
