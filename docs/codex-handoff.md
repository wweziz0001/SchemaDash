# Codex Handoff

## 1. Project Overview

SchemaDash is a full-stack database schema design product.

- The frontend is a Vite + React + Tailwind editor for diagram authoring, review, compare, versions, restore, and migration workflows.
- The backend is a Fastify API for persistence, collaboration, workflow state, migration orchestration, restore flows, and schema-sync operations.
- `packages/schema-sync-core/` holds shared canonical schema types, compare logic, hashing, diffing, SQL planning, and risk analysis used by both frontend and backend.

Relevant product context for this task:

- `Development` is the only mutable editor head.
- `Live Database` is a read-only synced snapshot attached to a saved connection.
- `Compare` is a read-only derived view between a baseline and Development.
- `Versions / Snapshots` are immutable captures that can be reviewed, compared, and restored into Development.
- `Restore to Development` copies a stored snapshot back into the mutable document instead of mutating the snapshot itself.

This task was specifically about frontend architecture correction: removing the feature-first `frontend/src/features/diagram-workflow` subtree and rebuilding that area into SchemaDash's native structure.

## 2. Current Architectural Context

Read these first for any future work in this area:

1. `docs/diagram-workflow-frontend-rebuild-plan.md`
2. `docs/diagram-workflow-frontend-audit.md`
3. `docs/live-database-development-compare-versions-design.md`
4. `docs/live-db-compare-feature-map.md`
5. `docs/CODEBASE_STRUCTURE.md`
6. `docs/codex-handoff.md`

The frontend modules that now matter most:

- Workflow provider and hooks:
  - `frontend/src/context/diagram-workflow-context/diagram-workflow-context.tsx`
  - `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
  - `frontend/src/context/diagram-workflow-context/use-diagram-workflow.ts`
- Workflow API clients and DTOs:
  - `frontend/src/lib/api/diagram-workflow-client.ts`
  - `frontend/src/lib/api/diagram-migration-client.ts`
- Workflow helpers:
  - `frontend/src/lib/diagram-workflow/compare-render-model.ts`
  - `frontend/src/lib/diagram-workflow/review-grouping.ts`
  - `frontend/src/lib/diagram-workflow/restore-messages.ts`
  - `frontend/src/lib/diagram-workflow/version-canonical.ts`
  - `frontend/src/lib/diagram-workflow/version-labels.ts`
- Workflow dialogs:
  - `frontend/src/dialogs/create-version-dialog/create-version-dialog.tsx`
  - `frontend/src/dialogs/review-changes-dialog/review-changes-dialog.tsx`
  - `frontend/src/dialogs/migration-dialog/migration-dialog.tsx`
  - `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.tsx`
- Editor-page workflow integration:
  - `frontend/src/pages/editor-page/workflow-editor-page.tsx`
  - `frontend/src/pages/editor-page/workflow/workflow-development-diagram-sync.tsx`
  - `frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.tsx`
  - `frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.tsx`
  - `frontend/src/pages/editor-page/top-navbar/workflow/version-view-badge.tsx`
  - `frontend/src/pages/editor-page/canvas/workflow/live-status-chip.tsx`
  - `frontend/src/pages/editor-page/canvas/workflow/compare-summary-chip.tsx`
  - `frontend/src/pages/editor-page/side-panel/versions-section/version-tab/version-list-item.tsx`

Important service/module boundaries:

- `frontend/src/context/diagram-workflow-context/*` owns workflow record loading, URL-driven mode selection, compare/version/live derived diagrams, and version record fetching.
- `frontend/src/lib/api/*diagram-workflow*` owns frontend HTTP transport only.
- `frontend/src/lib/diagram-workflow/*` owns non-UI workflow helpers and compare/review view-models.
- `frontend/src/dialogs/*workflow*` owns workflow action entrypoints.
- `frontend/src/pages/editor-page/.../workflow/*` owns editor chrome only.
- `frontend/src/features/schema-sync/context/schema-sync-context.tsx` is still the legacy compatibility bridge for Schema Sync and intentionally remains under `features`.

Important high-risk files that were intentionally touched only minimally:

- `frontend/src/pages/editor-page/editor-page.tsx`
- `frontend/src/pages/editor-page/workflow-editor-page.tsx`
- `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
- `frontend/src/pages/editor-page/top-navbar/top-navbar-mobile.tsx`
- `frontend/src/pages/editor-page/canvas/canvas.tsx`
- `frontend/src/features/schema-sync/context/schema-sync-context.tsx`

Important high-risk files intentionally not changed:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- backend workflow services/routes/repositories

Frontend/backend/shared relationships that still matter:

- Frontend converts the Development diagram to canonical schema using `frontend/src/features/schema-sync/lib/canonical-adapters.ts`.
- Backend remains authoritative for workflow persistence, version storage, restore, preview/validate/apply, and live snapshot refresh.
- `packages/schema-sync-core/` still supplies compare/migration primitives used by both sides.

## 3. Task Completed

What this task was trying to achieve:

- Remove `frontend/src/features/diagram-workflow`.
- Reclassify every file in that subtree by actual responsibility.
- Rebuild the workflow frontend into native `components`, `context`, `dialogs`, `lib`, and `pages/editor-page` locations.
- Preserve runtime behavior while reducing methodology drift.

What was actually implemented:

- Added file-by-file audit and rebuild-plan docs:
  - `docs/diagram-workflow-frontend-audit.md`
  - `docs/diagram-workflow-frontend-rebuild-plan.md`
- Moved workflow API clients out of the feature subtree and into `frontend/src/lib/api/`.
- Moved workflow helper/view-model code into `frontend/src/lib/diagram-workflow/`.
- Rebuilt the workflow provider into native context files under `frontend/src/context/diagram-workflow-context/`.
- Moved workflow action dialogs into `frontend/src/dialogs/`.
- Generalized the old `WorkflowMetricCard` into `frontend/src/components/metric-card/metric-card.tsx`.
- Moved editor-specific workflow chrome into `frontend/src/pages/editor-page/...`.
- Moved the versions side-panel row component beside the versions tab implementation.
- Removed dead code instead of preserving it:
  - `frontend/src/features/diagram-workflow/components/compare-legend.tsx`
  - `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
  - `frontend/src/features/diagram-workflow/components/versions-panel.test.tsx`
- Removed the `frontend/src/features/diagram-workflow` directory entirely.
- Fixed a small UI regression while moving code: the live status chip now renders the mode badge it was already calculating, which makes its existing tests pass and matches the intended editor chrome.

Decisions made:

- Kept the workflow provider behavior mostly intact while changing its location and public import surface.
- Kept schema-sync compatibility behavior in `frontend/src/features/schema-sync/context/schema-sync-context.tsx`, only updating imports.
- Did not attempt a broader repo-wide `frontend/src/features` cleanup because unrelated feature modules remain and that would have exceeded the requested scope.

Approach intentionally avoided:

- Did not redesign workflow business logic from scratch.
- Did not refactor storage, schemadash, or backend persistence layers.
- Did not move unrelated `admin`, `auth`, `dashboard`, `persistence`, or `schema-sync` feature folders.

## 4. Files Changed

Files created:

- `docs/diagram-workflow-frontend-audit.md`
- `docs/diagram-workflow-frontend-rebuild-plan.md`
- `frontend/src/components/metric-card/metric-card.tsx`
- `frontend/src/context/diagram-workflow-context/diagram-workflow-context.tsx`
- `frontend/src/context/diagram-workflow-context/use-diagram-workflow.ts`
- `frontend/src/lib/api/diagram-migration-client.ts`
- `frontend/src/lib/api/diagram-workflow-client.ts`
- `frontend/src/lib/diagram-workflow/compare-render-model.ts`
- `frontend/src/lib/diagram-workflow/compare-render-model.test.ts`
- `frontend/src/lib/diagram-workflow/review-grouping.ts`
- `frontend/src/lib/diagram-workflow/review-grouping.test.ts`
- `frontend/src/lib/diagram-workflow/restore-messages.ts`
- `frontend/src/lib/diagram-workflow/version-canonical.ts`
- `frontend/src/lib/diagram-workflow/version-canonical.test.ts`
- `frontend/src/lib/diagram-workflow/version-labels.ts`
- `frontend/src/dialogs/create-version-dialog/create-version-dialog.tsx`
- `frontend/src/dialogs/migration-dialog/migration-dialog.tsx`
- `frontend/src/dialogs/migration-dialog/migration-dialog.test.tsx`
- `frontend/src/dialogs/migration-dialog/migration-summary.tsx`
- `frontend/src/dialogs/migration-dialog/migration-warning-list.tsx`
- `frontend/src/dialogs/review-changes-dialog/review-changes-dialog.tsx`
- `frontend/src/dialogs/review-changes-dialog/review-changes-dialog.test.tsx`
- `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.tsx`
- `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.test.tsx`
- `frontend/src/dialogs/restore-version-dialog/restore-warning-panel.tsx`
- `frontend/src/pages/editor-page/canvas/workflow/compare-summary-chip.tsx`
- `frontend/src/pages/editor-page/canvas/workflow/live-status-chip.tsx`
- `frontend/src/pages/editor-page/canvas/workflow/live-status-chip.test.tsx`
- `frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.tsx`
- `frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.test.tsx`
- `frontend/src/pages/editor-page/top-navbar/workflow/version-view-badge.tsx`
- `frontend/src/pages/editor-page/top-navbar/workflow/version-view-badge.test.tsx`
- `frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.tsx`
- `frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.test.tsx`
- `frontend/src/pages/editor-page/workflow/workflow-development-diagram-sync.tsx`
- `frontend/src/pages/editor-page/workflow/workflow-development-diagram-sync.test.tsx`
- `frontend/src/pages/editor-page/side-panel/versions-section/version-tab/version-list-item.tsx`

Files modified:

- `docs/codex-handoff.md`
- `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
- `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
- `frontend/src/pages/editor-page/workflow-editor-page.tsx`
- `frontend/src/pages/editor-page/editor-page.tsx`
- `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
- `frontend/src/pages/editor-page/top-navbar/top-navbar-mobile.tsx`
- `frontend/src/pages/editor-page/canvas/canvas.tsx`
- `frontend/src/pages/editor-page/canvas/relationship-edge/relationship-edge.tsx`
- `frontend/src/pages/editor-page/canvas/table-node/table-node.tsx`
- `frontend/src/pages/editor-page/canvas/table-node/table-node-field.tsx`
- `frontend/src/pages/editor-page/side-panel/versions-section/version-tab/version-tab.tsx`
- `frontend/src/pages/editor-page/side-panel/versions-section/changelog-tab/changelog-tab.tsx`

Files intentionally not changed:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- backend workflow service/repository files
- unrelated feature folders under `frontend/src/features/`

Files removed as redundant:

- `frontend/src/features/diagram-workflow/components/compare-legend.tsx`
- `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
- `frontend/src/features/diagram-workflow/components/versions-panel.test.tsx`
- the rest of `frontend/src/features/diagram-workflow/` after relocation

Purpose of the most important changed files:

- `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
  - owns workflow record loading and mode-derived diagram state
- `frontend/src/lib/diagram-workflow/compare-render-model.ts`
  - builds compare canvas data from canonical baseline + Development
- `frontend/src/dialogs/migration-dialog/migration-dialog.tsx`
  - workflow migration preview/validate/apply entrypoint
- `frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.tsx`
  - editor top-navbar review/migration launcher
- `frontend/src/pages/editor-page/canvas/workflow/live-status-chip.tsx`
  - editor canvas workflow status chrome

## 5. Data / API / Workflow Changes

No backend models, routes, services, migrations, env vars, or config were added in this task.

What changed on the frontend:

- Workflow API DTOs/clients moved from a feature subtree to `frontend/src/lib/api/`.
- Workflow helper modules moved from a feature subtree to `frontend/src/lib/diagram-workflow/`.
- Workflow context import surface changed from one feature-local file to native context files under `frontend/src/context/diagram-workflow-context/`.
- Workflow dialogs now use native dialog locations under `frontend/src/dialogs/`.
- Editor workflow chrome now lives under `frontend/src/pages/editor-page/...`.

Behavior preserved intentionally:

- Workflow mode handling remains URL-driven.
- Development remains the mutable head.
- Live/Compare/Version views remain read-only.
- Version create, review, compare, migration, and restore behavior were not redesigned.
- Schema Sync compatibility behavior still flows through `frontend/src/features/schema-sync/context/schema-sync-context.tsx`.

Compatibility / notable nuance:

- `frontend/src/features` still exists because unrelated modules remain. This refactor removed only `frontend/src/features/diagram-workflow` and did not broaden into unrelated feature-folder cleanup.

## 6. Validation Performed

Automated validation run during this task:

- `npx vitest run --config frontend/vitest.config.ts frontend/src/dialogs/migration-dialog/migration-dialog.test.tsx frontend/src/dialogs/restore-version-dialog/restore-version-dialog.test.tsx frontend/src/dialogs/review-changes-dialog/review-changes-dialog.test.tsx`
- `npx vitest run --config frontend/vitest.config.ts frontend/src/lib/diagram-workflow/compare-render-model.test.ts frontend/src/lib/diagram-workflow/review-grouping.test.ts frontend/src/lib/diagram-workflow/version-canonical.test.ts frontend/src/pages/editor-page/canvas/workflow/live-status-chip.test.tsx frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.test.tsx frontend/src/pages/editor-page/top-navbar/workflow/version-view-badge.test.tsx frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.test.tsx frontend/src/pages/editor-page/workflow/workflow-development-diagram-sync.test.tsx`
- `npm run build:web`

What was verified:

- workflow dialogs still render and act correctly after relocation
- workflow helper modules still pass focused unit tests
- editor workflow chrome tests pass in new locations
- live status chip now renders the mode badge as intended
- the frontend production build completes successfully after the structural rewrite

What remains unverified:

- manual browser QA of compare/review/migration/version/restore flows on this branch
- live PostgreSQL integration in this session
- repo-wide non-workflow frontend tests beyond the focused workflow suite

Known limitations / risks:

- `frontend/src/features` still exists because unrelated folders remain; this was a scope constraint, not an overlooked import leak
- workflow-specific editor code is now in native locations, but the repo still has other non-native feature folders outside this task

## 7. Outstanding Work

Not done yet:

- manual QA for the full editor workflow
- any broader repo-wide removal of other feature-first folders
- any backend/product redesign around workflow behavior

Next recommended step:

1. Perform a manual end-to-end QA pass across live sync, compare, review changes, migration, version create/open/compare, and restore on desktop and mobile.
2. If the repo is continuing a broader architecture cleanup, audit the remaining unrelated `frontend/src/features/*` areas separately instead of extending this task ad hoc.

Blockers / dependencies:

- Broader `frontend/src/features` removal would require a separate scoped effort because unrelated modules still live there.
- Manual QA is the main remaining confidence gap after the focused automated coverage and production build.

## 8. Instructions for the Next Codex Session

Exact reading order:

1. `docs/codex-handoff.md`
2. `docs/diagram-workflow-frontend-rebuild-plan.md`
3. `docs/diagram-workflow-frontend-audit.md`
4. `docs/live-database-development-compare-versions-design.md`
5. `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
6. `frontend/src/dialogs/migration-dialog/migration-dialog.tsx`
7. `frontend/src/pages/editor-page/workflow-editor-page.tsx`
8. `frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.tsx`
9. `frontend/src/pages/editor-page/canvas/workflow/live-status-chip.tsx`
10. `frontend/src/features/schema-sync/context/schema-sync-context.tsx`

What to avoid breaking:

- URL-driven workflow mode selection in the workflow provider
- Schema Sync compatibility updates in `schema-sync-context`
- editor readonly behavior in `workflow-editor-page.tsx`
- restore/create-version dialog behavior and toast flows

Where to continue implementation:

- Manual QA and any follow-up fixes should start from the editor integration points under `frontend/src/pages/editor-page/...`
- Any future workflow helper/API changes should start from `frontend/src/lib/diagram-workflow/` and `frontend/src/lib/api/`

## 9. Git Summary

Working branch:

- `restructe/01-diagram-workflow-to-native-structure`

Pull request title:

- `Rebuild diagram workflow frontend code using native SchemaDash structure`

Commit list created for this task:

- `d26512d chore: audit diagram workflow frontend methodology drift`
- `807fd05 docs: add diagram workflow frontend rebuild plan`
- `72c07fb refactor: move reusable workflow ui into native components and dialogs`
- `2a56a0c refactor: move workflow state and helpers into native context and lib`
- `2eed5c2 refactor: integrate workflow code into editor-page structure and remove diagram-workflow subtree`

Brief explanation of each commit:

- `d26512d` added the raw file-by-file audit of the diagram-workflow methodology drift.
- `807fd05` added the required rebuild plan with classification, mapping, reuse opportunities, and risk notes.
- `72c07fb` moved workflow dialogs into native dialog folders and generalized the metric card into shared components.
- `2a56a0c` moved workflow API/helpers into native `lib`, rebuilt the provider under native `context`, and rewired consumers to those locations.
- `2eed5c2` moved the remaining editor-specific workflow chrome into `pages/editor-page`, deleted dead components, and removed the `frontend/src/features/diagram-workflow` subtree.
