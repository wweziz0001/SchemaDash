# Codex Handoff

## Project Overview

SchemaDash is a full-stack schema design and schema workflow product with:

- a React/Tailwind frontend for diagram editing and review
- a Fastify backend for persistence, collaboration, workflow state, and schema-sync APIs
- a shared `packages/schema-sync-core` package for canonical schema types, hashing, diffing, compare, and migration planning

Relevant architecture for this task:

- `Development` is the only mutable diagram head.
- `Live Database` is a stored read-only canonical snapshot.
- `Compare` is a derived read-only view.
- `Versions / Snapshots` are immutable historical captures of Development.
- Restoring a version must copy that immutable version back into Development, never mutate the stored snapshot.

Key concepts for this area:

- The editable diagram document still lives in app persistence and collaboration stays attached to that one document.
- Workflow snapshots and user-facing versions live beside the mutable Development document in `diagram_workflow_snapshots` and `diagram_versions`.
- Compare/review/migration logic depends on canonical schema integrity, but the editor itself still operates on one mutable Development diagram.

## Current Architectural Context

Read these first:

1. `docs/live-database-development-compare-versions-design.md`
2. `docs/live-db-compare-feature-map.md`
3. `docs/codex-handoff.md`

System areas that matter most for restore:

- Backend workflow persistence:
  - `backend/src/repositories/diagram-workflow-repository.ts`
- Backend version/snapshot creation and read APIs:
  - `backend/src/services/diagram-workflow-service.ts`
  - `backend/src/routes/diagram-workflow-routes.ts`
- Backend restore workflow added in this task:
  - `backend/src/services/diagram-version-restore-service.ts`
  - `backend/src/routes/diagram-version-restore-routes.ts`
  - `backend/src/schemas/diagram-workflow.ts`
- Frontend versions UI and restore UX:
  - `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
  - `frontend/src/features/diagram-workflow/components/version-list-item.tsx`
  - `frontend/src/features/diagram-workflow/components/restore-version-dialog.tsx`
  - `frontend/src/features/diagram-workflow/components/restore-warning-panel.tsx`
  - `frontend/src/features/diagram-workflow/lib/restore-messages.ts`
- Frontend workflow/editor glue:
  - `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
  - `frontend/src/pages/editor-page/workflow-editor-page.tsx`

Important service/module boundaries:

- `diagram-workflow-repository` owns workflow state, workflow snapshots, and version rows in the app DB.
- `diagram-workflow-service` still owns version creation, version list/detail, and live snapshot refresh.
- `diagram-version-restore-service` now owns restore-only behavior:
  - permission validation
  - version lookup and diagram ownership checks
  - automatic safety snapshot creation
  - Development replacement via normal persistence semantics
- `diagram-workflow-context` still decides which read-only surface is open in the editor, but it is not a multi-branch editor.
- `storage-provider` and `schemadash-provider` remain the authoritative client-side persistence/editor layers and were intentionally not rewritten.

Important high-risk files:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `packages/schema-sync-core/src/types.ts`

Frontend/backend/shared relationships relevant to restore:

- Frontend sends restore confirmation plus the current Development canonical schema and current document version.
- Backend validates that `baseVersion` still matches the authoritative Development document before creating the safety snapshot.
- Backend creates the safety snapshot/version from the current Development state, then restores the selected immutable version by writing a copied diagram document back through normal Development persistence.
- Frontend refreshes the authoritative diagram through the storage layer and reloads it into the editor, keeping the editor on Development after restore.

## Task Completed

What this task was trying to achieve:

- Add a controlled restore-to-Development workflow for immutable diagram versions.
- Keep versions immutable forever.
- Create a safety snapshot before replacement.
- Make restore explicit, confirmed, server-validated, and understandable in the UI.

What was actually implemented:

- Added `Restore to Development` actions to the versions UI for editable diagrams.
- Added a dedicated restore confirmation dialog with high-risk messaging and explicit confirmation text.
- Added a dedicated backend restore service and route:
  - validates edit access
  - validates version existence and diagram scope
  - validates confirmation text
  - validates the caller’s `baseVersion` against the current Development document
  - creates a `before_restore` safety snapshot/version
  - copies the selected immutable version’s stored diagram document into Development
- Added client restore wiring that:
  - calls the new restore API
  - refreshes the authoritative diagram through `storage.getDiagram(...)`
  - reloads the restored Development document into the editor
  - switches the UI back to Development mode
  - shows explicit success/failure feedback

Key decisions made:

- The restore workflow was kept isolated in `diagram-version-restore-service.ts` instead of folding more risk into `diagram-workflow-service.ts`.
- The backend safety snapshot uses the current server-side Development document plus client-supplied canonical schema, but only after a strict `baseVersion` match. This avoided redesigning the versions model or moving canonical conversion logic across packages.
- Restore preserves the current Development `schemaSync` compatibility payload rather than reviving potentially stale sync metadata from the historical version document.
- Restore uses the normal Development persistence path (`persistenceService.upsertDiagram(...)`) so document versioning/concurrency still advances normally.

Approach intentionally avoided and why:

- Did not turn `SchemaDashProvider` into a multi-head or multi-branch editor because the design docs explicitly reject that.
- Did not mutate stored version or snapshot rows during restore; restore always copies into Development.
- Did not modify `persistence-service`, `app-repository`, `metadata-repository`, `storage-provider`, or `schemadash-provider` because the restore flow could be layered on top of existing boundaries.
- Did not redesign versions into editable branches; versions remain read-only before and after restore.

## Files Changed

Files created in this task:

- `backend/src/services/diagram-version-restore-service.ts`
  - restore-only backend workflow with validation, safety snapshot creation, and Development replacement
- `backend/src/routes/diagram-version-restore-routes.ts`
  - restore HTTP entry point
- `backend/test/diagram-version-restore-service.test.ts`
  - backend safety/immutability/regression coverage for restore
- `frontend/src/features/diagram-workflow/components/restore-version-dialog.tsx`
  - explicit restore confirmation UI and client-side restore orchestration
- `frontend/src/features/diagram-workflow/components/restore-warning-panel.tsx`
  - reusable risk/consequence warning panel inside restore confirmation
- `frontend/src/features/diagram-workflow/components/restore-version-dialog.test.tsx`
  - frontend confirmation/success/failure restore coverage
- `frontend/src/features/diagram-workflow/lib/restore-messages.ts`
  - restore-specific confirmation/success/failure copy helpers

Files modified in this task:

- `backend/src/app.ts`
  - registered the restore route
- `backend/src/context/app-context.ts`
  - added and instantiated `DiagramVersionRestoreService`
- `backend/src/schemas/diagram-workflow.ts`
  - added restore request schema and restore confirmation constant
- `frontend/src/features/diagram-workflow/api/diagram-workflow-client.ts`
  - added typed restore API call/result model
- `frontend/src/features/diagram-workflow/components/version-list-item.tsx`
  - added `Restore to Development` action button
- `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
  - wired restore dialog entry from the versions sheet

Important files intentionally not changed:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `packages/schema-sync-core/src/types.ts`

Why those avoided files matter:

- They are the highest-blast-radius editor/persistence/shared-model files.
- This restore implementation stays additive and isolated by using their public behavior instead of refactoring them.

## Data / API / Workflow Changes

New backend route:

- `POST /api/diagrams/:id/workflow/versions/:versionId/restore-to-development`
  - request payload:
    - `confirmationText`
    - `baseVersion`
    - `sessionId` optional
    - `currentDevelopmentCanonicalSchema`
  - response payload:
    - `restoredVersion`
    - `safetySnapshotVersion`
    - `development` name/version/updatedAt summary

Restore workflow behavior:

- Restore requires explicit confirmation text: `RESTORE DEVELOPMENT`.
- Restore fails fast if the current Development document version no longer matches the caller’s `baseVersion`.
- Restore creates an automatic safety snapshot row with:
  - `snapshotKind: 'system'`
  - `sourceKind: 'development'`
- Restore also creates a user-facing safety version row with:
  - `origin: 'before_restore'`
  - generated label and descriptive name/note
- Restore writes the selected version’s stored diagram document back into the Development document.
- The selected immutable version remains unchanged.
- The current Development `schemaSync` metadata is preserved during restore so live/compare/migration compatibility pointers are not silently rolled back to stale version-local values.

Client workflow behavior:

- Versions UI now exposes `Restore to Development`.
- Restore dialog requires explicit confirmation text before enabling the destructive action.
- After a successful restore, the client:
  - refreshes the authoritative diagram from the server through storage
  - reloads that Development diagram into the editor
  - returns the UI to Development mode
  - shows a success toast naming the restored version and the safety snapshot
- On failure, the dialog shows the error inline and a destructive toast.

Compatibility/config changes:

- No env var changes.
- No metadata DB changes.
- No shared package type changes.
- No backup/export schema changes.

## Validation Performed

Targeted tests run:

- `npm run test -w @schemadash/backend -- diagram-version-restore-service.test.ts diagram-workflow-service.test.ts`
- `npm run test:web -- --run frontend/src/features/diagram-workflow/components/restore-version-dialog.test.tsx frontend/src/features/diagram-workflow/components/versions-panel.test.tsx frontend/src/features/diagram-workflow/components/version-view-badge.test.tsx frontend/src/features/diagram-workflow/components/review-dropdown.test.tsx`

What was verified:

- a stored version can be selected for restore through the versions UI
- restore requires explicit confirmation text before the button enables
- backend restore creates a `before_restore` safety snapshot/version
- restoring a version replaces Development through the server workflow
- the original immutable version remains unchanged after restore
- stale `baseVersion` restores fail before mutating Development or creating a safety snapshot
- versions list/open/compare UI behavior still works
- version read-only badge still works
- live-only review controls remain hidden for version-based compare mode

What was verified manually:

- no manual browser QA was run in this session

What remains unverified:

- end-to-end manual restore in a running browser session with real collaboration events
- share-token/read-only permission matrix around restore attempts
- full repo-wide test/build sweep on this branch

Known limitations / risks:

- Restore currently accepts `sessionId` from the client but intentionally does not pass it into `persistenceService.upsertDiagram(...)`; this avoids failing restores on stale/missing session metadata. If session attribution becomes important later, add a dedicated validated session handoff rather than blindly passing the ID through.
- Safety snapshot canonical schema is supplied by the client and protected by `baseVersion` validation. If the product later needs fully server-derived canonical snapshots, add a shared server-safe diagram-to-canonical conversion path rather than changing the versions model.

## Outstanding Work

Not done yet:

- manual browser QA of restore and post-restore editing
- broader route/integration coverage beyond the focused restore service tests
- backup/export portability for restore-generated safety snapshots
- richer system-version UX such as filtering, pinning, or separate grouping for `before_restore`

Recommended next implementation phase:

- run a broader integration/manual validation pass covering:
  - restore from version view and from Development view
  - editing immediately after restore
  - compare/live/migration behavior after restore
  - multi-user collaboration expectations after restore

Blockers/risks/dependencies for future work:

- do not break the invariant that Development is the only mutable head
- do not let restore overwrite or mutate stored immutable version rows
- do not “fix” restore by widening editor providers into multi-branch state

## Instructions for the Next Codex Session

Exact reading order:

1. `docs/live-database-development-compare-versions-design.md`
2. `docs/live-db-compare-feature-map.md`
3. `docs/codex-handoff.md`
4. `backend/src/services/diagram-version-restore-service.ts`
5. `backend/test/diagram-version-restore-service.test.ts`
6. `frontend/src/features/diagram-workflow/components/restore-version-dialog.tsx`
7. `frontend/src/features/diagram-workflow/components/restore-version-dialog.test.tsx`
8. `frontend/src/features/diagram-workflow/components/versions-panel.tsx`

Inspect first if continuing restore work:

- `backend/src/services/diagram-version-restore-service.ts`
- `backend/src/schemas/diagram-workflow.ts`
- `frontend/src/features/diagram-workflow/components/restore-version-dialog.tsx`
- `frontend/src/features/diagram-workflow/lib/restore-messages.ts`

What to avoid breaking:

- Development must stay the only mutable/collaborative head.
- Stored versions and snapshots must remain immutable forever.
- Current Development `schemaSync` metadata should survive restore.
- High-risk persistence/editor files should remain untouched unless absolutely necessary.

Where to continue implementation:

- add manual/integration coverage around restore if more confidence is needed
- add future UX refinements in the restore dialog or versions list
- if server-derived canonical safety snapshots are required later, add that as a new isolated helper/service instead of rewriting version storage

## Git Summary

Working branch:

- `feature/restore-version-to-development`

Pull request title:

- `Add controlled restore of immutable version into Development`

Commit list created for this task:

- `feat: add restore to development action and confirmation flow`
  - added restore entry point in the versions UI, confirmation dialog, warning panel, and restore-specific messaging helpers
- `feat: add server-controlled restore workflow and safety snapshot support`
  - added backend restore route/service, restore request schema, and typed client restore API
- `feat: apply restored version into development while preserving immutability`
  - wired restore completion back through storage/editor refresh so the editor cleanly resumes on restored Development
- `feat: add restore success and failure UX`
  - added explicit success toasts and actionable failure messaging for restore
- `test: validate restore safety immutability and development replacement behavior`
  - added focused backend/frontend restore tests and updated this handoff for the next session
