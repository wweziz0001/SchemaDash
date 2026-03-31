# Schema Sync Frontend Audit

## Scope

This audit covers every file currently under `frontend/src/features/schema-sync` and the native frontend modules that already consume or overlap with those responsibilities. The goal is to classify the schema-sync drift introduced by the feature-first subtree before rebuilding it into SchemaDash's native structure.

## Structural Findings

- `frontend/src/features/schema-sync/api/*` is transport code, not feature-owned UI. It belongs with the native frontend API clients in `frontend/src/lib/api/`.
- `frontend/src/features/schema-sync/lib/*` is non-UI canonical conversion logic already reused by workflow dialogs and helpers outside the schema-sync subtree. It belongs in `frontend/src/lib/`, not behind a feature import boundary.
- `frontend/src/features/schema-sync/dialogs/schema-sync-dialog.tsx` is a global action dialog entrypoint and belongs in `frontend/src/dialogs/`.
- `frontend/src/features/schema-sync/components/schema-sync-toolbar-button.tsx` is editor top-navbar integration, not a generic shared feature component. It belongs close to `frontend/src/pages/editor-page/top-navbar/...`.
- `frontend/src/features/schema-sync/context/*` and `frontend/src/features/schema-sync/hooks/use-schema-sync.ts` are structurally off-model. The provider exists mainly to manage one dialog's open state plus dialog-local actions. That should be rebuilt using the native dialog context pattern instead of keeping a feature-local provider around the entire editor.

## File Inventory

| Old path | Responsibility | Native destination | Action |
| --- | --- | --- | --- |
| `frontend/src/features/schema-sync/api/schema-sync-client.ts` | Frontend HTTP client for saved connections, preview, apply, and audit fetch | `frontend/src/lib/api/schema-sync-client.ts` | Move |
| `frontend/src/features/schema-sync/components/schema-sync-toolbar-button.tsx` | Editor top-navbar launch button for schema sync | `frontend/src/pages/editor-page/top-navbar/workflow/schema-sync-toolbar-button.tsx` | Move |
| `frontend/src/features/schema-sync/context/schema-sync-context-object.ts` | Feature-local dialog state contract for one dialog flow | Merge into `frontend/src/context/dialog-context/*` and dialog-local state in `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx` | Merge |
| `frontend/src/features/schema-sync/context/schema-sync-context.tsx` | Feature-local provider for dialog open state, connection mutations, preview/apply actions, and workflow compatibility updates | Split between `frontend/src/context/dialog-context/*`, `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx`, and `frontend/src/lib/api/schema-sync-client.ts` | Generalize |
| `frontend/src/features/schema-sync/dialogs/schema-sync-dialog.tsx` | Global dialog entrypoint for connection management, live import, preview, and apply | `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx` | Move |
| `frontend/src/features/schema-sync/hooks/use-schema-sync.ts` | Thin hook wrapper around the feature-local provider | Removed in favor of native `useDialog()` and dialog-local state | Remove |
| `frontend/src/features/schema-sync/lib/canonical-adapters.ts` | Non-UI canonical schema conversion between shared schema-sync core types and frontend diagram types | `frontend/src/lib/schema-sync/canonical-adapters.ts` | Move |
| `frontend/src/features/schema-sync/lib/__tests__/canonical-adapters.test.ts` | Unit coverage for canonical conversions and sync metadata preservation | `frontend/src/lib/schema-sync/canonical-adapters.test.ts` | Move |

## Native Reuse Opportunities

- Reuse `frontend/src/context/dialog-context/dialog-context.tsx` and `frontend/src/context/dialog-context/dialog-provider.tsx` instead of preserving a schema-sync-only provider around the editor.
- Reuse `frontend/src/lib/api/request.ts` instead of keeping schema-sync transport under a feature subtree.
- Reuse `frontend/src/lib/api/diagram-workflow-client.ts` for live snapshot bind/refresh behavior rather than hiding that integration behind feature-local context code.
- Reuse existing dialog primitives from `frontend/src/components/dialog/dialog.tsx`, `frontend/src/components/tabs/tabs.tsx`, `frontend/src/components/scroll-area/scroll-area.tsx`, and `frontend/src/components/toast/use-toast.ts`.
- Reuse the already-native `frontend/src/components/metric-card/metric-card.tsx` by generalizing the plan summary UI out of the migration dialog.

## Primary Risks

- `frontend/src/pages/editor-page/editor-page.tsx`
  - High risk because the schema-sync provider currently wraps the editor tree. Replacing it with the native dialog provider pattern must not break editor bootstrap or dialog mounting.
- `frontend/src/context/dialog-context/dialog-context.tsx`
  - High risk because it is shared by many global dialogs and must only receive minimal, compatible schema-sync additions.
- `frontend/src/context/dialog-context/dialog-provider.tsx`
  - High risk because dialog mounting/order changes can break editor action dialogs if handled carelessly.
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
  - High risk because schema-sync still updates persisted diagram `schemaSync` metadata. This file should stay untouched if possible.
- `frontend/src/context/storage-context/storage-provider.tsx`
  - High risk because diagram persistence and reload behavior depend on existing storage contracts. This file should stay untouched if possible.
- `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
  - Needs only narrow import-path updates because it already reuses canonical conversion logic.

## Special Handling Notes

- `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
  - Requires special handling because it mixes transport calls, workflow compatibility updates, diagram metadata persistence, toast side effects, and simple dialog-open state in one provider. That mixed responsibility is the core methodology problem in this subtree.
- `frontend/src/features/schema-sync/dialogs/schema-sync-dialog.tsx`
  - Requires special handling because the current file contains both dialog presentation and most of the operational flow logic. The rebuild should keep the behavior stable while moving open/close control into the native dialog system.
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
  - Requires special handling because it sits on a frontend/shared-package boundary and is consumed by workflow compare/version/migration code. The move must keep logic stable and only update imports.

## Boundary Notes

- Frontend UI and dialog concerns should stay in `frontend/src/dialogs/` and `frontend/src/pages/editor-page/...`.
- Frontend non-UI schema-sync helpers should move into `frontend/src/lib/`.
- Shared canonical schema contracts and diff logic must remain in `packages/schema-sync-core/`.
- Backend connection management, introspection, preview, apply, and audit services must remain in `backend/`.

## Repository Constraint

This refactor removes `frontend/src/features/schema-sync` completely. The repository still contains other unrelated `frontend/src/features/*` modules (`admin`, `auth`, `dashboard`, `persistence`) that are outside the schema-sync implementation itself. Removing the schema-sync subtree is in scope for this task; removing the remaining unrelated feature folders would require a broader repository-wide frontend cleanup.
