Use the attached image only as a structural/style reference for the account menu size and composition, but keep the final UI fully aligned with the existing SchemaDash system components and styling.

You are Codex acting as a senior frontend engineer and design-system alignment engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: feat/11-sidebar-user-menu-replace-social-buttons

PULL REQUEST TITLE: Replace sidebar social buttons with user profile menu

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped only to the sidebar user-menu task.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

MISSION:
In the left sidebar, remove the Discord and Twitter buttons currently shown at the bottom.

Replace one of those positions with a user account trigger button.

When the user clicks that button, open a small profile/account menu similar to the attached reference image.

UI REQUIREMENTS:
- The new menu must visually match the existing SchemaDash design system.
- Use the system’s existing buttons, menu/dropdown/popover/dialog primitives if already available.
- Use the system’s existing colors, spacing, radius, typography, shadows, hover states, and separators.
- Do NOT introduce a new visual language.
- Do NOT use ad-hoc styling if an existing native component already fits.
- The result must feel like a native part of the current system.

USER BUTTON REQUIREMENTS:
- The trigger button should show either:
  - the user profile image, if available
  - or 2 initials from the user’s name if no profile image exists
- The button should live where one of the social buttons currently lives at the bottom of the sidebar
- Remove both Discord and Twitter buttons from that bottom area

ACCOUNT MENU REQUIREMENTS:
The menu should be a small anchored account menu similar in structure to the reference image.

It should include, as appropriate for the current app and available routing/actions:
- user display name
- user email
- navigation/action items such as:
  - My Diagrams
  - Embed Links
  - Diagram Visibility
  - Invite Member
  - Settings
  - Support Chat
- theme switch section (Light / Dark) if the current app already supports it there
- Log out action

IMPORTANT:
- Do not invent routes/actions that do not exist.
- If some items from the reference image do not currently exist in SchemaDash, keep the structure and style of the menu, but only wire real existing routes/actions.
- If an item does not yet exist, either omit it or render it only if there is already a safe/native target for it.
- Prefer existing app actions/routes over creating fake placeholders.

BEHAVIOR REQUIREMENTS:
- Clicking the avatar/initials button opens the menu.
- The menu should close correctly on outside click, escape, and item selection where appropriate.
- Log out should call the existing logout flow.
- Settings should go to the existing settings route/dialog if one already exists.
- Theme toggle should reuse the existing theme system if available.
- The menu must be keyboard accessible if the project already uses accessible menu primitives.

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

IMPLEMENTATION STRATEGY:
1. Find the current sidebar bottom actions where Discord/Twitter are rendered.
2. Remove those social buttons.
3. Add a user-account trigger button in that area.
4. Reuse existing user/session/theme/logout data sources.
5. Build the small account menu using existing system primitives and styling.
6. Ensure the menu is visually aligned with the rest of SchemaDash.
7. Keep changes minimal and scoped.

DO NOT:
- redesign the whole sidebar
- add unrelated features
- add fake backend behavior
- create a custom mini design system just for this menu
- create frontend/src/features or any feature-first subtree
- break existing sidebar behavior

VERIFY:
- sidebar still renders correctly
- Discord and Twitter buttons are removed
- user button appears correctly
- avatar or initials render correctly
- clicking the button opens the small account menu
- existing actions/routes used in the menu work correctly
- logout works
- theme toggle works if implemented
- UI matches the native SchemaDash style

REQUIRED COMMIT SEQUENCE:
1. chore: audit sidebar social actions and account menu integration points
2. refactor: remove sidebar social buttons and add user trigger
3. feat: add native-styled user account menu in sidebar
4. test: validate sidebar account menu behavior and styling

REQUIRED OUTPUT:
At the end provide:
- files changed
- where the old social buttons were removed
- where the new user menu trigger was added
- which existing system components/helpers were reused
- any reference items that were omitted because no real route/action exists
- git status
- git log --oneline -n 20

SUCCESS CRITERIA:
- Discord and Twitter buttons are removed from the sidebar bottom area
- a user avatar/initials button appears in their place
- clicking it opens a small account menu similar to the reference image
- the menu uses the native SchemaDash visual style
- existing system components and flows are reused
- no unrelated sidebar redesign was introduced


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
