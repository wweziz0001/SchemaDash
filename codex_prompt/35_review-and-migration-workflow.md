You are Codex acting as a senior full-stack engineer and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: feature/review-and-migration-workflow

PULL REQUEST TITLE: Add review and migration workflow after compare mode

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped to Review and Migration workflow only.
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
- Compare mode exists and renders visual diff between Live Database and Development

Important architectural conclusions from the design docs:
- Compare is a read-only derived visualization, not the source of truth for migration execution.
- Canonical schema remains the correct source of truth for diff/review/apply logic.
- ChangePlan must not be overloaded to power the compare UI, but it can remain part of SQL/apply planning where appropriate.
- Development remains the mutable head.
- Live Database remains the baseline read-only schema snapshot.
- High-risk files should still be modified minimally.

MISSION:
Implement the next workflow layer after Compare by adding a Review button with a dropdown menu containing:

1. Review Changes
2. Migration

The feature should allow the user to:
- inspect and validate the changes in a structured way
- preview the planned migration
- review warnings and risky operations
- apply the changes to the real database through a controlled migration workflow

==================================================
PHASE SCOPE
==================================================

Implement ONLY these parts:

1. Review button in the editor chrome
- Add a visible Review button in the top toolbar/chrome when Compare mode is active or when a valid compare baseline exists.
- The Review button must open a dropdown menu with:
  - Review Changes
  - Migration

2. Review Changes flow
- Build a read-only review panel/dialog/page that presents changes in a structured engineering-friendly format.
- The review surface should summarize:
  - added tables
  - removed tables
  - changed tables
  - added/removed/changed relationships
  - added/removed/changed fields
- It should provide counts, grouping, and clear status badges.
- It should be understandable even on large diagrams.
- It should help the user inspect changes beyond the visual canvas compare.

3. Migration flow
- Build a migration review and execution workflow that lets the user:
  - inspect the planned migration actions
  - see warnings and risks
  - validate preconditions
  - trigger applying the migration to the real database
- The flow should clearly separate:
  - review/preview
  - validation/preflight
  - execution/apply
  - result/success/failure reporting

4. Migration plan generation
- Reuse existing schema-sync backend/apply foundations where appropriate.
- Use canonical schema and existing diff/apply infrastructure where safe.
- The migration plan should be generated from:
  - baseline: current live database schema snapshot
  - target: current Development canonical schema
- Do not use the visual compare overlay model itself as the migration source of truth.

5. Validation / safety layer
- Before allowing execution, provide checks such as:
  - live baseline still matches expected live schema when required
  - connection exists and is reachable
  - there are no blocking errors
  - warnings are surfaced clearly
- Distinguish:
  - informational notes
  - warnings
  - blocking issues

6. Apply / execution UX
- The Migration flow must let the user run the migration intentionally.
- Show progress/state such as:
  - validating
  - ready to apply
  - applying
  - success
  - failed
- Show meaningful error output if the apply step fails.
- Preserve existing operational safety constraints where appropriate.

==================================================
IMPLEMENTATION STRATEGY
==================================================

Follow the design docs and the existing schema-sync architecture.

Prefer additive/focused modules such as:

Frontend:
- frontend/src/features/diagram-workflow/components/review-dropdown.tsx
- frontend/src/features/diagram-workflow/components/review-changes-dialog.tsx
- frontend/src/features/diagram-workflow/components/migration-dialog.tsx
- frontend/src/features/diagram-workflow/components/migration-summary.tsx
- frontend/src/features/diagram-workflow/components/migration-warning-list.tsx
- frontend/src/features/diagram-workflow/lib/review-grouping.ts

Backend:
- backend/src/routes/diagram-migration-routes.ts
- backend/src/services/diagram-migration-service.ts

You may reuse existing routes/services if the current schema-sync backend already has strong apply primitives, but avoid broad entanglement.

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
REVIEW CHANGES REQUIREMENTS
==================================================

The Review Changes surface should:
- use the compare result and/or canonical diff data to build a human-friendly grouped review
- group by entity type where useful:
  - tables
  - fields
  - relationships
  - constraints/indexes if available
- include status labels such as:
  - added
  - removed
  - changed
- include summary totals
- support large result sets in a readable way
- remain read-only

This review layer is for understanding, not execution.

==================================================
MIGRATION REQUIREMENTS
==================================================

The Migration surface should:
- show planned migration actions derived from canonical live vs development state
- present warnings and blocked items clearly
- explain what is safe, risky, or not automatically applicable
- support a deliberate user-triggered apply action

Where appropriate, expose:
- generated migration SQL preview
- categorized change plan
- warning categories
- blocking validations
- apply result logs or summaries

Do NOT:
- apply silently
- merge Review Changes and Migration into one ambiguous UI
- make execution depend on the compare canvas overlay state

==================================================
READ-ONLY / SAFETY RULES
==================================================

- Compare remains read-only.
- Review Changes remains read-only.
- Migration may execute only through an explicit confirmed user action.
- Development must not be overwritten by review/apply workflow.
- Live snapshot should only change through the intended sync/apply/update path.
- Preserve existing safety constraints from schema-sync/apply architecture.

==================================================
RULES
==================================================

Do NOT:
- implement Versions UI in this task
- implement Restore to Development in this task
- broadly rewrite compare mode
- replace the current editor architecture
- introduce unrelated refactors

Do:
- keep the implementation additive
- reuse schema-sync diff/apply infrastructure where appropriate
- keep review separate from migration execution
- preserve runtime stability
- make the workflow understandable and testable

==================================================
VALIDATION REQUIREMENTS
==================================================

Verify:
- Review button appears in the correct workflow state
- dropdown contains:
  - Review Changes
  - Migration
- Review Changes opens and displays structured grouped change data
- Migration opens and displays migration plan / warnings / validation status
- apply action is explicit and controlled
- failed migration states are understandable
- successful migration states are visible
- Compare mode still works normally
- Development and Live Database modes still work normally

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. feat: add review dropdown and workflow entry points
2. feat: add structured review changes UI and grouping
3. feat: add migration planning validation and preview flow
4. feat: add migration execution UX and result handling
5. test: validate review and migration workflow behavior

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- files created
- files modified
- which high-risk files were avoided
- which high-risk files were changed and why
- what remains for later phases
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- a Review button exists
- it contains Review Changes and Migration
- Review Changes supports structured inspection of differences
- Migration supports validation, preview, and controlled apply
- compare remains read-only
- execution is explicit and safe
- no Versions/Restore work was mixed into this phase
- no broad editor-core rewrite was introduced

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
