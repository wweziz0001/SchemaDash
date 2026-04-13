Important: this task is about designing the architecture for multi-engine adapters, not about rushing into full MySQL or SQL Server implementation.

Preserve migration fidelity as a top architectural priority: the future adapter design must keep Development schema, canonical schema, migration preview, and apply behavior aligned across engines.

You are Codex acting as a principal full-stack architect, schema-sync platform architect, and repository-aware design engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: design/01-multi-engine-schema-sync-architecture

PULL REQUEST TITLE: Design multi-engine schema sync adapter architecture for SchemaDash

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- This task is architecture/design-first, not full adapter implementation-first.
- Create real git commits only for documentation outputs and any minimal architectural groundwork that is necessary.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by design phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
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
Design a clean, extensible multi-engine schema sync architecture for SchemaDash so that support for additional database engines can be added safely and systematically.

IMPORTANT:
Do NOT jump directly into a large full implementation of MySQL / MariaDB / SQL Server adapters in this task.
Do NOT broadly refactor the entire repository without a plan.
Focus on:
- architectural separation
- engine abstraction boundaries
- canonical schema pipeline design
- adapter contracts
- capability modeling
- migration SQL generation layering
- safe incremental rollout strategy

==================================================
PRIMARY GOAL
==================================================

Transform SchemaDash conceptually from:
- a PostgreSQL-oriented schema sync system

into:
- a multi-engine schema sync platform with a clean core and engine-specific adapters

The result of this task should make future adapters much easier to add, test, and maintain.

==================================================
DESIGN OBJECTIVES
==================================================

The architecture should clearly separate:

1. Engine-agnostic core
- canonical schema model
- baseline/target diff workflow
- compare/review concepts
- migration planning abstractions
- audit trail concepts
- drift detection concepts
- shared validation concepts

2. Engine-specific behavior
- connection testing
- schema introspection
- type mapping
- capability rules
- SQL generation
- DDL limitations
- destructive operation behavior
- engine-specific validation
- apply semantics if engine-specific differences matter

==================================================
TASK
==================================================

Analyze the current SchemaDash schema sync architecture and create a design for a multi-engine adapter system.

Create a design document such as:

docs/multi-engine-schema-sync-architecture.md

This document must explain how SchemaDash should evolve from PostgreSQL-oriented MVP behavior into a clean multi-engine architecture.

==================================================
REQUIRED CONTENT OF THE DESIGN DOCUMENT
==================================================

1. Executive Summary
- summarize the current PostgreSQL-oriented state
- explain why multi-engine support needs an explicit architecture
- explain the goals for MySQL, MariaDB, and SQL Server support

2. Current State Audit
Audit the existing live schema sync implementation and identify:
- what is engine-agnostic already
- what is implicitly PostgreSQL-specific
- what is strongly coupled to PostgreSQL assumptions
- where canonical schema boundaries already exist
- where SQL generation/introspection/apply logic is currently tied to PostgreSQL

3. Target Architecture Overview
Propose a clean architecture for multi-engine schema sync.

The design should clearly define layers such as:
- core schema sync orchestration layer
- canonical schema layer
- engine adapter interface layer
- introspection layer
- migration SQL generation layer
- apply / execution layer
- capability / support matrix layer

4. Adapter Interface Design
Define what a database engine adapter should look like.

For example, define responsibilities such as:
- testConnection()
- introspectSchema()
- normalizeToCanonical()
- getCapabilities()
- generateMigrationSql()
- validatePlan()
- applyPlan() if appropriate
- classifyDestructiveOperations()
- renderWarnings()

You do not need to use these exact names, but define a clear contract.

5. Canonical Model Strategy
Explain how all engines should map into the same canonical schema model.

Address how the architecture should handle differences in:
- primary keys
- unique constraints
- indexes
- nullability
- default values
- identity / auto increment / serial semantics
- enum/custom types
- foreign keys
- schema/database naming differences
- views if relevant

6. Capability Matrix Design
Design a capability model for engines.

The architecture should make it possible to express:
- what each engine supports
- what each engine partially supports
- what migration operations are risky or unsupported
- what compare/review/migration/apply behaviors should differ per engine

Include examples for:
- PostgreSQL
- MySQL
- MariaDB
- SQL Server

7. SQL Generation Strategy
Design how migration SQL generation should be structured:
- what belongs in shared planning
- what belongs in engine-specific SQL renderers
- how to avoid leaking PostgreSQL syntax into other engines
- how preview/apply fidelity should be preserved across engines

8. Incremental Rollout Strategy
Define a safe rollout plan such as:
- Phase 1: extract adapter interfaces and isolate PostgreSQL implementation
- Phase 2: move PostgreSQL to first-class adapter within the new architecture
- Phase 3: add MySQL adapter
- Phase 4: add MariaDB adapter
- Phase 5: add SQL Server adapter
- Phase 6: add cross-engine regression suites

9. Testing Strategy
Design the testing approach for multi-engine support:
- engine-specific introspection tests
- canonical fidelity tests
- migration preview tests
- apply behavior tests
- capability matrix tests
- regression cases for mismatched semantics

10. Risk / Coupling Analysis
Identify high-risk areas that would be sensitive during this migration.
Explain:
- what should be avoided
- what should be isolated first
- what files/modules are likely to need refactoring
- where future adapter work could create correctness bugs

11. Recommended File / Module Layout
Propose a target folder/module organization for the multi-engine architecture.

For example, define the intended home for:
- shared engine contracts
- postgres adapter
- mysql adapter
- mariadb adapter
- sqlserver adapter
- shared canonical helpers
- sql generation modules
- capability definitions
- engine test fixtures

12. Recommended Next Step
At the end, state what should be implemented first after the architecture doc is approved.

==================================================
OPTIONAL ARCHITECTURAL GROUNDWORK
==================================================

If useful and low-risk, you may also add minimal architectural scaffolding such as:
- shared adapter interface types
- capability type definitions
- placeholder adapter registry
- TODO-stub directories/files for future engine adapters

But only if this scaffolding is truly helpful and does not turn into premature full implementation.

==================================================
RULES
==================================================

Do NOT:
- fully implement MySQL / MariaDB / SQL Server adapters in this task
- broadly refactor unrelated product areas
- rewrite historical workflow features
- redesign the editor
- perform an unsafe repository-wide refactor

Do:
- produce a practical, repository-aware architecture design
- identify PostgreSQL-specific coupling clearly
- propose clean engine abstraction boundaries
- prepare the system for future adapters safely
- keep the design concrete and implementation-oriented

==================================================
VALIDATION REQUIREMENTS
==================================================

Verify that the proposed design:
- fits the actual repository
- respects existing canonical schema boundaries
- supports future multi-engine rollout
- preserves migration preview/apply correctness as a primary concern
- avoids unnecessary architectural churn

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. chore: audit current postgres-oriented schema sync architecture
2. docs: add multi-engine schema sync architecture design
3. chore: add minimal adapter architecture groundwork (only if needed)

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- document path created
- summary of current PostgreSQL-specific coupling
- proposed multi-engine architecture summary
- recommended adapter interface summary
- recommended rollout plan
- whether any minimal groundwork files were added
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- a real design document is created
- the design clearly explains how to support multiple engines
- PostgreSQL-specific assumptions are identified
- engine abstraction boundaries are practical and clear
- the result is useful for implementing MySQL / MariaDB / SQL Server next


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
