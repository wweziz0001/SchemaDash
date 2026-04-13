Important: this task is about reliability hardening of the remote schema-sync path, not about adding new engines or redesigning the product.
Treat migration preview and apply as high-trust operations: failures, timeouts, and remote-service issues must be explicit and never ambiguous.

You are Codex acting as a principal backend reliability engineer, distributed-service hardening engineer, and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: sync/04-remote-schema-sync-service-behavior

PULL REQUEST TITLE: Harden remote schema sync service behavior for reliability safety and observability

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Build on top of the existing standalone schema-sync service, remote integration, Dockerization, compose integration, and health checks already completed.
- Do not revert the current standalone-service architecture.
- Keep changes scoped to hardening remote service behavior.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by hardening phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
SchemaDash now uses schema sync as a standalone external service when enabled.

Desired runtime model:
- SCHEMADASH_SCHEMA_SYNC_ENABLED=false -> schema sync disabled
- SCHEMADASH_SCHEMA_SYNC_ENABLED=true -> main app uses standalone schema-sync service
- no embedded mode

The standalone service is already extracted, remotely integrated, and containerized.
Now the goal is to make the remote behavior more reliable, more diagnosable, and safer for real self-hosted operation.

MISSION:
Harden the remote schema-sync service behavior so that SchemaDash handles service communication, failure modes, timeouts, health/readiness, and error reporting in a production-credible way.

==================================================
PRIMARY GOAL
==================================================

Make the remote schema-sync integration trustworthy in real deployments.

The hardened result should improve:
- timeout handling
- retry policy where safe
- error classification
- service unavailability handling
- readiness vs liveness behavior
- startup dependency behavior
- user-facing error clarity
- logs and diagnostics
- migration/apply safety under remote service conditions

==================================================
REQUIRED HARDENING SCOPE
==================================================

Implement these improvements:

1. Timeout strategy
- Audit all remote calls from the main app to the schema-sync service.
- Define sensible timeouts for different classes of operations, such as:
  - health/readiness checks
  - connection test
  - schema import/introspection
  - migration preview/planning
  - apply execution
- Avoid one-size-fits-all timeouts if that would be misleading or too brittle.

2. Retry strategy
- Add retries only where they are safe and justified.
- Avoid unsafe retries for destructive operations.
- Distinguish between:
  - safe retryable calls
  - non-retryable / destructive / stateful calls
- If retries are added, keep them conservative and explicit.

3. Error classification and propagation
- Improve how remote service failures are classified and surfaced.
- Distinguish errors such as:
  - service unavailable
  - timeout
  - invalid response
  - readiness failure
  - connection validation failure
  - migration plan generation failure
  - apply execution failure
  - stale baseline / drift issue
- Ensure the main app surfaces actionable and understandable errors.

4. Readiness vs liveness hardening
- Review and improve the difference between:
  - service process is alive
  - service is actually ready to handle schema-sync requests
- Make startup behavior and readiness handling more explicit.
- Avoid confusing healthy-but-not-ready states.

5. Disabled mode safety
- Ensure disabled mode remains safe and boring.
- The main app should not attempt pointless remote calls when schema sync is disabled.
- UI and backend behavior should degrade cleanly.

6. Remote migration/apply safety
- Harden the remote path for:
  - SQL preview
  - apply
  - drift validation
- Ensure failures are clear and do not produce ambiguous state.
- Avoid behavior where apply may look successful when the remote service failed or timed out.

7. Logging and observability
- Improve structured logs and diagnostics around remote schema-sync calls.
- Include useful correlation/context where appropriate.
- Make logs more actionable for self-hosted debugging without leaking secrets.
- Improve visibility into:
  - service URL/availability issues
  - timeout cases
  - migration/apply failures
  - readiness issues

8. Health/readiness integration behavior
- Improve how the main app reacts when:
  - schema-sync service is disabled
  - schema-sync service is unreachable
  - schema-sync service is alive but not ready
  - schema-sync service is healthy and ready
- The app should communicate these states clearly and safely.

==================================================
IMPORTANT SAFETY RULES
==================================================

Do NOT:
- introduce embedded mode again
- implement new database engines in this task
- redesign product workflows unrelated to service reliability
- retry destructive apply operations blindly
- hide remote errors behind vague generic 500s
- break current PostgreSQL remote schema sync behavior

Do:
- preserve current feature behavior
- improve reliability and safety of remote execution
- keep migration/apply semantics trustworthy
- make failures easier to diagnose
- keep disabled mode clean

==================================================
AREAS TO AUDIT CAREFULLY
==================================================

Inspect carefully:
- remote service client implementation
- service URL/env resolution
- timeout configuration
- request/response handling
- health/readiness endpoints and callers
- migration preview path
- apply path
- startup behavior
- error mapping / error messages
- logging around service interactions
- compose/deployment assumptions if they affect readiness behavior

==================================================
TIMEOUT / RETRY GUIDANCE
==================================================

Use practical differentiated behavior.

Examples of likely direction:
- health checks: short timeout, likely no retry or very small retry window
- connection test: moderate timeout, small safe retry if justified
- schema import/introspection: longer timeout, but still bounded
- migration preview: moderate/long timeout depending on payload size
- apply execution: explicit longer timeout, but no blind automatic retry

You do not need to follow these exact numbers, but the behavior should be intentional and justified.

==================================================
ERROR UX GUIDANCE
==================================================

User-visible errors should become more actionable.

Prefer messages like:
- Schema sync service is unavailable
- Schema sync service timed out while importing live schema
- Migration preview failed because the service returned an invalid plan
- Apply blocked because the live baseline is stale
- Schema sync service is enabled but not ready yet

Avoid:
- generic ambiguous internal error messages
- failures that force the user to guess whether the problem is app-side or service-side

==================================================
TESTING REQUIREMENTS
==================================================

Add or update tests to verify:

1. Timeout handling
- remote timeout is detected and surfaced correctly
- different operation classes use appropriate timeout behavior

2. Disabled mode
- no remote calls are attempted when disabled
- app behavior remains stable

3. Service unavailable / not ready handling
- unavailable service is surfaced clearly
- not-ready service is handled distinctly from dead service where practical

4. Migration/apply safety
- apply is not retried unsafely
- preview/apply failures are surfaced clearly
- failure states are not falsely reported as success

5. Logging / diagnostics
- where testable, verify structured error classification and propagation behavior

==================================================
OPTIONAL IMPROVEMENTS
==================================================

If useful and low-risk, you may also add:
- configurable timeout env vars
- request correlation ids
- clearer service client error wrapper types
- small health/readiness documentation improvements

But keep the task focused on remote hardening.

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. chore: audit remote schema sync service failure modes and timeout behavior
2. fix: harden remote client timeout retry and readiness handling
3. fix: improve remote schema sync error classification and user-facing diagnostics
4. fix: harden remote migration and apply behavior under service failure conditions
5. docs: add remote schema sync hardening and troubleshooting notes
6. test: validate hardened remote schema sync reliability behavior

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- files created
- files modified
- what timeout/retry strategy was chosen
- how disabled/unavailable/not-ready/healthy states are handled
- how migration/apply safety was improved
- what logging/diagnostics improvements were added
- what tests were added or updated
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- remote schema-sync behavior is more reliable and diagnosable
- timeouts are intentional and operation-aware
- retries are safe and limited
- disabled mode remains clean
- service unavailability is handled clearly
- migration/apply failure behavior is safer and more trustworthy
- current PostgreSQL remote behavior is preserved

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
