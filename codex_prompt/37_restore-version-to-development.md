Use the existing versions implementation as-is. Do not redesign the versions model. Only add the missing restore-to-development workflow safely.

You are Codex acting as a senior full-stack engineer and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: feature/restore-version-to-development

PULL REQUEST TITLE: Add controlled restore of immutable version into Development

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped to Restore to Development only.
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
- Versions / Snapshots workflow exists
- Versions are immutable
- Versions can be listed and opened read-only

Important architectural conclusions from the design docs:
- Development remains the only mutable head.
- Versions must remain immutable forever.
- Restore must copy the selected version into Development rather than mutating the stored snapshot.
- Restore is high risk and must be implemented carefully.
- Collaboration remains attached to Development only.
- Do NOT turn SchemaDashProvider into a multi-branch editor.
- Do NOT make the version itself editable after restore.

MISSION:
Implement a controlled and safe "Restore to Development" workflow for diagram versions.

The goal is:
- the user selects an immutable version
- the system restores that version into the current Development document
- the original stored version remains immutable
- the restore is explicit, validated, and safe

==================================================
PHASE SCOPE
==================================================

Implement ONLY these parts:

1. Restore action entry point
- Add a Restore to Development action in the versions UI for eligible versions.
- The action must be explicit and not ambiguous.
- The action must not auto-run without confirmation.

2. Restore confirmation flow
- Before applying restore, show a confirmation dialog/panel that explains:
  - the selected version will be copied into Development
  - the original version will remain unchanged
  - current Development content will be replaced
  - a safety snapshot of the current Development state should be created first when possible
- The UI must clearly communicate risk and consequence.

3. Safety snapshot before restore
- Before restoring, create an automatic safety snapshot/version of the current Development state when appropriate.
- This safety snapshot should preserve the current Development state before it is replaced.
- It should be clearly marked with an origin such as:
  - before_restore
  - system
- If safety snapshot creation fails, do not proceed silently.

4. Server-validated restore flow
- Restore must be handled as a server-validated workflow, not just a client-side state swap.
- The backend should:
  - validate access/permission
  - validate selected version existence
  - confirm diagram ownership/scope
  - create the safety snapshot if required
  - copy the selected version contents into the current Development document
  - preserve version immutability
  - return an understandable result

5. Development replacement behavior
- After restore succeeds:
  - Development becomes the restored content
  - the restored version itself remains immutable
  - collaboration/runtime state should remain stable
  - the editor should load the restored Development cleanly

6. Restore result UX
- Show clear success/failure states.
- On success, indicate that Development now reflects the selected version.
- On failure, show a meaningful, actionable error.
- Avoid silent partial restore behavior.

==================================================
IMPLEMENTATION STRATEGY
==================================================

Follow the design docs.

Preferred/additive modules include:

Backend:
- backend/src/routes/diagram-version-restore-routes.ts
- backend/src/services/diagram-version-restore-service.ts

Frontend:
- frontend/src/features/diagram-workflow/components/restore-version-dialog.tsx
- frontend/src/features/diagram-workflow/components/restore-warning-panel.tsx
- frontend/src/features/diagram-workflow/lib/restore-messages.ts

You may reuse existing versions modules where appropriate, but keep the restore logic isolated and explicit.

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
RESTORE SAFETY REQUIREMENTS
==================================================

Restore must satisfy all of the following:

- the selected version remains immutable
- restore copies content into Development
- current Development is preserved first through a safety snapshot when possible
- restore requires explicit user confirmation
- restore is permission-checked on the server
- restore failure must not silently corrupt Development
- restore success must leave the system in a consistent state

Do NOT:
- mutate the stored version record
- convert versions into editable branches
- directly bypass normal Development persistence semantics
- make restore a client-only operation

==================================================
COLLABORATION / STATE RULES
==================================================

- Development remains the only collaboration-enabled mutable head.
- Version views remain read-only before and after restore.
- After restore, the editor should continue operating on Development normally.
- Avoid destabilizing current collaboration/session behavior.
- Do not introduce broad orchestration rewrites.

==================================================
RULES
==================================================

Do NOT:
- implement unrelated feature work
- rewrite Compare mode
- rewrite Versions architecture
- create arbitrary branching
- turn SchemaDashProvider into a multi-head editor
- introduce broad refactors

Do:
- keep the implementation additive
- keep restore isolated and server-controlled
- preserve immutability guarantees
- preserve runtime stability
- make restore understandable and testable

==================================================
VALIDATION REQUIREMENTS
==================================================

Verify:
- a version can be selected for restore
- restore always requires explicit confirmation
- a safety snapshot is created before restore when appropriate
- after restore, Development reflects the selected version
- the original version remains unchanged/immutable
- version listing still works
- read-only version viewing still works
- Development editing still works after restore
- Compare / Live Database / Migration workflows still behave normally after restore

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. feat: add restore to development action and confirmation flow
2. feat: add server-controlled restore workflow and safety snapshot support
3. feat: apply restored version into development while preserving immutability
4. feat: add restore success and failure UX
5. test: validate restore safety immutability and development replacement behavior

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- files created
- files modified
- which high-risk files were avoided
- which high-risk files were changed and why
- how immutability was preserved
- how safety snapshots were handled
- what remains for later phases
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- restore to development exists
- restore is explicit and confirmed
- restore is server-validated
- versions remain immutable
- development is replaced safely by copying from the selected version
- safety snapshot behavior exists when appropriate
- no broad multi-branch editor rewrite was introduced

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
