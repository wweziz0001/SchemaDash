# Codex Handoff

## 1. Project Overview

SchemaDash is a full-stack database schema design and review product.

- `frontend/` is a Vite + React + Tailwind app for the dashboard/library, editor, sharing, collaboration, import/export, templates/examples, and admin surfaces.
- `backend/` is a Fastify API that owns auth, durable persistence, sharing, collaboration sessions/presence, schema-sync operations, and admin/health endpoints.
- `packages/schema-sync-core/` is the shared canonical schema engine used by both frontend and backend for diffing, change plans, hashes, and SQL planning.

Relevant product context for this task:

- Frontend persistence is not a standalone feature island. It is a cross-cutting boundary spanning `storage-context`, open/save/share dialogs, shared-viewer pages, request helpers, and persistence-specific browser helpers.
- Durable storage uses backend persistence routes/services, while the browser still keeps a Dexie cache in `frontend/src/context/storage-context/storage-provider.tsx`.
- Sharing depends on persistence state, share-token propagation, and shared-viewer routes. Collaboration/session state also depends on persistence DTOs and storage-context orchestration.

Important current state:

- `frontend/src/features/persistence` does not exist.
- `frontend/src/features` does not exist.
- Persistence support code is now split across native `frontend/src/lib/`, `frontend/src/dialogs/`, `frontend/src/context/`, and `frontend/src/pages/` boundaries.

## 2. Current Architectural Context

Read these first for future work in this area:

1. `docs/persistence-frontend-rebuild-plan.md`
2. `docs/audits/persistence-frontend-methodology-drift.md`
3. `docs/CODEBASE_STRUCTURE.md`
4. `docs/FEATURE_INDEX.md`
5. `docs/architecture/backend-persistence-foundation.md`
6. `docs/codex-handoff.md`

Important frontend modules for this task:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/storage-context/storage-context.tsx`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
- `frontend/src/dialogs/open-diagram-dialog/sharing-settings-dialog.tsx`
- `frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.ts`
- `frontend/src/dialogs/save-diagram-dialog/save-diagram-dialog.tsx`
- `frontend/src/pages/editor-page/top-navbar/current-diagram-share-button.tsx`
- `frontend/src/pages/shared-project-page/shared-diagram-loader.tsx`
- `frontend/src/pages/shared-project-page/shared-project-page.tsx`
- `frontend/src/lib/api/persistence-client.ts`
- `frontend/src/lib/persistence/persistence-types.ts`
- `frontend/src/lib/persistence/diagram-serialization.ts`
- `frontend/src/lib/persistence/share-token.ts`
- `frontend/src/lib/persistence/collaboration-client-id.ts`

High-risk files:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
- `frontend/src/pages/editor-page/top-navbar/current-diagram-share-button.tsx`
- `frontend/src/pages/shared-project-page/shared-diagram-loader.tsx`

Important service/module boundaries:

- `frontend/src/context/storage-context/*` remains the single frontend persistence orchestration layer.
- `frontend/src/lib/api/persistence-client.ts` now owns only HTTP transport.
- `frontend/src/lib/persistence/*` now owns persistence DTOs, diagram serialization helpers, share-token helpers, and collaboration client-id helpers.
- `frontend/src/dialogs/open-diagram-dialog/*` owns the sharing dialog entrypoint and its dialog-specific storage adapter.
- `backend/src/services/persistence-service.ts` and `backend/src/repositories/app-repository.ts` remain authoritative backend persistence boundaries and were intentionally not refactored here.

Relevant frontend/backend relationship:

- Frontend request helpers call backend persistence routes under `backend/src/routes/persistence-routes.ts`.
- The storage provider translates backend DTOs into frontend saved-model state and Dexie cache rows.
- Shared project/diagram routes use the same persistence client and diagram serialization helpers as the editor/persistence flows.

## 3. Task Completed

Task objective:

- Correct the persistence frontend methodology drift.
- Remove any remaining persistence feature-island patterns.
- Keep persistence, sharing, cache, and open/save flows aligned with native SchemaDash structure.

What was implemented:

- Added a dedicated audit doc:
    - `docs/audits/persistence-frontend-methodology-drift.md`
- Added the required rebuild plan:
    - `docs/persistence-frontend-rebuild-plan.md`
- Moved the old root sharing hook into the dialog boundary:
    - `frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.ts`
- Removed the old root hook path:
    - `frontend/src/hooks/use-sharing-dialog-api.ts`
- Split persistence support code by responsibility:
    - `frontend/src/lib/api/persistence-client.ts` stays as the REST client
    - `frontend/src/lib/persistence/persistence-types.ts` now owns DTO/model types
    - `frontend/src/lib/persistence/diagram-serialization.ts` now owns diagram serialize/deserialize helpers
- Updated native consumers to use those new boundaries:
    - `storage-context`
    - `schemadash-context`
    - workflow/version helpers
    - shared-project/shared-diagram pages
    - auth client/context typing
    - create-version dialog
    - sharing dialog and share button
- Removed redundant identity deserializer usage from `storage-provider`.
- Updated architecture/index docs so they no longer describe persistence as living under `frontend/src/features/persistence` or `frontend/src/features`.

Approach intentionally avoided:

- No backend persistence redesign.
- No rewrite of storage-provider save/open/session logic.
- No new parallel persistence/state layer.
- No compatibility stubs under `frontend/src/features`.
- No broad unrelated frontend redesign.

## 4. Files Changed

Files created:

- `docs/audits/persistence-frontend-methodology-drift.md`
- `docs/persistence-frontend-rebuild-plan.md`
- `frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.ts`
- `frontend/src/lib/persistence/persistence-types.ts`
- `frontend/src/lib/persistence/diagram-serialization.ts`
- `frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.test.tsx`
- `frontend/src/lib/persistence/diagram-serialization.test.ts`

Files modified:

- `docs/CODEBASE_STRUCTURE.md`
- `docs/FEATURE_INDEX.md`
- `docs/architecture/backend-persistence-foundation.md`
- `docs/diagram-workflow-frontend-audit.md`
- `docs/diagram-workflow-frontend-rebuild-plan.md`
- `docs/codex-handoff.md`
- `frontend/src/context/auth-context/auth-context.ts`
- `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `frontend/src/context/storage-context/storage-context.tsx`
- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/dialogs/create-version-dialog/create-version-dialog.tsx`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
- `frontend/src/dialogs/open-diagram-dialog/sharing-settings-dialog.tsx`
- `frontend/src/lib/api/auth-client.ts`
- `frontend/src/lib/api/diagram-workflow-client.ts`
- `frontend/src/lib/api/persistence-client.ts`
- `frontend/src/lib/diagram-workflow/version-canonical.ts`
- `frontend/src/pages/editor-page/top-navbar/current-diagram-share-button.tsx`
- `frontend/src/pages/shared-project-page/shared-diagram-loader.tsx`
- `frontend/src/pages/shared-project-page/shared-project-page.tsx`

Files intentionally removed:

- `frontend/src/hooks/use-sharing-dialog-api.ts`

Important files intentionally not changed:

- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `frontend/src/dialogs/save-diagram-dialog/save-diagram-dialog.tsx`
- `frontend/vite.config.ts`

Notes on intentionally avoided edits:

- Backend persistence contracts were kept stable.
- `frontend/src/dialogs/save-diagram-dialog/save-diagram-dialog.tsx` was left alone because it already sits in the right native boundary and did not need structural correction.
- `frontend/vite.config.ts` had an unrelated local modification in the working tree before this task and was intentionally left out of the commit set.

## 5. Data / API / Workflow Changes

Behavioral/API changes:

- No backend routes, payload shapes, env vars, or database schemas changed.
- `frontend/src/lib/api/persistence-client.ts` still exposes the same persistence transport behavior, but it no longer owns the DTO/model type definitions or diagram serialization helpers.
- Sharing dialog API wiring moved from a global root hook into a dialog-local native module.
- Shared-viewer pages and workflow/version code now import diagram serialization helpers from `frontend/src/lib/persistence/diagram-serialization.ts`.

Workflow/storage behavior preserved:

- Dexie cache behavior remains in `frontend/src/context/storage-context/storage-provider.tsx`.
- Save/open/update/delete/project/collection flows still go through `storage-context`.
- Share-token request behavior remains in `frontend/src/lib/api/request.ts` and `frontend/src/lib/persistence/share-token.ts`.
- Collaboration/session behavior remains anchored in `storage-context` and `schemadash-context`.

Compatibility handling:

- This task removed old frontend feature-boundary references from major architecture docs.
- The runtime code no longer relies on any `frontend/src/features/*` path.

## 6. Validation Performed

Validation completed:

- `npx tsc -p tsconfig.json --noEmit`
- `npx vitest run --config frontend/vitest.config.ts frontend/src/lib/persistence/diagram-serialization.test.ts frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.test.tsx frontend/src/dialogs/review-changes-dialog/review-changes-dialog.test.tsx frontend/src/dialogs/restore-version-dialog/restore-version-dialog.test.tsx frontend/src/pages/dashboard-page/dashboard-shell-layout.test.tsx frontend/src/pages/admin-page/admin-page.test.tsx`
- `npm run build:web`

What was verified:

- TypeScript imports and module splits compile cleanly.
- Extracted diagram serialization round-trips correctly.
- Relocated sharing-dialog adapter still routes through the storage boundary correctly.
- Existing dashboard/admin/review/restore tests still pass after the persistence path updates.
- Frontend production build completes successfully.

Still unverified manually:

- Browser-level open diagram flow
- Save/update/delete flow in the UI
- Collection/project/diagram interactions against a running backend
- Shared project/diagram viewer flow in a browser session
- Session-aware editor persistence flows against a live backend

Known limitations / risks:

- `frontend/src/context/storage-context/storage-provider.tsx` remains large and high-risk. This task only corrected its surrounding support boundaries, not its internal size/complexity.
- Manual QA against a running backend is still recommended for share/open/save scenarios.

## 7. Outstanding Work

Not done yet:

- No new end-to-end browser tests were added for open/save/share flows.
- No internal decomposition of `frontend/src/context/storage-context/storage-provider.tsx` was attempted beyond safe import/helper corrections.
- Some older docs outside the persistence scope may still reference former feature-folder paths unrelated to this task.

Recommended next step:

1. Manually QA open/save/delete/share flows against a running backend and persisted data set.
2. If more persistence cleanup is needed, extract small pure helper modules from `storage-provider` without changing behavior.
3. If future work touches sharing/collaboration security, review `frontend/src/lib/persistence/share-token.ts`, `frontend/src/lib/api/request.ts`, and `backend/src/utils/request-share-token.ts` together.

Blockers/risks for future work:

- `storage-provider` is still the most sensitive file in the persistence frontend.
- Shared-viewer and collaboration flows are easy to regress because they depend on both persistence DTOs and share-token behavior.

## 8. Instructions for the Next Codex Session

Read in this order:

1. `docs/codex-handoff.md`
2. `docs/persistence-frontend-rebuild-plan.md`
3. `docs/audits/persistence-frontend-methodology-drift.md`
4. `docs/CODEBASE_STRUCTURE.md`
5. `frontend/src/context/storage-context/storage-provider.tsx`
6. `frontend/src/lib/api/persistence-client.ts`
7. `frontend/src/lib/persistence/persistence-types.ts`
8. `frontend/src/lib/persistence/diagram-serialization.ts`
9. `frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.ts`
10. `frontend/src/dialogs/open-diagram-dialog/sharing-settings-dialog.tsx`

Avoid breaking:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `frontend/src/lib/api/request.ts`
- `frontend/src/lib/persistence/share-token.ts`
- `frontend/src/pages/shared-project-page/shared-diagram-loader.tsx`

Continue implementation here if more persistence work is needed:

- Start at `frontend/src/context/storage-context/storage-provider.tsx` and only extract code that can be proven pure and behavior-preserving.
- Keep share/open/save behavior anchored in existing native context/dialog/page/lib boundaries.

## 9. Git Summary

Working branch:

- `restructe/03-persistence-to-native-structure`

Pull request title:

- `Rebuild persistence frontend code using native SchemaDash structure`

Commit list created for this task:

1. `chore: audit persistence frontend methodology drift`
   Added the persistence methodology audit documenting the old feature subtree, the responsibility drift, and the corrective direction.
2. `docs: add persistence frontend rebuild plan`
   Added the required file-by-file rebuild plan with old-to-new mappings, classifications, reuse notes, and risk handling.
3. `refactor: move reusable persistence ui and dialogs into native folders`
   Relocated the sharing-dialog adapter into `dialogs/open-diagram-dialog`, updated dialog consumers, and removed the old root hook path.
4. `refactor: move persistence helpers sharing helpers and clients into native lib/context structure`
   Split persistence DTOs and diagram serialization into native `frontend/src/lib/persistence/` modules and updated native consumers/imports.
5. `refactor: remove persistence feature subtree and update imports`
   Updated architecture/index docs so they no longer describe persistence as living under `frontend/src/features/persistence` or `frontend/src/features`.
6. `test: validate persistence-related frontend flows after structure correction`
   Added focused tests for the extracted persistence modules, updated this handoff, and captured the validation phase for the refactor.
