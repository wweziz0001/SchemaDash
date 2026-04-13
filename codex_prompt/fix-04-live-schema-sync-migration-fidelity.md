Important: the issue is limited to the Live Schema Sync MVP migration path that applies Development changes directly to the real database. Do not expand this task into Versions, Changelog, or unrelated workflow refactors.

You are Codex acting as a senior full-stack debugging engineer, schema-sync correctness engineer, and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: fix/04-live-schema-sync-migration-fidelity

PULL REQUEST TITLE: Fix live schema sync migration preview and apply fidelity

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped ONLY to the Live Schema Sync MVP migration path.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by debugging and fix phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
The issue exists only in the Live Schema Sync MVP flow that applies Development changes directly to the real database.

Current Live Schema Sync MVP supports:
- PostgreSQL connection management and testing
- Live schema import into the existing editor
- Canonical baseline/target schema diffing
- Generated migration SQL preview
- Safe apply with destructive confirmations
- Audit trail, execution logs, and drift detection

Observed bug:
- In Compare / Review, a newly created table from Development is displayed correctly.
- But in the Live Schema migration path, the SQL preview / migration plan does not faithfully preserve all intended schema details.
- Example:
  - a column such as `key` is shown as UNIQUE in the reviewed Development schema
  - but the generated migration SQL does not reflect that uniqueness correctly
- Similar problems may also affect:
  - PRIMARY KEY
  - UNIQUE
  - NOT NULL
  - DEFAULT values
  - enum/custom types
  - identity / serial / generated semantics
  - indexes
  - foreign keys and other constraints

IMPORTANT:
This bug is specifically about the production-oriented Live Schema Sync migration path.
Do NOT broadly refactor Versions, Changelog, or historical workflow features.
Do NOT redesign Review UI unless a tiny change is needed for debugging clarity.
Focus on the fidelity and correctness of migration planning, SQL preview, and apply behavior.

MISSION:
Find and fix the root cause so that the Live Schema Sync MVP migration pipeline faithfully preserves the intended Development schema when generating migration plans, SQL preview, and apply execution.

==================================================
PRIMARY GOAL
==================================================

Ensure that in the Live Schema Sync MVP flow:

- Development schema meaning
- canonical target schema
- migration plan
- SQL preview
- apply execution

all stay aligned.

If Development defines a field as UNIQUE, the migration path must preserve that.
If Development defines enum/custom types, defaults, nullability, PKs, indexes, identity semantics, or relationships, the migration path must preserve those too.

==================================================
DEBUGGING TASK
==================================================

Audit the full Live Schema migration pipeline carefully.

You must inspect:

1. Development -> Canonical target schema
- where the editor Development diagram is converted into canonical schema for live migration
- whether all field/table/constraint metadata is preserved correctly

2. Live baseline schema
- how the imported live database schema is represented canonically
- whether baseline normalization is causing loss or mismatch

3. Diff / plan generation
- how canonical baseline and canonical target are compared
- whether the generated migration plan loses metadata such as unique constraints or identity semantics

4. SQL preview generation
- whether SQL rendering omits or misinterprets metadata already present in the canonical target or plan

5. Apply execution path
- whether the apply step uses the same corrected plan and semantics as the SQL preview
- ensure preview and apply are aligned

==================================================
FILES / AREAS TO AUDIT CAREFULLY
==================================================

Pay special attention to likely areas such as:
- frontend/src/features/schema-sync/lib/canonical-adapters.ts
- packages/schema-sync-core/src/types.ts
- packages/schema-sync-core/src/diff.ts
- backend/src/services/schema-sync-service.ts
- backend/src/services/apply-service.ts
- backend/src/repositories/metadata-repository.ts
- any postgres introspection or ddl/sql generation modules
- migration planning services
- sql preview generation logic
- apply validation / preflight / execution path

Also inspect any workflow modules that feed Migration preview from Live Schema Sync.

==================================================
IMPORTANT DIAGNOSTIC REQUIREMENT
==================================================

Do NOT assume the Review / Compare UI proves migration correctness.

You must verify the actual schema object used by:
- live migration planning
- SQL preview
- apply execution

If Review is using one source of truth and Migration is using another, fix that architectural mismatch.

==================================================
LIKELY ROOT-CAUSE TYPES
==================================================

Look for issues such as:
- canonical adapter preserves metadata for review but not for migration target
- unique/index/constraint metadata dropped during normalization
- migration planner ignores some canonical fields
- SQL renderer omits unique/index/default/identity metadata
- plan generation handles tables/columns but not all constraints
- enum/custom type handling differs between review and migration path
- apply path diverges from preview path

==================================================
FIX REQUIREMENTS
==================================================

Fix the issue so that the Live Schema Sync MVP path becomes trustworthy.

That means:
- migration preview matches intended Development schema
- apply uses the same corrected schema meaning
- SQL preview reflects actual intended DDL
- critical metadata is preserved consistently across the full live sync migration path

Do not patch only the single sample case.
Fix the general correctness bug.

==================================================
CORRECTNESS REQUIREMENTS
==================================================

At minimum verify fidelity for:
- new table creation
- primary keys
- unique fields / unique constraints
- nullability
- default values
- identity / serial / generated semantics
- enum/custom types
- foreign keys / relationships
- indexes if supported in the MVP path

==================================================
TESTING REQUIREMENTS
==================================================

Add or update regression tests for the Live Schema Sync MVP path.

At minimum include coverage for:
1. Development diagram -> canonical target schema fidelity
2. canonical baseline/target -> migration plan fidelity
3. migration plan -> SQL preview fidelity
4. preview/apply alignment

Include a regression case with a new table containing:
- primary key
- unique field
- enum/custom type if supported
- not-null constraints
- identity/serial/generated field if supported

The tests should prove that the migration path preserves the intended schema details end to end.

==================================================
RULES
==================================================

Do NOT:
- broadly refactor Versions / Changelog / historical workflows
- redesign Review / Compare UI
- add unrelated features
- weaken existing live schema sync safety checks
- hardcode a one-off fix for only this sample table

Do:
- fix the root cause in the Live Schema Sync MVP path
- preserve current architecture as much as possible
- keep changes focused and testable
- improve migration fidelity and trustworthiness
- keep preview and apply aligned

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. chore: audit live schema sync migration fidelity issue
2. fix: preserve schema metadata across live migration planning pipeline
3. fix: align sql preview and apply behavior with canonical development schema
4. test: add regression coverage for live schema migration fidelity

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- root cause found
- files created
- files modified
- how live schema migration fidelity was fixed
- how preview and apply were aligned
- what regression tests were added
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- the bug is fixed specifically in the Live Schema Sync MVP path
- migration preview reflects the intended Development schema
- apply uses the same corrected semantics
- UNIQUE and other key schema metadata are preserved
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
