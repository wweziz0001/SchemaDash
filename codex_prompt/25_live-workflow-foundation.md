You are Codex acting as a senior full-stack engineer and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: feature/live-workflow-foundation

PULL REQUEST TITLE: Add workflow foundation for Live Database and Development modes

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped to this phase only.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
Use these existing design documents in the repository as the source of truth for this phase:
- docs/live-database-development-compare-versions-design.md
- docs/live-db-compare-feature-map.md

The design recommends:
- keeping Development as the current mutable diagram
- introducing a workflow layer around it
- avoiding broad rewrites of SchemaDashProvider, StorageProvider, and PersistenceService
- introducing focused new modules/services/repositories for workflow state
- implementing compare rendering and full versions/restore later, not in this phase

MISSION:
Implement ONLY the safe foundational phase for the new workflow:
- workflow persistence groundwork
- live database binding state
- live snapshot state support
- development/live mode split in the editor chrome
- connection/sync status UI groundwork

Do NOT implement full compare rendering yet.
Do NOT implement full versions UI yet.
Do NOT implement restore-to-development yet.
Do NOT broadly refactor the editor core.

==================================================
PHASE SCOPE
==================================================

Implement these parts only:

1. Workflow persistence foundation
- add the minimal new backend persistence needed for diagram workflow state
- support a diagram-scoped workflow state that can track:
  - connection binding
  - live snapshot reference
  - sync status
  - connection status
  - last synced timestamp
  - optional default compare baseline metadata if easy to add safely

2. Live database binding
- allow a diagram to be bound to a saved connection without replacing Development
- ensure live sync/import can update a stored live snapshot separately from the mutable diagram

3. Live snapshot support
- store the live database schema snapshot separately from Development
- keep Development as the existing editable diagram document
- do not overwrite Development during live refresh

4. Editor chrome mode split
- add visible workflow controls in the top editor chrome for:
  - Development
  - Live Database
- Live Database should become enabled only when a live snapshot/binding exists
- Live Database view must be read-only
- Development remains the editable view

5. Status UI groundwork
- show compact connection/sync state in the editor chrome
- include status such as:
  - connected/disconnected
  - last synced
  - sync failed if relevant

==================================================
IMPLEMENTATION STRATEGY
==================================================

Follow the design docs.

Prefer introducing new focused modules such as:
- backend/src/routes/diagram-workflow-routes.ts
- backend/src/services/diagram-workflow-service.ts
- backend/src/repositories/diagram-workflow-repository.ts
- frontend/src/features/diagram-workflow/api/diagram-workflow-client.ts
- frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx
- frontend/src/features/diagram-workflow/components/workflow-mode-switcher.tsx
- frontend/src/features/diagram-workflow/components/live-status-chip.tsx

Minimize changes to these high-risk files:
- frontend/src/context/storage-context/storage-provider.tsx
- frontend/src/context/schemadash-context/schemadash-provider.tsx
- backend/src/services/persistence-service.ts
- backend/src/repositories/app-repository.ts
- backend/src/repositories/metadata-repository.ts
- frontend/src/features/schema-sync/lib/canonical-adapters.ts
- packages/schema-sync-core/src/types.ts

If any high-risk file must be modified:
- keep the change minimal
- isolate the change
- explain why it was necessary

==================================================
RULES
==================================================

Do NOT:
- implement full compare canvas rendering yet
- implement green/red add/remove overlays yet
- implement full versions/snapshots UX yet
- implement restore-to-development yet
- turn SchemaDashProvider into a multi-branch editor
- perform a broad repository refactor

Do:
- keep Development as the current mutable head
- make Live Database a separate read-only workflow view
- add only the minimum persistence and UI needed for this phase
- preserve runtime stability
- keep the feature testable

==================================================
VALIDATION REQUIREMENTS
==================================================

Verify:
- a diagram can be bound to a saved connection
- live snapshot state is stored separately from Development
- refreshing live state does not overwrite Development
- Development mode remains editable
- Live Database mode is read-only
- workflow state loads correctly for the current diagram
- top chrome shows the correct mode/status behavior

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. feat: add diagram workflow persistence foundation
2. feat: add live database binding and snapshot state support
3. feat: add development and live database mode controls in editor chrome
4. feat: add workflow connection and sync status UI
5. test: validate live workflow foundation behavior

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- files created
- files modified
- which high-risk files were avoided
- which high-risk files were changed and why
- what remains for later phases
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- workflow persistence exists
- live binding exists without replacing Development
- live snapshot state is separate from Development
- Development and Live Database modes are visible and usable
- Live Database is read-only
- no full compare implementation was attempted yet
- no broad editor-core rewrite was introduced
