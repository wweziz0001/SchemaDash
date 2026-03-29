# Codex Handoff

## Project Overview

SchemaDash is a full-stack schema design and schema-sync product with:

- a React/Tailwind frontend for canvas-based database diagram editing
- a Fastify backend for persistence, collaboration, workflow state, and schema-sync APIs
- a shared `packages/schema-sync-core` package for canonical schema types, hashing, diffing, compare results, and migration planning

Relevant product context for this task:

- `Development` remains the only mutable diagram head.
- `Live Database` is a read-only stored canonical snapshot for a bound connection.
- `Compare` is a read-only derived visualization between a baseline schema and the current Development diagram.
- `Versions / Snapshots` are immutable, per-diagram historical captures of Development.

Key concepts for this system area:

- A diagram document is still the editable source for Development.
- Canonical schema is required for safe and stable compare behavior.
- Historical versions must never become second editable branches.
- Collaboration/editing must stay attached to Development; version views are read-only review surfaces.

## Current Architectural Context

Read these first:

1. `docs/live-database-development-compare-versions-design.md`
2. `docs/live-db-compare-feature-map.md`
3. `docs/codex-handoff.md`

Important system areas for this task:

- Backend workflow persistence and service logic:
  - `backend/src/repositories/diagram-workflow-repository.ts`
  - `backend/src/services/diagram-workflow-service.ts`
  - `backend/src/routes/diagram-workflow-routes.ts`
  - `backend/src/schemas/diagram-workflow.ts`
- Frontend workflow state and editor mode routing:
  - `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
  - `frontend/src/pages/editor-page/workflow-editor-page.tsx`
  - `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
  - `frontend/src/pages/editor-page/top-navbar/top-navbar-mobile.tsx`
- Frontend versions UI:
  - `frontend/src/features/diagram-workflow/components/create-version-dialog.tsx`
  - `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
  - `frontend/src/features/diagram-workflow/components/version-list-item.tsx`
  - `frontend/src/features/diagram-workflow/components/version-view-badge.tsx`
  - `frontend/src/features/diagram-workflow/lib/version-labels.ts`
- Existing compare/canonical seams reused here:
  - `frontend/src/features/diagram-workflow/lib/compare-render-model.ts`
  - `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
  - `packages/schema-sync-core/src/types.ts`
  - `packages/schema-sync-core/src/hash.ts`

Important service/module boundaries:

- `diagram-workflow-repository` owns app-db workflow state, workflow snapshots, and user-facing version rows.
- `diagram-workflow-service` owns version creation, version listing, live snapshot refresh, and version detail lookup.
- `diagram-workflow-routes` is the only HTTP entry point for workflow/version APIs.
- `diagram-workflow-context` is responsible for choosing which read-only surface to load into the editor (`live`, `compare`, or `version`) without changing the mutable editor architecture.
- `compare-render-model.ts` still only needs a baseline canonical schema plus the current Development diagram.

Important high-risk files:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `packages/schema-sync-core/src/types.ts`

Frontend/backend/shared relationships:

- Frontend creates versions from the current in-memory Development diagram by sending:
  - serialized diagram document
  - canonical schema derived with `diagramToCanonicalSchema(...)`
- Backend stores:
  - immutable workflow snapshot row in `diagram_workflow_snapshots`
  - user-facing version row in `diagram_versions`
- Read-only version rendering uses the stored diagram document when available, and falls back to canonical-to-diagram reconstruction otherwise.
- Version-based compare reuses the existing compare engine by swapping the baseline canonical schema only.

## Task Completed

What this task was trying to achieve:

- Add immutable per-diagram versions/snapshots of the current Development diagram.
- Let users create versions, list them, inspect metadata, and open them in a read-only historical view.
- Allow comparing Development against a selected version without rewriting compare mode or turning the editor into a multi-branch system.

What was actually implemented:

- Added persistent immutable version storage in the app database:
  - snapshot rows stored in `diagram_workflow_snapshots`
  - version metadata rows stored in new `diagram_versions`
- Added backend workflow service methods and HTTP routes for:
  - list versions
  - get version detail
  - create version
- Added frontend create-version flow that captures:
  - the current Development diagram document
  - the current canonical schema
  - optional name and note
- Added a Versions sheet in the editor chrome with:
  - version count
  - version metadata list
  - create version action
  - open read-only action
  - compare-to-Development action
- Added read-only version mode with a visible immutable snapshot badge.
- Added compare-against-version support using the existing compare render model and a version canonical schema baseline.

Key decisions made:

- Version compare uses URL state (`workflow=compare&compareVersionId=...`) instead of persisting a mutable compare-source choice on the server.
- Version creation captures both a diagram document snapshot and a canonical schema snapshot.
- Compare-based migration/review actions remain live-baseline-only; they are hidden when the compare baseline is a historical version.
- Read-only version mode still uses the existing editor shell, but only with `readonly` and authoritative sync disabled.

Approach intentionally avoided and why:

- Did not turn `SchemaDashProvider` into a multi-head or multi-branch editor because the design docs explicitly reject that.
- Did not implement restore-to-Development because safe restore needs explicit server validation, safety snapshots, and careful runtime/collaboration handling that would be risky to force into this phase.
- Did not modify the core storage provider or persistence service because the versions workflow can sit beside the mutable Development document.

## Files Changed

Files created:

- `frontend/src/features/diagram-workflow/components/create-version-dialog.tsx`
  - dialog for capturing a new immutable version from the current Development diagram
- `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
  - right-side versions sheet with list/create/open/compare actions
- `frontend/src/features/diagram-workflow/components/version-list-item.tsx`
  - reusable metadata row for a single version entry
- `frontend/src/features/diagram-workflow/components/version-view-badge.tsx`
  - read-only badge shown when a historical snapshot is open
- `frontend/src/features/diagram-workflow/lib/version-labels.ts`
  - shared version display/origin/time formatting helpers
- `frontend/src/features/diagram-workflow/components/versions-panel.test.tsx`
  - versions list/open/compare UI behavior coverage
- `frontend/src/features/diagram-workflow/components/version-view-badge.test.tsx`
  - read-only version badge coverage

Files modified:

- `backend/src/schemas/diagram-workflow.ts`
  - added version origin enum and create-version request schema
- `backend/src/repositories/diagram-workflow-repository.ts`
  - added migration 10, `diagram_versions`, version CRUD helpers, and transaction helper
- `backend/src/services/diagram-workflow-service.ts`
  - added create/list/get version behavior and version response shaping
- `backend/src/routes/diagram-workflow-routes.ts`
  - added version list/detail/create endpoints
- `backend/test/diagram-workflow-service.test.ts`
  - added immutable version creation/listing/open behavior coverage
- `frontend/src/features/diagram-workflow/api/diagram-workflow-client.ts`
  - added version DTOs and list/detail/create calls
- `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
  - added versions state, version detail caching, version mode, and version compare baseline loading
- `frontend/src/features/diagram-workflow/components/live-status-chip.tsx`
  - added explicit version read-only status badge
- `frontend/src/features/diagram-workflow/components/compare-summary-chip.tsx`
  - shows current compare baseline, including selected version labels
- `frontend/src/features/diagram-workflow/components/review-dropdown.tsx`
  - now hidden when compare is based on a version instead of live baseline
- `frontend/src/features/diagram-workflow/components/review-dropdown.test.tsx`
  - updated to cover live-only gating
- `frontend/src/pages/editor-page/workflow-editor-page.tsx`
  - loads read-only version diagrams and waits for version compare baselines when needed
- `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
  - integrates the versions sheet and version-view badge
- `frontend/src/pages/editor-page/top-navbar/top-navbar-mobile.tsx`
  - integrates the versions sheet and version-view badge in mobile chrome

Important files intentionally not changed:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `packages/schema-sync-core/src/types.ts`

Why those avoided files matter:

- They are high-blast-radius persistence/editor primitives.
- This task stayed additive by using the existing workflow service, canonical schema helpers, and editor read-only mode instead of modifying the mutable editor foundation.

## Data / API / Workflow Changes

App-database changes:

- `diagram_workflow_snapshots`
  - continues to store immutable snapshots
  - now stores version snapshots created from Development with `snapshot_kind='version'`
- `diagram_versions`
  - new app-db table added in workflow repository migration 10
  - fields include:
    - `id`
    - `diagram_id`
    - `snapshot_id`
    - `name`
    - `description`
    - `version_label`
    - `pinned`
    - `origin`
    - `created_by_user_id`
    - `created_at`

New backend routes:

- `GET /api/diagrams/:id/workflow/versions`
  - returns per-diagram version summaries
- `GET /api/diagrams/:id/workflow/versions/:versionId`
  - returns full version detail including immutable snapshot payload
- `POST /api/diagrams/:id/workflow/versions`
  - creates a new immutable version from the provided Development diagram/canonical schema payload

Frontend workflow changes:

- New URL state:
  - `?workflow=version&versionId=<id>` opens a read-only historical snapshot
  - `?workflow=compare&compareVersionId=<id>` compares the selected version against current Development
- `Versions` button in editor chrome opens the new versions sheet.
- Read-only version mode shows explicit immutable snapshot status.
- Compare summary now names the active baseline.
- Live-only review/migration actions are intentionally suppressed for version-based compare mode.

Compatibility / configuration notes:

- No env var changes.
- No metadata-db changes.
- No backup/export schema changes yet.

## Validation Performed

Targeted tests run:

- `npm run test -w @schemadash/backend -- diagram-workflow-service.test.ts`
- `npm run test:web -- --run frontend/src/features/diagram-workflow/components/workflow-mode-switcher.test.tsx frontend/src/features/diagram-workflow/components/review-dropdown.test.tsx frontend/src/features/diagram-workflow/components/versions-panel.test.tsx frontend/src/features/diagram-workflow/components/version-view-badge.test.tsx`
- `npm run typecheck -w @schemadash/backend -- --pretty false`

What was verified:

- live workflow behavior still binds and refreshes without mutating Development
- versions can be created from Development
- stored versions remain immutable even after Development changes
- versions list loads and shows metadata
- read-only version mode shows immutable snapshot status
- compare can be launched from a selected version
- live-only review/migration controls stay hidden for version-based compare

What remains unverified:

- manual browser QA of the versions flow in a live running app
- end-to-end creation and inspection against real user authentication/share-token combinations
- repo-wide root typecheck, which still has pre-existing unrelated frontend issues on this branch

Known limitations / risks:

- Restore-to-Development was intentionally deferred.
- Compare baseline selection for versions is URL-driven client state, not persisted server preference.
- Backup/export compatibility for versions is not implemented yet.

## Outstanding Work

Not done in this phase:

- restore-to-Development workflow
- automatic safety snapshot creation before restore/apply
- backup/export portability for workflow versions
- richer version metadata controls such as pinning or milestone-specific UX
- persisted server-side compare baseline preference for versions, if product still wants that later

Recommended next phase:

- implement a narrow, explicit restore-to-Development flow with:
  - server validation
  - automatic safety snapshot creation
  - immutable source version preservation
  - careful collaboration/runtime handling

Risks/dependencies for the next phase:

- restore must not mutate stored snapshots
- restore must not destabilize collaboration session/version counters
- restore likely needs a clearer interaction with `persistence-service` and the authoritative Development document

## Instructions for the Next Codex Session

Exact reading order:

1. `docs/live-database-development-compare-versions-design.md`
2. `docs/live-db-compare-feature-map.md`
3. `docs/codex-handoff.md`
4. `backend/src/repositories/diagram-workflow-repository.ts`
5. `backend/src/services/diagram-workflow-service.ts`
6. `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
7. `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
8. `frontend/src/pages/editor-page/workflow-editor-page.tsx`

What to inspect first if continuing versions/restore work:

- `backend/src/services/diagram-workflow-service.ts`
- `backend/src/repositories/diagram-workflow-repository.ts`
- `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
- `frontend/src/features/diagram-workflow/components/versions-panel.tsx`

What to avoid breaking:

- Development must remain the only mutable editor head.
- Review/Migration should stay tied to live compare, not historical version compare.
- High-risk persistence/editor core files should stay untouched unless restore truly requires it.

Where to continue implementation:

- add restore endpoints and service logic in `backend/src/services/diagram-workflow-service.ts`
- add restore UI from `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
- if restore requires Development mutation, trace that carefully through `backend/src/services/persistence-service.ts` and only make minimal isolated changes

## Git Summary

Working branch:

- `feature/versions-and-snapshots-workflow`

Pull request title:

- `Add diagram versions and immutable snapshot workflow`

Commit list created for this task:

- `feat: add immutable diagram snapshot and version persistence`
  - added app-db version persistence, repository helpers, and backend service support
- `feat: add create version flow and version metadata support`
  - added version routes/client types and the create-version capture dialog
- `feat: add versions list and read-only version view`
  - added versions sheet, version mode, immutable snapshot badge, and read-only version rendering
- `feat: add compare against selected version`
  - added version-backed compare launches, compare baseline labeling, and live-only review gating
- `test: validate version creation listing and read-only behavior`
  - adds targeted backend/frontend tests and refreshes this handoff for future sessions
