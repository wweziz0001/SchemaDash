This is a hard requirement: I do not want frontend/src/features to exist in the repository at all after this task.

You are Codex acting as a senior frontend refactoring engineer, repository-structure correction engineer, and production-safe migration engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: refactor/restructure-frontend-features-folder-completely

PULL REQUEST TITLE: Remove frontend features folder entirely and realign code with native SchemaDash structure

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped to removing the frontend feature-folder structure and relocating code correctly.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

MISSION:
The frontend must NOT contain a feature-first structure.

I do NOT want to see:
- frontend/src/features
at all.

Remove it completely.

All recently added code that was placed under frontend/src/features/... must be relocated into the native SchemaDash frontend structure.

This is a strict requirement.

==================================================
NON-NEGOTIABLE STRUCTURE RULE
==================================================

frontend/src/features must not exist after this task.

Do not keep it.
Do not partially keep it.
Do not leave one remaining subfolder inside it.
Do not recreate it elsewhere.
Do not argue for feature-based organization in this task.

The goal is explicit:
REMOVE frontend/src/features entirely.

==================================================
TARGET FRONTEND STRUCTURE
==================================================

All frontend code must be placed according to the existing SchemaDash structure:

- frontend/src/components/
  -> shared UI primitives and reusable composite widgets

- frontend/src/context/
  -> cross-cutting React providers and application/editor-level state containers

- frontend/src/dialogs/
  -> dialog entrypoints for user actions and workflows

- frontend/src/pages/
  -> routed pages and page-level shells/integrations

- frontend/src/lib/
  -> non-UI logic, helpers, API clients, adapters, workflow utilities, view models, DTO mapping, frontend-side services

- frontend/src/assets/
- frontend/public/
- frontend/src/templates-data/
  -> static assets and data only

==================================================
MANDATORY CLASSIFICATION RULES
==================================================

When relocating files, classify strictly by responsibility:

1. Put in frontend/src/components/
- presentational reusable widgets
- toolbar controls
- status chips
- legends
- badges
- reusable panels that are not dialog entrypoints

2. Put in frontend/src/context/
- providers
- React contexts
- cross-cutting workflow/editor state containers

3. Put in frontend/src/dialogs/
- review dialog
- migration dialog
- create version dialog
- restore dialog
- any global editor action dialog

4. Put in frontend/src/pages/
- only route-level or page-shell-level code

5. Put in frontend/src/lib/
- API clients
- workflow helpers
- compare render model helpers
- review grouping helpers
- labels/formatters
- non-React workflow logic
- frontend-side service/helper code

==================================================
TASKS
==================================================

PHASE 1 — AUDIT
Audit all files currently under:
- frontend/src/features/...

Classify every file by its true responsibility.

PHASE 2 — PLAN
Create:
- docs/frontend-features-folder-removal-plan.md

This document must include:
1. every file currently under frontend/src/features
2. its target new path
3. why the old path is wrong
4. why the new path is correct
5. import/runtime risks
6. any minimal compatibility step if absolutely necessary

PHASE 3 — RELOCATE
Move all files out of frontend/src/features and into the correct native folders.

Update:
- imports
- exports
- references
- tests
- any path assumptions

PHASE 4 — DELETE THE FEATURES FOLDER
After relocation:
- delete frontend/src/features completely
- ensure no code remains in it
- ensure no dead imports remain
- ensure no empty placeholder directories remain

PHASE 5 — VERIFY
Verify:
- frontend builds
- imports resolve
- dialogs still work
- workflow state still works
- compare/review/migration/versions/restore still work
- no regressions were introduced by relocation

==================================================
STRICT RULES
==================================================

Do NOT:
- leave frontend/src/features in the repository
- keep transitional duplicate copies
- keep compatibility re-export stubs inside frontend/src/features
- create a renamed equivalent of the same feature-first structure
- redesign business logic unless required by relocation
- perform unrelated refactors

Do:
- move code based on responsibility
- preserve behavior
- keep changes disciplined
- align with the native SchemaDash structure
- fully remove frontend/src/features

==================================================
HIGH-RISK FILE DISCIPLINE
==================================================

Minimize risky changes to:
- frontend/src/context/storage-context/storage-provider.tsx
- frontend/src/context/schemadash-context/schemadash-provider.tsx
- frontend/src/pages/editor-page/... core editor files

If these files must be touched:
- keep changes minimal
- prefer import-path updates and narrow integration fixes
- explain why they were necessary

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. chore: audit frontend features-folder drift and classify all files
2. docs: add frontend features-folder removal plan
3. refactor: move workflow ui files into native frontend folders
4. refactor: move workflow contexts dialogs and lib helpers into native frontend folders
5. refactor: remove frontend features folder completely and update imports
6. test: validate runtime stability after frontend structure correction

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- plan document path
- complete old path -> new path mapping
- files moved
- confirmation that frontend/src/features no longer exists
- any files that required special handling
- which high-risk files were minimally adjusted
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- frontend/src/features is completely removed
- no frontend code remains under a feature-first subtree
- shared UI is under frontend/src/components
- providers are under frontend/src/context
- dialogs are under frontend/src/dialogs
- helpers/clients/utilities are under frontend/src/lib
- behavior remains stable
- the frontend structure now follows the native SchemaDash layout


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

If your implementation leaves frontend/src/features in the repository in any form, the task is considered failed.
