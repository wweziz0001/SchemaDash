This task is not only about moving admin files. You must correct the methodology, reuse native SchemaDash code and system components where appropriate, and ensure the admin page visually matches the rest of the product.

You are Codex acting as a senior frontend architecture correction engineer, design-system alignment engineer, and production-safe refactoring engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: restructe/04-admin-to-native-structure-and-system-style

PULL REQUEST TITLE: Rebuild admin frontend using native SchemaDash structure and native system styling

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped only to the admin frontend area.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

HARD REQUIREMENTS:
- frontend/src/features must not exist after this task.
- frontend/src/features/admin must be removed completely.
- Do not preserve a feature-first structure in any equivalent form.
- Do not just move files mechanically.
- First analyze the admin feature, then classify each file by responsibility, then rebuild it according to the native SchemaDash structure.
- Reuse existing native components/helpers/providers/dialog patterns where appropriate.
- Reuse the native SchemaDash visual language.
- Generalize newly added code where appropriate instead of keeping it overly feature-specific.
- Remove redundant or duplicated code where safe.

THIS TASK IS NOT ONLY ABOUT MOVING FILES.
It is about correcting the wrong frontend development methodology and aligning the admin frontend implementation with:
1. the native SchemaDash project structure
2. the native SchemaDash design/system style

NON-NEGOTIABLE UI/STYLING REQUIREMENT:
The admin frontend must follow the SAME visual style as the rest of SchemaDash.

That means:
- use existing SchemaDash buttons
- use existing SchemaDash badge/card/dialog/input/select patterns
- use existing theme colors/tokens
- use existing spacing/radius/typography conventions
- use the same page rhythm and component language already used by the system
- do NOT introduce a different admin-only design language
- do NOT create visually inconsistent buttons, colors, or layouts
- do NOT bypass system components if an existing native component already fits

If a page or widget looks visually disconnected from the rest of SchemaDash, the task is considered incomplete.

NATIVE FRONTEND STRUCTURE TO FOLLOW:
- frontend/src/components/ -> shared UI primitives and reusable composite widgets
- frontend/src/context/ -> cross-cutting React providers for storage, editor state, dialogs, history, theme, diff, layout, and keyboard shortcuts
- frontend/src/dialogs/ -> global dialog entrypoints for create/open/save/import/export/editor actions
- frontend/src/pages/ -> routed pages: dashboard, editor, shared viewers, admin, templates, examples
- frontend/src/lib/ -> domain models, import/export logic, DBML support, SQL tooling, utility helpers, runtime env access, and non-UI frontend logic
- frontend/src/assets/, frontend/public/, frontend/src/templates-data/ -> static assets and data only

FEATURE CONTEXT:
Admin / Operations is responsible for frontend-side behavior related to:
- admin overview
- runtime health presentation
- operational/deployment surfaces
- status displays
- admin-facing actions and summaries

Known related backend files include:
- backend/src/routes/admin-routes.ts
- backend/src/routes/health-routes.ts

Known related frontend area includes:
- frontend/src/pages/admin-page/admin-page.tsx

This task must integrate admin into the native page structure and native design system rather than preserving an isolated admin feature island.

PRIMARY GOALS:
1. Remove frontend/src/features/admin completely.
2. Reclassify every file in admin by its true responsibility.
3. Rebuild the admin-related frontend code according to the original SchemaDash methodology.
4. Reuse existing native components/helpers/dialog/page structures where appropriate.
5. Ensure the admin page and admin widgets visually match the rest of SchemaDash.
6. Reduce unnecessary duplication introduced by the feature-folder approach.
7. Preserve runtime behavior and stability.

MANDATORY CLASSIFICATION RULES:
- Put truly reusable presentational UI into frontend/src/components/
- Put cross-cutting state/providers into frontend/src/context/ only if truly cross-cutting
- Put admin action dialogs into frontend/src/dialogs/ where appropriate
- Put admin page-level structure and route-level integration into frontend/src/pages/admin-page/
- Put admin API clients, view-model helpers, status helpers, and non-UI logic into frontend/src/lib/
- Do not keep any isolated admin subtree under frontend/src/features
- When deciding a target path for a file, choose based on responsibility, not on feature ownership

MANDATORY METHOD:
Do NOT simply move files mechanically.

For each file currently under frontend/src/features/admin, you must decide whether it should be:
- moved
- merged into an existing native file/module
- generalized and then placed in a native folder
- removed as redundant

You must also identify cases where:
- an existing native component/helper/dialog/page structure should have been reused but was not
- an overly specific new admin component should be generalized
- duplicated admin UI should be merged or deleted
- admin visuals diverge from the system’s existing design language and need correction

TASKS

PHASE 1 — AUDIT THE CURRENT ADMIN DRIFT
Audit everything currently under:
- frontend/src/features/admin/...

For each file, determine:
- what it actually does
- whether it is UI, dialog, context, page integration, helper, API client, status widget, or redundant duplication
- whether it should be moved, merged, generalized, or removed
- which existing native module/component/helper/provider/dialog/page structure should be reused instead if applicable

Also audit the visual style of the current admin implementation and identify:
- where it does not match the rest of SchemaDash
- where it uses custom patterns instead of existing system components
- where buttons/colors/cards/layout/spacing differ from the native system style

Create:
- docs/admin-frontend-rebuild-plan.md

This document must include:
1. every file currently under frontend/src/features/admin
2. old path -> proposed new path
3. classification for each file:
   - move
   - merge
   - generalize
   - remove
4. why the old location is structurally wrong
5. why the new location is correct according to SchemaDash’s native structure
6. existing native modules/components/helpers/providers/dialogs/pages that should be reused instead
7. any risky integration points
8. any file that must receive special handling and why
9. visual mismatches that must be corrected so admin matches the native system style

PHASE 2 — REBUILD ACCORDING TO THE NATIVE METHODOLOGY
Implement the plan by rebuilding the admin-related frontend code according to the native SchemaDash structure.

This includes:
- moving truly reusable UI into frontend/src/components/
- moving cross-cutting state/providers into frontend/src/context/ only where appropriate
- moving admin dialogs into frontend/src/dialogs/
- moving page-level admin integration into frontend/src/pages/admin-page/
- moving admin API clients/helpers/view-model logic/non-UI code into frontend/src/lib/
- merging redundant implementations into existing native modules where appropriate
- generalizing overly feature-specific components/helpers where appropriate
- deleting duplicated/redundant code where safe

PHASE 3 — ALIGN ADMIN UI WITH THE NATIVE SYSTEM STYLE
This phase is mandatory.

The admin UI must visually match the rest of SchemaDash.

Specifically:
- use existing Button components and variants
- use existing Badge components and variants
- use existing Card/panel/dialog/input/select components and patterns
- use the same color tokens and theme conventions
- use the same spacing and border radius conventions
- use the same typography rhythm and page-section style
- avoid custom colors unless the system already uses them
- avoid ad-hoc button styling when a native button variant already exists
- avoid custom admin-only component styling unless absolutely necessary

If admin currently uses custom visuals that do not match the system, replace them with native system patterns.

PHASE 4 — REMOVE THE FEATURE SUBTREE COMPLETELY
After relocation/consolidation:
- remove frontend/src/features/admin completely
- do not leave compatibility stubs there
- do not leave duplicate copies there
- do not leave empty directories there

Also ensure:
- frontend/src/features itself no longer exists if it becomes empty
- no imports point to frontend/src/features/admin
- no dead code remains because of the relocation

PHASE 5 — VERIFY
Verify:
- frontend builds
- imports resolve correctly
- admin page still works
- admin status/runtime health UI still works
- admin-related actions still work
- admin visuals now match the rest of SchemaDash
- no regressions were introduced by the structural correction

STRICT RULES:
Do NOT:
- keep frontend/src/features/admin in any form
- keep duplicate copies of code
- create a renamed equivalent of the same feature-first structure
- preserve overly specific components/helpers that should be generalized
- ignore existing reusable components/helpers/providers/dialog/page patterns
- do broad unrelated refactors
- redesign admin business logic unnecessarily
- create a visually separate admin design language
- use custom buttons/colors/layouts when native system components already exist

Do:
- follow native SchemaDash architecture
- reuse existing code where appropriate
- reuse existing system components and visual patterns
- generalize new code where appropriate
- preserve runtime stability
- keep the codebase more coherent than before
- ensure admin visually belongs to the same product as the rest of the application

HIGH-RISK FILE DISCIPLINE:
Minimize risky changes to:
- frontend/src/pages/admin-page/admin-page.tsx
- shared system components used by multiple pages
- route-level integration files
- app-wide theme or style foundation files

If these files must be touched:
- keep changes minimal
- prefer import-path updates and narrow integration fixes
- explain why they were necessary

REQUIRED COMMIT SEQUENCE:
1. chore: audit admin frontend methodology drift and style divergence
2. docs: add admin frontend rebuild plan
3. refactor: move reusable admin ui and dialogs into native folders
4. refactor: move admin helpers and page integration into native structure
5. refactor: align admin page with native SchemaDash visual system and remove admin feature subtree
6. test: validate admin frontend behavior and style consistency after correction

REQUIRED OUTPUT:
At the end provide:
- plan document path
- full old path -> new path mapping
- files moved
- files merged into existing native files
- files generalized
- files removed as redundant
- existing native modules/components/helpers/providers/dialogs/pages that were reused
- confirmation that frontend/src/features/admin no longer exists
- confirmation that frontend/src/features no longer exists
- any files that required special handling
- which high-risk files were minimally adjusted
- how visual consistency with the native SchemaDash system was achieved
- git status
- git log --oneline -n 20

SUCCESS CRITERIA:
The task is successful only if:
- frontend/src/features/admin is completely removed
- frontend/src/features is completely removed
- the admin-related frontend code now follows the native SchemaDash methodology
- the admin page and its widgets visually match the rest of SchemaDash
- existing native modules/components/helpers/providers/dialogs/pages are reused where appropriate
- redundant isolated feature-specific implementations are reduced
- runtime behavior remains stable

FAILURE CONDITIONS:
- If frontend/src/features/admin still exists after this task, the task is failed.
- If frontend/src/features still exists after this task, the task is failed.
- If the admin UI still looks visually disconnected from the rest of SchemaDash, the task is failed.
- If native system components and styles were clearly reusable but ignored, the task is failed.


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


If frontend/src/features/admin still exists after this task, or if the admin page still does not follow the same visual language as the rest of SchemaDash, the task is considered failed.
