Important: treat MySQL as the first non-PostgreSQL proof that the standalone schema-sync architecture is genuinely multi-engine.
Do not force PostgreSQL semantics onto MySQL. Preserve correctness first, even if some MySQL capabilities need clear limitations or warnings.
You are Codex acting as a principal full-stack engineer, database-engine integration engineer, and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: sync/05-add-mysql-schema-sync-adapter

PULL REQUEST TITLE: Add MySQL adapter to standalone schema sync service

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Build on top of the existing standalone schema-sync service architecture already completed.
- Do not revert the current standalone-service work.
- Keep changes scoped to adding MySQL support to the schema-sync service.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
SchemaDash currently has:
- standalone schema-sync service architecture
- remote integration with the main app
- Docker/Compose and health checks
- PostgreSQL as the first working engine adapter

Next planned adapters include:
- MySQL
- MariaDB
- SQL Server

MISSION:
Implement MySQL support in the standalone schema-sync service as the next formal engine adapter after PostgreSQL.

IMPORTANT:
This task is about adding MySQL support to the schema-sync service architecture.
Do NOT implement MariaDB or SQL Server yet.
Do NOT broadly refactor unrelated product features.
Do NOT redesign the standalone-service architecture.
Focus on making MySQL a real, usable adapter within the current architecture.

==================================================
PRIMARY GOAL
==================================================

Add a MySQL adapter that supports the existing Live Schema Sync workflow through the standalone service, including where appropriate:

- connection management and testing
- live schema introspection/import
- canonical schema mapping
- baseline/target diff support
- migration SQL preview
- safe apply behavior
- capability reporting
- warnings / destructive operation handling

The adapter should fit naturally into the existing service architecture and preserve fidelity between:
- Development schema
- canonical target schema
- migration plan
- SQL preview
- apply execution

==================================================
REQUIRED IMPLEMENTATION SCOPE
==================================================

Implement these parts for MySQL:

1. Engine registration
- Register MySQL as a supported engine in the schema-sync service.
- Ensure engine resolution can identify and dispatch to the MySQL adapter.

2. Connection test / health support
- Implement MySQL connection testing through the standalone schema-sync service.
- Report useful validation or connection errors safely.

3. Live schema introspection
- Implement MySQL schema introspection/import so the live schema can be imported into SchemaDash.
- Support the key schema elements needed by the current workflow.

4. Canonical mapping
- Map MySQL schema constructs into the canonical schema model correctly.
- Preserve semantic fidelity for the current workflow.

5. Migration planning and SQL preview
- Ensure MySQL can produce migration plans and SQL preview from:
  - live baseline schema
  - Development canonical target schema
- SQL preview must reflect MySQL syntax and semantics correctly.

6. Apply behavior
- Implement safe apply behavior for MySQL where supported by the current architecture.
- Preserve destructive confirmation behavior and warnings where applicable.

7. Capability model
- Define/report MySQL capabilities clearly, including differences from PostgreSQL where relevant.
- Use the existing capability system if already present.

==================================================
MYSQL-SPECIFIC CORRECTNESS REQUIREMENTS
==================================================

Handle MySQL semantics carefully, including where relevant:
- primary keys
- unique constraints
- indexes
- nullability
- default values
- AUTO_INCREMENT behavior
- foreign keys
- schema/database naming differences
- type normalization / mapping
- engine-specific DDL differences
- destructive operation limitations or warnings

Do not assume PostgreSQL semantics apply unchanged.

==================================================
ARCHITECTURAL REQUIREMENTS
==================================================

Keep the current standalone-service architecture intact.

The MySQL adapter should:
- live in the standalone schema-sync service
- follow the shared adapter contract
- use engine-specific logic only where needed
- reuse engine-agnostic canonical/diff/orchestration layers where appropriate

Do not re-entangle the service with PostgreSQL-only assumptions.
If lingering PostgreSQL assumptions block MySQL support, fix them surgically and safely.

==================================================
AREAS TO AUDIT CAREFULLY
==================================================

Inspect carefully:
- engine registry / adapter resolution
- canonical schema mapping boundaries
- shared types / API contracts
- type normalization
- diff/planning path
- SQL renderer path
- apply path
- capability model
- service transport/API contract
- any frontend engine definitions or engine-selection assumptions
- any remaining hardcoded 'postgresql' logic in shared/core paths

==================================================
RULES
==================================================

Do NOT:
- implement MariaDB or SQL Server in this task
- redesign the service architecture
- broadly refactor unrelated workflows
- weaken migration fidelity
- blindly copy PostgreSQL SQL generation logic

Do:
- add MySQL cleanly as the next real adapter
- preserve remote-service behavior
- preserve disabled-mode behavior
- preserve migration preview/apply trustworthiness
- keep changes focused and testable

==================================================
TESTING REQUIREMENTS
==================================================

Add or update tests to verify:

1. Adapter registration
- MySQL adapter is discoverable and selectable through the engine system

2. Connection testing
- MySQL connection validation works
- useful failures are returned safely

3. Introspection fidelity
- imported MySQL live schema maps correctly into canonical schema

4. Migration fidelity
- baseline/target diff works for MySQL
- SQL preview reflects MySQL semantics correctly
- apply behavior matches preview behavior where supported

5. Core schema cases
At minimum cover:
- primary key
- unique field / unique constraint
- nullable vs not null
- default values
- AUTO_INCREMENT
- foreign keys
- indexes if supported in the current workflow

6. Regression safety
- PostgreSQL behavior is not broken by adding MySQL support
- service architecture remains stable

==================================================
OPTIONAL LIMITED SCAFFOLDING
==================================================

If helpful and low-risk, you may add:
- MySQL capability definition file
- MySQL-specific test fixtures
- small docs update listing MySQL as supported or newly added
- service env/example notes if MySQL-specific config is relevant

But keep the task focused on real MySQL adapter support.

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. feat: register mysql as supported schema sync engine
2. feat: add mysql connection and introspection adapter support
3. feat: add mysql migration preview and apply support
4. fix: remove blocking postgres-only assumptions for mysql adapter path
5. docs: update schema sync service support notes for mysql
6. test: validate mysql schema sync adapter behavior and postgres regression safety

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- files created
- files modified
- how MySQL was added to the adapter system
- what MySQL-specific capabilities are supported
- any remaining limitations of the MySQL adapter
- what shared/core PostgreSQL assumptions had to be fixed
- what tests were added
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- MySQL is added as a real adapter in the standalone schema-sync service
- connection test works
- live schema import works
- migration preview works
- apply behavior is supported appropriately
- migration fidelity is preserved
- PostgreSQL support still works
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
