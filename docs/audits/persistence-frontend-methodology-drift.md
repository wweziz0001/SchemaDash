# Persistence Frontend Methodology Drift Audit

## Scope

This audit covers the persistence-oriented frontend files that historically lived under `frontend/src/features/persistence/` and the native modules that now carry that behavior on branch `restructe/03-persistence-to-native-structure`.

The old subtree no longer exists in the working tree, so this audit reconstructs the persistence feature boundary from git history and validates how that code fits into SchemaDash's native frontend structure today.

## Historical Persistence Subtree

Files that existed under `frontend/src/features/persistence/` before the earlier broad relocation:

1. `frontend/src/features/persistence/api/persistence-client.ts`
2. `frontend/src/features/persistence/collaboration-client-id.ts`
3. `frontend/src/features/persistence/hooks/use-sharing-dialog-api.ts`
4. `frontend/src/features/persistence/share-token.ts`

## Findings

### 1. The old feature boundary mixed transport, serialization, token helpers, and dialog glue

- `api/persistence-client.ts` combined REST transport, persistence DTO types, and diagram serialization helpers in one module.
- `share-token.ts` and `collaboration-client-id.ts` were browser/runtime helpers, not feature-owned UI code.
- `hooks/use-sharing-dialog-api.ts` was a thin adapter around `storage-context`, but it was effectively owned by the sharing dialog surface rather than the whole app.

Why this drift matters:

- It encoded persistence as an isolated frontend feature instead of a cross-cutting system boundary shared by storage context, shared pages, and dialog entrypoints.
- It duplicated responsibility inside one oversized client module instead of following SchemaDash's native `lib/api` plus `lib/persistence` split.
- It placed a dialog-specific adapter in the root hooks folder, which made it look global and reusable when it was really tied to the sharing dialog entrypoint.

### 2. The previous removal of `frontend/src/features/persistence` was necessary but incomplete methodologically

At the start of this task, the current branch had already removed `frontend/src/features/persistence`, which was the correct direction, but the resulting structure still carried some feature-island residue:

- `frontend/src/lib/api/persistence-client.ts` is still overloaded with persistence DTO definitions and diagram serialization helpers.
- `frontend/src/hooks/use-sharing-dialog-api.ts` still lives in a global hook location even though it exists only to feed `SharingSettingsDialog`.
- Docs still describe persistence and sharing as if they lived inside `frontend/src/features/persistence`.

### 3. Native reuse opportunities already exist and should be honored

Persistence should continue to center on existing native boundaries:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/storage-context/storage-context.tsx`
- `frontend/src/dialogs/open-diagram-dialog/sharing-settings-dialog.tsx`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
- `frontend/src/pages/editor-page/top-navbar/current-diagram-share-button.tsx`
- `frontend/src/pages/shared-project-page/*`
- `frontend/src/lib/api/request.ts`

These are already the right high-level boundaries. The corrective work is to align supporting helpers with them, not to introduce a new persistence subsystem.

## Corrective Direction

### Keep in `frontend/src/lib/api/`

- The persistence REST client entrypoint itself belongs in `frontend/src/lib/api/persistence-client.ts`.

### Move into `frontend/src/lib/persistence/`

- Persistence DTO and sharing/collaboration model types.
- Diagram serialization and deserialization helpers.
- Existing token/client-id runtime helpers.

### Move into `frontend/src/dialogs/`

- The sharing-dialog storage adapter hook should live beside the sharing dialog entrypoint, because that is its real responsibility boundary.

### Keep risky provider/page changes minimal

High-risk files should only receive narrow import and composition updates unless a strictly local extraction is clearly safe:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
- `frontend/src/pages/editor-page/top-navbar/current-diagram-share-button.tsx`
- `frontend/src/pages/shared-project-page/shared-diagram-loader.tsx`

## Operational Guardrails

- Preserve Dexie cache behavior in `storage-provider`.
- Preserve backend contract usage in `backend/src/routes/persistence-routes.ts` and `backend/src/services/persistence-service.ts`.
- Preserve sharing token flow and session-aware collaboration behavior.
- Avoid introducing a second persistence orchestration layer outside `storage-context`.

## Audit Summary

The main remaining problem is not a missing folder move. It is that persistence support code still partially reflects feature ownership instead of responsibility ownership.

The safe fix is:

1. Split the overloaded persistence client by responsibility.
2. Relocate the sharing-dialog adapter next to the dialog boundary.
3. Update docs so the native structure is accurately documented.
4. Keep provider/page/storage behavior stable while imports and helper boundaries are corrected.
