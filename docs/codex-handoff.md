# Codex Handoff

## 1. Project Overview

SchemaDash is a self-hosted database diagramming application with a React
frontend, a Fastify backend, and a standalone schema-sync service used for live
PostgreSQL import, migration preview, drift validation, and apply. The product
still centers on diagrams, projects, sharing, authentication, collaboration,
and workflow history. This task did not change those product areas.

The runtime contract relevant to this task is:

- `SCHEMADASH_SCHEMA_SYNC_ENABLED=false`: schema sync is disabled and the rest
  of SchemaDash should continue working without remote schema-sync calls
- `SCHEMADASH_SCHEMA_SYNC_ENABLED=true`: the main app calls the standalone
  schema-sync service over HTTP
- there is no embedded schema-sync mode in the main app

Key concepts for this area:

- `backend/` is the main app API used by the frontend
- `services/schema-sync-service/` is the standalone remote dependency
- `shared/schema-sync-core/` holds canonical schema types, diffing, and shared
  apply contracts
- `backend/src/services/diagram-migration-service.ts` is the main app workflow
  layer that turns remote schema-sync behavior into migration preview,
  validation, and apply responses for the UI

## 2. Current Architectural Context

Read these files first for future work:

1. [docs/codex-handoff.md](/root/data/SchemaDash/docs/codex-handoff.md)
2. [docs/operations/self-hosting.md](/root/data/SchemaDash/docs/operations/self-hosting.md)
3. [services/schema-sync-service/README.md](/root/data/SchemaDash/services/schema-sync-service/README.md)
4. [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
5. [backend/src/services/diagram-migration-service.ts](/root/data/SchemaDash/backend/src/services/diagram-migration-service.ts)
6. [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
7. [backend/src/app.ts](/root/data/SchemaDash/backend/src/app.ts)
8. [docker-compose.yml](/root/data/SchemaDash/docker-compose.yml)
9. [docs/audits/remote-schema-sync-service-reliability-audit-2026-04-09.md](/root/data/SchemaDash/docs/audits/remote-schema-sync-service-reliability-audit-2026-04-09.md)

Parts of the system that matter for this task:

- main app remote client boundary:
  [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
- main app request lifecycle and logging:
  [backend/src/app.ts](/root/data/SchemaDash/backend/src/app.ts),
  [backend/src/utils/request-context.ts](/root/data/SchemaDash/backend/src/utils/request-context.ts)
- main app readiness and health reporting:
  [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
- migration preview/validate/apply orchestration:
  [backend/src/services/diagram-migration-service.ts](/root/data/SchemaDash/backend/src/services/diagram-migration-service.ts)
- standalone service health contract:
  [services/schema-sync-service/src/routes/health-routes.ts](/root/data/SchemaDash/services/schema-sync-service/src/routes/health-routes.ts)

Important service and module boundaries:

- frontend talks only to the main app, not directly to the standalone service
- the main app talks to the standalone service through
  [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
- the standalone service owns connection storage, baseline snapshots, change
  plans, audits, apply jobs, and post-apply snapshots
- the main app owns workflow state shown in the editor and needs to keep that
  workflow state trustworthy under remote-service failures

High-risk files:

- [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
  because every enabled remote call flows through it
- [backend/src/services/diagram-migration-service.ts](/root/data/SchemaDash/backend/src/services/diagram-migration-service.ts)
  because apply safety and drift validation live here
- [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
  because operators use these routes to understand disabled vs degraded vs
  unavailable states

## 3. Task Completed

This task was meant to harden remote schema-sync service behavior for
reliability, safety, and observability without redesigning the product or
changing the standalone-service architecture.

What was implemented:

- audited the current remote schema-sync failure modes before changing behavior
- added operation-aware timeouts in the main app remote client instead of one
  implicit network behavior for every call
- added conservative automatic retries only for safe read-style operations such
  as readiness checks, connection lookup, audit lookup, snapshot lookup,
  apply-job lookup, and connection test
- kept live schema import, migration preview generation, connection mutation,
  and apply explicitly non-retryable
- forwarded the main app request id to the standalone service so cross-service
  logs can be correlated with the same `x-request-id`
- changed main-app readiness reporting to distinguish `disabled`, `ready`,
  `not_ready`, and `unavailable`
- improved main-app health payloads to expose schema-sync `errorCode` and
  `checkedAt`
- added structured main-app logging for remote schema-sync failures and
  high-value operations
- changed migration preview and validation to convert remote-service failures
  into explicit blocking issues instead of letting some remote failures bubble
  up as vague route errors
- hardened apply so a remote timeout or transport failure is treated as an
  explicit unknown-outcome case and remote audit state is consulted before
  reporting success or failure
- prevented a post-apply snapshot refresh failure from falsely turning a
  successful remote apply into a failed apply result

Approach intentionally avoided:

- no new engines
- no reintroduction of embedded mode
- no redesign of diagram workflow or migration UX
- no blind retries for apply
- no changes to PostgreSQL diff/apply internals inside the standalone service

## 4. Files Changed

Files created in this task:

- [docs/audits/remote-schema-sync-service-reliability-audit-2026-04-09.md](/root/data/SchemaDash/docs/audits/remote-schema-sync-service-reliability-audit-2026-04-09.md)
  reliability audit and hardening direction used for this task
- [backend/src/utils/request-context.ts](/root/data/SchemaDash/backend/src/utils/request-context.ts)
  request-id propagation helper so outbound schema-sync calls can reuse the main
  app request id
- [backend/test/schema-sync-client.test.ts](/root/data/SchemaDash/backend/test/schema-sync-client.test.ts)
  focused remote-client reliability coverage for disabled mode, timeout,
  retry, readiness, and invalid-response behavior

Files modified in this task:

- [backend/src/app.ts](/root/data/SchemaDash/backend/src/app.ts)
  request-context setup plus structured AppError logging for schema-sync and
  server-side failures
- [backend/src/context/app-context.ts](/root/data/SchemaDash/backend/src/context/app-context.ts)
  passes a dedicated logger into the remote schema-sync client
- [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
  operation-aware timeout and retry policy, request-id forwarding, readiness
  state hardening, invalid-response handling, and structured logs
- [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
  richer schema-sync health details including error code and last check time
- [backend/src/services/diagram-migration-service.ts](/root/data/SchemaDash/backend/src/services/diagram-migration-service.ts)
  explicit migration preview/validation/apply behavior under remote-service
  failure conditions
- [docs/operations/self-hosting.md](/root/data/SchemaDash/docs/operations/self-hosting.md)
  operator guidance for readiness states, timeout strategy, retry boundaries,
  and apply troubleshooting
- [services/schema-sync-service/README.md](/root/data/SchemaDash/services/schema-sync-service/README.md)
  service-facing troubleshooting and runtime contract updates
- [docs/codex-handoff.md](/root/data/SchemaDash/docs/codex-handoff.md)
  this file
- [backend/test/health-routes.test.ts](/root/data/SchemaDash/backend/test/health-routes.test.ts)
  readiness-state assertions for `disabled`, `not_ready`, and `unavailable`
- [backend/test/schema-sync-routes.test.ts](/root/data/SchemaDash/backend/test/schema-sync-routes.test.ts)
  schema-sync route mocks updated for the hardened readiness contract
- [backend/test/diagram-migration-service.test.ts](/root/data/SchemaDash/backend/test/diagram-migration-service.test.ts)
  migration/apply safety coverage for remote failures, unknown apply outcomes,
  audit recovery, and post-apply refresh warnings
- [backend/test/diagram-workflow-service.test.ts](/root/data/SchemaDash/backend/test/diagram-workflow-service.test.ts)
  schema-sync client mock updated for the hardened readiness contract
- [backend/test/diagram-version-restore-service.test.ts](/root/data/SchemaDash/backend/test/diagram-version-restore-service.test.ts)
  schema-sync client mock updated for the hardened readiness contract

Important files intentionally not changed:

- [services/schema-sync-service/src/services/schema-sync-service.ts](/root/data/SchemaDash/services/schema-sync-service/src/services/schema-sync-service.ts)
  PostgreSQL import and plan generation semantics were intentionally preserved
- [services/schema-sync-service/src/services/apply-service.ts](/root/data/SchemaDash/services/schema-sync-service/src/services/apply-service.ts)
  standalone apply engine semantics were intentionally preserved in this task
- [docker-compose.yml](/root/data/SchemaDash/docker-compose.yml)
  startup/dependency wiring from the previous standalone-service work was kept
  intact

## 5. Data / API / Workflow Changes

Behavior changes:

- main app schema-sync readiness now reports:
  `disabled`, `ready`, `not_ready`, or `unavailable`
- remote client timeout behavior is differentiated by operation class
- remote client retries only safe read-style operations on transport/readiness
  failures
- migration preview and validation now surface remote-service failures as
  blocking workflow issues with clearer messages
- apply can now report:
  confirmed success,
  confirmed failure,
  or failed-with-unknown-outcome guidance when the remote service timed out or
  became unavailable

API and logging changes:

- main app forwards `x-request-id` to the standalone service
- `/api/readyz` and `/api/health` include richer schema-sync state details
- main app logs now include structured remote-call context for schema-sync
  failures and retried operations

Compatibility notes:

- no database migrations were added
- no frontend route changes were required
- current PostgreSQL remote schema-sync behavior was preserved

## 6. Validation Performed

Validated in this task:

- `npm run build -w @schemadash/schema-sync-core`
- `npm run build -w @schemadash/backend`
- `npm run test -w @schemadash/backend -- schema-sync-client.test.ts health-routes.test.ts schema-sync-routes.test.ts diagram-migration-service.test.ts`

Manually verified in code review:

- safe operations have bounded retries and apply does not
- disabled mode still returns the disabled client path
- readiness is no longer collapsed into a single `down` state
- migration preview/validation/apply code paths now distinguish remote-service
  failures more explicitly

Not yet completed in this handoff snapshot:

- full backend or full repository test suites beyond the focused reliability
  slice above

Known limitations and risks:

- the standalone service still owns audit/job truth, so unknown-outcome apply
  cases still require operators to inspect remote audit state before retrying
- local generated SQLite WAL files under
  `services/schema-sync-service/.schemadash-schema-sync-service/` remain a
  repository hygiene footgun and should be handled carefully in future work

## 7. Outstanding Work

Still not done in this task:

- full repo-wide regression coverage outside the targeted backend reliability
  slice
- cleanup of tracked/generated SQLite WAL state under
  `services/schema-sync-service/.schemadash-schema-sync-service/`

Recommended next implementation phase:

1. Read the backend client and migration service changes first.
2. Expand from focused backend tests to broader end-to-end or container-level
   verification if more confidence is needed.
3. Keep future work narrowly scoped to reliability and observability rather than
   feature expansion.

## 8. Instructions for the Next Codex Session

Exact reading order:

1. [docs/codex-handoff.md](/root/data/SchemaDash/docs/codex-handoff.md)
2. [docs/audits/remote-schema-sync-service-reliability-audit-2026-04-09.md](/root/data/SchemaDash/docs/audits/remote-schema-sync-service-reliability-audit-2026-04-09.md)
3. [backend/src/schema-sync/client.ts](/root/data/SchemaDash/backend/src/schema-sync/client.ts)
4. [backend/src/services/diagram-migration-service.ts](/root/data/SchemaDash/backend/src/services/diagram-migration-service.ts)
5. [backend/src/routes/health-routes.ts](/root/data/SchemaDash/backend/src/routes/health-routes.ts)
6. [docs/operations/self-hosting.md](/root/data/SchemaDash/docs/operations/self-hosting.md)
7. [services/schema-sync-service/README.md](/root/data/SchemaDash/services/schema-sync-service/README.md)

Do not break:

- the external-service-only schema-sync runtime contract
- disabled-mode safety
- apply non-retryability
- PostgreSQL-only remote behavior
- the distinction between service liveness and service readiness

Continue work in:

- [backend/test/schema-sync-routes.test.ts](/root/data/SchemaDash/backend/test/schema-sync-routes.test.ts)
- [backend/test/health-routes.test.ts](/root/data/SchemaDash/backend/test/health-routes.test.ts)
- [backend/test/diagram-migration-service.test.ts](/root/data/SchemaDash/backend/test/diagram-migration-service.test.ts)
- add a new focused remote-client test file if needed under
  `backend/test/`

## 9. Git Summary

- Working branch: `sync/04-remote-schema-sync-service-behavior`
- Pull request title:
  `Harden remote schema sync service behavior for reliability safety and observability`

Commits created so far in this task:

1. `chore: audit remote schema sync service failure modes and timeout behavior`
   Added the repository audit doc for current remote-client gaps and the chosen hardening direction.
2. `fix: harden remote client timeout retry and readiness handling`
   Added operation-aware timeouts, safe retries, request-id forwarding, remote-call logs, and differentiated readiness states.
3. `fix: improve remote schema sync error classification and user-facing diagnostics`
   Improved health payload detail, AppError logging, and migration preview/validation surfaces for remote-service failures.
4. `fix: harden remote migration and apply behavior under service failure conditions`
   Made apply outcome handling safer under remote failures and prevented post-apply refresh problems from misreporting successful applies.
5. `docs: add remote schema sync hardening and troubleshooting notes`
   Updated operator docs, service docs, and this handoff for the hardened remote behavior.
6. `test: validate hardened remote schema sync reliability behavior`
   Added focused backend reliability tests and updated existing mocks for the new readiness model.
