Important: focus on operationalizing the existing standalone schema-sync service, not on adding new database engines yet.

Keep disabled mode safe and boring: when schema sync is off, unrelated SchemaDash features must keep working normally.

You are Codex acting as a principal DevOps engineer, service deployment engineer, and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: sync/03-dockerize-schema-sync-standalone-service

PULL REQUEST TITLE: Dockerize standalone schema sync service with compose integration and health checks

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Build on top of the existing standalone schema-sync service work already completed.
- Do not revert the current standalone-service extraction or runtime integration.
- Keep changes scoped to containerization, compose integration, health checks, and deployment-readiness for the standalone schema-sync service.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
The standalone schema-sync service has already been extracted and integrated as an external service path.
The current desired runtime model is:
- SCHEMADASH_SCHEMA_SYNC_ENABLED=false -> schema sync disabled
- SCHEMADASH_SCHEMA_SYNC_ENABLED=true -> main app uses the standalone schema-sync service
- no embedded/in-process runtime mode

MISSION:
Make the standalone schema-sync service production-friendly for self-hosted deployment by:
- containerizing it
- integrating it into docker compose
- adding health checks
- documenting startup and configuration clearly
- preserving the existing PostgreSQL schema sync behavior

==================================================
PRIMARY GOAL
==================================================

Make the standalone schema-sync service easy to run in real deployments.

The result should support:
- standalone Docker build for the schema-sync service
- docker-compose integration with the main app
- service startup ordering / readiness checks
- health endpoints and healthcheck configuration
- clear environment configuration
- safe enabled/disabled behavior

==================================================
REQUIRED IMPLEMENTATION SCOPE
==================================================

Implement these parts:

1. Standalone service Dockerization
- Add a Dockerfile for the standalone schema-sync service.
- Ensure it is practical, minimal, and buildable.
- The service should be runnable independently in a container.

2. Compose integration
- Add or update docker-compose configuration so the standalone schema-sync service can run alongside the main app.
- The main app should use the service URL from env when schema sync is enabled.
- Keep disabled mode possible and well-defined.

3. Health checks
- Add a real health/readiness endpoint for the standalone schema-sync service.
- Add Docker/Compose healthcheck configuration.
- Make sure the service can be probed for readiness.
- Where useful, document liveness vs readiness semantics clearly.

4. Service startup / dependency behavior
- Ensure the main app can tolerate:
  - schema sync disabled
  - schema sync enabled but service unavailable
  - schema sync enabled and service healthy
- Startup behavior should be understandable and safe.
- Avoid hard crashes of unrelated app features when schema sync is unavailable.

5. Environment configuration
- Clearly support and document:
  - SCHEMADASH_SCHEMA_SYNC_ENABLED=true|false
  - SCHEMADASH_SCHEMA_SYNC_SERVICE_URL=http://schema-sync-adapter:4020
- Add any additional required environment variables only if necessary and keep them minimal.

6. Documentation
- Add clear setup/deployment notes for:
  - running the service locally
  - running it with docker compose
  - enabled vs disabled behavior
  - health checks
  - troubleshooting service connectivity

==================================================
HEALTH CHECK REQUIREMENTS
==================================================

Implement a simple, practical health endpoint for the standalone schema-sync service.

The health path should:
- be lightweight
- return success when the service process is healthy
- be suitable for container health checks

If useful, also distinguish:
- basic liveness
- service readiness

But do not overcomplicate the design.

==================================================
COMPOSE REQUIREMENTS
==================================================

The compose integration should:
- make the schema-sync service easy to run beside the main app
- use meaningful service names
- wire the service URL cleanly
- support healthcheck-based dependency flow where practical
- avoid breaking deployments where schema sync is disabled

If the repo already has compose files, update them carefully rather than creating conflicting alternatives.

==================================================
PRESERVE CURRENT FUNCTIONALITY
==================================================

Preserve the existing PostgreSQL standalone schema-sync behavior.

Important:
- keep migration fidelity
- keep SQL preview correctness
- keep apply safety
- do not break the current remote PostgreSQL path while dockerizing and adding health checks

==================================================
RULES
==================================================

Do NOT:
- implement MySQL / MariaDB / SQL Server in this task
- redesign product workflows
- introduce embedded mode again
- broadly refactor unrelated infrastructure
- break disabled mode
- break current PostgreSQL schema sync behavior

Do:
- make the standalone service operationally usable
- improve self-hosted deployment readiness
- keep configuration simple
- add practical health checks
- preserve current functionality

==================================================
TESTING REQUIREMENTS
==================================================

Add or update tests / validation to verify:
- standalone schema-sync service container build works
- service health endpoint works
- compose wiring is valid
- main app env integration is correct
- disabled mode still works
- enabled mode works when service URL is configured
- the existing PostgreSQL remote schema sync path still works

Where full automated Docker tests are not practical, provide the strongest reasonable validation and documentation.

==================================================
OPTIONAL DEPLOYMENT EXTRAS
==================================================

If useful and low-risk, you may also add:
- example env file updates
- a service-specific README
- startup script cleanup
- deployment notes for reverse proxy / internal networking if relevant

But keep the focus on Dockerization, compose integration, and health checks.

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. feat: add docker build for standalone schema sync service
2. feat: add health endpoint and container healthcheck support
3. feat: integrate standalone schema sync service into compose configuration
4. docs: add standalone schema sync docker and env usage notes
5. test: validate dockerized schema sync service and compose integration

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- files created
- files modified
- how the schema-sync service is containerized
- what health endpoint/checks were added
- how compose integration works
- how enabled and disabled modes behave in deployment
- what documentation was added
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- the standalone schema-sync service has a real Docker build
- it is integrated into docker compose cleanly
- health checks exist and are practical
- the main app can be deployed with schema sync enabled or disabled
- current PostgreSQL remote schema sync behavior is preserved
- self-hosted deployment is materially easier

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
