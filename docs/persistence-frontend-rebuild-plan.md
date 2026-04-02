# Persistence Frontend Rebuild Plan

## Goal

Rebuild the persistence-related frontend support code so it follows SchemaDash's native responsibility-based structure instead of the old `frontend/src/features/persistence` feature boundary.

This plan is intentionally conservative about runtime behavior. Persistence, sharing, local cache, save/open flows, and session-aware editor synchronization must continue to work through the existing `storage-context` orchestration instead of a new parallel layer.

## Historical File Classification

The old `frontend/src/features/persistence/` subtree contained four files. Each one is classified below using the required move / merge / generalize / remove decision model.

| Old path                                                            | Proposed new path                                                                                                                                          | Classification     | Why the old location was structurally wrong                                                                                                                                                                 | Why the new location is correct                                                                                                                                                                                                                       | Existing native modules to reuse                                                                                                                                                                                          |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/features/persistence/api/persistence-client.ts`       | `frontend/src/lib/api/persistence-client.ts`, `frontend/src/lib/persistence/persistence-types.ts`, `frontend/src/lib/persistence/diagram-serialization.ts` | Generalize + merge | It bundled API transport, DTOs, sharing/collaboration models, and diagram serialization inside a feature folder, which treated cross-cutting persistence infrastructure as feature-local UI ownership.      | `frontend/src/lib/api/` is the native home for transport clients, while `frontend/src/lib/persistence/` is the right home for persistence-specific models and browser-side serialization helpers.                                                     | Reuse `frontend/src/lib/api/request.ts`, `frontend/src/context/storage-context/storage-provider.tsx`, `frontend/src/pages/shared-project-page/*`, `frontend/src/dialogs/create-version-dialog/create-version-dialog.tsx`. |
| `frontend/src/features/persistence/collaboration-client-id.ts`      | `frontend/src/lib/persistence/collaboration-client-id.ts`                                                                                                  | Move               | Runtime client-id generation is browser persistence infrastructure, not a feature-owned component or hook.                                                                                                  | `frontend/src/lib/persistence/` is the native non-UI home for collaboration/persistence browser helpers.                                                                                                                                              | Reuse from `frontend/src/context/storage-context/storage-provider.tsx`.                                                                                                                                                   |
| `frontend/src/features/persistence/hooks/use-sharing-dialog-api.ts` | `frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.ts`                                                                              | Generalize         | The hook is not a cross-app primitive. It exists to adapt `storage-context` methods for the sharing dialog entrypoint. Leaving it in root `hooks/` makes it look globally reusable when it is dialog-bound. | `frontend/src/dialogs/` is the native home for dialog entrypoints and their local integration helpers. Co-locating the adapter with `SharingSettingsDialog` makes the ownership explicit while still allowing reuse from `CurrentDiagramShareButton`. | Reuse `frontend/src/context/storage-context/storage-context.tsx`, `frontend/src/dialogs/open-diagram-dialog/sharing-settings-dialog.tsx`, `frontend/src/pages/editor-page/top-navbar/current-diagram-share-button.tsx`.   |
| `frontend/src/features/persistence/share-token.ts`                  | `frontend/src/lib/persistence/share-token.ts`                                                                                                              | Move               | Share-token parsing/storage is browser runtime support for request/auth flows, not feature-owned UI code.                                                                                                   | `frontend/src/lib/persistence/` is the correct home for cross-cutting persistence/sharing runtime helpers used by request and editor collaboration layers.                                                                                            | Reuse from `frontend/src/lib/api/request.ts` and `frontend/src/context/schemadash-context/schemadash-provider.tsx`.                                                                                                       |

## Logic To Merge Into Existing Native Boundaries

### Storage boundary

The following logic should remain centered on `frontend/src/context/storage-context/` rather than being abstracted into a second client-side persistence layer:

- collection/project/diagram list and mutation flows
- diagram save and save-as behavior
- sharing mutations that also need cached list refreshes
- local Dexie cache hydration and remote bootstrap
- diagram session activation, heartbeat, presence, and delayed sync

### Dialog boundary

The following logic belongs near dialog entrypoints instead of in global hooks or feature folders:

- sharing dialog subject typing
- dialog-specific storage adapters for project/diagram sharing actions
- any local prop contracts that exist only to support `SharingSettingsDialog`

### Lib boundary

The following logic belongs in `frontend/src/lib/persistence/` instead of the transport client:

- persistence DTO types
- sharing and collaboration response models
- diagram serialization and deserialization helpers
- runtime share-token and collaboration client-id helpers

## Files That Should Be Removed As Redundant

- `frontend/src/hooks/use-sharing-dialog-api.ts`
    - Redundant once the dialog-specific adapter lives beside the dialog entrypoint.
- identity-style summary deserializers inside the old persistence client
    - They add indirection without transforming data and can be removed safely while keeping date conversion in `storage-provider`.

## Existing Native Modules / Providers / Dialogs To Reuse

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/storage-context/storage-context.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
- `frontend/src/dialogs/open-diagram-dialog/sharing-settings-dialog.tsx`
- `frontend/src/pages/editor-page/top-navbar/current-diagram-share-button.tsx`
- `frontend/src/pages/shared-project-page/shared-diagram-loader.tsx`
- `frontend/src/lib/api/request.ts`

## Risky Integration Points

- `frontend/src/context/storage-context/storage-provider.tsx`
    - High risk because it coordinates Dexie cache, remote bootstrap, save/open flows, sharing refresh, and session lifecycle.
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
    - High risk because it consumes share tokens during collaboration/event-stream behavior.
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
    - High risk because it combines project/diagram browsing, actions, and sharing entrypoints.
- `frontend/src/pages/editor-page/top-navbar/current-diagram-share-button.tsx`
    - High risk because it is the editor-facing sharing entrypoint and must keep owner/local-only gating intact.
- `frontend/src/pages/shared-project-page/shared-diagram-loader.tsx`
    - High risk because shared-viewer loading depends on persistence DTO and diagram deserialization behavior.

## Files Requiring Special Handling

- `frontend/src/lib/api/persistence-client.ts`
    - Needs special handling because it currently carries several responsibilities. The correction should split helpers without changing route contracts.
- `frontend/src/dialogs/open-diagram-dialog/sharing-settings-dialog.tsx`
    - Needs special handling because it has a large prop contract that should reuse shared dialog-subject/API types instead of duplicating them inline.
- `frontend/src/context/storage-context/storage-provider.tsx`
    - Needs special handling because import cleanup must not disturb cache invalidation or session tracking behavior.

## Implementation Order

1. Land the audit document and this rebuild plan.
2. Move the sharing dialog adapter into `frontend/src/dialogs/open-diagram-dialog/` and update dialog consumers.
3. Split persistence DTO/serialization concerns into `frontend/src/lib/persistence/` while keeping the transport client in `frontend/src/lib/api/`.
4. Update consuming imports in storage context, shared pages, workflow/version dialogs, and auth types.
5. Remove stale docs references to `frontend/src/features/persistence` and ensure `frontend/src/features` is not documented as a live runtime structure.
6. Add targeted tests for the extracted persistence helpers and run frontend validation.

## Acceptance Notes

- `frontend/src/features/persistence` must remain absent.
- `frontend/src/features` must remain absent.
- No compatibility stubs should be recreated under `frontend/src/features`.
- The result must continue to use `storage-context` as the single frontend persistence orchestration layer.
