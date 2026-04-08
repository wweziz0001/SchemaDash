# Codex Handoff

## 1. Project Overview

SchemaDash is a full-stack schema design product with a browser-based diagram editor, collaboration-aware Development document persistence, immutable workflow snapshots, compare/review flows, and database-oriented migration tooling.

This task adds a true Development-history changelog timeline. The important product distinction is:

- `Development` is the mutable head and remains the only editable document.
- `Versions` are explicit immutable milestone-style snapshots.
- `Changelog` is not a renamed Versions list. It is an ongoing chronological history of Development activity generated from saves, restore/revert actions, and periodic automatic checkpoints.

Key concepts for this area:

- The persisted editor document in `backend/src/services/persistence-service.ts` is still the source of truth for the current Development head.
- Workflow snapshots in `backend/src/repositories/diagram-workflow-repository.ts` remain immutable and are reused as durable state carriers for both Versions and Changelog history entries.
- Compare and review remain baseline-vs-current-Development workflows. Changelog extends the set of valid compare baselines instead of introducing an editable branch model.

## 2. Current Architectural Context

Read these first for follow-up work in this area:

1. `docs/live-database-development-compare-versions-design.md`
2. `docs/diagram-workflow-frontend-rebuild-plan.md`
3. `docs/codex-handoff.md`
4. `backend/src/repositories/diagram-workflow-repository.ts`
5. `backend/src/services/diagram-workflow-service.ts`
6. `backend/src/services/diagram-changelog-service.ts`
7. `backend/src/services/diagram-version-restore-service.ts`
8. `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
9. `frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.tsx`
10. `frontend/src/pages/editor-page/workflow/workflow-development-changelog-sync.tsx`

Important boundaries and responsibilities:

- `backend/src/repositories/diagram-workflow-repository.ts`
    - Owns workflow SQLite tables and snapshot/version/changelog persistence. This is a high-risk file because schema migrations and record mapping for workflow history all pass through it.
- `backend/src/services/diagram-changelog-service.ts`
    - Owns changelog entry capture, dedupe, event classification, summary generation, and changelog list/detail views. Changelog-specific behavior should be added here first instead of scattering history logic across routes.
- `backend/src/services/diagram-version-restore-service.ts`
    - Owns safe restore/revert semantics that mutate Development, create safety snapshots, and now emit changelog restore/revert entries.
- `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
    - Owns workflow mode state, selected version/changelog entry state, compare baseline resolution, and URL-backed workflow routing. This is the highest-risk frontend integration point.
- `frontend/src/pages/editor-page/workflow/workflow-development-changelog-sync.tsx`
    - Owns save-driven and timed auto-checkpoint capture from the live Development editor state.
- `frontend/src/pages/editor-page/side-panel/versions-section/changelog-tab/*`
    - Own the left-side Changelog timeline UI. This is additive and should stay distinct from the Version list.
- `frontend/src/pages/editor-page/top-navbar/workflow/*`
    - Own read-only/viewing badges, compare toggles, Review entry, and Options actions while a changelog entry is selected.

Frontend/backend/shared relationships:

- Backend changelog entries are stored as immutable workflow snapshots with `snapshotKind: 'changelog'`.
- Frontend changelog selection resolves the historical diagram snapshot for read-only viewing and the historical canonical schema for compare/review.
- Shared canonical diffing still comes from `@schemadash/schema-sync-core`; changelog does not introduce a second compare engine.

High-risk files:

- `backend/src/repositories/diagram-workflow-repository.ts`
- `backend/src/services/diagram-version-restore-service.ts`
- `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
- `frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.tsx`
- `frontend/src/pages/editor-page/workflow-editor-page.tsx`

## 3. Task Completed

Task objective:

- Implement a first-class Development changelog timeline that records actual Development history rather than reusing manual Versions as a thin proxy.

What was implemented:

- Added a persisted changelog entry model backed by immutable workflow snapshots dedicated to Development history.
- Added backend routes and service logic for listing, loading, capturing, and reverting changelog entries.
- Added a real Changelog tab in the left workflow panel with a Current Development card and chronological changelog item list.
- Added changelog viewing mode so selecting an entry opens its stored historical diagram in read-only mode.
- Extended compare/review infrastructure so a changelog entry can be used as a compare baseline against current Development.
- Added a changelog-specific Options action that safely reverts Development to a selected historical changelog state.
- Added automatic periodic Development checkpoints with deduplication safeguards so recent work is captured even without creating manual Versions.

Key decisions:

- Changelog entries reuse snapshot persistence primitives, but they are classified separately from Versions through their own entry records and `snapshotKind: 'changelog'`.
- Revert keeps historical changelog entries immutable. Reverting copies a historical state into Development and records a new `revert` changelog event plus a safety Version snapshot.
- Manual save tracking is driven from actual Development save activity in the editor session, not from version creation.

Approach intentionally avoided:

- No “show Versions in another tab” implementation.
- No editable historical branch model.
- No broad rewrite of the editor core or compare engine.
- No weakening of existing immutable snapshot guarantees.

## 4. Files Changed

Files created:

- `backend/src/routes/diagram-changelog-routes.ts`
    - API surface for listing, loading, capturing, and reverting changelog entries.
- `backend/src/services/diagram-changelog-service.ts`
    - Changelog domain service for persistence orchestration, event summaries, and dedupe.
- `backend/test/diagram-changelog-service.test.ts`
    - Backend regression coverage for changelog entry capture and deduplication.
- `frontend/src/dialogs/revert-changelog-dialog/revert-changelog-dialog.tsx`
    - Confirmation flow for reverting Development from a selected changelog state.
- `frontend/src/lib/diagram-workflow/changelog-entry-format.ts`
    - Shared changelog labels, timestamps, and canonical-schema resolution helpers.
- `frontend/src/pages/editor-page/side-panel/versions-section/changelog-tab/changelog-list-item.tsx`
    - Timeline list item UI for a changelog entry.
- `frontend/src/pages/editor-page/side-panel/versions-section/changelog-tab/current-development-card.tsx`
    - Distinct Current Development card shown above the timeline.
- `frontend/src/pages/editor-page/workflow/workflow-development-changelog-sync.tsx`
    - Editor integration that emits save and auto-checkpoint changelog entries.
- `frontend/src/pages/editor-page/workflow/workflow-development-changelog-sync.test.tsx`
    - Frontend regression coverage for save-triggered and timed checkpoint capture.

Files modified:

- `backend/src/app.ts`
    - Registers changelog routes.
- `backend/src/context/app-context.ts`
    - Wires the changelog service into the app container and restore service.
- `backend/src/repositories/diagram-workflow-repository.ts`
    - Adds changelog entry table, migration, and repository methods.
- `backend/src/schemas/diagram-workflow.ts`
    - Adds changelog schemas, event types, compare source support, and revert input.
- `backend/src/services/diagram-version-restore-service.ts`
    - Adds restore-generated changelog entries and changelog revert semantics.
- `backend/test/diagram-version-restore-service.test.ts`
    - Covers restore-created changelog events and revert flows.
- `frontend/src/context/diagram-workflow-context/diagram-workflow-context.tsx`
    - Exposes changelog mode/state/hooks in the workflow context API.
- `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
    - Loads changelog data, resolves changelog viewing mode, and supports compare/review baselines from changelog entries.
- `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.tsx`
    - Refreshes changelog state after version restore.
- `frontend/src/dialogs/restore-version-dialog/restore-version-dialog.test.tsx`
    - Updates restore expectations for changelog outputs.
- `frontend/src/dialogs/review-changes-dialog/review-changes-dialog.tsx`
    - Accepts changelog baselines for review.
- `frontend/src/lib/api/diagram-workflow-client.ts`
    - Adds changelog DTOs and API client methods.
- `frontend/src/pages/editor-page/canvas/workflow/compare-summary-chip.tsx`
    - Shows changelog baseline labels in compare mode.
- `frontend/src/pages/editor-page/canvas/workflow/live-status-chip.tsx`
    - Shows changelog viewing/read-only state in canvas chrome.
- `frontend/src/pages/editor-page/editor-page.tsx`
    - Mounts the Development changelog sync bridge.
- `frontend/src/pages/editor-page/side-panel/versions-section/changelog-tab/changelog-tab.tsx`
    - Replaces the placeholder tab with the real timeline UI.
- `frontend/src/pages/editor-page/side-panel/versions-section/changelog-tab/changelog-tab.test.tsx`
    - Covers Current Development + timeline rendering.
- `frontend/src/pages/editor-page/side-panel/versions-section/version-tab/version-tab.tsx`
    - Shows changelog-aware compare copy without changing the Versions workflow itself.
- `frontend/src/pages/editor-page/top-navbar/workflow/version-view-badge.tsx`
    - Supports changelog viewing and compare badges.
- `frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.tsx`
    - Adds changelog Review and Options actions, including revert.
- `frontend/src/pages/editor-page/workflow-editor-page.tsx`
    - Supports changelog read-only rendering in the workflow page shell.

Important files intentionally not changed:

- `backend/src/services/diagram-workflow-service.ts`
    - Versions remain distinct and still represent explicit/manual immutable snapshots.
- `frontend/src/pages/editor-page/side-panel/versions-section/versions-section.tsx`
    - The existing Versions/Changelog panel structure was reused rather than redesigned.
- `packages/schema-sync-core/*`
    - Compare/review reuse the existing canonical diff engine instead of introducing a new one for changelog.

## 5. Data / API / Workflow Changes

New data/model behavior:

- Added diagram-scoped changelog entries linked to immutable snapshots of the Development state.
- Each changelog entry stores:
    - event type (`save`, `auto_checkpoint`, `restore`, `revert`)
    - timestamp
    - optional actor
    - optional source label
    - optional source document version
    - summary text
    - optional compare summary counts
    - snapshot reference and fingerprint

Backend/API changes:

- `GET /api/diagrams/:id/workflow/changelog`
    - Returns the chronological Development history timeline for the diagram.
- `GET /api/diagrams/:id/workflow/changelog/:entryId`
    - Returns a single changelog entry with its historical diagram/canonical snapshot.
- `POST /api/diagrams/:id/workflow/changelog`
    - Captures a changelog entry from the current Development state.
- `POST /api/diagrams/:id/workflow/changelog/:entryId/revert-to-development`
    - Safely copies a historical changelog snapshot into Development.

Storage behavior:

- Changelog is persisted separately from Version records but uses the existing workflow snapshot table as the immutable state carrier.
- Snapshot classification now distinguishes version/manual/system/changelog usage through schema-level enums and entry metadata.
- The workflow repository migration for this task creates the changelog entry table.

Workflow behavior:

- Manual editor saves create `save` changelog entries when the current collaboration session is the saving actor.
- Version restore creates a `restore` changelog event after Development is updated.
- Changelog revert creates:
    - a safety Version snapshot first
    - a new Development head copied from the historical entry
    - a new `revert` changelog event describing the action
- Automatic checkpoints run on a 2-minute interval in editable Development mode and only capture when the Development state meaningfully changed.

Config/env changes:

- No environment variable changes.
- Auto-checkpoint timing is currently code-defined in `frontend/src/pages/editor-page/workflow/workflow-development-changelog-sync.tsx` (`2 minutes`, polled every `30 seconds`).

## 6. Validation Performed

Automated validation run:

- `npx vitest run test/diagram-changelog-service.test.ts test/diagram-version-restore-service.test.ts test/diagram-workflow-service.test.ts` in `backend/`
- `npx vitest run --config frontend/vitest.config.ts frontend/src/pages/editor-page/side-panel/versions-section/changelog-tab/changelog-tab.test.tsx frontend/src/dialogs/restore-version-dialog/restore-version-dialog.test.tsx frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.test.tsx frontend/src/pages/editor-page/top-navbar/workflow/version-view-badge.test.tsx frontend/src/pages/editor-page/workflow/workflow-development-changelog-sync.test.tsx` in `frontend/`

What was verified:

- Changelog entries persist as immutable Development-history snapshots.
- Manual save and timed auto-checkpoint flows call changelog capture correctly.
- No-change auto-checkpoints dedupe while later manual saves still create history entries.
- Restore creates a changelog `restore` event.
- Changelog revert creates a safety snapshot and a new `revert` event.
- The Changelog tab renders Current Development separately from historical entries.
- Toolbar/view badges remain coherent while viewing or comparing a changelog entry.

What remains unverified:

- No full end-to-end browser manual QA was run in this session.
- No repository-wide frontend test or typecheck pass was achieved because unrelated pre-existing failures exist elsewhere in the repo.

Known limitations / risks:

- Auto-checkpoint timing is frontend-driven. If a future requirement needs server-authoritative background checkpointing, this implementation should be moved or supplemented on the backend.
- Dedupe uses canonical schema fingerprints and save document versions. If richer “meaningful change” semantics are needed later, extend `DiagramChangelogService.shouldSkipCapture(...)`.

## 7. Outstanding Work

- Add browser-level manual QA for the full changelog journey:
    - save Development
    - wait for an auto-checkpoint
    - open historical view
    - compare against current Development
    - review
    - revert
- Consider whether auto-checkpoint interval should become a shared config value instead of remaining in frontend code.
- If future UX work expands changelog, add richer per-entry change summaries or filtering without collapsing the distinction between Versions and Changelog.

## 8. Instructions for the Next Codex Session

Exact reading order:

1. `docs/live-database-development-compare-versions-design.md`
2. `docs/codex-handoff.md`
3. `backend/src/repositories/diagram-workflow-repository.ts`
4. `backend/src/services/diagram-changelog-service.ts`
5. `backend/src/services/diagram-version-restore-service.ts`
6. `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`
7. `frontend/src/pages/editor-page/side-panel/versions-section/changelog-tab/changelog-tab.tsx`
8. `frontend/src/pages/editor-page/top-navbar/workflow/workflow-mode-switcher.tsx`
9. `frontend/src/pages/editor-page/workflow/workflow-development-changelog-sync.tsx`
10. `backend/test/diagram-changelog-service.test.ts`
11. `frontend/src/pages/editor-page/workflow/workflow-development-changelog-sync.test.tsx`

What to avoid breaking:

- Development must remain the only mutable head.
- Versions must remain explicit/manual immutable snapshots and not become auto-generated changelog aliases.
- Historical changelog entries must remain read-only.
- Compare/review should continue reusing the existing canonical diff infrastructure.
- Revert must continue creating a safety snapshot before replacing Development.

Where to continue:

- If the next task is changelog refinement, start in `backend/src/services/diagram-changelog-service.ts` and `frontend/src/context/diagram-workflow-context/diagram-workflow-provider.tsx`.
- If the next task is UX polish, start in the changelog tab components and top-navbar workflow chrome.
- If the next task is persistence expansion, inspect the workflow repository migration and snapshot/changelog record mapping first.

## 9. Git Summary

- Working branch: `pro/02-add-development-changelog-timeline`
- Pull request title: `Add development changelog timeline with save change revert and auto-snapshot history`
- Commit list created for this task:
  - `9c3d9933` `feat: add development changelog model and history event persistence`
    - Added changelog persistence schemas, repository storage, backend service orchestration, API routes, and app wiring.
  - `09fd0bac` `feat: add changelog panel and development history entry list UI`
    - Added the Changelog tab data flow, current Development card, changelog list items, and frontend API/context support.
  - `100d305f` `feat: add changelog viewing mode and diff/review integration`
    - Added changelog read-only viewing state plus compare/review integration across the editor chrome and canvas badges.
  - `196d2cc7` `feat: add revert from changelog using safe restore semantics`
    - Added the changelog revert confirmation flow and frontend restore/revert state refresh behavior.
  - `05455a7f` `feat: add periodic development checkpoint generation and deduplication safeguards`
    - Added automatic timed checkpoint capture from Development editing with no-change dedupe protection.
  - `test: validate development changelog history timeline behavior`
    - Adds targeted backend/frontend changelog regression coverage and finalizes this handoff for the next session.
