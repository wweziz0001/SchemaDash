# Codex Handoff

## 1. Project Overview

SchemaDash is a full-stack schema design, persistence, sharing, and review product.

- `frontend/` is a Vite + React + Tailwind application for the authenticated dashboard/library shell, editor, shared viewers, templates/examples, auth flows, and admin surfaces.
- `backend/` is a Fastify API that owns auth, persistence, sharing, collaboration, schema sync, health, and admin routes.
- `packages/schema-sync-core/` contains shared schema/diff logic used by both frontend and backend.

Relevant product context for this task:

- The authenticated dashboard is the main saved-workspace surface for browsing diagrams, collections, shared items, profile/settings, and trash.
- Native frontend ownership in this area should be:
  - reusable dashboard widgets in `frontend/src/components/`
  - page composition and route-local hooks in `frontend/src/pages/dashboard-page/`
  - reusable non-UI catalog/search logic in `frontend/src/lib/`
  - dashboard-adjacent dialogs in `frontend/src/dialogs/`
- `frontend/src/features/dashboard` and `frontend/src/features` must remain absent.

## 2. Current Architectural Context

Read these first for future dashboard work:

1. `docs/codex-handoff.md`
2. `docs/dashboard-hooks-rebuild-plan.md`
3. `docs/audits/dashboard-hooks-methodology-drift.md`
4. `docs/architecture/project-collections.md`
5. `docs/CODEBASE_STRUCTURE.md`

Important frontend files for this area:

- `frontend/src/pages/dashboard-page/use-library-catalog.ts`
- `frontend/src/lib/dashboard/library-catalog.ts`
- `frontend/src/lib/utils/search.ts`
- `frontend/src/pages/dashboard-page/library-page.tsx`
- `frontend/src/pages/dashboard-page/collections-page.tsx`
- `frontend/src/pages/dashboard-page/trash-page.tsx`
- `frontend/src/pages/dashboard-page/profile-page.tsx`
- `frontend/src/pages/dashboard-page/settings-page.tsx`
- `frontend/src/components/dashboard-page/dashboard-page-header.tsx`
- `frontend/src/components/dashboard-page/dashboard-feedback-panel.tsx`
- `frontend/src/components/dashboard-page/dashboard-search-toolbar.tsx`
- `frontend/src/components/dashboard-page/dashboard-setting-option-card.tsx`
- `frontend/src/components/dashboard-page/library-diagram-card.tsx`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`

High-risk files and boundaries:

- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
  - Shared authenticated shell and sidebar routing surface. Intentionally not changed in this task.
- `frontend/src/pages/dashboard-page/use-library-catalog.ts`
  - Route-local hook that loads dashboard catalog data from storage.
- `frontend/src/pages/dashboard-page/library-page.tsx`
  - Main library composition surface. Visual changes here affect multiple routed views.
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
  - Dashboard-adjacent dialog that now shares the new search helper.
- `frontend/src/router.tsx`
  - Route ownership is already correct and was intentionally not changed.

Important service/module boundaries:

- `frontend/src/lib/dashboard/library-catalog.ts` now owns pure dashboard catalog types and helpers.
- `frontend/src/pages/dashboard-page/use-library-catalog.ts` now owns React state, deferred search, storage calls, and hook orchestration only.
- `frontend/src/lib/utils/search.ts` now owns normalized dashboard search behavior reused by page and dialog code.
- `frontend/src/components/dashboard-page/*` now owns reusable dashboard page widgets.
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx` remains the dialog entrypoint; only helper reuse changed here.

Relevant frontend/backend relationship:

- Dashboard/library pages still read from the frontend storage layer via `useStorage()`.
- No backend routes, persistence DTOs, or environment contracts changed in this task.

## 3. Task Completed

Task objective:

- Correct the dashboard hooks methodology drift.
- Keep dashboard code aligned with SchemaDash's native responsibility-based structure.
- Ensure dashboard-related UI matches the existing SchemaDash system style instead of behaving like a dashboard-only UI island.

What was implemented:

- Added the required audit:
  - `docs/audits/dashboard-hooks-methodology-drift.md`
- Added the required rebuild plan:
  - `docs/dashboard-hooks-rebuild-plan.md`
- Confirmed the historical dashboard feature subtree was already absent on this branch lineage and kept it absent.
- Extracted reusable dashboard page widgets into native components:
  - `frontend/src/components/dashboard-page/dashboard-page-header.tsx`
  - `frontend/src/components/dashboard-page/dashboard-feedback-panel.tsx`
  - `frontend/src/components/dashboard-page/dashboard-search-toolbar.tsx`
  - `frontend/src/components/dashboard-page/dashboard-setting-option-card.tsx`
  - `frontend/src/components/dashboard-page/library-diagram-card.tsx`
- Split pure dashboard catalog logic out of the page hook:
  - `frontend/src/lib/dashboard/library-catalog.ts`
  - `frontend/src/lib/utils/search.ts`
- Rebuilt `frontend/src/pages/dashboard-page/use-library-catalog.ts` so it stays page-local but delegates pure sorting/filtering/query logic to `lib/`.
- Updated `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx` to reuse the shared search helper instead of defining its own dashboard-specific normalization function.
- Rebuilt the dashboard page surfaces around shared SchemaDash components and styling patterns:
  - shared `MetricCard`
  - shared `StatusBadge`
  - shared `SummaryList`
  - shared `Alert`
  - native empty-state primitives via `DashboardFeedbackPanel`

Key decisions:

- Keep route ownership under `frontend/src/pages/dashboard-page/`.
- Keep the dashboard shell and router unchanged because their structure was already correct and they are high-risk integration points.
- Generalize pure catalog/search logic into `frontend/src/lib/` instead of leaving it inside the page hook.
- Generalize repeated dashboard page widgets into `frontend/src/components/dashboard-page/` instead of keeping page-local clones.

Approach intentionally avoided:

- No mechanical recreation of a feature-first subtree.
- No compatibility stubs under `frontend/src/features/dashboard`.
- No route reshuffle in `frontend/src/router.tsx`.
- No broad edits to `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`.
- No unrelated changes to `frontend/vite.config.ts`.

## 4. Files Changed

Files created:

- `docs/audits/dashboard-hooks-methodology-drift.md`
  - Audit of the historical hook drift, current runtime drift, and style mismatches.
- `docs/dashboard-hooks-rebuild-plan.md`
  - Required mapping, classifications, native reuse targets, and risk notes.
- `frontend/src/components/dashboard-page/dashboard-page-header.tsx`
  - Shared dashboard hero/header surface.
- `frontend/src/components/dashboard-page/dashboard-feedback-panel.tsx`
  - Shared loading/empty dashboard surface built from native empty-state primitives.
- `frontend/src/components/dashboard-page/dashboard-search-toolbar.tsx`
  - Shared dashboard search/filter toolbar wrapper.
- `frontend/src/components/dashboard-page/dashboard-setting-option-card.tsx`
  - Shared settings preference tile.
- `frontend/src/components/dashboard-page/library-diagram-card.tsx`
  - Shared library diagram card surface.
- `frontend/src/lib/dashboard/library-catalog.ts`
  - Pure dashboard catalog types and helpers.
- `frontend/src/lib/utils/search.ts`
  - Shared search normalization/matching helpers.
- `frontend/src/lib/dashboard/__tests__/library-catalog.test.ts`
  - Tests for catalog query/filter/shared-item behavior.
- `frontend/src/lib/utils/__tests__/search.test.ts`
  - Tests for shared search normalization/matching.

Files modified:

- `docs/codex-handoff.md`
  - Rewritten for this dashboard refactor so a fresh session can continue safely.
- `frontend/src/pages/dashboard-page/use-library-catalog.ts`
  - Reduced to page-owned hook orchestration and storage loading.
- `frontend/src/pages/dashboard-page/library-page.tsx`
  - Uses shared dashboard widgets plus native `Alert`/`MetricCard`.
- `frontend/src/pages/dashboard-page/collections-page.tsx`
  - Uses shared dashboard page header/search/feedback components and shared search helper.
- `frontend/src/pages/dashboard-page/trash-page.tsx`
  - Uses shared dashboard header/feedback components plus native `MetricCard` and `Alert`.
- `frontend/src/pages/dashboard-page/profile-page.tsx`
  - Uses shared dashboard header and `SummaryList`.
- `frontend/src/pages/dashboard-page/settings-page.tsx`
  - Uses shared dashboard header, settings option card, and `SummaryList`.
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
  - Reuses the shared search helper.

Important files intentionally not changed:

- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
  - High-risk authenticated shell. Left untouched.
- `frontend/src/router.tsx`
  - Route ownership was already correct. Left untouched.
- `frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.ts`
  - Already sits in a reasonable dialog-native boundary for this scope.
- `frontend/src/pages/editor-page/top-navbar/current-diagram-share-button.tsx`
  - Consumed the existing sharing dialog API without needing structural changes.
- `frontend/vite.config.ts`
  - Had a pre-existing unrelated working-tree modification and was intentionally avoided.

Files/directories intentionally absent:

- `frontend/src/features/dashboard`
- `frontend/src/features`

## 5. Data / API / Workflow Changes

Behavioral/API changes:

- No backend routes changed.
- No storage contract changed.
- No env vars, migrations, or config keys changed.

Frontend structure/workflow changes:

- Dashboard catalog DTOs and helper logic moved into `frontend/src/lib/dashboard/library-catalog.ts`.
- Shared search normalization/matching moved into `frontend/src/lib/utils/search.ts`.
- `frontend/src/pages/dashboard-page/use-library-catalog.ts` now focuses on page hook orchestration only.
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx` now uses the same search helper as dashboard pages.
- Dashboard empty/loading/header/search/settings/library-card UI now comes from shared components under `frontend/src/components/dashboard-page/`.

Compatibility handling:

- The library route behavior and storage query semantics were preserved.
- Shared-item detection still uses the same ownership/access rules as before, now expressed through pure helpers with tests.

## 6. Validation Performed

Validation completed:

- `npx vitest run --config frontend/vitest.config.ts frontend/src/lib/dashboard/__tests__/library-catalog.test.ts frontend/src/lib/utils/__tests__/search.test.ts frontend/src/pages/dashboard-page/dashboard-shell-layout.test.tsx frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.test.tsx`
- `npx tsc -p tsconfig.json --noEmit`
- `npm run build:web`
- `find frontend/src -type d | grep '/features\\(/\\|$\\)' || true`

What was verified:

- New shared dashboard helper tests pass.
- Existing dashboard shell behavior test still passes.
- Existing sharing dialog API test still passes after shared search helper reuse.
- TypeScript passes.
- Frontend production build passes.
- `frontend/src/features/dashboard` is absent.
- `frontend/src/features` is absent.

What remains unverified manually:

- Browser-level QA of the dashboard/library pages in light and dark themes.
- Manual verification of collections, trash, profile, and settings visuals against a running authenticated deployment.
- Manual QA of open-diagram search behavior in the browser after helper consolidation.

Known limitations / risks:

- Other historical docs in `docs/` still reference removed feature subtrees outside this dashboard scope.
- The `shared-with-me` disabled-state card was left as-is because it already uses native primitives, but it was not given a dedicated shared dashboard widget in this task.

## 7. Outstanding Work

Not done yet:

- No browser screenshots or manual visual QA artifacts were captured.
- No end-to-end tests were added for routed dashboard pages.
- No broader documentation cleanup was done for unrelated feature-subtree references elsewhere in `docs/`.

Recommended next step:

1. Manually QA `/`, `/collections`, `/trash`, `/profile`, `/settings`, and `/shared-with-me` in both light and dark themes against a running app.
2. If more dashboard views are added later, keep putting reusable view-model helpers in `frontend/src/lib/` and reusable dashboard widgets in `frontend/src/components/dashboard-page/`.
3. If open-diagram browsing grows further, consider whether more of its row/search presentation should be shared with the library surfaces without coupling route and dialog concerns too tightly.

Blockers/risks for future work:

- Avoid broad edits to `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx` unless dashboard navigation actually changes.
- Keep `frontend/src/lib/dashboard/library-catalog.ts` aligned with storage-layer query semantics if `useStorage()` project filtering evolves.
- Preserve `frontend/src/lib/utils/search.ts` normalization rules when reusing it elsewhere so dashboard and dialog search stay consistent.

## 8. Instructions for the Next Codex Session

Read in this order:

1. `docs/codex-handoff.md`
2. `docs/dashboard-hooks-rebuild-plan.md`
3. `docs/audits/dashboard-hooks-methodology-drift.md`
4. `frontend/src/lib/dashboard/library-catalog.ts`
5. `frontend/src/lib/utils/search.ts`
6. `frontend/src/pages/dashboard-page/use-library-catalog.ts`
7. `frontend/src/components/dashboard-page/dashboard-page-header.tsx`
8. `frontend/src/components/dashboard-page/dashboard-feedback-panel.tsx`
9. `frontend/src/components/dashboard-page/library-diagram-card.tsx`
10. `frontend/src/pages/dashboard-page/library-page.tsx`
11. `frontend/src/pages/dashboard-page/collections-page.tsx`
12. `frontend/src/pages/dashboard-page/trash-page.tsx`
13. `frontend/src/pages/dashboard-page/profile-page.tsx`
14. `frontend/src/pages/dashboard-page/settings-page.tsx`
15. `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`

What to avoid breaking:

- Storage-backed filtering for all/shared/unorganized/trash/collection views.
- Shared-resource detection logic for owned vs shared diagrams/projects.
- Dashboard shell routing and sidebar navigation.
- Open-diagram search behavior.
- The absence of `frontend/src/features/dashboard` and `frontend/src/features`.

Where to continue implementation:

- Manual dashboard QA or any follow-up dashboard UI refinements should start from the shared widgets in `frontend/src/components/dashboard-page/`.
- Any future non-UI dashboard logic should start in `frontend/src/lib/dashboard/` instead of going back into page files.

## 9. Git Summary

Working branch:

- `restructe/05-dashboard-hooks-to-native-structure-and-system-style`

Pull request title:

- `Rebuild dashboard hooks integration using native SchemaDash structure and native system styling`

Commit list created for this task:

- `chore: audit dashboard hooks methodology drift and style divergence`
  - Added the required methodology/style audit for the dashboard area.
- `docs: add dashboard hooks rebuild plan`
  - Added the required old-to-new path mapping and implementation plan.
- `refactor: move reusable dashboard-related ui and hooks into native folders`
  - Extracted shared dashboard page widgets into `frontend/src/components/dashboard-page/`.
- `refactor: move dashboard helpers and page integration into native structure`
  - Moved pure catalog/search logic into `frontend/src/lib/` and updated dashboard/dialog integration.
- `refactor: align dashboard-related UI with native SchemaDash visual system and remove dashboard feature subtree`
  - Swapped remaining dashboard surfaces to native MetricCard, StatusBadge, SummaryList, Alert, and empty-state patterns while keeping the feature subtree absent.
- `test: validate dashboard frontend behavior and style consistency after correction`
  - Adds focused helper tests, runs validation, and updates this handoff for the next session.
