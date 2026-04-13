You are Codex acting as a senior full-stack engineer and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: feature/versions-and-snapshots-workflow

PULL REQUEST TITLE: Add diagram versions and immutable snapshot workflow

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped to Versions / Snapshots workflow only.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
Use these design documents in the repository as the source of truth:
- docs/live-database-development-compare-versions-design.md
- docs/live-db-compare-feature-map.md

Assume previous phases are already complete:
- Development mode exists
- Live Database mode exists
- Compare mode exists
- Review / Migration workflow exists

Important architectural conclusions from the design docs:
- Development remains the mutable head.
- Versions must be immutable snapshots.
- Versions are per diagram, not per project.
- Versions should include canonical schema snapshot for compare integrity.
- Versions may also include diagram document/layout snapshot for historical review.
- Collaboration remains attached to Development only.
- Restore to Development is high risk and must be approached carefully.
- Do NOT turn SchemaDashProvider into a multi-branch editor.

MISSION:
Implement the Versions / Snapshots workflow for diagrams.

The feature should allow the user to:
- create immutable snapshots/versions of the current Development diagram
- view a list of versions for the current diagram
- inspect version metadata
- open a version in read-only mode
- compare Development against a selected version when appropriate

Do NOT broadly rewrite the editor architecture.
Do NOT convert the editor into a multi-branch live editor.
Do NOT introduce unrelated refactors.

==================================================
PHASE SCOPE
==================================================

Implement ONLY these parts:

1. Snapshot and version persistence
- Add the necessary backend persistence for immutable diagram snapshots and user-facing versions.
- Support storing:
  - canonical schema snapshot
  - diagram document/layout snapshot where needed
  - version metadata such as:
    - id
    - diagram_id
    - snapshot_id
    - name or label
    - optional description/note
    - created_at
    - created_by if available
    - origin if useful (manual / milestone / system)
- Keep snapshots immutable after creation.

2. Create Version flow
- Add a user action such as "Create Version" or "Create Snapshot" for the current diagram.
- Creating a version must:
  - use the current Development diagram as the source
  - capture a canonical schema snapshot
  - capture diagram/layout state if needed for historical rendering
  - store an immutable version record
- Support sane default naming if the user does not provide a custom name.

3. Versions listing UI
- Add a Versions surface for the current diagram.
- It may be:
  - a side panel
  - a drawer
  - a dedicated panel/page
- Each version item should show:
  - name or generated label
  - created time
  - created by if available
  - origin badge if implemented
  - optional note/description

4. Version read-only view
- Allow opening a version in a read-only inspection mode.
- The version view must not be editable.
- It must not attach collaboration editing flows.
- It should clearly communicate that the user is viewing an immutable snapshot.

5. Compare against version
- Allow using a selected version as a compare baseline where practical.
- Reuse the existing compare engine if possible.
- Keep this additive and safe:
  - baseline = selected version canonical schema
  - target = current Development canonical schema
- Do not rewrite compare mode broadly.

==================================================
OPTIONAL / LIMITED RESTORE SUPPORT
==================================================

Restore to Development is high risk.

If it is safe to implement in a narrow and controlled way, you may add a restore action ONLY if all of the following are true:
- the implementation remains explicit and server-validated
- the version itself remains immutable
- restore copies snapshot contents into Development rather than mutating the stored version
- a safety snapshot of current Development is created first when appropriate
- collaboration/runtime behavior remains stable

If safe implementation is not clearly achievable within this phase, do NOT force restore.
Instead:
- leave restore out
- document it as a later phase

==================================================
IMPLEMENTATION STRATEGY
==================================================

Follow the design docs.

Preferred/additive modules include:

Backend:
- backend/src/routes/diagram-versions-routes.ts
- backend/src/services/diagram-versions-service.ts
- backend/src/repositories/diagram-versions-repository.ts

Frontend:
- frontend/src/features/diagram-workflow/components/versions-panel.tsx
- frontend/src/features/diagram-workflow/components/create-version-dialog.tsx
- frontend/src/features/diagram-workflow/components/version-list-item.tsx
- frontend/src/features/diagram-workflow/components/version-view-badge.tsx
- frontend/src/features/diagram-workflow/lib/version-labels.ts

You may add other focused files if needed, but keep the design layered.

Minimize changes to these high-risk files:
- frontend/src/context/storage-context/storage-provider.tsx
- frontend/src/context/schemadash-context/schemadash-provider.tsx
- backend/src/services/persistence-service.ts
- backend/src/repositories/app-repository.ts
- backend/src/repositories/metadata-repository.ts
- frontend/src/features/schema-sync/lib/canonical-adapters.ts
- packages/schema-sync-core/src/types.ts

If a high-risk file must be modified:
- keep the change minimal
- isolate the change
- explain why it was necessary

==================================================
VERSIONS REQUIREMENTS
==================================================

Versions must be:
- immutable
- scoped per diagram
- readable in a user-friendly list
- safe to inspect without affecting Development
- usable as compare baselines

Recommended behavior:
- Development remains the only mutable head
- Versions are frozen copies of Development at a point in time
- versions should not become second editable branches

==================================================
READ-ONLY RULES
==================================================

Version views must:
- be non-editable
- not mutate Development
- not mutate the stored snapshot
- not start collaboration editing flows
- behave like historical review surfaces

==================================================
RULES
==================================================

Do NOT:
- broadly rewrite compare mode
- broadly rewrite migration flow
- implement arbitrary branching
- turn SchemaDashProvider into a multi-head editor
- introduce unrelated refactors

Do:
- keep the implementation additive
- keep versions immutable
- keep Development authoritative and mutable
- preserve runtime stability
- make the feature understandable and testable

==================================================
VALIDATION REQUIREMENTS
==================================================

Verify:
- a version can be created from current Development
- stored versions remain immutable
- versions list loads correctly for the current diagram
- a version can be opened in read-only mode
- version metadata is visible and understandable
- selected version can be used as a compare baseline if implemented
- Compare, Live Database, and Development still work normally after integration

If restore is implemented, also verify:
- restore is explicit
- a safety snapshot is created when appropriate
- Development changes, but the original version remains immutable
- runtime stability is preserved

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. feat: add immutable diagram snapshot and version persistence
2. feat: add create version flow and version metadata support
3. feat: add versions list and read-only version view
4. feat: add compare against selected version
5. test: validate version creation listing and read-only behavior

If restore is safely implemented:
6. feat: add controlled restore to development workflow
7. test: validate restore safety and immutability guarantees

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- files created
- files modified
- which high-risk files were avoided
- which high-risk files were changed and why
- whether restore was implemented or intentionally deferred
- what remains for later phases
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- versions/snapshots exist as immutable per-diagram records
- a version can be created from Development
- versions can be listed and viewed read-only
- compare against a selected version works if implemented
- Development remains the only mutable head
- no broad multi-branch editor rewrite was introduced
- restore is either implemented safely or explicitly deferred

==================================================
Git workflow is part of the acceptance criteria.
==================================================
The task is NOT complete unless:
- real commits were created
- commits follow the required logical sequence
- work is not left as one uncommitted patch
- final output includes the actual commit list

If implementation is correct but commits are missing or badly grouped, the task is considered incomplete.

==================================================
MANDATORY HANDOFF FILE REQUIREMENT
==================================================

When you finish the task, you must create or update a persistent handoff/context file inside the repository so future Codex sessions can quickly understand:

- what SchemaDash is
- the relevant architecture for this task
- what was changed in this task
- which files were created, modified, or intentionally avoided
- what remains unfinished
- what the next recommended step should be

Use a file such as one of these:
- docs/codex-handoff.md
- docs/context-handoff.md
- docs/implementation-handoff.md

Preferred file path:
docs/codex-handoff.md

This file must be written for a future Codex session that starts in a fresh chat with no prior memory.

==================================================
REQUIRED STRUCTURE OF THE HANDOFF FILE
==================================================

The handoff file must include these sections:

1. Project Overview
- what SchemaDash is
- the relevant product/architecture context for this task
- key concepts needed to understand the system area touched by this task

2. Current Architectural Context
- which parts of the system matter for this task
- important existing design docs to read first
- important high-risk files
- important service/module boundaries
- any relevant frontend/backend/shared package relationships

3. Task Completed
- what this task was trying to achieve
- what was actually implemented
- what decisions were made
- what approach was intentionally avoided and why

4. Files Changed
- list of files created
- list of files modified
- list of important files intentionally not changed
- brief purpose of each important file

5. Data / API / Workflow Changes
- any new models, routes, services, UI states, storage behavior, or workflow behavior
- any migrations, env vars, config changes, or compatibility handling

6. Validation Performed
- what was tested
- what was verified manually
- what remains unverified
- known limitations or risks

7. Outstanding Work
- what is not done yet
- what the next recommended implementation phase should be
- blockers, risks, or dependencies for the next phase

8. Instructions for the Next Codex Session
- exact reading order for future work
- exact files/docs the next session should inspect first
- what to avoid breaking
- where to continue implementation

9. Git Summary
- working branch
- pull request title
- commit list created for this task
- brief explanation of each commit

==================================================
HANDOFF QUALITY RULES
==================================================

- Write the handoff file as if the next Codex session knows nothing.
- Be concrete and repository-specific.
- Use real file paths only.
- Do not write vague summaries.
- Make it useful for continuing work in a fresh conversation.
- Keep it updated, not append-only chaos.
- If a previous handoff file exists, update it carefully instead of duplicating stale information.

==================================================
FINAL OUTPUT REQUIREMENT
==================================================

Before finishing, provide:
- the handoff file path
- a short summary of what was added to the handoff
- git status
- git log --oneline -n 20
