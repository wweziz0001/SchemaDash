You are Codex acting as a principal full-stack architect, service-boundary refactoring engineer, and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: sync/02-schema-sync-standalone-service-only-on-top-of-postgres-extraction

PULL REQUEST TITLE: Convert extracted postgres schema sync adapter into standalone-service-only architecture

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Build on top of the existing postgres adapter extraction work already present in this branch.
- Do NOT revert the previous adapter extraction.
- Keep changes scoped to converting the current extraction into standalone-service-only architecture.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CURRENT RECOMMENDATION TO FOLLOW:
The current postgres extraction should be kept.
Do NOT revert to pre-extraction state.
The current adapter/runtime seam is additive, localized, and useful.
The real follow-up problem is lingering PostgreSQL assumptions in shared/core files, not the extraction itself.

Important current hotspots identified:
- packages/schema-sync-core/src/api.ts
- packages/schema-sync-core/src/types.ts
- packages/schema-sync-core/src/diff.ts
- packages/schema-sync-core/src/sql.ts
- packages/schema-sync-core/src/type-normalization.ts
- backend/src/repositories/metadata-repository.ts
- frontend/src/lib/schema-sync/canonical-adapters.ts

CURRENT EXTRACTION / RUNTIME LAYER ALREADY EXISTS IN AREAS SUCH AS:
- backend/src/engines/types.ts
- backend/src/engines/registry.ts
- backend/src/engines/plan.ts
- backend/src/engines/postgresql/adapter.ts
- backend/src/engines/postgresql/apply.ts
- backend/src/engines/postgresql/capabilities.ts
- backend/src/engines/postgresql/connection.ts
- backend/src/engines/postgresql/introspection.ts
- backend/src/engines/postgresql/renderer.ts
- backend/src/context/app-context.ts
- backend/src/services/connections-service.ts
- backend/src/services/schema-sync-service.ts
- backend/src/services/diagram-migration-service.ts
- backend/src/services/apply-service.ts

MISSION:
Convert the current extracted PostgreSQL adapter architecture into a standalone-service-only schema sync architecture.

IMPORTANT RUNTIME REQUIREMENT:
Do NOT retain embedded runtime mode.
The desired runtime model is ONLY:

1. schema sync disabled
2. schema sync enabled as a standalone external service

If enabled:
- the main app must communicate with the standalone schema-sync service

If disabled:
- the rest of SchemaDash should continue to work normally
- schema sync features should be hidden, blocked, or degrade safely

Do NOT keep an in-process embedded schema sync runtime path as a supported mode.

==================================================
PRIMARY GOAL
==================================================

Use the current extracted adapter seam as the basis for a clean standalone-service-only architecture where:

- schema sync code is organized into a dedicated standalone-service-ready area
- the main app no longer assumes local/in-process schema sync execution
- env vars control enabled vs disabled behavior
- PostgreSQL remains the first real engine implementation
- future Dockerization is straightforward

==================================================
REQUIRED BEHAVIOR
==================================================

Support ONLY these states:

A. Disabled
- schema sync is unavailable
- app continues to function normally outside schema sync
- schema sync routes/features fail safely or are hidden appropriately

B. Service Enabled
- schema sync is expected to run as a standalone external service
- main app communicates with it via a defined client/service boundary
- service URL and enablement are controlled by env vars

Suggested env contract:
- SCHEMADASH_SCHEMA_SYNC_ENABLED=true|false
- SCHEMADASH_SCHEMA_SYNC_SERVICE_URL=http://localhost:4020

You may refine the exact names if justified, but keep the model simple:
- enabled external service
- disabled

==================================================
PHASE 1 — ADD / UPDATE DESIGN DOCUMENT
==================================================

Create or update:

docs/schema-sync-service-architecture.md

It must explain:
- why the current postgres extraction is being preserved
- why reverting is not recommended
- why embedded mode is intentionally not retained
- what remains in the main app
- what moves into the standalone schema sync service area
- how disabled mode behaves
- how enabled service mode behaves
- environment variable design
- rollout/migration strategy from current branch state

==================================================
PHASE 2 — FIX FALSE MULTI-ENGINE SIGNALING / HARDCODED LEAKAGE
==================================================

Before broad service extraction, address the most misleading hardcoded PostgreSQL/shared leakage first, especially in:
- backend/src/repositories/metadata-repository.ts
- packages/schema-sync-core/src/api.ts

Then continue with the other shared/core PostgreSQL assumption hotspots as needed:
- packages/schema-sync-core/src/diff.ts
- packages/schema-sync-core/src/sql.ts
- packages/schema-sync-core/src/type-normalization.ts
- packages/schema-sync-core/src/types.ts
- frontend/src/lib/schema-sync/canonical-adapters.ts

Goal:
- remove misleading hardcoded engine leakage
- make the current extraction more honest and cleaner
- prepare the code for service-only boundary

==================================================
PHASE 3 — STANDALONE SERVICE FOLDER STRUCTURE
==================================================

Move or organize schema sync into a dedicated standalone-service-ready area, for example:
- services/schema-sync-adapter/
or a better justified equivalent

This area should clearly contain:
- service entrypoint
- config/env handling
- transport/api layer
- engine registry
- postgres adapter
- future engine locations
- shared engine contracts if they belong there
- planning / SQL preview / apply service logic as appropriate

The structure must be suitable for future Dockerization.

==================================================
PHASE 4 — MAIN APP SERVICE CLIENT BOUNDARY
==================================================

Implement the main app side so it no longer assumes schema sync runs in-process.

Add:
- a schema sync remote client boundary
- service URL resolution from env
- enabled/disabled resolution
- graceful handling when disabled

Do NOT keep a hidden embedded fallback runtime mode.

==================================================
PHASE 5 — PRESERVE CURRENT POSTGRESQL FUNCTIONALITY
==================================================

Preserve the existing PostgreSQL behavior functionally through the new service boundary:
- connection test
- live import
- diff
- migration preview
- apply
- audit/logging/drift support

Migration fidelity remains a top priority.

==================================================
PHASE 6 — OPTIONAL LIGHT SERVICE SCAFFOLDING
==================================================

If useful, add lightweight service-oriented scaffolding such as:
- service README
- env example
- placeholder Dockerfile
- simple startup notes
- service port defaults

But keep this practical and focused.

==================================================
RULES
==================================================

Do NOT:
- revert the previous postgres adapter extraction
- retain embedded runtime mode
- fully implement MySQL / MariaDB / SQL Server
- broadly refactor unrelated product features
- redesign Versions / Changelog / Compare workflows
- break current PostgreSQL behavior

Do:
- build on top of the current extracted seam
- remove misleading shared PostgreSQL leakage where necessary
- make schema sync standalone-service-only
- support only enabled external service or disabled mode
- keep the implementation incremental and testable

==================================================
TESTING REQUIREMENTS
==================================================

Add or update tests to verify:
- enabled/disabled env behavior works
- disabled mode degrades safely
- service URL/env parsing works
- main app integration uses the service boundary
- current PostgreSQL schema sync behavior remains correct through the new architecture
- migration preview/apply fidelity remains correct

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. chore: audit current extracted postgres seam for standalone-service-only conversion
2. docs: add standalone schema sync service architecture design from current branch state
3. fix: remove hardcoded postgres engine leakage in shared/core boundaries
4. refactor: introduce standalone schema sync service client and enablement boundary
5. refactor: move schema sync into dedicated standalone-service-ready folder
6. fix: preserve postgres live schema sync behavior through service-oriented boundary
7. docs: add env configuration and standalone service deployment notes
8. test: validate disabled and standalone-service-enabled schema sync behavior

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- document path created/updated
- new folder/module structure
- chosen env variable contract
- how enabled and disabled modes behave
- which hardcoded postgres/shared leakage was removed
- what remains in the main app
- what moved into the standalone schema sync service area
- whether any docker/service scaffolding was added
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- the previous postgres extraction is preserved and built upon
- embedded mode is not retained
- schema sync is organized as a standalone-service-ready component
- env vars control only enabled service vs disabled behavior
- current PostgreSQL behavior is preserved
- misleading hardcoded shared PostgreSQL leakage is reduced
- future Dockerization is materially easier

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
