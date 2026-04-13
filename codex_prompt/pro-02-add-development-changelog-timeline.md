Important: Changelog is a timeline of Development history, not a renamed Versions tab. Model it around save/change/revert/auto-checkpoint events on Development.
Do not implement changelog as a thin view over manual versions. The system must generate changelog entries from ongoing Development activity.

You are Codex acting as a senior full-stack product engineer, workflow architect, and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: pro/02-add-development-changelog-timeline

PULL REQUEST TITLE: Add development changelog timeline with save change revert and auto-snapshot history

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped to the new Changelog timeline feature.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
SchemaDash already has:
- Development as the mutable head
- Versions / Snapshots as immutable version-style records
- Compare / Review / Migration workflows
- Restore / Revert workflow

However, the Changelog feature must NOT be modeled as just a list of Versions.

IMPORTANT PRODUCT CLARIFICATION:
The Changelog must represent the actual history timeline of the Development diagram itself.

That means the Changelog should record events such as:
- save operations
- meaningful change checkpoints on Development
- restore/revert operations
- automatic periodic snapshots/checkpoints
- other important development-history events if already available

So:
- Versions = explicit named/manual or milestone snapshots
- Changelog = ongoing chronological history of Development activity

Do NOT model changelog as merely “show versions in another tab”.
Do NOT make changelog depend only on manual versions.
Build it as a true Development history timeline.

MISSION:
Implement a real Changelog feature for SchemaDash that records and displays the evolving history of the Development diagram over time.

==================================================
PRIMARY PRODUCT GOALS
==================================================

The Changelog feature must support:

1. Changelog tab
- Add a Changelog tab beside Versions in the left-side workflow panel.
- The user can switch between:
  - Versions
  - Changelog

2. Development history timeline
The Changelog should show a chronological history of Development-related events, including at minimum:

- manual save events
- meaningful change/save checkpoints on Development
- restore/revert events
- automatic timed checkpoints/snapshots
- optionally system-generated historical events that are useful for tracking development evolution

3. Auto-snapshot / periodic checkpointing
Implement automatic changelog checkpoint creation for Development at a small interval, such as:
- every 2 minutes
or a similarly safe/configurable interval

The goal is:
- create lightweight historical timeline entries
- make it possible to inspect recent Development evolution
- avoid requiring the user to create manual versions for every step

Important:
- periodic checkpoints should be designed safely and efficiently
- do not flood the system with unnecessary duplicates
- avoid creating identical entries when nothing meaningful changed

4. Changelog entries
Each changelog item should represent a point-in-time state or event in the Development timeline.

Each entry should include where possible:
- event type
  - save
  - autosave/autocheckpoint
  - restore
  - revert
  - other relevant development-history event
- actor/user if available
- timestamp / relative time
- short readable summary
- optional change summary/count if available
- stable short id/label if helpful
- visual selected state
- visual viewing state

5. Current Development representation
- Show “Current Development Version” or equivalent at the top of the changelog panel.
- Make clear that this is the latest editable mutable state.
- Distinguish it visually from historical changelog entries.

6. Historical viewing mode
- Selecting a changelog entry should open that historical state in read-only mode.
- The canvas should display the historical Development state represented by that entry.
- The UI should show a clear Viewing badge/state.
- Historical changelog entries must remain read-only.

7. Diff viewing
- The changelog workflow must support viewing diffs between:
  - selected changelog entry
  - current Development
or another safe baseline according to the existing compare architecture
- Add View Diffs / Hide Diffs behavior in changelog mode.
- Reuse compare infrastructure where appropriate.

8. Review flow
- While viewing a changelog entry or a diff, the user can click Review.
- Review should open a structured review dialog/surface that helps inspect changes between the selected historical entry and current Development.

9. Options menu
- Add an Options dropdown in changelog viewing mode.
- It should support at minimum:
  - Revert to This Changelog State
or equivalent wording if needed

10. Revert flow
- From a changelog entry, the user should be able to revert Development to that historical Development state.
- Revert must:
  - be explicit
  - show confirmation
  - preserve history immutability
  - use safe restore semantics
  - create a safety checkpoint/snapshot when appropriate

==================================================
ARCHITECTURAL REQUIREMENTS
==================================================

The Changelog must be a first-class Development history system.

It must be conceptually separate from Versions:
- Versions are explicit/manual/milestone immutable snapshots
- Changelog is the ongoing historical timeline of Development activity

The implementation should:
- preserve Development as the mutable head
- keep historical changelog entries read-only
- allow revert by copying historical state into Development
- preserve existing immutable snapshot/version guarantees
- reuse existing compare/review/revert infrastructure where appropriate
- avoid creating a disconnected parallel architecture if existing snapshot primitives can safely support changelog history

==================================================
DATA MODEL REQUIREMENTS
==================================================

Implement the minimal necessary backend/frontend support so Changelog is a real development-history timeline.

The model should support:
- changelog entries tied to a diagram’s Development history
- event type classification
- timestamped historical checkpoints
- historical state resolution for viewing/diff/revert
- periodic auto-checkpoint creation
- restore/revert event tracking

If useful, introduce concepts like:
- changelog entry
- development checkpoint
- autosnapshot
- event origin
- event summary

Prefer reusing existing snapshot/document persistence primitives when safe.
But do NOT reduce changelog to manual versions only.

==================================================
AUTO-CHECKPOINT REQUIREMENTS
==================================================

Implement periodic changelog checkpoint behavior for Development, such as every 2 minutes.

Important safety requirements:
- avoid creating a checkpoint when the Development state has not meaningfully changed
- avoid excessive duplicate history entries
- keep storage behavior reasonable
- use a lightweight, efficient approach where possible
- make interval/config behavior clear and maintainable
- if needed, make the interval configurable with a sensible default

Also support event-driven entries for:
- explicit saves
- restore/revert actions
- other major development state transitions

==================================================
UI / UX REQUIREMENTS
==================================================

Use the attached screenshots as the UX benchmark for:
- Changelog tab
- Current Development card
- changelog item cards
- selected/viewing state
- top workflow strip
- Review button
- View Diffs / Hide Diffs
- Options dropdown
- revert confirmation dialog

The UI should feel like:
- a real timeline/history workflow
- clearly different from Versions
- product-grade and readable
- useful for inspecting Development history over time

Do NOT copy the screenshots literally.
Match their workflow quality and interaction clarity.

==================================================
IMPLEMENTATION STRATEGY
==================================================

Prefer focused modules such as:

Frontend:
- frontend/src/features/diagram-workflow/components/changelog-panel.tsx
- frontend/src/features/diagram-workflow/components/changelog-list-item.tsx
- frontend/src/features/diagram-workflow/components/current-development-card.tsx
- frontend/src/features/diagram-workflow/components/changelog-viewing-badge.tsx
- frontend/src/features/diagram-workflow/components/changelog-review-dialog.tsx
- frontend/src/features/diagram-workflow/lib/changelog-entry-format.ts
- frontend/src/features/diagram-workflow/lib/changelog-view-model.ts

Backend:
- backend/src/routes/diagram-changelog-routes.ts
- backend/src/services/diagram-changelog-service.ts
- backend/src/repositories/diagram-changelog-repository.ts

You may choose different names if the repository structure suggests better ones, but keep the solution focused and layered.

==================================================
RULES
==================================================

Do NOT:
- model changelog as only a versions list
- make changelog depend only on manual snapshots
- redesign unrelated product areas
- create editable historical branches
- weaken immutability guarantees
- broadly rewrite the editor core
- introduce unrelated refactors

Do:
- preserve Development as the mutable head
- preserve read-only historical entries
- treat changelog as development history timeline
- support save/change/revert/periodic history events
- reuse compare/review/revert infrastructure where appropriate
- keep the implementation additive and testable

==================================================
VALIDATION REQUIREMENTS
==================================================

Verify:
- Changelog tab exists and works
- changelog entries are created from Development history events
- save operations can produce changelog entries
- restore/revert operations can produce changelog entries
- periodic checkpoints are created on interval when there are meaningful changes
- unchanged Development state does not generate excessive duplicate entries
- Current Development card is shown clearly
- selecting a changelog entry opens a read-only historical view
- View Diffs / Hide Diffs works in changelog context
- Review works in changelog context
- Options menu works in changelog context
- Revert from changelog works safely
- Development remains editable
- Versions workflow still works normally and remains distinct from changelog

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. feat: add development changelog model and history event persistence
2. feat: add changelog panel and development history entry list UI
3. feat: add changelog viewing mode and diff/review integration
4. feat: add revert from changelog using safe restore semantics
5. feat: add periodic development checkpoint generation and deduplication safeguards
6. test: validate development changelog history timeline behavior

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- files created
- files modified
- how changelog entries are modeled
- how save/revert/auto-checkpoint events create changelog entries
- how duplicate/no-change history entries are avoided
- how changelog stays distinct from versions
- whether any high-risk files were touched
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- Changelog becomes a true Development history timeline
- it is not merely a versions list
- save/revert/periodic checkpoints contribute to changelog history
- historical entries can be viewed read-only
- diff/review/revert work coherently from changelog
- Development remains the mutable head
- Versions remain distinct from Changelog
- the UX feels substantially closer to the attached screenshots

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
