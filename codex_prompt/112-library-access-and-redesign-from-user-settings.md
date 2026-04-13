Clarification:
- Image 1 = current Library page that I currently reach through a top button
- Image 2 = target visual/style reference
I want the top Library button removed, and I want the Library page to be opened from the user-menu Settings item instead, while redesigning the Library page to match the style direction of Image 2.


You are Codex acting as a senior frontend engineer, information architecture engineer, and design-system alignment engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: feat/12-library-access-and-redesign-from-user-settings

PULL REQUEST TITLE: Remove top library entry button and redesign Library page using the new native reference style

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped only to:
  1. Library access flow
  2. removing the current top entry button
  3. redesigning the Library page/view
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

MISSION:
Correct the Library access flow and redesign the Library page so it matches the new desired native style.

IMPORTANT CLARIFICATION ABOUT THE ATTACHED IMAGES:
- Image 1 = the CURRENT Library page/view in SchemaDash
- Image 2 = the TARGET visual/layout/style reference

This means:
- Image 1 is NOT the Settings page
- Image 1 shows the current Library page that is currently accessed through a button at the top of the page
- That current top button should be removed
- The user should instead access the Library page from the "Settings" item in the user menu
- The Library page itself must be redesigned so it visually follows Image 2

PRIMARY GOALS:
1. Remove the current top button that opens/goes to the Library page.
2. Make the "Settings" item in the user account menu open/navigate to the Library page instead.
3. Redesign the Library page/view so it matches the visual/layout style of Image 2.
4. Preserve the real Library functionality/content already موجود in the system.
5. Use the native SchemaDash design system and existing components rather than introducing a foreign style.

IMPORTANT PRODUCT INTENT:
The destination is still the Library page and its real functionality.
What changes is:
- how the user reaches it
- and how it looks visually

Do NOT turn the Library page into a fake settings page.
Do NOT remove the real Library purpose/content.
Instead:
- keep it as the Library page
- but route it from the user menu Settings action
- and redesign it to match the target reference style

NON-NEGOTIABLE UI REQUIREMENT:
The redesigned Library page must visually match the rest of SchemaDash and use the same native system style.

Use Image 2 as the benchmark for:
- page shell rhythm
- left navigation composition if applicable
- spacing
- card treatment
- headings/subheadings
- button styles
- filters/search bar layout
- summary/stat cards
- content density
- border radius
- separators
- typography hierarchy

Do NOT copy the screenshot literally.
Instead:
- preserve the native SchemaDash design language
- use Image 2 as a strong layout/style direction
- make the final result feel like a polished native SchemaDash page

ARCHITECTURE REQUIREMENTS:
- Follow the native SchemaDash frontend structure.
- Do not introduce or use frontend/src/features.
- Reuse existing native components/helpers/providers where appropriate.
- Place code according to responsibility:
  - shared reusable UI in frontend/src/components/
  - cross-cutting state/providers in frontend/src/context/
  - dialogs in frontend/src/dialogs/
  - routed/page-level integration in frontend/src/pages/
  - non-UI helpers/API/view-model logic in frontend/src/lib/

TASKS

PHASE 1 — AUDIT CURRENT LIBRARY ACCESS FLOW
Audit:
- where the current top button that opens/goes to the Library page is rendered
- where the user account menu Settings item is wired
- where the current Library page/view is implemented
- what current Library functionality/content exists and must be preserved
- what current Library layout/styling in Image 1 should be replaced

Identify:
- the existing route/page for Library
- the current user-menu Settings target
- the safest way to route Settings to Library without breaking navigation
- the existing native components/layout patterns that can be reused

PHASE 2 — REMOVE THE CURRENT TOP LIBRARY ENTRY BUTTON
Implement removal of the current top button that opens/goes to the Library page.

Requirements:
- remove only the obsolete access point
- do not break the Library route/page itself
- do not remove real Library functionality
- keep the rest of the top bar stable unless a tiny adjustment is needed after removal

PHASE 3 — ROUTE USER MENU SETTINGS TO THE LIBRARY PAGE
Change the user account menu so that clicking "Settings":
- navigates to the Library page/view
or
- opens the same routed Library destination used by the app

Important:
- use the existing routing/navigation system
- do not create a fake duplicate page if a real Library page already exists
- the user menu Settings item becomes the main access point requested by the user

PHASE 4 — REDESIGN THE LIBRARY PAGE USING IMAGE 2 AS REFERENCE
Redesign the Library page/view so it visually follows the style direction of Image 2.

Preserve real Library functionality such as:
- diagram listing
- workspace/library structure
- search/filter/sort behavior if already implemented
- create/import/open actions if they already exist
- cards/list items and real content

But improve the layout/style so it feels closer to Image 2 in terms of:
- page composition
- left navigation/sidebar treatment if relevant
- content header
- section cards
- search/filter row
- summary blocks
- card layout and hierarchy
- overall polish and spacing

PHASE 5 — DESIGN SYSTEM ALIGNMENT
The redesigned Library page must use the native SchemaDash system styling.

Specifically:
- use existing Button components and variants
- use existing Card/panel/list/input/select/search/menu patterns
- use the same theme colors and tokens
- use the same spacing/radius/typography conventions
- use the same border/shadow/hover style language
- avoid ad-hoc custom styling when native components already exist
- do not make the page look like Bootstrap or like an external template

PHASE 6 — VERIFY
Verify:
- the old top Library button is gone
- the user menu Settings item now opens/goes to the Library page
- the Library page still functions correctly
- the Library page now visually aligns with the target style direction from Image 2
- existing actions on the page still work
- the UI remains consistent with the rest of SchemaDash

STRICT RULES:
Do NOT:
- create a fake Settings page for this task
- remove the real Library functionality
- keep the old top Library button
- introduce frontend/src/features
- redesign unrelated pages
- introduce a foreign visual style
- remove working Library actions without justification

Do:
- keep the task scoped
- preserve real Library behavior
- change the access point from the top button to the user menu Settings action
- redesign the Library page using the target reference style
- reuse native system components and layout patterns

REQUIRED COMMIT SEQUENCE:
1. chore: audit current library access flow and redesign integration points
2. refactor: remove obsolete top library entry button
3. refactor: route user-menu settings action to library page
4. refactor: redesign library page using native system style and target reference direction
5. test: validate library navigation behavior and visual consistency

REQUIRED OUTPUT:
At the end provide:
- files changed
- where the old top button was removed
- how the user menu Settings action was rewired
- where the Library page implementation was redesigned
- which existing native components/layout patterns were reused
- which Library behaviors were preserved
- git status
- git log --oneline -n 20

SUCCESS CRITERIA:
- the old top Library button is removed
- clicking Settings in the user menu opens/goes to the Library page
- the Library page still performs its real function
- the Library page visually follows the target style direction from Image 2
- the final result feels native to SchemaDash
- no unrelated redesign was introduced

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
