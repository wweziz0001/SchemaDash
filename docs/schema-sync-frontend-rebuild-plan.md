# Schema Sync Frontend Rebuild Plan

## Goal

Rebuild the schema-sync frontend implementation so it follows SchemaDash's native responsibility-based structure instead of a feature-first subtree. The refactor must preserve runtime behavior while removing `frontend/src/features/schema-sync` completely.

## File-by-File Classification

| Old path | Proposed new path | Classification | Why old location is wrong | Why new location is correct | Reuse / notes |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/features/schema-sync/api/schema-sync-client.ts` | `frontend/src/lib/api/schema-sync-client.ts` | Move | HTTP transport is not feature-owned UI state. | `frontend/src/lib/api/` already owns frontend request helpers and API clients. | Keep reusing `requestJson` from `frontend/src/lib/api/request.ts`. |
| `frontend/src/features/schema-sync/components/schema-sync-toolbar-button.tsx` | `frontend/src/pages/editor-page/top-navbar/workflow/schema-sync-toolbar-button.tsx` | Move | This button is editor chrome, not a reusable global feature component. | The native editor-page structure owns top-navbar action integration. | Rebuild it to use `useDialog()` instead of a schema-sync-only provider. |
| `frontend/src/features/schema-sync/context/schema-sync-context-object.ts` | Merged into `frontend/src/context/dialog-context/dialog-context.tsx`, `frontend/src/context/dialog-context/dialog-provider.tsx`, and `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx` | Merge | The context contract exists only to support one global dialog flow and one launch button. | SchemaDash already uses a native global dialog context/provider pattern for editor actions. | Remove the feature-local context object entirely. |
| `frontend/src/features/schema-sync/context/schema-sync-context.tsx` | Split across `frontend/src/context/dialog-context/dialog-context.tsx`, `frontend/src/context/dialog-context/dialog-provider.tsx`, `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx`, and `frontend/src/lib/api/schema-sync-client.ts` | Generalize | The provider mixes dialog open state, toast side effects, API calls, workflow integration, and diagram metadata updates. | Native structure separates dialog entrypoints from transport helpers and avoids wrapping the editor in a feature-only provider. | Keep diagram/workflow compatibility logic stable while relocating it into the dialog flow. |
| `frontend/src/features/schema-sync/dialogs/schema-sync-dialog.tsx` | `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx` | Move | This is a global action dialog entrypoint, not a feature-bucket component. | `frontend/src/dialogs/` is the native home for create/open/save/import/export/editor dialogs. | Use native dialog props from the dialog context provider. |
| `frontend/src/features/schema-sync/hooks/use-schema-sync.ts` | Removed | Remove | This hook only exposes the feature-local provider and perpetuates the wrong methodology. | The native dialog system already exposes open/close behavior through `useDialog()`. | Delete after rewiring the toolbar button and dialog. |
| `frontend/src/features/schema-sync/lib/canonical-adapters.ts` | `frontend/src/lib/schema-sync/canonical-adapters.ts` | Move | Canonical conversion is non-UI frontend logic already reused outside schema-sync. | `frontend/src/lib/` is the native home for shared adapters, helpers, and frontend domain logic. | Keep logic stable because workflow compare/version/migration code depends on it. |
| `frontend/src/features/schema-sync/lib/__tests__/canonical-adapters.test.ts` | `frontend/src/lib/schema-sync/canonical-adapters.test.ts` | Move | The test should live with the native helper, not inside a dead feature subtree. | Native lib adjacency keeps test ownership clear. | Update imports only. |

## Existing Native Modules to Reuse

- `frontend/src/context/dialog-context/dialog-context.tsx`
- `frontend/src/context/dialog-context/dialog-provider.tsx`
- `frontend/src/hooks/use-dialog.ts`
- `frontend/src/lib/api/request.ts`
- `frontend/src/lib/api/diagram-workflow-client.ts`
- `frontend/src/components/dialog/dialog.tsx`
- `frontend/src/components/tabs/tabs.tsx`
- `frontend/src/components/scroll-area/scroll-area.tsx`
- `frontend/src/components/metric-card/metric-card.tsx`
- `frontend/src/components/toast/use-toast.ts`
- `frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.tsx`

## Risky Integration Points

- `frontend/src/pages/editor-page/editor-page.tsx`
  - Remove the schema-sync provider with minimal editor composition change.
- `frontend/src/context/dialog-context/dialog-context.tsx`
  - Add schema-sync dialog hooks without destabilizing existing dialog APIs.
- `frontend/src/context/dialog-context/dialog-provider.tsx`
  - Mount the new schema-sync dialog using the same native pattern as other global dialogs.
- `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
  - Update canonical-adapter imports only.
- `frontend/src/dialogs/create-version-dialog/create-version-dialog.tsx`
  - Update canonical-adapter imports only.
- `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.tsx`
  - Update canonical-adapter imports only.
- `frontend/src/dialogs/migration-dialog/migration-dialog.tsx`
  - Update canonical-adapter imports and generalize plan-summary reuse without changing migration behavior.
- `frontend/src/context/storage-context/storage-provider.tsx`
  - Avoid touching this high-risk storage layer.
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
  - Avoid touching this high-risk editor-state layer.

## Special Handling

- `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
  - Must be decomposed carefully because it currently combines true non-UI operations with dialog-only state.
- `frontend/src/features/schema-sync/dialogs/schema-sync-dialog.tsx`
  - Needs a controlled rebuild so the UI remains stable while the provider dependency disappears.
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
  - Must stay conceptually close to the backend/shared canonical schema boundary even after moving into the native frontend lib.

## Frontend / Shared / Backend Boundary Handling

- Frontend-only presentation stays in `frontend/src/dialogs/` and `frontend/src/pages/editor-page/...`.
- Frontend-only transport and conversion logic moves into `frontend/src/lib/`.
- Shared canonical schema types, diffing, hashing, and SQL planning remain in `packages/schema-sync-core/`.
- Backend routes and services for connections, live introspection, diff, apply, and audit stay in `backend/`.
- No dialog or presentation concerns should leak into `packages/schema-sync-core/` or backend services.

## Implementation Order

1. Land the audit and rebuild-plan docs.
2. Move and generalize schema-sync UI and dialog entrypoints into native folders.
3. Move schema-sync helpers, canonical adapters, and API client into native lib folders.
4. Rewire editor integrations and dialog context to use native patterns.
5. Delete `frontend/src/features/schema-sync` and remove all imports that reference it.
6. Validate build plus targeted schema-sync/workflow tests and update the persistent handoff doc.

## Acceptance Notes

- `frontend/src/features/schema-sync` must be removed completely.
- No compatibility stubs should remain under `frontend/src/features/schema-sync`.
- Canonical adapter imports should come from native `frontend/src/lib/schema-sync/*` paths after the refactor.
- The schema-sync launch button should use the native dialog system instead of a dedicated feature provider.
