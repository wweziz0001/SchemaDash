# ChartDB-Inspired UI Adaptation Plan

## Objective

Apply original UI polish to SchemaDash by adapting safe, high-level workflow and presentation ideas observed in the uploaded ChartDB bundles.

The result should feel more polished and product-grade while remaining recognizably SchemaDash and preserving the live/development/compare/version workflow rules from:

- `docs/live-database-development-compare-versions-design.md`
- `docs/live-db-compare-feature-map.md`

## Patterns Worth Adapting

### 1. Compact workflow chrome

Adapt:

- tighter grouped controls
- clearer active mode treatment
- stronger separation between workflow state and general navigation actions

Apply to:

- top toolbar / editor chrome
- workflow mode switcher
- live/read-only status chips
- compare summary visibility

### 2. Status-first information hierarchy

Adapt:

- short chips and compact summaries before deep detail
- clear read-only/editable messaging
- visible connection and sync freshness cues

Apply to:

- Live Database
- Compare
- Versions / Snapshots
- restore and validation surfaces

### 3. Guided review and migration surfaces

Adapt:

- overview cards at the top
- grouped warnings and validation states
- separated execution area
- cleaner empty and error states

Apply to:

- Review Changes
- Migration
- warning and validation UI

### 4. Stronger immutable snapshot presentation

Adapt:

- explicit immutable/read-only language
- clearer action grouping for open/compare/restore
- more polished version list cards and empty states

Apply to:

- Versions / Snapshots
- Restore to Development
- version-read-only state presentation

## SchemaDash Areas To Improve

### Editor chrome

- Clarify the relationship between `Development`, `Live Database`, `Compare`, and `Version` read-only views.
- Make workflow status more legible without expanding the navbar into a dense wall of unrelated controls.

### Compare

- Improve legend/summary readability.
- Make baseline and read-only context harder to miss.

### Review Changes

- Improve section hierarchy, change summaries, and category readability.
- Make empty and supplemental states more deliberate.

### Migration

- Improve the sense of sequence:
  - preview
  - validation
  - apply
  - execution/result

### Versions / Snapshots

- Improve version card styling and action grouping.
- Make immutable snapshot context more obvious.

### Restore to Development

- Make the risk framing and confirmation area clearer.

## Expected Files To Change

### Primary targets

- `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
- `frontend/src/pages/editor-page/top-navbar/top-navbar-mobile.tsx`
- `frontend/src/features/diagram-workflow/components/workflow-mode-switcher.tsx`
- `frontend/src/features/diagram-workflow/components/live-status-chip.tsx`
- `frontend/src/features/diagram-workflow/components/compare-summary-chip.tsx`
- `frontend/src/features/diagram-workflow/components/compare-legend.tsx`
- `frontend/src/features/diagram-workflow/components/review-dropdown.tsx`
- `frontend/src/features/diagram-workflow/components/review-changes-dialog.tsx`
- `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
- `frontend/src/features/diagram-workflow/components/migration-summary.tsx`
- `frontend/src/features/diagram-workflow/components/migration-warning-list.tsx`
- `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
- `frontend/src/features/diagram-workflow/components/version-list-item.tsx`
- `frontend/src/features/diagram-workflow/components/version-view-badge.tsx`
- `frontend/src/features/diagram-workflow/components/restore-version-dialog.tsx`
- `frontend/src/features/diagram-workflow/components/restore-warning-panel.tsx`
- `frontend/src/features/diagram-workflow/components/create-version-dialog.tsx`

### Small original helper components that may be added

- small workflow UI helpers for shared header cards, summary blocks, or badge rows inside `frontend/src/features/diagram-workflow/components/`

## High-Risk Files To Avoid

Avoid changes if possible:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `packages/schema-sync-core/src/types.ts`

Reason:

- the requested work is presentation and UX polish, not a workflow-model rewrite
- these files are foundational to persistence, sync, and schema-model integrity

## Safe Implementation Plan

### Commit 1

`docs: analyze uploaded chartdb js patterns and map safe adaptation opportunities`

- add the analysis document
- add the adaptation plan

### Commit 2

`feat: improve editor chrome and workflow status presentation`

- refine desktop and mobile top navbar workflow grouping
- improve mode switcher clarity
- improve live/compare/version chip hierarchy
- polish compare legend placement and summary treatment

### Commit 3

`feat: refine compare review and migration ui presentation`

- improve review dialog structure and summary cards
- improve migration overview, validation, warnings, and execution sections
- keep logic intact while improving readability and sequencing

### Commit 4

`feat: polish versions and read-only workflow surfaces`

- improve versions panel and version list item styling
- improve create/restore dialogs and warning panels
- strengthen immutable/read-only messaging

### Commit 5

`test: validate build and workflow ui integrity after polish`

- run targeted tests for touched workflow components where feasible
- run a build or equivalent validation command
- commit any minimal test updates required by the UI polish

## Non-Goals

- no direct reuse of ChartDB code
- no bundled-code transplanting
- no broad frontend redesign unrelated to workflow polish
- no architectural change to mutable `Development`, derived `Compare`, immutable `Versions`, or restore semantics

## Originality Constraint

All implementation must be:

- written directly for SchemaDash
- adapted to existing SchemaDash components and conventions
- limited to safe UI/UX improvements
- materially distinct from the analyzed proprietary bundles
