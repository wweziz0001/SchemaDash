# Remote Schema Sync Service Reliability Audit

Date: 2026-04-09
Branch: `sync/04-remote-schema-sync-service-behavior`
Scope: hardening the existing remote schema-sync path only

## Goal

Make the standalone schema-sync integration safer and more diagnosable for real
self-hosted operation without reintroducing embedded mode, redesigning product
flows, or adding new engines.

## Files Audited First

- `backend/src/schema-sync/client.ts`
- `backend/src/routes/health-routes.ts`
- `backend/src/routes/schema-sync-routes.ts`
- `backend/src/routes/diagram-migration-routes.ts`
- `backend/src/services/diagram-migration-service.ts`
- `backend/src/config/env.ts`
- `backend/src/app.ts`
- `services/schema-sync-service/src/routes/health-routes.ts`
- `services/schema-sync-service/src/services/schema-sync-service.ts`
- `services/schema-sync-service/src/services/apply-service.ts`
- `docker-compose.yml`
- `docs/operations/self-hosting.md`

## Observed Reliability Gaps

### 1. Remote timeout behavior is implicit and uniform

- `backend/src/schema-sync/client.ts` uses one generic `fetch` path.
- No `AbortController` is used, so operation timeouts are not explicit.
- Health/readiness probes, connection tests, introspection, diff preview, and
  apply all currently inherit the same unbounded network behavior.

### 2. Retry policy is absent and unclassified

- The main app does not distinguish safe retryable reads from stateful writes.
- This avoids unsafe retries today, but transient network failures are also not
  handled intentionally for safe operations.
- There is no explicit statement in code about why apply must not be retried.

### 3. Error mapping is too coarse

- Non-`AppError` failures collapse into `schema_sync_service_unavailable`.
- Timeouts, DNS/connectivity failures, invalid JSON, readiness failures, and
  malformed success payloads are not distinguished.
- User-facing route failures can force operators to guess whether the problem is
  app-side, service-side, or live-database-side.

### 4. Readiness state loses important detail

- The standalone service already separates `/livez` and `/readyz`.
- The main app reduces that to `disabled | up | down`.
- A service that is reachable but not ready is therefore reported the same as a
  dead or unreachable service.

### 5. Migration preview/apply path trusts remote failures too loosely

- Preview and validation catch broad errors and attach raw messages, but the
  issues are not strongly classified for operators.
- Apply depends on a single remote call path and fallback audit lookup, but it
  does not explicitly guard against ambiguous timeout/unavailable outcomes.
- The desired trust model requires preview/apply failures to be explicit and
  never look like success.

### 6. Logging around remote calls is thin

- The backend client does not emit structured per-operation diagnostics.
- Request correlation exists at the Fastify level, but remote client logs do not
  consistently include operation name, target URL, retry metadata, or failure
  classification.
- Self-hosted debugging would benefit from more actionable remote call logs that
  do not leak connection secrets.

### 7. Disabled mode is safe today and must stay boring

- `createSchemaSyncClient` correctly returns a disabled client when the feature
  is off.
- Existing route behavior returns `schema_sync_disabled`.
- This area should be preserved rather than redesigned.

## Hardening Direction Chosen

- Add operation-aware timeout classes instead of one global timeout.
- Add conservative retries only for safe idempotent operations and only for
  transport/readiness failures.
- Keep destructive and stateful operations, especially apply, strictly
  non-retryable.
- Introduce clearer client-side error classification and preserve actionable
  user-facing messages.
- Expose `disabled`, `unavailable`, `not_ready`, and `ready` distinctly through
  main-app readiness/health responses.
- Strengthen migration preview/apply reporting so timeout and remote-failure
  cases are explicit.
- Add structured backend logs for remote schema-sync operations with request and
  operation context but without secrets.

## Out of Scope

- Reintroducing embedded schema sync
- New database engines
- Reworking the schema-sync service internal apply engine
- Product workflow redesign unrelated to reliability hardening
