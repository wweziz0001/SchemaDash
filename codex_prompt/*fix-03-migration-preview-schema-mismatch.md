Important: do not trust the Review dialog as proof that migration input is correct. Verify the actual schema object used by Migration and SQL preview, and make both paths use the same canonical truth.

You are Codex acting as a senior full-stack debugging engineer, schema-diff correctness engineer, and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: fix/03-migration-preview-schema-mismatch

PULL REQUEST TITLE: Fix migration preview mismatch with reviewed development schema changes

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped only to fixing the mismatch between Compare/Review and Migration preview/apply behavior.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by debugging and fix phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
There is a correctness bug in SchemaDash.

Observed behavior:
- In Compare / Review Proposed Changes, a newly created table is shown correctly from the Development side.
- The reviewed schema correctly reflects properties such as:
  - UNIQUE column constraints
  - and potentially other field metadata
- But when opening Migration / SQL Preview, the generated migration does not faithfully match what was shown in Review.
- Example:
  - a column like `key` should be UNIQUE in the reviewed development schema
  - but that uniqueness is not reflected correctly in migration planning / SQL preview
- Similar mismatches may also affect:
  - identity / serial semantics
  - defaults
  - enum handling
  - nullability
  - PK/unique/index definitions
  - other field-level or table-level constraints

MISSION:
Find and fix the root cause so that Migration planning and SQL preview are generated from the same correct canonical Development schema that is shown in Compare / Review.

==================================================
PRIMARY GOAL
==================================================

Ensure that:
- Review Proposed Changes
- Migration validation
- Migration plan generation
- SQL preview
- Apply execution

all agree on the same schema meaning.

If the Development schema says a field is UNIQUE, the migration plan and SQL preview must preserve that.
If the Development schema includes identity/default/nullability/custom type metadata, the migration plan and SQL preview must preserve that too.

==================================================
DEBUGGING TASK
==================================================

Audit the full path from editor schema to migration preview.

You must inspect carefully:

1. Diagram -> Canonical conversion
- where the Development diagram is converted into canonical schema
- whether UNIQUE / PK / indexes / defaults / identity / enum/custom types are all preserved correctly

2. Compare / Review data source
- identify exactly what data model Review Proposed Changes uses
- verify whether Review is based on canonical schema or a different render model

3. Migration plan data source
- identify exactly what data Migration uses to produce:
  - findings
  - validation
  - SQL preview
  - execution plan

4. Canonical diff / plan generation
- verify whether the migration path loses metadata during:
  - canonical normalization
  - diff generation
  - plan generation
  - SQL generation

5. SQL preview generation
- verify whether the SQL renderer omits constraints or metadata that are actually present in canonical input

==================================================
FILES / AREAS TO AUDIT CAREFULLY
==================================================

Pay special attention to likely areas such as:
- frontend/src/features/schema-sync/lib/canonical-adapters.ts
- packages/schema-sync-core/src/types.ts
- packages/schema-sync-core/src/diff.ts
- compare/review grouping or render-model helpers
- migration planning services
- schema sync services
- apply / preview SQL generation logic
- any postgres ddl/sql generation modules
- review dialog data shaping code
- migration dialog data shaping code

Also inspect any newly added workflow modules involved in:
- Review Proposed Changes
- Migration dialog
- SQL preview
- development/live compare

==================================================
EXPECTED ROOT-CAUSE TYPES
==================================================

Look for issues such as:
- Review uses one schema source while Migration uses another
- Diagram -> Canonical conversion preserves more metadata for review than for migration
- UNIQUE constraints are represented in UI but not canonical plan input
- indexes/constraints are dropped during normalization
- SQL preview renderer ignores canonical uniqueness/index metadata
- field metadata is not mapped consistently between compare and migration
- custom type / enum / identity handling diverges between review and apply paths

==================================================
FIX REQUIREMENTS
==================================================

Fix the issue so that:
- Migration preview matches Review
- SQL preview reflects the actual intended Development schema
- Apply uses the same corrected plan
- UNIQUE / PK / defaults / nullability / enum/custom type / identity metadata are preserved consistently

Do not patch only the screenshot case.
Fix the general schema-consistency bug.

==================================================
CORRECTNESS REQUIREMENTS
==================================================

The following must be aligned end-to-end:
- Review Proposed Changes
- Migration findings
- SQL preview
- Apply execution plan

At minimum verify correctness for:
- new table creation
- unique columns
- primary key columns
- nullable vs not null
- default values
- identity / serial behavior
- enum/custom types
- relationships / foreign keys if affected

==================================================
TESTING REQUIREMENTS
==================================================

Add or update tests to cover the bug.

At minimum include test coverage for:
1. a new table with:
   - PK
   - UNIQUE field
   - custom enum field if relevant
   - identity/serial field if relevant
2. canonical conversion correctness
3. migration plan correctness
4. SQL preview correctness

Tests should verify that:
- the reviewed schema meaning matches
- the generated SQL contains the expected constraints / semantics

==================================================
RULES
==================================================

Do NOT:
- broadly refactor unrelated workflow code
- redesign Review UI
- redesign Migration UI
- weaken existing architecture
- hardcode a one-off fix only for this single table

Do:
- fix the root cause
- preserve architecture as much as possible
- keep changes focused and testable
- improve schema consistency across review and migration
- make migration preview trustworthy

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. chore: audit schema review and migration preview mismatch
2. fix: preserve canonical schema metadata across migration planning pipeline
3. fix: align sql preview with reviewed development schema
4. test: add regression coverage for unique constraints and schema fidelity

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- root cause found
- files created
- files modified
- how review and migration were brought into alignment
- what test cases were added
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- Review and Migration describe the same intended schema
- SQL preview matches the reviewed Development changes
- UNIQUE and other important schema metadata are preserved
- the fix is general and regression-tested
- no broad unrelated rewrite was introduced




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

