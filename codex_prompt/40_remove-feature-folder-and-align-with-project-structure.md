You are Codex acting as a senior frontend refactoring engineer, repository-structure correction engineer, and production-safe migration engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: refactor/remove-feature-folder-and-align-with-project-structure

PULL REQUEST TITLE: Re-align frontend additions with native SchemaDash structure and remove feature-folder drift

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped to correcting the frontend structure and relocating misplaced files.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

MISSION:
SchemaDash has drifted away from its native frontend structure.

Recent work added new functionality under feature-first folders such as:
- frontend/src/features/diagram-workflow/...

This is NOT aligned with the intended frontend structure of the project.

Your task is to correct this and re-align all recently added frontend code with the native SchemaDash project structure.

The project must follow these primary frontend boundaries:

- frontend/src/components/ -> shared UI primitives and reusable composite widgets
- frontend/src/context/ -> cross-cutting React providers for storage, editor state, dialogs, history, theme, diff, layout, and keyboard shortcuts
- frontend/src/dialogs/ -> global dialog entrypoints for create/open/save/import/export/editor actions
- frontend/src/pages/ -> routed pages: dashboard, editor, shared viewers, admin, templates, examples
- frontend/src/lib/ -> domain models, import/export logic, DBML support, SQL tooling, utility helpers, runtime env access, and non-UI frontend logic
- frontend/src/assets/, frontend/public/, frontend/src/templates-data/ -> images, examples, static/template data

IMPORTANT:
The goal is NOT to redesign the application.
The goal is NOT to introduce another new structure.
The goal is to restore structural discipline so the new additions fit the existing project organization.

==================================================
PRIMARY GOAL
==================================================

Remove the feature-folder drift and relocate all newly added frontend files into the correct existing project folders.

Specifically:
- do not keep frontend/src/features as the main home for new product functionality
- move files out of frontend/src/features/... where appropriate
- place each file into its natural existing location based on responsibility
- update all imports and references accordingly
- preserve behavior and runtime stability

==================================================
STRUCTURAL RULES
==================================================

Use these rules strictly:

1. Shared reusable UI components go to:
- frontend/src/components/

Examples:
- workflow-mode switchers
- compare legends
- status chips
- version badges
- reusable review/migration UI widgets
as long as they are presentational/reusable and not route-entry dialogs

2. Cross-cutting providers and state containers go to:
- frontend/src/context/

Examples:
- diagram workflow context/provider
- compare mode context if it is app/editor-wide
- live workflow state provider if it coordinates editor-level state

3. Global dialog entrypoints go to:
- frontend/src/dialogs/

Examples:
- review changes dialog
- migration dialog
- create version dialog
- restore version dialog
- any global editor action dialog

4. Routed views or page-level shells go to:
- frontend/src/pages/

Only place code here if it is truly page/routing-level, not generic workflow support.

5. Non-UI domain/frontend logic goes to:
- frontend/src/lib/

Examples:
- workflow API clients
- compare render model helpers
- review grouping helpers
- version labeling helpers
- workflow DTO mapping
- frontend-side workflow utilities
- lightweight service/helper logic not tied to React rendering

6. Do NOT create or preserve a large feature-first subtree such as:
- frontend/src/features/diagram-workflow/api
- frontend/src/features/diagram-workflow/components
- frontend/src/features/diagram-workflow/context
- frontend/src/features/diagram-workflow/lib

unless there is an extremely strong reason, which should be avoided in this task.

==================================================
TASKS
==================================================

PHASE 1 — AUDIT CURRENT FRONTEND DRIFT
Audit all recently added frontend files under feature-based folders such as:
- frontend/src/features/diagram-workflow/...
- any similar new frontend feature folders

Classify each file by its real responsibility:
- shared UI component
- cross-cutting context/provider
- dialog entrypoint
- page-level integration
- non-UI frontend logic/helper
- asset/static data
- code that should stay where it is only if truly justified

PHASE 2 — CREATE A RELOCATION PLAN
Before moving files, create a document:
- docs/frontend-structure-realignment-plan.md

This document must include:
1. current misplaced frontend files
2. target path for each file
3. why the old location is structurally wrong
4. why the new location is correct according to SchemaDash’s intended structure
5. import/config/runtime risks
6. any file that must remain temporarily in place and why

PHASE 3 — IMPLEMENT THE RELOCATION
Move the files to the correct existing folders.

Examples of the intended style:
- shared presentational workflow widgets -> frontend/src/components/
- workflow/provider state -> frontend/src/context/
- review/migration/version dialogs -> frontend/src/dialogs/
- workflow helpers/api clients/view models -> frontend/src/lib/
- editor integration points remain near the editor pages/components already used by the project

Update:
- imports
- exports
- barrel files if present
- type references
- tests
- path aliases if needed

PHASE 4 — REMOVE STRUCTURAL DRIFT
After relocation:
- remove or empty obsolete feature folders where possible
- do not leave duplicate copies behind
- do not leave dead imports
- do not leave transitional code unless necessary

If a temporary compatibility re-export is absolutely necessary, keep it minimal and document it.

PHASE 5 — VERIFY
Verify:
- the frontend still builds
- imports resolve correctly
- dialogs still open
- workflow state still works
- compare/review/migration/versions/restore integrations still function
- no accidental runtime regressions were introduced by the relocation

==================================================
IMPORTANT SAFETY RULES
==================================================

Do NOT:
- redesign business logic unnecessarily
- rewrite the workflow architecture from scratch
- change product behavior unless required by the relocation
- introduce new feature-first organization elsewhere
- do broad refactors unrelated to structure correction
- move files cosmetically without a clear reason

Do:
- preserve behavior
- preserve current capabilities
- relocate code based on responsibility
- align with the native project structure
- keep the changes disciplined and minimal

==================================================
HIGH-RISK FILE DISCIPLINE
==================================================

Minimize risky changes to:
- frontend/src/context/storage-context/storage-provider.tsx
- frontend/src/context/schemadash-context/schemadash-provider.tsx
- frontend/src/pages/editor-page/... core editor files

If these files must be touched:
- keep the changes minimal
- limit them to import path updates or narrow integration adjustments
- explain why they were necessary

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. chore: audit frontend structural drift and classify misplaced workflow files
2. docs: add frontend structure realignment plan
3. refactor: move workflow ui components into native frontend folders
4. refactor: move workflow contexts dialogs and lib helpers into native frontend folders
5. refactor: update imports references and remove obsolete feature folders
6. test: validate frontend structure realignment and runtime stability

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- the plan document path
- old path -> new path mapping
- files moved
- files intentionally left in place and why
- which high-risk files were minimally adjusted
- whether frontend/src/features was fully removed or partially retained
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- recently added frontend code is re-aligned with the native SchemaDash structure
- shared UI is placed under frontend/src/components
- providers are placed under frontend/src/context
- dialogs are placed under frontend/src/dialogs
- helpers/clients/view-model logic are placed under frontend/src/lib
- unnecessary feature-first folders are removed
- behavior remains stable
- the project structure is closer to the original SchemaDash organization than before


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


Important: do not argue for a feature-first structure in this task. The required goal is explicit alignment with the existing native SchemaDash folder conventions, not introducing an alternative architecture.

When deciding a target path for a file, choose based on responsibility, not on feature ownership.

