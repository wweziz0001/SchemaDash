Use the attached screenshots as the UX benchmark specifically for the Versions workflow, Revert dialog, Review dialog, and View Diffs experience.

You are Codex acting as a senior full-stack product engineer, UI/UX refinement engineer, and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: pro/01-improve-versions-workflow-ui 

PULL REQUEST TITLE: Refine and enhance versions workflow UI and interactions

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped to Versions / Changelog / View Diffs / Review / Revert UX refinement.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
Use the current SchemaDash implementation as the base.
Use the attached screenshots as the visual and interaction target for improving the Versions workflow.

MISSION:
Improve the Versions feature in SchemaDash so it feels much closer to the polished workflow shown in the attached screenshots.

This task is mainly about:
- UX refinement
- visual structure
- workflow clarity
- better version browsing
- better review and revert interactions
- better integration between Versions, Development, View Diffs, Review, and Revert

Do NOT redesign the entire product.
Do NOT broadly rewrite the editor architecture.
Do NOT add unrelated features.
Focus specifically on making the Versions experience much more polished, intuitive, and product-grade.

==================================================
PRIMARY GOALS
==================================================

Improve the Versions workflow so that it includes and refines:

1. A stronger left-side Versions panel
- tabs for:
  - Versions
  - Changelog
- searchable/filterable list
- clearer card styling for Development and saved versions
- better selected/active state
- improved metadata display

2. Development as the current editable version
- show Development clearly as the current editable version
- display a status badge such as:
  - Viewing
  - Current
  - Editable
depending on current mode
- make the distinction between Development and immutable versions visually obvious

3. Version cards
Each version entry should feel polished and informative, similar to the screenshots:
- version label/name
- optional short description
- relative time
- visual state when selected
- better spacing, hierarchy, and hover/active treatment

4. Top workflow controls
Refine the top bar workflow around:
- selected version
- Development
- View Diffs / Hide Diffs
- Review
- Options dropdown

The controls should feel coherent and aligned, not scattered.

5. Review Proposed Changes dialog
Improve the review dialog so it feels much more product-grade:
- clearer title and structure
- searchable changes
- cleaner split between left and right sides
- better grouping of changed entities
- improved visual hierarchy
- better empty states
- better resizable layout if already present
- better SQL / DBML preview section styling if applicable

6. Revert / Restore interaction
Refine the revert workflow to feel closer to the screenshots:
- Options dropdown action: Revert to This Version
- confirmation dialog with clear warning and consequence
- polished modal layout and button hierarchy
- clearer messaging around replacing Development
- preserve existing safety behavior

7. Diff viewing experience
Improve how version diffs are shown on canvas:
- better visual highlighting of changed/new elements
- clearer “Viewing” state
- cleaner integration with View Diffs / Hide Diffs
- better communication of whether the user is looking at Development or a historical version

8. Changelog tab
Improve the Changelog presentation so it feels like part of the same workflow:
- cleaner timeline/list structure
- better readability
- better relationship to versions and diff review
- keep it useful and lightweight

==================================================
DESIGN / UX TARGET
==================================================

Match the attached screenshots in spirit and product quality, especially:
- left panel structure
- versions cards
- selected state styling
- development card presentation
- top workflow chips/buttons
- review button placement
- options dropdown behavior
- revert confirmation modal
- compare/diff viewing flow
- clean, restrained, premium SaaS styling

Do NOT copy the screenshots literally pixel-for-pixel.
Instead:
- match their workflow clarity
- match their layout discipline
- match their interaction polish
- match their visual hierarchy

==================================================
IMPLEMENTATION STRATEGY
==================================================

Prefer focused improvements in the versions workflow area, such as:
- versions panel components
- changelog components
- top toolbar/chrome controls related to versions
- review dialog components
- revert dialog components
- diff visibility controls
- version metadata display helpers

Keep architecture changes minimal.
Prefer improving and refining existing components over broad rewrites.

==================================================
AREAS TO IMPROVE
==================================================

Specifically improve:

A. Versions sidebar / panel
- spacing
- sizing
- typography
- card states
- search/filter styling
- “Create Version” action styling
- better distinction between Development and frozen versions

B. Top workflow strip
- currently selected version indicator
- Development button/state
- View Diffs / Hide Diffs
- Review button
- Options dropdown
- read-only state badge if applicable

C. Review modal
- structure and layout
- readability on large diffs
- better grouping and scanning
- more polished lower SQL / DBML preview area
- improved empty and filtered states

D. Revert confirmation modal
- cleaner copy
- clearer warning
- stronger action hierarchy
- visually safer destructive action flow

E. Diff view on canvas
- improve clarity of what changed
- improve labeling for new/removed/changed items if present
- improve overall polish when viewing diffs between a version and Development

==================================================
RULES
==================================================

Do NOT:
- redesign unrelated pages
- add broad new features outside versions workflow
- replace the entire design system
- rewrite editor core logic unnecessarily
- break current immutable version behavior
- weaken restore/revert safety

Do:
- keep the implementation focused
- preserve current versions architecture
- preserve Development as the mutable head
- preserve immutable versions
- improve visual polish and interaction quality significantly
- make the workflow more intuitive and closer to the attached screenshots

==================================================
VALIDATION REQUIREMENTS
==================================================

Verify:
- Versions tab looks cleaner and more polished
- Changelog tab looks cleaner and more coherent
- Development card is clearly distinguished from saved versions
- selected version state is obvious
- View Diffs / Hide Diffs flow feels clear
- Review dialog is significantly improved
- Options dropdown works cleanly
- Revert to This Version flow feels polished and safe
- immutable versions behavior is preserved
- Development behavior is preserved

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. feat: refine versions sidebar and version card presentation
2. feat: improve top workflow controls for versions and diff viewing
3. feat: polish review proposed changes dialog and structured diff browsing
4. feat: refine revert to version interaction and confirmation modal
5. feat: improve changelog and diff viewing UX for historical versions
6. test: validate improved versions workflow behavior and visual clarity

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- files created
- files modified
- what was improved in the Versions workflow
- what was improved in Review / Revert / Diff viewing
- whether any high-risk files were touched
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- the Versions workflow feels noticeably more polished
- the UI is closer in quality and clarity to the attached screenshots
- Development vs historical versions is clearer
- Review / View Diffs / Revert interactions are improved
- immutable version behavior is preserved
- no broad unrelated rewrite was introduced


Prioritize layout hierarchy, spacing, card states, button grouping, and interaction polish over adding new functionality.

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
