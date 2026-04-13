This task is not only about moving persistence files. You must correct the methodology, reuse native SchemaDash code where appropriate, generalize overly specific new code where appropriate, and fully remove the corresponding frontend/src/features/persistence subtree.

You are Codex acting as a senior frontend architecture correction engineer and production-safe refactoring engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: restructe/03-persistence-to-native-structure

PULL REQUEST TITLE: Rebuild persistence frontend code using native SchemaDash structure

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped only to the persistence frontend area.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

HARD REQUIREMENTS:
- frontend/src/features must not exist after this task.
- frontend/src/features/persistence must be removed completely.
- Do not preserve a feature-first structure in any equivalent form.
- Do not just move files mechanically.
- First analyze the persistence feature, then classify each file by responsibility, then rebuild it according to the native SchemaDash structure.
- Reuse existing native components/helpers/providers/dialog patterns where appropriate.
- Generalize newly added code where appropriate instead of keeping it overly feature-specific.
- Remove redundant or duplicated code where safe.

THIS TASK IS NOT ONLY ABOUT MOVING FILES.
It is about correcting the wrong frontend development methodology and aligning the entire persistence-related frontend implementation with the native SchemaDash architecture.

NATIVE FRONTEND STRUCTURE TO FOLLOW:
- frontend/src/components/ -> shared UI primitives and reusable composite widgets
- frontend/src/context/ -> cross-cutting React providers for storage, editor state, dialogs, history, theme, diff, layout, and keyboard shortcuts
- frontend/src/dialogs/ -> global dialog entrypoints for create/open/save/import/export/editor actions
- frontend/src/pages/ -> routed pages: dashboard, editor, shared viewers, admin, templates, examples
- frontend/src/lib/ -> domain models, import/export logic, DBML support, SQL tooling, utility helpers, runtime env access, and non-UI frontend logic
- frontend/src/assets/, frontend/public/, frontend/src/templates-data/ -> static assets and data only

FEATURE CONTEXT:
Persistence is responsible for frontend-side behavior related to:
- save / open / update / delete
- collections, projects, diagrams, and config
- durable storage integration
- local cache behavior
- persistence API access
- sharing helpers that currently sit within the persistence feature boundary
- frontend coordination with backend persistence APIs

Known related files include:
- frontend/src/context/storage-context/storage-provider.tsx
- backend/src/services/persistence-service.ts
- backend/src/repositories/app-repository.ts

This area is highly sensitive because it is tied to:
- local Dexie cache
- remote durable storage
- sharing
- session-aware editor persistence flows

That means this task must be structurally corrective but operationally conservative.

PRIMARY GOALS:
1. Remove frontend/src/features/persistence completely.
2. Reclassify every file in persistence by its true responsibility.
3. Rebuild the persistence-related frontend code according to the original SchemaDash methodology.
4. Reuse existing native storage/context/dialog/lib/page structures where appropriate.
5. Generalize newly added code where appropriate so it fits the project’s reusable component model.
6. Reduce unnecessary duplication introduced by the feature-folder approach.
7. Preserve current runtime behavior and stability.
8. Keep persistence, sharing, cache, and open/save flows working.

MANDATORY CLASSIFICATION RULES:
- Put truly reusable presentational UI into frontend/src/components/
- Put cross-cutting persistence/editor/app state into frontend/src/context/ only if it is truly cross-cutting
- Put open/save/share/import/export dialogs into frontend/src/dialogs/ where appropriate
- Put page integration close to frontend/src/pages/... where appropriate
- Put API clients, persistence helpers, sharing helpers, DTO/view-model helpers, and other non-UI logic into frontend/src/lib/
- Do not keep any isolated persistence subtree under frontend/src/features
- When deciding a target path for a file, choose based on responsibility, not on feature ownership

MANDATORY METHOD:
Do NOT simply move files mechanically.

For each file currently under frontend/src/features/persistence, you must decide whether it should be:
- moved
- merged into an existing native file/module
- generalized and then placed in a native folder
- removed as redundant

You must also identify cases where:
- an existing native provider/helper/dialog/component should have been reused but was not
- an overly specific new component/helper should be generalized
- duplicated persistence logic should be merged or deleted
- persistence concerns and sharing concerns were split unnaturally instead of integrating with the project’s existing boundaries

TASKS

PHASE 1 — AUDIT THE CURRENT PERSISTENCE DRIFT
Audit everything currently under:
- frontend/src/features/persistence/...

For each file, determine:
- what it actually does
- whether it is UI, dialog, context, page integration, helper, API client, sharing helper, cache helper, or redundant duplication
- whether it should be moved, merged, generalized, or removed
- which existing native module/component/helper/provider/dialog should be reused instead if applicable

Create:
- docs/persistence-frontend-rebuild-plan.md

This document must include:
1. every file currently under frontend/src/features/persistence
2. old path -> proposed new path
3. classification for each file:
   - move
   - merge
   - generalize
   - remove
4. why the old location is structurally wrong
5. why the new location is correct according to SchemaDash’s native structure
6. existing native modules/components/helpers/providers/dialogs that should be reused instead
7. any risky integration points
8. any file that must receive special handling and why
9. any logic that should be merged into existing storage-context/dialog/page/lib boundaries instead of remaining isolated

PHASE 2 — REBUILD ACCORDING TO THE NATIVE METHODOLOGY
Implement the plan by rebuilding the persistence-related frontend code according to the native SchemaDash structure.

This includes:
- moving truly reusable UI into frontend/src/components/
- moving cross-cutting persistence/editor/app state into frontend/src/context/ only where appropriate
- moving action dialogs into frontend/src/dialogs/
- moving page integration close to frontend/src/pages/... where appropriate
- moving API clients/helpers/sharing helpers/view-model logic/non-UI code into frontend/src/lib/
- merging redundant implementations into existing native modules where appropriate
- generalizing overly feature-specific components/helpers where appropriate
- deleting duplicated/redundant code where safe

PHASE 3 — ALIGN WITH EXISTING STORAGE AND SHARING BOUNDARIES
Persistence in SchemaDash is already strongly tied to:
- storage-provider
- open/save flows
- shared project/diagram access
- durable persistence APIs

You must align the rebuilt frontend code with these existing boundaries rather than preserving a parallel persistence island.

Specifically:
- prefer integrating into existing storage-context behavior rather than maintaining duplicate client-side persistence abstractions
- prefer integrating sharing-related helpers into the native places they belong instead of leaving them trapped in a persistence feature island
- avoid introducing a second parallel persistence orchestration layer

PHASE 4 — REMOVE THE FEATURE SUBTREE COMPLETELY
After relocation/consolidation:
- remove frontend/src/features/persistence completely
- do not leave compatibility stubs there
- do not leave duplicate copies there
- do not leave empty directories there

Also ensure:
- frontend/src/features itself no longer exists if it becomes empty
- no imports point to frontend/src/features/persistence
- no dead code remains because of the relocation

PHASE 5 — VERIFY
Verify:
- frontend builds
- imports resolve correctly
- open diagram flows still work
- save/update/delete flows still work
- collection/project/diagram persistence flows still work
- local cache behavior still works
- sharing-related frontend flows still work if touched
- no regressions were introduced by the structural correction

STRICT RULES:
Do NOT:
- keep frontend/src/features/persistence in any form
- keep duplicate copies of code
- create a renamed equivalent of the same feature-first structure
- preserve overly specific components/helpers that should be generalized
- ignore existing reusable components/helpers/providers/dialog patterns
- do broad unrelated refactors
- redesign business logic unnecessarily
- rewrite persistence architecture from scratch
- create a second parallel persistence/state layer

Do:
- follow native SchemaDash architecture
- reuse existing code where appropriate
- generalize new code where appropriate
- preserve runtime stability
- keep the codebase more coherent than before
- prefer responsibility-based placement over feature ownership
- preserve the current storage/persistence/sharing operational model while correcting the frontend structure

HIGH-RISK FILE DISCIPLINE:
Minimize risky changes to:
- frontend/src/context/storage-context/storage-provider.tsx
- frontend/src/context/schemadash-context/schemadash-provider.tsx
- frontend/src/pages/dashboard-page/... related page integrations
- frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx
- backend-tied frontend persistence integration points

If these files must be touched:
- keep changes minimal
- prefer import-path updates and narrow integration fixes
- explain why they were necessary

REQUIRED COMMIT SEQUENCE:
1. chore: audit persistence frontend methodology drift
2. docs: add persistence frontend rebuild plan
3. refactor: move reusable persistence ui and dialogs into native folders
4. refactor: move persistence helpers sharing helpers and clients into native lib/context structure
5. refactor: remove persistence feature subtree and update imports
6. test: validate persistence-related frontend flows after structure correction

REQUIRED OUTPUT:
At the end provide:
- plan document path
- full old path -> new path mapping
- files moved
- files merged into existing native files
- files generalized
- files removed as redundant
- existing native modules/components/helpers/providers/dialogs that were reused
- confirmation that frontend/src/features/persistence no longer exists
- confirmation that frontend/src/features no longer exists
- any files that required special handling
- which high-risk files were minimally adjusted
- how storage/persistence/sharing boundaries were preserved
- git status
- git log --oneline -n 20

SUCCESS CRITERIA:
The task is successful only if:
- frontend/src/features/persistence is completely removed
- frontend/src/features is completely removed
- the persistence-related frontend code now follows the native SchemaDash methodology
- reusable components/helpers are placed correctly
- existing native modules/components/helpers/providers/dialogs are reused where appropriate
- redundant isolated feature-specific implementations are reduced
- storage/persistence/sharing boundaries remain coherent
- runtime behavior remains stable

FAILURE CONDITIONS:
- If frontend/src/features/persistence still exists after this task, the task is failed.
- If frontend/src/features still exists after this task, the task is failed.
- If the result preserves isolated feature-specific implementations where native reuse/generalization was clearly possible, the task is failed.
- If a second parallel persistence/state layer is preserved or reinforced, the task is failed.


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

If frontend/src/features/persistence still exists after this task, or if a parallel persistence/frontend orchestration layer is still preserved, the task is considered failed.
