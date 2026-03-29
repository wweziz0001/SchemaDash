You are Codex acting as a senior <ROLE> for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: <BRANCH_NAME>

PULL REQUEST TITLE: <PR_TITLE>

==================================================
GIT WORKFLOW REQUIREMENTS
==================================================

- Work only on the specified repository and branch.
- Keep changes scoped to the requested task.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

==================================================
MISSION
==================================================

<TASK_DESCRIPTION>

==================================================
CONTEXT
==================================================

Use all existing repository context and relevant design docs before making changes.

Important existing docs to inspect first if relevant:
- docs/codex-handoff.md
- docs/codex-session-log.md
- docs/live-database-development-compare-versions-design.md
- docs/live-db-compare-feature-map.md
- docs/system-improvements-assessment.md
- docs/system-improvements-backlog.md
- docs/local-sync-architecture.md
- docs/repository-organization-plan.md
- docs/repository-organization.md

Important known high-risk files/modules:
- frontend/src/context/storage-context/storage-provider.tsx
- frontend/src/context/schemadash-context/schemadash-provider.tsx
- backend/src/services/persistence-service.ts
- backend/src/repositories/app-repository.ts
- backend/src/repositories/metadata-repository.ts
- frontend/src/features/schema-sync/lib/canonical-adapters.ts
- packages/schema-sync-core/src/types.ts

General architectural caution:
- Prefer additive, focused modules over broad rewrites.
- Avoid unnecessary changes to high-risk orchestration files.
- Keep Development/editor behavior stable unless the task explicitly requires changing it.
- Preserve runtime stability and keep the system testable throughout the task.

==================================================
IMPORTANT RULES
==================================================

- Do NOT introduce unrelated changes.
- Do NOT perform broad refactors unless explicitly requested.
- Do NOT move files/folders unless this task explicitly requires it.
- Do NOT rename files/modules unless this task explicitly requires it.
- Prefer safe, incremental implementation.
- If compatibility matters, add compatibility handling rather than risky breakage.
- Use real repository files and actual code paths only.
- Be repository-specific, not generic.
- If a previous design document exists for this area, follow it unless there is a strong code-grounded reason not to.
- If you change a high-risk file, keep the change minimal and explain why.

==================================================
PHASES
==================================================

PHASE 0 — READ FIRST
Before implementing:
- read docs/codex-handoff.md if it exists
- read the most relevant design/assessment docs for this task
- inspect the actual repository files involved
- identify the minimum safe implementation path

PHASE 1 — ANALYZE
- identify the current implementation state
- identify affected files/modules
- identify risks and dependencies
- identify what can be reused
- identify what should be avoided

PHASE 2 — DESIGN / PLAN
- define the implementation plan for this task
- prefer focused modules/services/components if needed
- keep risky integration points minimal
- if useful, create or update a design doc before major code changes

PHASE 3 — IMPLEMENT
- implement the requested task in logical, safe steps
- keep code, config, docs, and tests aligned where relevant
- preserve runtime stability

PHASE 4 — VALIDATE
- verify the requested behavior
- run appropriate checks/build/tests if available
- confirm imports/config/routes/state still work
- document what was validated and what remains unverified

PHASE 5 — DOCUMENT / HANDOFF
- update or create the required documentation
- update the persistent Codex handoff file
- optionally update the session log

==================================================
COMMIT DISCIPLINE
==================================================

Create real commits during the task.

Rules:
- Do not leave all changes until the end.
- Do not provide only suggested commit messages.
- Do not squash everything into one giant commit.
- Commit after each major logical phase.

Suggested commit structure:
1. chore/docs: analyze current state and document implementation plan
2. feat/fix/refactor: implement core changes for this task
3. feat/fix/refactor: integrate follow-up changes and validation fixes
4. docs: update handoff, session log, and relevant task docs
5. test: update or validate tests if relevant

If a more task-specific commit sequence is appropriate, use it instead, but keep it logical and phase-based.

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

Preferred file path:
- docs/codex-handoff.md

This file must be written for a future Codex session that starts in a fresh chat with no prior memory.

Required structure of docs/codex-handoff.md:

1. Project Overview
- what SchemaDash is
- relevant system/product context

2. Current Architectural Context
- important modules for this work
- important docs to read first
- high-risk files
- relevant frontend/backend/shared boundaries

3. Task Completed
- task goal
- what was actually implemented
- important design decisions
- what approach was intentionally avoided

4. Files Changed
- created files
- modified files
- important avoided files
- brief purpose of major files

5. Data / API / Workflow Changes
- any new models, routes, services, UI states, storage behavior, or workflow changes
- migrations/env/config/compatibility notes if any

6. Validation Performed
- what was tested
- what was manually verified
- what remains unverified
- known limitations

7. Outstanding Work
- what is not finished
- recommended next phase
- blockers, risks, dependencies

8. Instructions for the Next Codex Session
- exact reading order
- exact files/docs to inspect first
- what to avoid breaking
- where to continue

9. Git Summary
- working branch
- pull request title
- commit list created
- brief explanation of each commit

Handoff quality rules:
- Write the handoff as if the next Codex session knows nothing.
- Be concrete and repository-specific.
- Use real file paths only.
- Do not write vague summaries.
- Keep it updated, not append-only chaos.
- If a previous handoff exists, update it carefully instead of duplicating stale information.

The task is NOT complete unless docs/codex-handoff.md is updated to reflect the final implementation state.

==================================================
OPTIONAL SESSION LOG
==================================================

If useful, also create or update:
- docs/codex-session-log.md

Rules:
- codex-handoff.md = current best-known state
- codex-session-log.md = chronological session/task summaries
- future sessions should read codex-handoff.md first, then session log if needed

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- summary of what was done
- files created
- files modified
- important files intentionally not changed
- validation summary
- remaining work / next recommended step
- handoff file path
- whether session log was updated
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- the requested task was implemented or completed correctly
- changes stayed scoped to the requested task
- runtime stability was preserved
- commits were created in logical phases
- docs/codex-handoff.md was created or updated properly
- the final output includes git status and git log
