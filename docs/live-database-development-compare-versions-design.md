# Live Database, Development, Compare, and Versions Design

## Executive Summary

SchemaDash already has the beginnings of a schema-sync system, but the current product workflow is still centered on a single mutable diagram document. Today, when a user connects to a live database, the main decision is whether to replace the current canvas or create a new diagram from the imported schema. That works for import and one-shot sync, but it does not support the richer schema evolution workflow described in this proposal.

The target workflow introduces four first-class concepts for each diagram:

- `Live Database`: a read-only representation of the last synchronized live database schema for the connected database.
- `Development`: the editable working schema for planning changes inside SchemaDash.
- `Compare`: a visual diff between the live schema and the current development schema.
- `Versions / Snapshots`: immutable historical snapshots of a diagram's development state for review, restore, and change tracking.

This model lets live schema state and in-progress design state coexist instead of forcing the user to choose one or the other. It also turns comparison and history into product features instead of incidental byproducts of import/apply. The result is a safer schema evolution workflow that better fits local/self-hosted SchemaDash.

## Current State Analysis

### How database import and connection currently work

Existing live database connectivity is implemented as an operational schema-sync workflow:

- `frontend/src/features/schema-sync/dialogs/schema-sync-dialog.tsx`
  - Provides a modal with three tabs: connection management, live import, and preview/apply.
- `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
  - Loads saved connections.
  - Imports a live schema with two modes: `replace` or `new`.
  - Converts canonical schema payloads into the editor `Diagram`.
  - Stores baseline snapshot metadata back into `diagram.schemaSync`.
- `frontend/src/features/schema-sync/components/schema-sync-toolbar-button.tsx`
  - Exposes the workflow through a single `Schema Sync` toolbar button.
- `backend/src/routes/schema-sync-routes.ts`
  - Defines `/api/connections`, `/api/schema/import-live`, `/api/schema/diff`, `/api/schema/apply`, and audit/job read endpoints.
- `backend/src/services/connections-service.ts`
  - Stores encrypted connection secrets and performs connection tests.
- `backend/src/services/schema-sync-service.ts`
  - Introspects PostgreSQL, stores snapshots, and generates change plans.
- `backend/src/services/apply-service.ts`
  - Revalidates live drift, runs SQL, and writes pre/post-apply snapshots and audit records.
- `backend/src/repositories/metadata-repository.ts`
  - Persists connections, snapshots, change plans, apply jobs, and audits in the metadata SQLite database.

### Current schema-sync related models and files

Reusable existing pieces:

- `packages/schema-sync-core/src/types.ts`
  - Canonical schema types, change plan types, warnings, and API schemas.
- `packages/schema-sync-core/src/diff.ts`
  - Canonical diff logic and matching heuristics for tables, columns, keys, and constraints.
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
  - Canonical schema <-> editor diagram adapters.
- `frontend/src/lib/domain/schema-sync.ts`
  - Diagram-level sync metadata currently limited to baseline/import/apply pointers.
- `docs/architecture/schema-sync-architecture.md`
  - Documents the current import/diff/apply architecture.

### Current version, history, and changelog related modules

There is no existing product-level version/snapshot system for diagrams.

What exists instead:

- `frontend/src/context/history-context/history-provider.tsx`
  - Undo/redo for the current editing session only.
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
  - Holds one mutable current diagram in React state.
- `backend/src/repositories/app-repository.ts`
  - Stores one `document_json` payload per diagram plus `document_version` for optimistic concurrency.
- `backend/src/services/persistence-service.ts`
  - Uses `documentVersion` to prevent overwrite conflicts during collaboration saves.
- `docs/architecture/project-backup-format.md`
  - Backup/export for projects and diagrams, but not historical per-diagram versions.

Important distinction:

- Current `documentVersion` is a collaboration/concurrency counter.
- Current undo/redo is session-local editing history.
- Neither is a user-facing immutable schema snapshot/version feature.

### What already exists that can be reused

Strong reuse candidates:

- Canonical schema model in `packages/schema-sync-core/src/types.ts`
- Canonical diff matching behavior in `packages/schema-sync-core/src/diff.ts`
- Canonical/editor adapters in `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- Encrypted connection storage in `backend/src/services/connections-service.ts`
- Live database introspection in `backend/src/postgres/introspection.ts`
- Diagram/project persistence and sharing model in `backend/src/services/persistence-service.ts`
- Diagram collaboration/session model in `backend/src/services/persistence-service.ts` and `frontend/src/context/storage-context/storage-provider.tsx`

### What is missing

Missing for the target workflow:

- A diagram-scoped workflow state that distinguishes live schema, development schema, compare mode, and versions.
- A way to keep live schema and development schema side by side without replacing the editable diagram.
- A compare result model suitable for visual diff rendering instead of SQL plan generation.
- Immutable per-diagram versions/snapshots.
- A UI mode switcher for `Live Database`, `Development`, and `Compare`.
- A list/detail UI for versions and snapshot restore/compare actions.
- Backup/export support for workflow snapshots if long-term portability is required.

## Proposed Product Model

### Primary concepts

#### Live Database

`Live Database` is the latest successfully synchronized read-only schema snapshot for a diagram's connected database. It should:

- be clearly connected to a saved database connection
- show connection/sync status in the editor chrome
- never be directly editable on the main development canvas
- be refreshable from the live database by an authorized user

This is not "the diagram itself." It is a read-only baseline attached to the diagram workflow.

#### Development

`Development` is the existing editable SchemaDash diagram document. It remains the authoritative mutable head for the diagram:

- users draw and edit here
- collaboration sessions remain attached here
- save, rename, share, and access rules continue to apply here

For the safest first implementation, the current `Diagram` model should continue to represent the development head only.

#### Compare

`Compare` is a derived visualization between:

- baseline: `Live Database` or a selected immutable version
- target: current `Development`

Compare is read-only. It should not create a second editable branch in the same provider. Instead, it overlays semantic diff information onto a rendered canvas using development layout where possible.

#### Version / Snapshot

A `Version` is an immutable saved snapshot of a diagram's development state at a point in time. A version should include:

- canonical schema snapshot for compare integrity
- rendered diagram/layout snapshot for historical review
- metadata such as name, note, author, and timestamp

`Snapshot` is the broader storage concept. Versions are user-facing named or timestamped snapshots. Some snapshots may also be system-generated, such as `before restore` or `post-apply bookmark`.

#### Current editable version

The current editable version is simply the existing mutable diagram document. It behaves like a branch head:

- mutable
- collaboration-enabled
- saveable many times
- source for creating immutable versions

#### Published / immutable snapshot

Snapshots/versions should be immutable after creation. Restoring a snapshot should copy its contents into Development instead of modifying the stored snapshot.

### Relationship to diagrams, projects, and collections

- Versions are scoped per diagram, not per project or collection.
- Projects and collections remain organizational containers for diagrams.
- A diagram may optionally have one live database binding.
- Versions inherit the parent diagram's ownership and access model.

### Relationship to sync state

The workflow state should track:

- connected database reference
- last live snapshot id and fingerprint
- selected schemas
- sync status and timestamps
- default compare baseline

This state should sit beside the diagram, not replace the diagram.

### Relationship to collaboration and sharing

Recommended initial rules:

- Collaboration remains attached to Development only.
- Live Database, Compare, and historical Version views are read-only.
- Users with diagram `view` access can inspect live/compare/version data.
- Users with diagram `edit` access can create versions and restore into Development.
- Database refresh/apply authority remains more restrictive and should continue following operational/admin rules from the schema-sync backend.

## Proposed Data Model

### Data model direction

Use two persistence zones intentionally:

- `app` persistence for diagram-scoped product workflow state and user-facing versions
- `metadata` persistence for operational connection secrets, live introspection jobs, change plans, and apply audits

This separation preserves the current security model while allowing diagram versions to behave like first-class project content.

### 1. `diagram_workflow_state`

Purpose:

- Stores mutable per-diagram workflow metadata.
- Connects the development head to its live database state and default compare settings.

Main fields:

- `diagram_id`
- `connection_id` nullable
- `connection_name_cache`
- `connection_engine`
- `imported_schemas_json`
- `live_snapshot_id` nullable
- `live_fingerprint` nullable
- `sync_status` enum
  - suggested values: `disconnected`, `connected`, `syncing`, `in_sync`, `drifted`, `error`
- `connection_status` enum
  - suggested values: `unknown`, `ok`, `failed`
- `last_connected_at`
- `last_synced_at`
- `last_sync_error`
- `default_compare_source_kind`
  - `live` or `version`
- `default_compare_source_id` nullable
- `updated_at`

Persistence location:

- App database, because this is diagram product state and should travel with the diagram lifecycle.

Relationship to existing models:

- One-to-one with existing `app_diagrams`.
- Replaces the need to overload `diagram.schemaSync` with all future workflow behavior.
- Existing `diagram.schemaSync` can remain as compatibility metadata during migration and gradually become a thin pointer/cache.

### 2. `diagram_workflow_snapshots`

Purpose:

- Stores immutable schema/document snapshots used for live state and versions.

Main fields:

- `id`
- `diagram_id`
- `snapshot_kind`
  - suggested values: `live`, `version`, `system`
- `source_kind`
  - suggested values: `introspection`, `development`, `restore`, `apply`
- `connection_id` nullable
- `fingerprint`
- `canonical_schema_json`
- `diagram_document_json` nullable
- `layout_source`
  - suggested values: `captured`, `derived`, `auto_layout`
- `based_on_snapshot_id` nullable
- `created_by_user_id` nullable
- `created_at`

Persistence location:

- App database.

Relationship to existing models:

- Many snapshots per diagram.
- `live` snapshots provide read-only live state.
- `version` snapshots provide historical immutable development states.

Why store both canonical and diagram payloads:

- canonical schema is needed for accurate compare logic
- diagram document/layout is needed for historical review and compare rendering with stable coordinates

### 3. `diagram_versions`

Purpose:

- Stores user-facing version metadata and naming separate from raw snapshot storage.

Main fields:

- `id`
- `diagram_id`
- `snapshot_id`
- `name` nullable
- `description` nullable
- `version_label`
- `created_by_user_id` nullable
- `created_at`
- `pinned` boolean
- `origin`
  - suggested values: `manual`, `before_restore`, `before_apply`, `milestone`

Persistence location:

- App database.

Relationship to existing models:

- One version points to one immutable snapshot.
- Many versions per diagram.
- Keeps user-facing version UX separate from lower-level snapshot storage.

### 4. Live database connection metadata

Purpose:

- Existing connection metadata already exists, but the diagram needs a stable binding to one connection and schema selection.

Main fields:

- continue using existing `connections` storage in `backend/src/repositories/metadata-repository.ts`
- bind via `diagram_workflow_state.connection_id`

Persistence location:

- Connection secrets remain in the metadata database.
- Binding state lives in the app database.

### 5. Development schema state

Purpose:

- No new primary entity is required for the mutable development head if the existing diagram document remains authoritative.

Main fields:

- existing `app_diagrams.document_json`
- existing `document_version`
- existing collaboration metadata

Persistence location:

- App database via `app_diagrams`.

Relationship to existing models:

- Development is the current diagram document.
- Versions are frozen copies of Development.

### 6. Compare result model

Purpose:

- Represents derived compare output for UI rendering.

Main fields:

- not recommended as a persisted primary entity in v1
- compute on demand from two canonical schemas
- optional short-lived cache keyed by `(leftFingerprint, rightFingerprint, compareOptions)`

Persistence location:

- derived in memory on the backend or frontend
- optional transient client cache only

Relationship to existing models:

- references one baseline snapshot and one target state
- does not become source-of-truth data

### 7. Comparison baseline metadata

Purpose:

- Remembers the user's default compare source for a diagram.

Main fields:

- `default_compare_source_kind`
- `default_compare_source_id`

Persistence location:

- `diagram_workflow_state`

## Proposed UI / UX Model

### Top toolbar / mode switcher

Replace the single-purpose schema-sync affordance with a workflow-aware control set:

- mode tabs or segmented controls:
  - `Development`
  - `Live Database`
  - `Compare`
- retain a secondary connection/settings button for managing connection details and refresh/apply actions

Recommended behavior:

- `Development` is always visible
- `Live Database` becomes enabled after a successful live connection/import
- `Compare` becomes enabled once both Development and a compare baseline exist

### Connection success indicator

When a diagram is bound to a connection, show a compact status area in the top bar:

- `Connected to <connection name>`
- `Last synced <timestamp>`
- status badge:
  - `In sync`
  - `Drifted`
  - `Sync failed`
  - `Never synced`

### Status chips

Recommended chips:

- `Live`
- `Development`
- `Compare`
- `Last synced`
- `Connection failed` for failure state
- `Readonly` for live/version/compare modes

### Compare mode visual conventions

Canvas visual rules:

- Development-only additions:
  - green tint
  - plus icon or `+` badge
- Live-only items:
  - red tint
  - minus icon or `-` badge
- Changed items on both sides:
  - amber or blue neutral change marker
  - field-level badges for changed properties

Recommended scope:

- tables
- relationships
- fields/columns
- custom types where already represented in canonical schema
- metadata details where practical:
  - type
  - nullability
  - default
  - PK/unique
  - comments

### Relationship compare behavior

- A relationship present only in Development is green.
- A relationship present only in Live is red.
- A relationship with same endpoints but changed actions or cardinality metadata should be marked as changed, not removed+added if stable identifiers allow it.
- In dense canvases, relationship diff badges should remain legible even if the line style does most of the work.

### Version / snapshot UI

Recommended UI surfaces:

- right-side drawer or left panel section: `Versions`
- primary actions:
  - `Create snapshot`
  - `Compare to version`
  - `Restore to Development`
  - `Open read-only`

Each version row should show:

- name or timestamp fallback
- author if available
- created time
- origin badge
- optional short note

### Empty states

Recommended empty states:

- no live connection:
  - explain that Development is editable and Live Database activates after connection
- no live snapshot yet:
  - show `Connect and sync to enable Live Database and Compare`
- no versions yet:
  - show `Create a snapshot before major changes`

### Failure states

Need explicit handling for:

- connection test failure
- live sync/import failure
- compare source missing
- stale live snapshot
- version restore conflict
- insufficient permission for refresh/apply

### State transitions

Safe state transitions:

- first connect:
  - Development remains untouched
  - live snapshot is stored separately
  - Live Database and Compare become available
- refresh live:
  - updates live snapshot only
  - does not overwrite Development
- create version:
  - freezes current Development into immutable snapshot+version records
- restore version:
  - optionally auto-create a `before restore` version first
  - copies version contents into Development

## Compare Engine Design

### What is being compared

Primary compare inputs:

- left baseline:
  - live snapshot canonical schema, or selected version canonical schema
- right target:
  - current Development canonical schema, or optionally another version later

### Normalization / canonicalization strategy

Use canonical schema as the compare source of truth.

Recommended approach:

1. Convert Development `Diagram` to `CanonicalSchema` using the existing adapter path in `frontend/src/features/schema-sync/lib/canonical-adapters.ts`.
2. Store/fetch live and version snapshots as canonical schema payloads.
3. Compare canonical-to-canonical rather than diagram-to-diagram.

This reuses the most stable existing abstraction and avoids UI-specific compare heuristics.

### Table compare

Table matching priority:

1. `sync.sourceId` when available
2. qualified `schema.table` identity
3. controlled rename heuristics only if compare result explicitly needs rename classification

Table statuses:

- `added`
- `removed`
- `changed`
- `unchanged`

### Field compare

For matched tables, compare columns by:

1. `sync.sourceId`
2. normalized column name

Changed properties to detect:

- name
- type / custom type reference
- nullability
- default value
- primary key participation
- uniqueness
- identity/serial markers
- comments

### Relationship compare

Compare relationships from canonical foreign keys, keyed by:

1. `sync.sourceId`
2. stable endpoint signature:
   - local table
   - local columns
   - referenced table
   - referenced columns

Detect:

- added
- removed
- changed
  - `onDelete`
  - `onUpdate`
  - endpoint changes

### Metadata compare

Metadata compare should remain practical, not exhaustive, in the first release.

Recommended v1 metadata scope:

- table kind (`table` vs `view`)
- table comment
- column type/default/nullability/comment
- PK/unique/index/check/FK definitions
- custom types already modeled in canonical schema

### Detecting added / removed / changed items

Do not directly use `ChangePlan` as the UI diff model.

Reason:

- `ChangePlan` is directional and optimized for SQL generation.
- visual compare needs a symmetric, render-focused result with nested entity statuses and layout hints.

Recommended implementation:

- add a new compare module in `packages/schema-sync-core`, for example:
  - `packages/schema-sync-core/src/compare.ts`
  - `packages/schema-sync-core/src/compare-types.ts`
- reuse normalization and match-key helpers from `diff.ts` where practical
- keep output render-oriented:
  - per table, per field, per relationship status
  - summary counts
  - optional property-level deltas

### Persisted or on-demand

Recommendation:

- compute compare results on demand
- optionally memoize by schema fingerprints in memory
- do not persist compare results as primary data in v1

### Layout preservation during compare

Preferred layout behavior:

- base canvas uses Development layout for shared and development-only items
- live-only items use stored live snapshot layout when available
- if a live-only item has no usable layout, auto-place it in a compare overflow lane or run a small focused layout pass

This avoids disturbing the editable development layout while still letting removed/live-only items be visible.

## Version / Snapshot Design

### How a version is created

User flow:

1. User clicks `Create snapshot`
2. Current Development diagram is converted to canonical schema
3. Current Development diagram document is copied
4. Immutable snapshot is stored
5. User-facing version metadata is stored

Optional metadata:

- name
- note
- origin

### Are versions immutable

Yes. Versions should be immutable.

Restoring a version should:

- optionally create an automatic safety snapshot of current Development
- copy the version snapshot into Development
- increment normal development save/concurrency state

### Does Development point to a mutable head

Yes. Development is the mutable head and remains the current diagram document.

### Are versions per diagram

Yes. Versions should be per diagram.

Project-level history can be considered later, but the user request is fundamentally per-diagram schema evolution.

### Can compare target a version

Yes, and this should be designed in from the start even if the first UI exposes only:

- Live vs Development

Recommended compare source options:

- `Live Database`
- `Selected Version`

### Interaction with collaboration and sharing

Recommended rules:

- Live/version/compare canvases are view-only
- Collaboration cursors/sessions remain Development-only
- Shared viewers can inspect versions if they can view the parent diagram
- Restore/create-snapshot actions require edit access
- Live refresh/apply keeps current schema-sync operational restrictions

## Risk / Coupling Analysis

### `frontend/src/context/storage-context/storage-provider.tsx`

Likely impact:

- Very high. It is the largest client persistence/orchestration layer and already mixes Dexie cache, remote persistence sync, sharing, sessions, and backup flows.

Recommendation:

- Avoid turning this provider into the primary implementation home for live/development/version workflow rules.
- Prefer a new focused client feature layer such as `frontend/src/features/diagram-workflow/*`.
- If client-side caching is needed, add isolated workflow methods and dedicated Dexie tables rather than threading new branching logic through existing generic diagram methods.

Safer extension points:

- new workflow API client
- optional dedicated storage adapter methods for workflow records only
- leave current diagram CRUD semantics intact

### `frontend/src/context/schemadash-context/schemadash-provider.tsx`

Likely impact:

- Extremely high. This provider assumes one mutable current diagram and directly owns every editing mutation path.

Recommendation:

- Do not refactor this provider into a multi-branch/multi-mode source of truth in the first implementation.
- Keep it authoritative for Development only.
- Put live/version/compare state in a separate workflow provider above or alongside it.

Safer extension points:

- readonly mode selector from a higher-level workflow context
- derived compare overlays that consume `currentDiagram`
- explicit `load version into development` action instead of dual-edit state

### `backend/src/services/persistence-service.ts`

Likely impact:

- Very high. This service already handles projects, diagrams, sharing, collaboration sessions, search, and backups.

Recommendation:

- Avoid mixing live connection orchestration and compare/version logic deeply into this service.
- Add a dedicated `diagram-workflow-service.ts` for workflow operations.
- Keep only narrow integration points here, such as backup import/export hooks if needed later.

Safer extension points:

- new service and route module for workflow endpoints
- reuse existing access checks and diagram lookup helpers

### `backend/src/repositories/app-repository.ts`

Likely impact:

- Very high. It is a central repository with migrations and broad CRUD behavior for core app entities.

Recommendation:

- Minimize direct changes.
- A small additive migration for new workflow tables is likely unavoidable.
- Prefer a new repository focused on workflow tables and methods instead of expanding `AppRepository` into another large surface.

Safer extension points:

- new repository class such as `diagram-workflow-repository.ts`
- narrow helper methods for diagram existence/access if needed
- additive migrations only

### `backend/src/repositories/metadata-repository.ts`

Likely impact:

- Medium to high. It currently owns operational schema-sync state.

Recommendation:

- Keep connection secrets, change plans, apply jobs, and audits here.
- Avoid turning this repository into the long-term home for user-facing diagram versions.
- It can remain the source for operational live import/apply artifacts.

Safer extension points:

- keep using for connections and apply audit chains
- optionally add lookup helpers needed to bridge live refresh to diagram workflow state

### `frontend/src/features/schema-sync/lib/canonical-adapters.ts`

Likely impact:

- Medium to high. It is a key bridge between canonical and editor models.

Recommendation:

- Reuse it heavily.
- Keep it focused on mapping between models.
- Do not fold compare visualization concerns into these adapters.

Safer extension points:

- add helper exports for snapshot creation or normalization
- create separate compare adapter/render helpers beside it

### `packages/schema-sync-core/src/types.ts`

Likely impact:

- High. Shared type changes affect backend, frontend, package builds, and tests.

Recommendation:

- Prefer additive new types for compare results and workflow DTOs.
- Do not break existing diff/apply request/response contracts.
- Avoid repurposing existing `ChangePlan` or `DiagramSchemaSync` types into something much broader.

Safer extension points:

- new compare result schemas
- new workflow DTO schemas
- additive fields only where backward compatible

## Recommended Architecture Strategy

### Core strategy

Implement the feature set as a workflow layer around the existing Development diagram, not as a rewrite of the editor core.

### Recommended new backend modules

- `backend/src/routes/diagram-workflow-routes.ts`
- `backend/src/services/diagram-workflow-service.ts`
- `backend/src/repositories/diagram-workflow-repository.ts`

Responsibilities:

- diagram live binding state
- live snapshot persistence
- version creation/listing/restore
- compare baseline selection
- workflow-specific read APIs

### Recommended new frontend modules

- `frontend/src/features/diagram-workflow/api/diagram-workflow-client.ts`
- `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
- `frontend/src/features/diagram-workflow/components/workflow-mode-switcher.tsx`
- `frontend/src/features/diagram-workflow/components/live-status-chip.tsx`
- `frontend/src/features/diagram-workflow/components/versions-panel.tsx`
- `frontend/src/features/diagram-workflow/lib/compare-render-model.ts`

Responsibilities:

- load workflow state for current diagram
- switch between Development, Live, and Compare views
- expose version actions
- keep `SchemaDashProvider` focused on Development editing

### Compare engine boundary

Recommended package boundary:

- `packages/schema-sync-core/src/compare.ts`

This module should:

- accept canonical inputs only
- return render-ready compare results
- stay independent from React, Fastify, or storage details

### Snapshot service boundary

Snapshot rules:

- backend creates immutable snapshots
- frontend requests creation and lists metadata
- restore is server-validated and explicit

### Local live-schema state boundary

Do not store live schema as a second mutable editor document inside `SchemaDashProvider`.

Instead:

- Development remains the current mutable diagram
- live snapshots are loaded as read-only workflow data
- compare mode combines Development with workflow snapshot data

### Minimal changes to orchestration files

Prefer:

- small top-navbar integration
- additive editor-page workflow provider wrapping
- additive backend routing

Avoid:

- large-scale rewrites of storage, persistence, or editing providers

## Phased Implementation Plan

### Phase 1: Workflow model and compare contract groundwork

Goal:

- Introduce workflow types, snapshot/version schema, and compare result contracts without changing editing behavior.

Affected files:

- `packages/schema-sync-core/src/types.ts`
- new `packages/schema-sync-core/src/compare.ts`
- new backend workflow repository/service/route files
- minimal app database migration additions

Risk level:

- Medium

Test / verification:

- unit tests for compare result typing and matching
- migration tests for new workflow tables
- API contract tests for workflow endpoints

### Phase 2: Live database state support

Goal:

- Allow a diagram to connect to a live database and store live snapshots separately from Development.

Affected files:

- `frontend/src/features/schema-sync/context/schema-sync-context.tsx`
- new workflow frontend modules
- backend workflow service
- `backend/src/services/schema-sync-service.ts`

Risk level:

- Medium to high

Test / verification:

- integration test for connect -> refresh live snapshot -> workflow state update
- manual check that Development is not overwritten by live refresh

### Phase 3: Development / Live split in the editor chrome

Goal:

- Introduce visible `Development` and `Live Database` modes with clear read-only behavior.

Affected files:

- `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
- editor page composition files
- new workflow mode switcher components

Risk level:

- Medium

Test / verification:

- component tests for mode visibility and enablement
- manual validation for readonly protections in Live mode

### Phase 4: Compare mode visual engine

Goal:

- Render visual compare overlays between Live and Development using canonical compare results.

Affected files:

- compare core module
- workflow compare rendering helpers
- canvas/relationship rendering integration points

Risk level:

- High

Test / verification:

- unit tests for added/removed/changed classification
- visual regression or screenshot tests where available
- manual validation for table, field, and relationship diffs

### Phase 5: Versions / snapshots

Goal:

- Add immutable version creation, list, compare-to-version, and restore-to-development flows.

Affected files:

- workflow repository/service/routes
- versions panel UI
- backup/export integration if included in this phase

Risk level:

- Medium to high

Test / verification:

- integration tests for create version, restore version, compare version
- manual validation that restore preserves immutable history

### Phase 6: Polish, retention, and portability

Goal:

- Refine status language, empty states, snapshot retention, and backup/export coverage.

Affected files:

- workflow UI components
- optional backup schema files
- operational docs

Risk level:

- Low to medium

Test / verification:

- end-to-end smoke tests
- backup/import tests if workflow data is exported
- permissions regression checks

## Readiness and Recommendation

### What should be implemented first

Implement first:

- workflow state model
- live snapshot persistence separate from Development
- compare contracts based on canonical schemas

These three pieces unlock the rest without forcing a large editor rewrite.

### What should wait

Wait until later phases:

- restore/version portability in backups
- project/library-level version indicators
- advanced compare against arbitrary pairs of versions
- aggressive client-side caching in Dexie

### What is high risk

Highest-risk areas:

- changing `SchemaDashProvider` into a multi-document editor
- expanding `storage-provider.tsx` with broad mode-branch logic
- overloading `ChangePlan` to serve both apply and visual compare
- storing user-facing version history only in `metadata-repository.ts`
- broad rewrites inside `persistence-service.ts`

### Is the system ready

Yes, with constraints.

The repository is ready for this feature set if implementation stays additive and layered:

- reuse canonical schema and diff foundations
- keep Development as the current diagram
- treat Live/Compare/Versions as a workflow layer around that diagram

The repository is not ready for a safe implementation if the feature is approached as a full editor-state rewrite in a single pass.

### Recommended delivery order

1. Add workflow persistence and compare contracts.
2. Add live snapshot support without replacing Development.
3. Add UI mode switching for Development and Live.
4. Add compare rendering.
5. Add immutable versions and restore flows.
6. Expand backup/export and polish.
