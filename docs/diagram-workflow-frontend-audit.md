# Diagram Workflow Frontend Audit

## Scope

This audit covers every file currently under `frontend/src/features/diagram-workflow` and the editor integrations that consume that subtree. The goal is to classify the drift introduced by the feature-first implementation and capture the native destination for each responsibility before refactoring.

## Structural Findings

- `frontend/src/features/diagram-workflow/api/*` is not feature-local state. It is a transport layer that belongs with the native frontend API helpers in `frontend/src/lib/api/`.
- `frontend/src/features/diagram-workflow/context/*` is not feature-local UI state. It is a cross-cutting editor workflow provider and should follow the existing native context pattern under `frontend/src/context/`.
- `frontend/src/features/diagram-workflow/components/*` mixes at least four responsibilities:
  - editor chrome that belongs near `frontend/src/pages/editor-page/...`
  - version list UI that belongs near the versions side-panel
  - reusable visual primitives that should live in `frontend/src/components/`
  - action dialogs that should live in `frontend/src/dialogs/`
- `frontend/src/features/diagram-workflow/lib/*` contains non-UI workflow helpers and view-model builders that belong in `frontend/src/lib/`.
- Two files are already dead or structurally redundant:
  - `frontend/src/features/diagram-workflow/components/compare-legend.tsx`
  - `frontend/src/features/diagram-workflow/components/versions-panel.tsx`

## File Inventory

| Old path | Responsibility | Native destination | Action |
| --- | --- | --- | --- |
| `frontend/src/features/diagram-workflow/api/diagram-migration-client.ts` | Workflow migration API client and DTOs | `frontend/src/lib/api/diagram-migration-client.ts` | Move |
| `frontend/src/features/diagram-workflow/api/diagram-workflow-client.ts` | Workflow API client and DTOs | `frontend/src/lib/api/diagram-workflow-client.ts` | Move |
| `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx` | Cross-cutting workflow provider, URL mode state, workflow record loading | `frontend/src/context/diagram-workflow-context/*` | Generalize into native context pattern |
| `frontend/src/features/diagram-workflow/lib/compare-render-model.ts` | Non-UI compare render model builder | `frontend/src/lib/diagram-workflow/compare-render-model.ts` | Move |
| `frontend/src/features/diagram-workflow/lib/restore-messages.ts` | Restore dialog copy helpers | `frontend/src/lib/diagram-workflow/restore-messages.ts` | Move |
| `frontend/src/features/diagram-workflow/lib/review-grouping.ts` | Non-UI review grouping builder | `frontend/src/lib/diagram-workflow/review-grouping.ts` | Move |
| `frontend/src/features/diagram-workflow/lib/version-canonical.ts` | Canonical snapshot selection helper | `frontend/src/lib/diagram-workflow/version-canonical.ts` | Move |
| `frontend/src/features/diagram-workflow/lib/version-labels.ts` | Version label/date helpers | `frontend/src/lib/diagram-workflow/version-labels.ts` | Move |
| `frontend/src/features/diagram-workflow/components/create-version-dialog.tsx` | Action dialog for immutable snapshot creation | `frontend/src/dialogs/create-version-dialog/create-version-dialog.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/migration-dialog.tsx` | Action dialog for preview/validate/apply | `frontend/src/dialogs/migration-dialog/migration-dialog.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/migration-summary.tsx` | Dialog-local summary view | `frontend/src/dialogs/migration-dialog/migration-summary.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/migration-warning-list.tsx` | Dialog-local issue list | `frontend/src/dialogs/migration-dialog/migration-warning-list.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/restore-version-dialog.tsx` | Action dialog for restore to development | `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/restore-warning-panel.tsx` | Dialog-local restore warning surface | `frontend/src/dialogs/restore-version-dialog/restore-warning-panel.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/review-changes-dialog.tsx` | Action dialog for structured review | `frontend/src/dialogs/review-changes-dialog/review-changes-dialog.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/workflow-metric-card.tsx` | Generic metric card UI | `frontend/src/components/metric-card/metric-card.tsx` | Generalize |
| `frontend/src/features/diagram-workflow/components/version-list-item.tsx` | Versions side-panel list row | `frontend/src/pages/editor-page/side-panel/versions-section/version-tab/version-list-item.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/workflow-development-diagram-sync.tsx` | Editor integration that mirrors current development diagram into workflow provider | `frontend/src/pages/editor-page/workflow/workflow-development-diagram-sync.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/workflow-mode-switcher.tsx` | Editor top-navbar workflow mode chrome | `frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/review-dropdown.tsx` | Editor top-navbar workflow action menu | `frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.tsx` | Generalize/rename |
| `frontend/src/features/diagram-workflow/components/version-view-badge.tsx` | Editor top-navbar snapshot state badge | `frontend/src/pages/editor-page/top-navbar/workflow/version-view-badge.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/live-status-chip.tsx` | Editor canvas workflow status chrome | `frontend/src/pages/editor-page/canvas/workflow/live-status-chip.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/compare-summary-chip.tsx` | Editor canvas compare summary chrome | `frontend/src/pages/editor-page/canvas/workflow/compare-summary-chip.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/compare-legend.tsx` | Unused compare legend card | Removed | Remove |
| `frontend/src/features/diagram-workflow/components/versions-panel.tsx` | Unused shortcut button for versions side-panel | Removed | Remove |
| `frontend/src/features/diagram-workflow/components/live-status-chip.test.tsx` | Test for live status chip | `frontend/src/pages/editor-page/canvas/workflow/live-status-chip.test.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/migration-dialog.test.tsx` | Test for migration dialog | `frontend/src/dialogs/migration-dialog/migration-dialog.test.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/restore-version-dialog.test.tsx` | Test for restore dialog | `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.test.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/review-changes-dialog.test.tsx` | Test for review dialog | `frontend/src/dialogs/review-changes-dialog/review-changes-dialog.test.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/review-dropdown.test.tsx` | Test for workflow actions menu | `frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.test.tsx` | Move/rename |
| `frontend/src/features/diagram-workflow/components/version-view-badge.test.tsx` | Test for top-navbar snapshot badge | `frontend/src/pages/editor-page/top-navbar/workflow/version-view-badge.test.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/versions-panel.test.tsx` | Test for dead shortcut button | Removed | Remove |
| `frontend/src/features/diagram-workflow/components/workflow-development-diagram-sync.test.tsx` | Test for editor integration sync bridge | `frontend/src/pages/editor-page/workflow/workflow-development-diagram-sync.test.tsx` | Move |
| `frontend/src/features/diagram-workflow/components/workflow-mode-switcher.test.tsx` | Test for top-navbar mode switcher | `frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.test.tsx` | Move |
| `frontend/src/features/diagram-workflow/lib/compare-render-model.test.ts` | Test for compare render model | `frontend/src/lib/diagram-workflow/compare-render-model.test.ts` | Move |
| `frontend/src/features/diagram-workflow/lib/review-grouping.test.ts` | Test for review grouping | `frontend/src/lib/diagram-workflow/review-grouping.test.ts` | Move |
| `frontend/src/features/diagram-workflow/lib/version-canonical.test.ts` | Test for authoritative version canonical schema selection | `frontend/src/lib/diagram-workflow/version-canonical.test.ts` | Move |

## Native Reuse Opportunities

- Reuse `frontend/src/lib/api/request.ts` rather than keeping a feature-local HTTP layer.
- Reuse `frontend/src/features/schema-sync/lib/canonical-adapters.ts` rather than duplicating canonical conversion logic.
- Reuse `frontend/src/features/persistence/api/persistence-client.ts` for diagram fetch, serialize, and deserialize behavior.
- Reuse `frontend/src/components/*` primitives already adopted by the workflow UI instead of leaving composite workflow code buried in a feature subtree.
- Reuse `frontend/src/context/layout-context/*` for versions panel navigation instead of feature-local layout state.
- Reuse the existing editor route structure under `frontend/src/pages/editor-page/...` for workflow chrome and side-panel integrations.

## Primary Risks

- `frontend/src/context/storage-context/storage-provider.tsx` and `frontend/src/context/schemadash-context/schemadash-provider.tsx` are high-risk because workflow restore/sync behavior depends on their existing persistence and editor state contracts.
- `frontend/src/pages/editor-page/editor-page.tsx`, `frontend/src/pages/editor-page/workflow-editor-page.tsx`, and the top-navbar/canvas entry files are high-risk because import-path and mode wiring changes can easily break readonly/editor composition.
- `frontend/src/features/schema-sync/context/schema-sync-context.tsx` is a related integration boundary because it updates workflow records and still sits under another feature subtree that is out of scope for this refactor.

## Out-of-Scope Constraint

`frontend/src/features` still contains unrelated modules (`admin`, `auth`, `dashboard`, `persistence`, `schema-sync`) that are not part of this task. The implementation should remove `frontend/src/features/diagram-workflow` completely and migrate its responsibilities into native locations without broad unrelated feature-folder cleanup.
