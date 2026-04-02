# Diagram Workflow Frontend Rebuild Plan

## Goal

Rebuild the `diagram-workflow` frontend implementation so it follows SchemaDash's native responsibility-based structure instead of a feature-first subtree. The refactor must preserve current runtime behavior while removing `frontend/src/features/diagram-workflow` completely.

## File-by-File Classification

| Old path | Proposed new path | Classification | Why old location is wrong | Why new location is correct | Reuse / notes |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/features/diagram-workflow/api/diagram-migration-client.ts` | `frontend/src/lib/api/diagram-migration-client.ts` | Move | API transport is not feature-owned UI code. | `frontend/src/lib/api/` already owns request helpers and frontend API clients. | Keep reusing `requestJson` from `frontend/src/lib/api/request.ts`. |
| `frontend/src/features/diagram-workflow/api/diagram-workflow-client.ts` | `frontend/src/lib/api/diagram-workflow-client.ts` | Move | Same transport-layer drift as above. | Native API placement matches existing request helpers and shared DTO use. | Keep reusing `requestJson`; continue importing persistence DTOs. |
| `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx` | `frontend/src/context/diagram-workflow-context/diagram-workflow-context.tsx`, `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`, `frontend/src/context/diagram-workflow-context/use-diagram-workflow.ts` | Generalize | Cross-cutting editor workflow state should not live under a feature subtree. | Native `context/*-context` pattern is how SchemaDash hosts shared providers/hooks. | Reuse canonical adapters and persistence client; keep high-risk editor/provider edits minimal. |
| `frontend/src/features/diagram-workflow/lib/compare-render-model.ts` | `frontend/src/lib/diagram-workflow/compare-render-model.ts` | Move | Non-UI compare modeling is domain logic, not feature-local code. | `frontend/src/lib/` is the native home for compare helpers and view-model builders. | Reuse canonical adapters and shared compare engine. |
| `frontend/src/features/diagram-workflow/lib/restore-messages.ts` | `frontend/src/lib/diagram-workflow/restore-messages.ts` | Move | Dialog copy helpers are non-UI logic. | `frontend/src/lib/diagram-workflow/` keeps workflow helpers grouped by domain, not ownership. | Reuse `version-labels`. |
| `frontend/src/features/diagram-workflow/lib/review-grouping.ts` | `frontend/src/lib/diagram-workflow/review-grouping.ts` | Move | Review grouping is domain/view-model logic, not component code. | `frontend/src/lib/diagram-workflow/` matches native helper placement. | Reuse compare core and canonical adapters. |
| `frontend/src/features/diagram-workflow/lib/version-canonical.ts` | `frontend/src/lib/diagram-workflow/version-canonical.ts` | Move | Version canonical selection is shared non-UI workflow logic. | Same native lib rationale as above. | Reuse persistence deserialize + canonical adapters. |
| `frontend/src/features/diagram-workflow/lib/version-labels.ts` | `frontend/src/lib/diagram-workflow/version-labels.ts` | Move | Label/date helpers are shared non-UI formatting utilities. | Native lib placement lets dialogs, page chrome, and side-panel code share one helper source. | Reuse from top-navbar and versions side-panel. |
| `frontend/src/features/diagram-workflow/components/create-version-dialog.tsx` | `frontend/src/dialogs/create-version-dialog/create-version-dialog.tsx` | Move | This is an action dialog entrypoint, not a generic feature component. | `frontend/src/dialogs/` is the native home for create/open/save/import/export/editor dialogs. | Reuse persistence serialize, canonical adapters, toast primitives. |
| `frontend/src/features/diagram-workflow/components/migration-dialog.tsx` | `frontend/src/dialogs/migration-dialog/migration-dialog.tsx` | Move | Main migration action surface is a dialog entrypoint. | Dialog folder aligns with native dialog structure. | Reuse workflow API client, storage hook, toast primitives. |
| `frontend/src/features/diagram-workflow/components/migration-summary.tsx` | `frontend/src/dialogs/migration-dialog/migration-summary.tsx` | Move | Dialog-local rendering code should live with its dialog instead of a global feature bucket. | Keeps dialog-specific composition close to the entrypoint. | Use generalized metric card component. |
| `frontend/src/features/diagram-workflow/components/migration-warning-list.tsx` | `frontend/src/dialogs/migration-dialog/migration-warning-list.tsx` | Move | Dialog-local issue rendering is not a shared feature root component. | Co-locating with the dialog reduces indirection and duplication. | Reuse `Badge` and `cn`. |
| `frontend/src/features/diagram-workflow/components/restore-version-dialog.tsx` | `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.tsx` | Move | Action dialog entrypoint belongs in dialogs. | Native dialog placement matches other editor actions. | Reuse storage, persistence, schemadash hooks, toast, restore lib helpers. |
| `frontend/src/features/diagram-workflow/components/restore-warning-panel.tsx` | `frontend/src/dialogs/restore-version-dialog/restore-warning-panel.tsx` | Move | Dialog-local warning panel was buried in a generic feature bucket. | Co-locating with restore dialog keeps the warning surface with the action it protects. | Reuse alert primitives and restore message helpers. |
| `frontend/src/features/diagram-workflow/components/review-changes-dialog.tsx` | `frontend/src/dialogs/review-changes-dialog/review-changes-dialog.tsx` | Move | Structured review is a dialog entrypoint, not a reusable generic component. | Dialog folder matches native action-dialog organization. | Reuse review grouping lib and generalized metric card component. |
| `frontend/src/features/diagram-workflow/components/workflow-metric-card.tsx` | `frontend/src/components/metric-card/metric-card.tsx` | Generalize | The UI is generic enough to be reusable, but the name and location keep it feature-specific. | `frontend/src/components/` is the native home for reusable presentational widgets. | Rename to a feature-neutral component and reuse across workflow dialogs. |
| `frontend/src/features/diagram-workflow/components/version-list-item.tsx` | `frontend/src/pages/editor-page/side-panel/versions-section/version-tab/version-list-item.tsx` | Move | This row is side-panel-specific editor UI, not a shared feature primitive. | Native editor integration should live close to `pages/editor-page/...`. | Reuse dialog entrypoints and version label helpers. |
| `frontend/src/features/diagram-workflow/components/workflow-development-diagram-sync.tsx` | `frontend/src/pages/editor-page/workflow/workflow-development-diagram-sync.tsx` | Move | This file is editor integration glue, not a generic feature component. | Page-local workflow bridge belongs beside editor page composition. | Keep logic unchanged except imports. |
| `frontend/src/features/diagram-workflow/components/workflow-mode-switcher.tsx` | `frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.tsx` | Move | Top-navbar editor chrome should not sit in a feature bucket. | Native editor-page structure already owns top-navbar composition. | Reuse workflow provider only. |
| `frontend/src/features/diagram-workflow/components/review-dropdown.tsx` | `frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.tsx` | Generalize | This is editor-specific chrome, and the name undersells that it launches multiple workflow actions. | Page-local top-navbar placement reflects true responsibility. | Reuse dropdown/button primitives and dialog entrypoints. |
| `frontend/src/features/diagram-workflow/components/version-view-badge.tsx` | `frontend/src/pages/editor-page/top-navbar/workflow/version-view-badge.tsx` | Move | Snapshot view chrome is editor-navbar-specific. | Page-local placement matches existing top-navbar structure. | Reuse version label helpers. |
| `frontend/src/features/diagram-workflow/components/live-status-chip.tsx` | `frontend/src/pages/editor-page/canvas/workflow/live-status-chip.tsx` | Move | Canvas overlay chrome is editor-page integration, not shared global UI. | Page-local canvas workflow folder reflects its narrow responsibility. | Reuse workflow provider and `Badge`. |
| `frontend/src/features/diagram-workflow/components/compare-summary-chip.tsx` | `frontend/src/pages/editor-page/canvas/workflow/compare-summary-chip.tsx` | Move | Same editor-canvas-specific issue as above. | Native editor-page placement is the right fit. | Reuse version label helpers and workflow provider. |
| `frontend/src/features/diagram-workflow/components/compare-legend.tsx` | Removed | Remove | The file is unused and duplicates compare-summary intent. | Removing dead code reduces drift and maintenance cost. | No native consumer exists. |
| `frontend/src/features/diagram-workflow/components/versions-panel.tsx` | Removed | Remove | The file is unused and duplicates existing side-panel navigation patterns. | Removing dead code is safer than preserving an unused shortcut. | Layout/context already drive versions access. |
| `frontend/src/features/diagram-workflow/components/live-status-chip.test.tsx` | `frontend/src/pages/editor-page/canvas/workflow/live-status-chip.test.tsx` | Move | Test should follow the implementation location. | Keeps tests adjacent to editor-page chrome. | Update import mocks to use native context path. |
| `frontend/src/features/diagram-workflow/components/migration-dialog.test.tsx` | `frontend/src/dialogs/migration-dialog/migration-dialog.test.tsx` | Move | Test belongs with the dialog entrypoint. | Co-located dialog test matches native dialog organization. | Update mocks for moved API/context/modules. |
| `frontend/src/features/diagram-workflow/components/restore-version-dialog.test.tsx` | `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.test.tsx` | Move | Same as above. | Same as above. | Keep high-risk restore behavior coverage. |
| `frontend/src/features/diagram-workflow/components/review-changes-dialog.test.tsx` | `frontend/src/dialogs/review-changes-dialog/review-changes-dialog.test.tsx` | Move | Same as above. | Same as above. | Update context/lib imports. |
| `frontend/src/features/diagram-workflow/components/review-dropdown.test.tsx` | `frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.test.tsx` | Move | Test belongs with top-navbar workflow chrome. | Page-local adjacency is clearer. | Rename to match generalized menu component. |
| `frontend/src/features/diagram-workflow/components/version-view-badge.test.tsx` | `frontend/src/pages/editor-page/top-navbar/workflow/version-view-badge.test.tsx` | Move | Test belongs with top-navbar workflow chrome. | Page-local adjacency is clearer. | Update context path. |
| `frontend/src/features/diagram-workflow/components/versions-panel.test.tsx` | Removed | Remove | Test covers dead code. | Dead-code test should be removed with dead component. | No replacement needed. |
| `frontend/src/features/diagram-workflow/components/workflow-development-diagram-sync.test.tsx` | `frontend/src/pages/editor-page/workflow/workflow-development-diagram-sync.test.tsx` | Move | Test belongs with editor integration glue. | Page-local adjacency is clearer. | Update context path. |
| `frontend/src/features/diagram-workflow/components/workflow-mode-switcher.test.tsx` | `frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.test.tsx` | Move | Test belongs with top-navbar workflow chrome. | Page-local adjacency is clearer. | Update context path. |
| `frontend/src/features/diagram-workflow/lib/compare-render-model.test.ts` | `frontend/src/lib/diagram-workflow/compare-render-model.test.ts` | Move | Non-UI helper test should live with the helper. | Native lib adjacency. | No behavior change expected. |
| `frontend/src/features/diagram-workflow/lib/review-grouping.test.ts` | `frontend/src/lib/diagram-workflow/review-grouping.test.ts` | Move | Same as above. | Same as above. | No behavior change expected. |
| `frontend/src/features/diagram-workflow/lib/version-canonical.test.ts` | `frontend/src/lib/diagram-workflow/version-canonical.test.ts` | Move | Same as above. | Same as above. | No behavior change expected. |

## Existing Native Modules to Reuse

- `frontend/src/lib/api/request.ts`
- `frontend/src/features/persistence/api/persistence-client.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `frontend/src/context/layout-context/layout-context.tsx`
- `frontend/src/components/alert/alert.tsx`
- `frontend/src/components/badge/badge.tsx`
- `frontend/src/components/button/button.tsx`
- `frontend/src/components/dialog/dialog.tsx`
- `frontend/src/components/empty-state/empty-state.tsx`
- `frontend/src/components/input/input.tsx`
- `frontend/src/components/scroll-area/scroll-area.tsx`
- `frontend/src/components/tabs/tabs.tsx`
- `frontend/src/components/toast/use-toast.ts`

## Risky Integration Points

- `frontend/src/pages/editor-page/workflow-editor-page.tsx`
  - Must keep readonly mode bootstrapping behavior intact while only updating provider imports.
- `frontend/src/pages/editor-page/editor-page.tsx`
  - Must keep the workflow sync bridge placement unchanged except for native path updates.
- `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
  - Must keep workflow chrome visible only when the workflow provider is present.
- `frontend/src/pages/editor-page/top-navbar/top-navbar-mobile.tsx`
  - Same mobile chrome constraint as desktop.
- `frontend/src/pages/editor-page/canvas/canvas.tsx`
  - Must keep compare/live chips rendering in the same places.
- `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
  - Must keep workflow refresh/bind behavior intact even though the workflow client/provider paths move.

## Special Handling

- `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
  - Requires special handling because it combines context object, provider, hooks, URL mode state, API loading, and compare/view-model derivation in one file.
- `frontend/src/features/diagram-workflow/components/review-dropdown.tsx`
  - Should be renamed while moving so the responsibility is obvious in editor-page chrome.
- `frontend/src/features/diagram-workflow/components/workflow-metric-card.tsx`
  - Should be generalized so the code no longer encodes feature ownership into a reusable visual primitive.
- `frontend/src/features/diagram-workflow/components/compare-legend.tsx`
  - Remove instead of moving because no native consumer exists.
- `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
  - Remove instead of moving because it is unused and duplicates existing layout navigation.

## Implementation Order

1. Land the audit and rebuild plan docs.
2. Move and generalize reusable UI plus dialog entrypoints.
3. Move the workflow provider and workflow lib/api helpers into native context/lib locations.
4. Move editor-specific workflow chrome and side-panel integration into `frontend/src/pages/editor-page/...`.
5. Delete `frontend/src/features/diagram-workflow`, update imports, and remove dead tests/code.
6. Verify with frontend build and targeted tests, then update the persistent handoff doc.

## Acceptance Notes

- The implementation must remove `frontend/src/features/diagram-workflow` completely.
- Unrelated feature folders under `frontend/src/features/` are outside the scope of this refactor and should not be broadly reorganized here.
