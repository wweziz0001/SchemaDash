# Codex Handoff

## 1. Project Overview

SchemaDash is a full-stack database schema diagram editor with frontend canvas editing, backend persistence/collaboration, and a shared `schema-sync-core` package for canonical schema import/diff/apply logic.

Relevant product context for this task:

- The current mutable head is the `Development` diagram document.
- A diagram can also have a read-only `Live Database` snapshot attached through the workflow layer.
- `Compare` is intentionally derived, read-only, and based on canonical schema comparison between the live snapshot baseline and the current development diagram.
- This task implemented only the Compare phase for `Live Database` vs `Development`.

Key concepts for the touched area:

- `CanonicalSchema` is the source of truth for compare classification.
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts` converts between diagram data and canonical schema.
- `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx` owns editor mode selection (`development`, `live`, `compare`) and workflow-scoped derived state.
- The compare canvas is still rendered through the normal editor/canvas stack, but the diagram loaded into the read-only compare surface is derived on demand.

## 2. Current Architectural Context

Parts of the system that matter for this task:

- Shared compare engine:
  - `packages/schema-sync-core/src/compare-types.ts`
  - `packages/schema-sync-core/src/compare.ts`
  - `packages/schema-sync-core/src/index.ts`
- Frontend workflow state and compare derivation:
  - `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
  - `frontend/src/features/diagram-workflow/lib/compare-render-model.ts`
  - `frontend/src/pages/editor-page/workflow-editor-page.tsx`
- Compare-specific UI surface:
  - `frontend/src/features/diagram-workflow/components/workflow-mode-switcher.tsx`
  - `frontend/src/features/diagram-workflow/components/live-status-chip.tsx`
  - `frontend/src/features/diagram-workflow/components/compare-summary-chip.tsx`
  - `frontend/src/features/diagram-workflow/components/compare-legend.tsx`
- Compare visual rendering on the canvas:
  - `frontend/src/pages/editor-page/canvas/canvas.tsx`
  - `frontend/src/pages/editor-page/canvas/table-node/table-node.tsx`
  - `frontend/src/pages/editor-page/canvas/table-node/table-node-field.tsx`
  - `frontend/src/pages/editor-page/canvas/relationship-edge/relationship-edge.tsx`

Important docs to read first:

1. `docs/live-database-development-compare-versions-design.md`
2. `docs/live-db-compare-feature-map.md`
3. `docs/codex-handoff.md`

Important high-risk files that were intentionally avoided in this task:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `packages/schema-sync-core/src/types.ts`

Important service/module boundaries:

- `schema-sync-core` now owns canonical compare contracts and compare classification logic.
- The workflow context owns fetching the live workflow record and the persisted development diagram, then deriving compare state on demand.
- `compare-render-model.ts` converts compare results into a canvas-ready read-only diagram plus metadata maps.
- Canvas components consume compare metadata maps for visual treatment; compare does not mutate backend state and is not persisted as its own source of truth.

## 3. Task Completed

Goal of this task:

- Implement only the Compare phase for `Live Database` vs `Development`.
- Keep compare derived/read-only.
- Keep development as the mutable authoritative head.
- Avoid turning `SchemaDashProvider` into a multi-branch editor.

What was implemented:

- Added compare-specific contracts and a canonical compare engine in `schema-sync-core`.
- Added compare mode to the workflow layer and enabled it only when both a live snapshot and a development diagram are available.
- Loaded the persisted development diagram through the existing persistence client, converted it to canonical, compared it with the live snapshot canonical schema, and built a derived compare diagram on demand.
- Added compare canvas rendering for:
  - tables
  - fields
  - relationships
- Added compare summary chrome and an on-canvas legend.
- Tightened compare mode read-only behavior so canvas dragging/resizing/relationship editing/schema-sync entrypoints are disabled in compare mode.

Important decisions made:

- Compare uses `compareCanonicalSchemas()` from the shared package instead of overloading `ChangePlan`.
- The compare canvas is a derived diagram built in `compare-render-model.ts`, not a new persisted document.
- Matching in the compare render model now indexes by both `sync.sourceId` and identity/name-based fallbacks so live-only items without true source IDs still render correctly.

Approaches intentionally avoided:

- No Versions UI.
- No restore-to-development workflow.
- No backend compare persistence.
- No broad editor-core/provider rewrite.
- No changes to the listed high-risk persistence/provider files.

## 4. Files Changed

Files created in this task:

- `packages/schema-sync-core/src/compare-types.ts`
  - compare-specific shared types and Zod schemas
- `packages/schema-sync-core/src/compare.ts`
  - canonical compare engine
- `packages/schema-sync-core/src/__tests__/compare.test.ts`
  - shared compare-engine classification test
- `frontend/src/features/diagram-workflow/lib/compare-render-model.ts`
  - builds the derived compare diagram plus compare metadata maps
- `frontend/src/features/diagram-workflow/lib/compare-render-model.test.ts`
  - validates compare render-model output
- `frontend/src/features/diagram-workflow/components/compare-summary-chip.tsx`
  - compact compare summary for editor chrome
- `frontend/src/features/diagram-workflow/components/compare-legend.tsx`
  - on-canvas compare legend/read-only note

Files modified in this task:

- `packages/schema-sync-core/src/index.ts`
  - exports compare modules
- `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
  - adds compare mode, loads development diagram, derives compare render model on demand
- `frontend/src/features/diagram-workflow/components/workflow-mode-switcher.tsx`
  - adds `Compare` mode button and activation gating
- `frontend/src/features/diagram-workflow/components/workflow-mode-switcher.test.tsx`
  - covers compare button activation
- `frontend/src/features/diagram-workflow/components/live-status-chip.tsx`
  - shows compare read-only state
- `frontend/src/features/diagram-workflow/components/live-status-chip.test.tsx`
  - validates compare read-only badge
- `frontend/src/pages/editor-page/workflow-editor-page.tsx`
  - routes compare mode into a read-only derived diagram
- `frontend/src/pages/editor-page/canvas/canvas.tsx`
  - disables drag/connect mutations in readonly compare mode and renders the compare legend
- `frontend/src/pages/editor-page/canvas/table-node/table-node.tsx`
  - applies table compare styling/markers and suppresses edit controls in readonly mode
- `frontend/src/pages/editor-page/canvas/table-node/table-node-field.tsx`
  - applies field compare styling and property-change text treatment
- `frontend/src/pages/editor-page/canvas/relationship-edge/relationship-edge.tsx`
  - applies relationship compare styling and blocks edit popovers in readonly mode
- `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
  - adds compare summary chip and hides schema-sync entrypoint outside development mode
- `frontend/src/pages/editor-page/top-navbar/top-navbar-mobile.tsx`
  - same mobile treatment

Important files intentionally not changed:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `packages/schema-sync-core/src/types.ts`

## 5. Data / API / Workflow Changes

New models and workflow behavior:

- Added compare-specific shared result types in `schema-sync-core`.
- Added `compareCanonicalSchemas({ baseline, target })`.
- Added frontend workflow mode `compare`.
- Added derived `CompareRenderModel` containing:
  - derived compare diagram
  - compare result summary
  - compare metadata maps for tables/fields/relationships

UI/workflow changes:

- Compare mode is activated via `?workflow=compare`.
- Compare mode is enabled only when:
  - `workflow.liveSnapshot` exists
  - persisted development diagram load succeeds
- Compare mode is read-only and does not persist compare results.

Storage/API changes:

- No backend API changes in this task.
- No schema migrations.
- No env/config changes.
- No compatibility layer added beyond using existing live workflow and persistence APIs.

## 6. Validation Performed

Focused validation that passed:

- `npm run test -w @schemadash/schema-sync-core -- --run src/__tests__/compare.test.ts`
- `npx vitest run --config frontend/vitest.config.ts frontend/src/features/diagram-workflow/components/workflow-mode-switcher.test.tsx frontend/src/features/diagram-workflow/components/live-status-chip.test.tsx frontend/src/features/diagram-workflow/lib/compare-render-model.test.ts`
- Targeted eslint runs on all newly touched compare/workflow/canvas files during implementation.

What those tests verified:

- Compare engine classifies added/removed/changed tables, fields, and relationships.
- Compare render model preserves development layout and adds live-only entities with compare metadata.
- Compare mode button activation gating works.
- Compare read-only status badge appears in UI.

What was manually verified by code inspection / targeted checks:

- Compare results are derived from canonical schema, not `ChangePlan`.
- Compare mode is routed as read-only in `workflow-editor-page.tsx`.
- Read-only compare disables drag/connect/edit affordances in the canvas components that were changed.
- Schema Sync entrypoint is hidden outside Development mode.

What remains unverified:

- Full browser/manual visual QA on dense real-world diagrams.
- End-to-end editor interaction coverage across all compare edge cases.
- Any behavior that depends on the repo-wide test/typecheck environment outside the targeted compare suite.

Known limitations / validation caveat:

- `npm run typecheck` still fails on this branch due pre-existing unrelated issues, including matcher typings in older tests and a `replaceAll` target complaint in `frontend/vite.config.ts`. These were not introduced by this compare task.

## 7. Outstanding Work

Not done yet:

- Versions/snapshots UI
- Compare-against-version workflow
- Restore-to-development
- Broader multi-version workflow state
- Additional compare polish for dense diagrams and more exhaustive visual/manual QA

Recommended next implementation phase:

- Implement immutable diagram versions/snapshots using the existing workflow foundation and reuse the compare engine/render model for `live` and `version` baselines.

Blockers / risks for next phase:

- Do not push snapshot/version state into `SchemaDashProvider` as editable parallel branches.
- Keep compare derived and read-only.
- Preserve the separation between workflow-derived views and the mutable development head.

## 8. Instructions for the Next Codex Session

Read in this order:

1. `docs/live-database-development-compare-versions-design.md`
2. `docs/live-db-compare-feature-map.md`
3. `docs/codex-handoff.md`
4. `packages/schema-sync-core/src/compare-types.ts`
5. `packages/schema-sync-core/src/compare.ts`
6. `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
7. `frontend/src/features/diagram-workflow/lib/compare-render-model.ts`
8. `frontend/src/pages/editor-page/workflow-editor-page.tsx`

Inspect first if continuing compare/version work:

- `frontend/src/features/diagram-workflow/components/workflow-mode-switcher.tsx`
- `frontend/src/features/diagram-workflow/components/compare-summary-chip.tsx`
- `frontend/src/features/diagram-workflow/components/compare-legend.tsx`
- `frontend/src/pages/editor-page/canvas/table-node/table-node.tsx`
- `frontend/src/pages/editor-page/canvas/table-node/table-node-field.tsx`
- `frontend/src/pages/editor-page/canvas/relationship-edge/relationship-edge.tsx`

Avoid breaking:

- Derived/read-only compare behavior
- Development remaining the mutable head
- Existing live mode behavior from the workflow foundation branch
- The decision to keep compare out of the high-risk persistence/provider files

Where to continue:

- For versions/snapshots: stay in the workflow layer and shared compare core; do not start by refactoring the editor provider.
- Reuse `compareCanonicalSchemas()` and `buildCompareRenderModel()` instead of inventing a second diff/view model.

## 9. Git Summary

Working branch:

- `feature/compare-mode-visual-engine`

Pull request title:

- `Implement compare mode visual engine for Live Database vs Development`

Commit list created for this task:

- `e4123dd feat: add canonical compare contracts and compare engine`
  - Added shared compare types and canonical compare classification logic in `schema-sync-core`.
- `4e79eb7 feat: add compare mode state and baseline plumbing`
  - Added compare mode to workflow context/editor routing and created the derived compare render model plumbing.
- `01a8732 feat: add compare canvas rendering and visual indicators`
  - Applied compare status rendering to tables, fields, and relationships on the canvas.
- `bfecfc8 feat: add compare legend summary and read-only UX`
  - Added compare legend/summary UI and tightened readonly compare behavior.
- `9d6a244 test: validate compare classification and rendering behavior`
  - Added targeted shared/frontend tests for compare classification, render-model output, and workflow UI state.
