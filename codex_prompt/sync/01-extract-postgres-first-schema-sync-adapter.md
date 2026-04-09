Important: treat PostgreSQL extraction as the reference implementation of the adapter architecture. Do not compromise behavior just to force abstraction purity.

Preserve production-oriented PostgreSQL Live Schema Sync behavior as-is from the user's perspective while improving internal structure for future engines.
You are Codex acting as a principal full-stack engineer, schema-sync platform refactoring engineer, and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: sync/01-extract-postgres-first-schema-sync-adapter

PULL REQUEST TITLE: Extract PostgreSQL into the first formal schema sync adapter

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped to extracting PostgreSQL into the new multi-engine adapter architecture.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
Use the following design document as the source of truth:
- docs/multi-engine-schema-sync-architecture.md

SchemaDash currently has a Live Schema Sync MVP that supports:
- PostgreSQL connection management and testing
- Live schema import into the existing editor
- Canonical baseline/target schema diffing
- Generated migration SQL preview
- Safe apply with destructive confirmations
- Audit trail, execution logs, and drift detection

Planned next adapters:
- MySQL
- MariaDB
- SQL Server

MISSION:
Implement the first real step of the multi-engine architecture by extracting PostgreSQL into the first formal engine adapter under the new adapter design.

IMPORTANT:
This task is NOT about implementing MySQL, MariaDB, or SQL Server yet.
This task is about:
- isolating PostgreSQL-specific behavior
- introducing the engine adapter structure
- making PostgreSQL the first concrete adapter in that structure
- preserving current Live Schema Sync MVP behavior
- keeping migration fidelity as a top priority

==================================================
PRIMARY GOAL
==================================================

Refactor the current PostgreSQL-oriented schema sync implementation so that:

- engine-agnostic logic is separated from PostgreSQL-specific logic
- PostgreSQL becomes the first formal adapter in the new architecture
- current behavior still works
- future adapters can be added cleanly

The result should move SchemaDash from:
- implicit PostgreSQL-specific implementation

toward:
- explicit adapter-based architecture with PostgreSQL as adapter #1

==================================================
IMPLEMENTATION OBJECTIVES
==================================================

You should implement:

1. Engine adapter boundary
- Introduce the shared engine adapter contract described in the architecture doc.
- Define a clean interface/boundary for engine-specific behavior.

2. PostgreSQL adapter extraction
Move or isolate PostgreSQL-specific logic into a formal PostgreSQL adapter area, including as appropriate:
- connection testing
- live schema introspection
- capability reporting
- canonical mapping support if adapter-owned
- SQL generation
- engine-specific validation
- apply semantics if engine-specific
- destructive operation classification if engine-specific

3. Adapter registry / resolution path
- Add a safe way to resolve the engine adapter for the current connection/engine.
- For now, PostgreSQL may be the only fully implemented adapter.
- The system should be architecturally ready for future adapters.

4. Capability model groundwork
- Introduce the capability model needed by the architecture.
- PostgreSQL should report its supported operations/capabilities through the new model.

5. Preserve current behavior
- Live Schema Sync MVP for PostgreSQL must continue to work.
- Existing PostgreSQL flows must remain functionally intact:
  - connection testing
  - import
  - diff
  - migration preview
  - apply
  - audit/logging/drift behavior

==================================================
MIGRATION FIDELITY REQUIREMENT
==================================================

Migration fidelity is a top architectural priority.

During this refactor, preserve alignment between:
- Development schema
- canonical target schema
- migration plan
- SQL preview
- apply execution

Do NOT allow the adapter extraction to introduce or hide schema fidelity issues.

If any PostgreSQL-specific SQL generation or planning logic currently preserves correctness, keep that behavior intact while relocating it into the adapter architecture.

==================================================
RECOMMENDED STRUCTURAL DIRECTION
==================================================

Follow the architecture document, but a likely structure may include areas such as:

- shared engine contracts / interfaces
- adapter registry / engine resolver
- postgres adapter module(s)
- shared capability definitions
- shared engine-agnostic orchestration layer

Examples of possible module areas:
- backend/src/schema-sync/engines/types.ts
- backend/src/schema-sync/engines/registry.ts
- backend/src/schema-sync/engines/postgres/*
- backend/src/schema-sync/capabilities/*
- backend/src/schema-sync/core/*

You do not need to use these exact paths if the architecture doc recommends better ones, but keep the design clear and layered.

==================================================
AREAS TO AUDIT AND REFACTOR CAREFULLY
==================================================

Carefully inspect and separate:
- PostgreSQL-specific introspection code
- PostgreSQL-specific type handling
- PostgreSQL-specific SQL generation
- PostgreSQL-specific apply assumptions
- PostgreSQL-specific destructive validation assumptions
- engine-agnostic canonical/diff/orchestration logic

Pay special attention to files/modules currently involved in:
- connection testing
- introspection
- migration planning
- SQL preview generation
- apply execution
- drift detection
- audit / metadata logging

==================================================
RULES
==================================================

Do NOT:
- implement MySQL / MariaDB / SQL Server in this task
- broadly refactor unrelated product features
- redesign Versions / Changelog / Compare workflows
- perform a repository-wide cleanup unrelated to schema sync
- weaken PostgreSQL behavior just to fit the new abstraction

Do:
- extract PostgreSQL cleanly into the new adapter architecture
- keep engine-agnostic logic separate where practical
- preserve current PostgreSQL functionality
- preserve migration correctness and safety
- make future adapters easier to add

==================================================
TESTING REQUIREMENTS
==================================================

Add or update tests to prove that:
- PostgreSQL still works through the new adapter path
- adapter resolution works correctly
- connection test flow still works
- introspection still works
- migration preview still works
- apply still works
- capabilities are reported correctly
- existing PostgreSQL schema fidelity is preserved

At minimum, verify end-to-end behavior for the current PostgreSQL-supported workflow.

==================================================
OPTIONAL LIMITED SCAFFOLDING
==================================================

If useful, you may add:
- placeholder adapter stubs for MySQL / MariaDB / SQL Server
- capability placeholders
- TODO notes for future engine-specific modules

But keep these lightweight.
Do NOT turn this task into premature full multi-engine implementation.

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. chore: introduce shared schema sync engine contracts and capability model
2. refactor: extract postgres-specific schema sync logic into formal adapter modules
3. refactor: route live schema sync through postgres adapter resolution path
4. test: validate postgres live schema sync behavior under adapter architecture
5. docs: update multi-engine architecture notes with postgres extraction status

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- files created
- files modified
- what PostgreSQL-specific logic was isolated
- what engine-agnostic logic remains shared
- how adapter resolution now works
- whether any future adapter scaffolding was added
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- PostgreSQL is extracted as the first formal adapter
- engine-specific and engine-agnostic logic are more clearly separated
- current PostgreSQL live schema sync behavior still works
- migration fidelity is preserved
- the codebase is materially more ready for MySQL / MariaDB / SQL Server adapters

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
