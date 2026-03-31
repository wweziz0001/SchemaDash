# Codex Handoff

## 1. Project Overview

SchemaDash is a full-stack database schema design and review product.

- The frontend is a Vite + React + Tailwind application for diagram authoring, library management, sharing, collaboration, live database review, versioning, and migration workflows.
- The backend is a Fastify API that owns auth, persistence, collaboration state, live database connectivity, migration/apply orchestration, and audit history.
- `packages/schema-sync-core/` is the shared canonical schema engine used by both frontend and backend for canonical types, diffing, compare output, hashing, warnings, and SQL planning.

Relevant product context for this task:

- `Development` is the mutable editor head.
- `Live Database` is a read-only synced snapshot.
- `Compare` is a read-only derived view between Live and Development.
- `Schema Sync` manages saved connections, live import/bind, diff preview, and apply/migration safety.
- Native frontend structure now matters more than feature ownership:
  - `frontend/src/components/`
  - `frontend/src/context/`
  - `frontend/src/dialogs/`
  - `frontend/src/pages/`
  - `frontend/src/lib/`

Important state after this task:

- `frontend/src/features/schema-sync` is gone.
- `frontend/src/features` is gone.
- Former `auth`, `admin`, `dashboard`, and `persistence` frontend files were also relocated so the parent `features` folder could be removed completely.

## 2. Current Architectural Context

Read these first for work in this area:

1. `docs/schema-sync-frontend-audit.md`
2. `docs/schema-sync-frontend-rebuild-plan.md`
3. `docs/architecture/schema-sync-architecture.md`
4. `docs/live-database-development-compare-versions-design.md`
5. `docs/diagram-workflow-frontend-rebuild-plan.md`
6. `docs/codex-handoff.md`

Important frontend modules after the refactor:

- Schema sync dialog and editor entry:
  - `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx`
  - `frontend/src/pages/editor-page/top-navbar/workflow/schema-sync-toolbar-button.tsx`
  - `frontend/src/context/dialog-context/dialog-context.tsx`
  - `frontend/src/context/dialog-context/dialog-provider.tsx`
- Canonical/frontend schema-sync helpers:
  - `frontend/src/lib/schema-sync/canonical-adapters.ts`
  - `frontend/src/lib/schema-sync/canonical-adapters.test.ts`
  - `frontend/src/lib/api/schema-sync-client.ts`
- Workflow integrations that depend on those adapters:
  - `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
  - `frontend/src/lib/diagram-workflow/compare-render-model.ts`
  - `frontend/src/lib/diagram-workflow/review-grouping.ts`
  - `frontend/src/lib/diagram-workflow/version-canonical.ts`
  - `frontend/src/dialogs/migration-dialog/migration-dialog.tsx`
  - `frontend/src/dialogs/create-version-dialog/create-version-dialog.tsx`
  - `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.tsx`
- Other former `features/` code now lives here:
  - `frontend/src/context/auth-context/*`
  - `frontend/src/hooks/use-auth.ts`
  - `frontend/src/lib/api/auth-client.ts`
  - `frontend/src/lib/api/admin-client.ts`
  - `frontend/src/lib/api/persistence-client.ts`
  - `frontend/src/lib/persistence/*`
  - `frontend/src/pages/dashboard-page/use-library-catalog.ts`
  - `frontend/src/pages/admin-page/admin-route-guard.tsx`
  - `frontend/src/pages/bootstrap-page/bootstrap-page.tsx`
  - `frontend/src/pages/sign-in-page/sign-in-page.tsx`

Important boundaries:

- Frontend presentation and dialog state stay in `frontend/src/dialogs/` and `frontend/src/pages/...`.
- Frontend non-UI transport/helpers stay in `frontend/src/lib/`.
- Shared canonical logic stays in `packages/schema-sync-core/`.
- Backend routes/services remain authoritative for live DB access, preview, apply, restore, and persistence.

High-risk files touched minimally:

- `frontend/src/context/storage-context/storage-provider.tsx`
  - Import-path updates only.
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
  - Import-path updates only.
- `frontend/src/pages/editor-page/editor-page.tsx`
  - Removed schema-sync provider wrapper and kept editor composition otherwise stable.
- `frontend/src/context/dialog-context/dialog-provider.tsx`
  - Added schema-sync dialog registration using the existing native dialog pattern.
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
  - Moved only; logic intentionally kept stable.

## 3. Task Completed

Task objective:

- Rebuild the schema-sync frontend into SchemaDash’s native structure.
- Remove `frontend/src/features/schema-sync`.
- Reclassify files by responsibility instead of feature ownership.
- Reuse native dialog/context/lib patterns.
- Preserve frontend/backend/shared-package boundaries.

What was implemented:

- Added audit and plan docs:
  - `docs/schema-sync-frontend-audit.md`
  - `docs/schema-sync-frontend-rebuild-plan.md`
- Moved schema-sync dialog into native dialogs:
  - `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx`
- Moved schema-sync editor launch button into native editor-page chrome:
  - `frontend/src/pages/editor-page/top-navbar/workflow/schema-sync-toolbar-button.tsx`
- Rebuilt schema-sync open/close behavior to use the native dialog context instead of a dedicated editor wrapper/provider.
- Moved schema-sync transport and canonical helpers into native lib locations:
  - `frontend/src/lib/api/schema-sync-client.ts`
  - `frontend/src/lib/schema-sync/canonical-adapters.ts`
- Generalized the old migration-only summary widget into:
  - `frontend/src/components/change-plan-summary/change-plan-summary.tsx`
- Updated workflow/version/migration code to import canonical adapters from native `frontend/src/lib/schema-sync/*`.
- Deleted the old schema-sync context and hook files instead of preserving compatibility wrappers.
- Removed the rest of `frontend/src/features` by relocating the remaining auth/admin/dashboard/persistence frontend files into native `context`, `hooks`, `lib`, and `pages` locations.

Approach intentionally avoided:

- No backend redesign.
- No shared-package redesign.
- No business-logic rewrite of canonical diff/apply behavior.
- No pushing frontend concerns into `packages/schema-sync-core`.

## 4. Files Changed

Files created or introduced at new native paths:

- `docs/schema-sync-frontend-audit.md`
- `docs/schema-sync-frontend-rebuild-plan.md`
- `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx`
- `frontend/src/pages/editor-page/top-navbar/workflow/schema-sync-toolbar-button.tsx`
- `frontend/src/lib/api/schema-sync-client.ts`
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
- `frontend/src/lib/schema-sync/canonical-adapters.test.ts`
- `frontend/src/components/change-plan-summary/change-plan-summary.tsx`
- `frontend/src/context/auth-context/auth-context.ts`
- `frontend/src/context/auth-context/auth-provider.tsx`
- `frontend/src/hooks/use-auth.ts`
- `frontend/src/hooks/use-sharing-dialog-api.ts`
- `frontend/src/lib/api/admin-client.ts`
- `frontend/src/lib/api/auth-client.ts`
- `frontend/src/lib/api/persistence-client.ts`
- `frontend/src/lib/persistence/collaboration-client-id.ts`
- `frontend/src/lib/persistence/share-token.ts`
- `frontend/src/pages/admin-page/admin-route-guard.tsx`
- `frontend/src/pages/bootstrap-page/bootstrap-page.tsx`
- `frontend/src/pages/dashboard-page/use-library-catalog.ts`
- `frontend/src/pages/sign-in-page/sign-in-page.tsx`

Important modified files:

- `frontend/src/context/dialog-context/dialog-context.tsx`
- `frontend/src/context/dialog-context/dialog-provider.tsx`
- `frontend/src/pages/editor-page/editor-page.tsx`
- `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
- `frontend/src/dialogs/migration-dialog/migration-dialog.tsx`
- `frontend/src/dialogs/create-version-dialog/create-version-dialog.tsx`
- `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.tsx`
- `frontend/src/lib/diagram-workflow/compare-render-model.ts`
- `frontend/src/lib/diagram-workflow/review-grouping.ts`
- `frontend/src/lib/diagram-workflow/version-canonical.ts`
- `frontend/src/app.tsx`
- `frontend/src/router.tsx`
- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/storage-context/storage-context.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `frontend/src/pages/admin-page/admin-page.tsx`
- `frontend/src/pages/dashboard-page/*.tsx` consumers of `use-library-catalog`
- `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
- `frontend/src/pages/editor-page/top-navbar/top-navbar-mobile.tsx`
- `frontend/src/pages/editor-page/top-navbar/current-diagram-share-button.tsx`
- `frontend/src/pages/shared-project-page/shared-diagram-loader.tsx`
- `frontend/src/pages/shared-project-page/shared-project-page.tsx`

Important files intentionally not changed beyond narrow import updates:

- `packages/schema-sync-core/src/types.ts`
- `packages/schema-sync-core/src/diff.ts`
- `backend/src/routes/*`
- `backend/src/services/*`

Files intentionally removed:

- every file that was previously under `frontend/src/features/schema-sync/`
- every remaining file that was previously under `frontend/src/features/`

## 5. Data / API / Workflow Changes

Behavioral/API changes:

- No backend routes, payloads, env vars, or shared schema types changed.
- Frontend API client modules were relocated only.
- Schema sync dialog state now lives inside the dialog entrypoint and uses native dialog-provider open/close state.
- Canonical adapter import paths changed from feature-local paths to `frontend/src/lib/schema-sync/*`.
- Auth/admin/persistence/dashboard frontend modules now use native paths, but their behavior was intentionally preserved.

Compatibility note:

- Several older docs still reference former `frontend/src/features/*` paths. The codebase no longer uses those paths. Treat this handoff as the source of truth for current locations.

## 6. Validation Performed

Validation completed:

- `npx tsc -p tsconfig.json --noEmit`
- `npx vitest run --config frontend/vitest.config.ts frontend/src/lib/schema-sync/canonical-adapters.test.ts frontend/src/dialogs/migration-dialog/migration-dialog.test.tsx frontend/src/dialogs/restore-version-dialog/restore-version-dialog.test.tsx frontend/src/dialogs/review-changes-dialog/review-changes-dialog.test.tsx frontend/src/pages/editor-page/top-navbar/workflow/workflow-actions-menu.test.tsx frontend/src/pages/admin-page/admin-page.test.tsx frontend/src/pages/dashboard-page/dashboard-shell-layout.test.tsx`
- `NODE_OPTIONS=--max-old-space-size=4096 npm run build:web`

What that covered:

- canonical adapter stability
- migration dialog integration
- restore dialog integration
- review dialog integration
- workflow top-navbar entrypoints
- admin page imports and auth/admin path updates
- dashboard shell imports and route-guard path updates
- full frontend production build

Still worth manual QA:

- live PostgreSQL connection management end-to-end
- live import and refresh against a real database
- schema sync preview/apply flows in browser
- shared project/dialog flows after the persistence path move

## 7. Outstanding Work

Not fully done:

- older architecture docs still mention former `frontend/src/features/*` paths
- no new UI-level tests were added specifically for opening the schema-sync dialog through `useDialog()`
- manual browser QA against a live database was not performed in this session

Recommended next step:

1. Do manual QA for schema sync connection management, bind/refresh, preview, and apply against a local PostgreSQL instance.
2. Clean up stale doc references in `docs/CODEBASE_STRUCTURE.md`, `docs/FEATURE_INDEX.md`, and workflow/schema-sync design docs so they point at current native paths.

## 8. Instructions for the Next Codex Session

Read in this order:

1. `docs/codex-handoff.md`
2. `docs/schema-sync-frontend-rebuild-plan.md`
3. `docs/schema-sync-frontend-audit.md`
4. `docs/architecture/schema-sync-architecture.md`
5. `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx`
6. `frontend/src/lib/schema-sync/canonical-adapters.ts`
7. `frontend/src/context/dialog-context/dialog-provider.tsx`
8. `frontend/src/pages/editor-page/top-navbar/workflow/schema-sync-toolbar-button.tsx`

Avoid breaking:

- `frontend/src/lib/schema-sync/canonical-adapters.ts`
- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
- schema-sync metadata writes to `diagram.schemaSync`

Best place to continue:

- browser QA of schema-sync flows
- stale-doc cleanup for removed `frontend/src/features/*` paths

## 9. Git Summary

Working branch:

- `restructe/02-schema-sync-to-native-structure`

Pull request title:

- `Rebuild schema sync frontend code using native SchemaDash structure`

Commit list created for this task:

- `7bb912f chore: audit schema sync frontend methodology drift`
  - Added the schema-sync drift audit document.
- `01aa7ba docs: add schema sync frontend rebuild plan`
  - Added the file-by-file rebuild mapping and integration notes.
- `5eafea8 refactor: move reusable schema sync ui and dialogs into native folders`
  - Moved schema-sync UI/dialog entrypoints into native folders and generalized the reusable change-plan summary component.
- `cb31cfc refactor: move schema sync helpers adapters and clients into native lib/context structure`
  - Moved schema-sync transport/adapters into native `lib`, rewired workflow imports, and replaced the schema-sync provider with native dialog-context wiring.
- `207820c refactor: remove schema sync feature subtree and update imports`
  - Deleted the remaining schema-sync feature files, removed the entire `frontend/src/features` tree, and relocated the remaining auth/admin/dashboard/persistence frontend modules into native folders.
- `test: validate schema sync flows after structure correction`
  - Records the final TypeScript check, targeted vitest run, successful production build, and this updated handoff.
