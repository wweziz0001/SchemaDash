# SchemaDash System Improvements Assessment

Date: 2026-03-28

Scope: repository assessment for performance, security, reliability, maintainability, scalability, observability, developer experience, and operational safety before major local self-hosted sync work.

Assessment basis:
- Code review of the current branch, with emphasis on `frontend/src/context/storage-context/storage-provider.tsx`, `frontend/src/context/schemadash-context/schemadash-provider.tsx`, `backend/src/services/persistence-service.ts`, `backend/src/repositories/app-repository.ts`, `backend/src/repositories/metadata-repository.ts`, `frontend/src/features/schema-sync/lib/canonical-adapters.ts`, and `packages/schema-sync-core/src/types.ts`.
- Supporting review of auth, env, request, schema-sync, apply, health, collaboration, and docs files that materially affect operational risk.

Evidence labels used in this document:
- Confirmed: directly supported by the current code.
- Likely: highly probable from the current implementation shape, but not exhaustively benchmarked at runtime.
- Inferred: architectural risk implied by the current design and deployment model.

## 1. Executive Summary

SchemaDash is functional and has meaningful strengths: the backend uses schema validation in many request paths, persistence is isolated behind repositories and services, and the schema-sync work already has a shared core package instead of ad hoc duplicated logic. Those are good foundations.

The main problem is not lack of features. It is concentration of risk in a few oversized orchestration points and several unsafe operational defaults. The frontend storage and editor providers each act as multi-system coordinators. The backend `PersistenceService` acts as the service layer for projects, diagrams, sharing, sessions, collaboration, and backup import/export. That makes change impact broad, error handling uneven, and performance behavior hard to predict.

The most urgent improvement areas are:
- production safety around auth-disabled deployments, operational routes, share tokens, and browser-exposed AI credentials
- tighter boundaries around storage, sync, sharing, and collaboration before major local sync replacement
- reduction of full-scan and full-snapshot behavior in both frontend storage and backend listing flows
- better transactionality, retention, and diagnostics for schema-sync metadata and apply jobs

The biggest blockers to safe future development are:
- `frontend/src/context/storage-context/storage-provider.tsx` and `frontend/src/context/schemadash-context/schemadash-provider.tsx` being too coupled to safely absorb another major sync implementation change
- `backend/src/services/persistence-service.ts` owning too many cross-cutting behaviors at once
- operational endpoints becoming effectively open when `SCHEMADASH_AUTH_MODE=disabled`
- share/session/security behavior still carrying legacy ChartDB compatibility paths

Bottom line: SchemaDash is usable, but it is not yet in a strong enough state for a major local self-hosted sync replacement without a focused hardening pass first. Current readiness is moderate for small feature work and low-to-moderate for high-risk sync replacement.

## 2. Performance Assessment

| Issue | Evidence | Affected files/modules | Why it matters | Likely impact | Severity | Recommended improvement | Fix before local sync replacement? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Oversized orchestration providers create broad rerender and change blast radius | Confirmed | `frontend/src/context/storage-context/storage-provider.tsx`, `frontend/src/context/schemadash-context/schemadash-provider.tsx` | The storage provider is ~2.9k lines and the editor provider is ~2.6k lines. Both return large inline context values and manage many concerns at once. Any state or callback change can ripple widely through consumers. | UI state churn, harder memoization, fragile editor responsiveness under active collaboration | High | Split into narrower hooks/services for catalog sync, diagram sessions, remote refresh, and diagram mutation state. Memoize context value objects or use segmented contexts/selectors. | Yes |
| Remote catalog sync performs full scans and serial project-by-project diagram fetches | Confirmed | `frontend/src/context/storage-context/storage-provider.tsx` | `syncRemoteCatalog()` loads all collections and projects, loads all cached records with `toArray()`, then fetches diagrams for each project sequentially. Startup work scales with total catalog size rather than the current view. | Slow bootstrap, slow dashboard loads, poor scaling as projects and diagrams grow | High | Add paginated or delta-based catalog APIs, batch diagram summaries server-side, and avoid `toArray()` full-cache comparisons for every refresh. | Yes |
| Local diagram saves rewrite whole snapshots instead of applying incremental updates | Confirmed | `frontend/src/context/storage-context/storage-provider.tsx` | `replaceLocalDiagramSnapshot()` deletes all tables, relationships, dependencies, areas, custom types, and notes for a diagram, then bulk reinserts them. | Large local writes, unnecessary IndexedDB churn, higher conflict surface during sync and refresh | High | Introduce diagram-part mutation paths or patch-based persistence for local cache. Keep full snapshot rewrite only for import/reset paths. | Yes |
| Diagram hydration repeatedly materializes full child collections | Confirmed | `frontend/src/context/storage-context/storage-provider.tsx` | `hydrateDiagram()`, `readLocalDiagrams()`, and related helpers repeatedly call `toArray()` for each entity set per diagram. `buildLocalOnlyProject()` also reads full diagrams just to count/update timestamps. | Slow large-diagram loading and large local-only fallback flows | Medium-High | Add lightweight summary records, selective includes by call site, and denormalized counts/timestamps for list views. | Yes |
| Backend listing/filtering is mostly in-memory after full-table reads | Confirmed | `backend/src/services/persistence-service.ts`, `backend/src/repositories/app-repository.ts` | `listProjects()` loads all collections, all diagrams, and all projects, then filters and computes access in memory. `listCollections()` and `listProjectDiagrams()` also lean on whole-list repository methods. | Growing latency and CPU as catalog size grows; poor multi-user scaling on SQLite | High | Push search/filter/count work into repository queries, add pagination, and precompute summary fields where possible. | Yes |
| Repository list methods deserialize full diagram documents even for summary views | Confirmed | `backend/src/repositories/app-repository.ts`, `backend/src/services/persistence-service.ts` | `mapDiagram()` always parses `document_json`, and summary endpoints derive `tableCount` from the parsed document. This makes “list” operations pay near “get full diagram” cost. | Wasteful CPU and memory for project and dashboard listing | High | Store summary columns separately, add summary-only queries, and avoid parsing full diagram JSON when only metadata is needed. | Yes |
| Remote refresh and collaboration paths fall back to full diagram reloads | Confirmed | `frontend/src/context/schemadash-context/schemadash-provider.tsx`, `frontend/src/context/storage-context/storage-provider.tsx` | Collaboration events frequently lead to `refreshDiagramFromRemote()` and authoritative reload behavior instead of smaller document patches. | More network traffic and editor disruption under active collaboration | Medium-High | Add version-aware patch application or lightweight diff/pull endpoints for collaboration refreshes. | During sync work |
| Canonical schema adapters rebuild whole objects and layout state on import/export | Confirmed | `frontend/src/features/schema-sync/lib/canonical-adapters.ts`, `packages/schema-sync-core/src/types.ts` | Canonical import/export regenerates IDs, reconstructs all tables/relationships, and recalculates positions. That is acceptable for small imports but expensive for large schemas or frequent preview flows. | Slower schema import/diff UX on larger databases | Medium | Separate canonical transform from layout generation, cache type lookups, and support incremental layout for unchanged tables. | During sync work |
| Derived schema lists rescan all tables on each relevant render | Confirmed | `frontend/src/context/schemadash-context/schemadash-provider.tsx` | `schemas` is recomputed from the full table list and counts tables per schema in render-time code. | Noticeable editor slowdown as table count grows | Medium | Maintain schema summaries alongside table mutations or derive them in a reducer/store. | Can wait |

Performance assessment summary:
- The current hotspots are mostly structural rather than micro-optimizations.
- The largest pre-sync wins are reducing full scans, avoiding whole-snapshot rewrites, and shrinking the orchestration providers.

## 3. Security Assessment

| Issue | Evidence | Affected files/modules | Why it matters | Severity | Recommended mitigation | Required before implementing local self-hosted sync? |
| --- | --- | --- | --- | --- | --- | --- |
| Browser-exposed AI credentials and endpoints | Confirmed | `.env.example`, `frontend/src/lib/env.ts`, `frontend/src/lib/data/sql-export/export-sql-script.ts` | `VITE_OPENAI_API_KEY` and related values are designed to be present in the frontend bundle/runtime and are used directly in browser-side SQL generation. That exposes credentials to every user of the app. | Critical | Move provider-backed SQL generation behind a server route or require explicit user-supplied BYOK input that is never stored as deployment config. Remove `VITE_OPENAI_API_KEY` from recommended runtime config. | Yes |
| Operational routes become effectively open when auth is disabled | Confirmed | `backend/src/config/env.ts`, `backend/src/security/request-access.ts`, `backend/src/routes/schema-sync-routes.ts`, `backend/src/routes/persistence-routes.ts`, `backend/src/services/persistence-service.ts` | `SCHEMADASH_AUTH_MODE` defaults to `disabled`, and `requireOperationalAccess()` allows schema-sync operations when auth is disabled. That means connection management, diff/apply, backups, and persistence mutation routes are reachable without identity if the instance is network-accessible. | Critical | Add an explicit secure deployment mode for self-hosted operations. At minimum, require auth or a separate operational secret for schema-sync/apply/backups whenever the server is not loopback-isolated. | Yes |
| Share tokens are accepted via query string and pushed into EventSource URLs | Confirmed | `backend/src/utils/request-share-token.ts`, `frontend/src/context/schemadash-context/schemadash-provider.tsx`, `frontend/src/lib/api/request.ts` | EventSource cannot send custom headers, so share tokens are appended to the URL. Query-string tokens are more likely to appear in browser history, logs, proxies, and monitoring tools. | High | Exchange share tokens for short-lived session credentials before opening streams, or use a token bootstrap endpoint that returns a scoped stream ticket. Stop accepting long-lived link tokens via query string where possible. | Yes |
| Legacy share headers and cookie names widen the attack surface | Confirmed | `frontend/src/lib/api/request.ts`, `backend/src/utils/request-share-token.ts`, `backend/src/services/auth-service.ts`, `backend/src/config/env.ts` | The app still emits and accepts legacy ChartDB headers and cookie names. That increases ambiguity in audits, proxy rules, and security hardening. | Medium-High | Remove legacy compatibility paths after a defined migration window, or gate them behind an opt-in compatibility flag instead of default behavior. | Yes |
| Missing secret key is tolerated outside production, which breaks secret-backed features | Confirmed | `backend/src/config/env.ts`, `backend/src/services/connections-service.ts`, `backend/src/security/encryption.ts`, `backend/src/services/auth-service.ts` | If `SCHEMADASH_SECRET_KEY` is absent and `NODE_ENV` is not `production`, the server generates an ephemeral key. Stored DB connection secrets then become undecryptable after restart, and session/OIDC cookie signing also changes. | High | Fail fast whenever auth, stored connections, or encrypted metadata features are enabled without a stable secret key. Add documented rotation behavior. | Yes |
| No login/bootstrap/OIDC rate limiting or lockout controls | Confirmed | `backend/src/routes/auth-routes.ts`, `backend/src/services/auth-service.ts` | The auth service validates credentials and bootstrap setup codes but there is no rate limiting, lockout, or IP throttling around login/bootstrap/OIDC start. | High | Add route-level rate limiting and bootstrap/login attempt controls, ideally with per-IP and per-identity windows. | Yes |
| Public health routes expose DB paths and auth mode details | Confirmed | `backend/src/routes/health-routes.ts` | `/api/health` and `/api/readyz` include sqlite file paths, auth mode, and trust proxy settings. That improves diagnostics but also leaks deployment details to unauthenticated callers. | Medium | Keep liveness public, but gate detailed health information or redact file paths and auth configuration from public responses. | Before production local sync rollout |
| Auth-disabled + permissive CORS is a risky default combination | Confirmed | `backend/src/config/env.ts`, `backend/src/app.ts` | `SCHEMADASH_AUTH_MODE=disabled` and `SCHEMADASH_CORS_ORIGIN=*` are easy defaults. That is acceptable for isolated local development, but dangerous for accidental internet exposure. | High | Introduce a safer default profile for self-hosted deployments and surface startup warnings or fatal checks when unsafe combinations are used outside loopback development. | Yes |

Security assessment summary:
- The most serious issues are not subtle code bugs. They are deployment and trust-boundary problems.
- The local self-hosted sync project should not proceed until the operational/auth story is tightened.

## 4. Reliability / Resilience Assessment

| Issue | Evidence | Affected files/modules | Failure mode | Likely production impact | Recommended hardening |
| --- | --- | --- | --- | --- | --- |
| Single large persistence service concentrates unrelated failure paths | Confirmed | `backend/src/services/persistence-service.ts` | A change or failure in sharing, session handling, backup import/export, or project bootstrap can affect unrelated persistence behaviors. | High change risk, harder incident isolation, brittle regression surface | Split into project/catalog, diagram lifecycle, collaboration session, sharing, and backup services behind a smaller façade. |
| Schema-sync metadata writes are multi-step and non-transactional | Confirmed | `backend/src/services/schema-sync-service.ts`, `backend/src/services/apply-service.ts`, `backend/src/repositories/metadata-repository.ts` | Diff/apply flows write snapshots, plans, audits, and jobs in separate calls. A crash or thrown error can leave partial metadata state. | Inconsistent audit history, confusing recovery, orphaned jobs/snapshots | Add transaction support in `MetadataRepository` and wrap multi-record diff/apply state transitions in atomic writes. |
| Remote persistence bootstrap silently flips between remote and local-only modes | Confirmed | `frontend/src/context/storage-context/storage-provider.tsx` | `ensureRemotePersistenceReady()` silently degrades to local-only when persistence is unavailable, but later auto-uploads local diagrams if the server becomes available. | Hard-to-reproduce split-brain behavior and unexpected data movement | Introduce explicit offline state, sync queue visibility, and an operator/user decision before bulk local-to-remote reconciliation. |
| Sync conflict handling is shallow and user-facing recovery is limited | Confirmed | `frontend/src/context/storage-context/storage-provider.tsx`, `frontend/src/context/schemadash-context/schemadash-provider.tsx`, `backend/src/services/persistence-service.ts` | A 409 marks the session stale and shows a toast, but there is no richer merge/retry/rebase path. | Lost edits or confusing collaboration flows under concurrent changes | Add conflict-classified error states, retry/reload tooling, and at least a manual “compare and reload” workflow before deeper sync changes land. |
| Collaboration broker is process-local only | Confirmed | `backend/src/services/diagram-collaboration-broker.ts`, `backend/src/routes/persistence-routes.ts` | Presence and event distribution live in memory. Process restart or multi-instance deployment loses shared presence/event continuity. | Poor resilience in rolling deploys and no horizontal scaling for collaboration | Introduce a pluggable broker abstraction so process-local mode is explicit and a distributed broker can be added later. |
| Secret-key drift can permanently break stored connections after restart | Confirmed | `backend/src/config/env.ts`, `backend/src/services/connections-service.ts` | Connection secrets are encrypted at rest, but if the key changes unexpectedly the app has no graceful recovery or classification path. | Stored connection failures that present as opaque runtime errors | Add explicit key-validation checks at startup, clear diagnostics, and an operator migration path for key rotation. |
| Client request helper assumes JSON responses | Confirmed | `frontend/src/lib/api/request.ts` | If a proxy or upstream returns HTML/plain text, `requestJson()` throws a parsing error before creating a structured `RequestError`. | Poor resilience and weak diagnostics for production network/proxy failures | Guard JSON parsing by content type or fallback error handling so upstream failures remain actionable. |
| Documentation drift increases operational misconfiguration risk | Confirmed | `docs/architecture/backend-persistence-foundation.md`, `docs/audits/authenticated-layout-audit.md`, `docs/audits/sharing-live-presence-audit.md`, `docs/audits/viewer-readonly-live-sync-audit.md` | Several docs still reference `server/src`, `chartdb-provider.tsx`, or `/root/test/chartdb/...`. | Onboarding and operations errors during feature work or incident response | Refresh operational and architecture docs as part of the pre-sync hardening phase. |

Reliability summary:
- Reliability risk is dominated by mode switching, giant service boundaries, and weak state-transition guarantees.
- The current implementation can recover from simple failures, but not predictably from complex sync, restart, or scale events.

## 5. Maintainability Assessment

| Issue | Evidence | Affected files/modules | Why it makes development harder | Refactor direction | Urgency |
| --- | --- | --- | --- | --- | --- |
| Over-coupled storage provider | Confirmed | `frontend/src/context/storage-context/storage-provider.tsx` | It mixes IndexedDB schema management, remote bootstrap, catalog caching, sync scheduling, sharing-aware fetches, collaboration session lifecycle, and backup import/export. | Split into focused hooks/services: local cache adapter, remote catalog client, diagram sync coordinator, session manager, and backup façade. | High |
| Over-coupled editor provider | Confirmed | `frontend/src/context/schemadash-context/schemadash-provider.tsx` | Editor state, undo/redo, session activation, remote refresh, collaboration events, access mode, and entity mutation APIs all live together. | Move diagram state mutations into a reducer/store and isolate collaboration/session behavior in a separate hook/service. | High |
| Persistence service mixes too many business domains | Confirmed | `backend/src/services/persistence-service.ts` | Projects, collections, diagrams, sharing, sessions, collaboration, and backup logic share one class and one dependency surface. | Split by bounded context while preserving a compatibility façade for routes. | High |
| Repository and service layers are tightly coupled to full document shapes | Confirmed | `backend/src/repositories/app-repository.ts`, `backend/src/services/persistence-service.ts`, `frontend/src/features/schema-sync/lib/canonical-adapters.ts`, `packages/schema-sync-core/src/types.ts` | Changing summary behavior, sync metadata, or document layout frequently means touching multiple layers at once. | Introduce summary DTOs and narrower transport contracts instead of moving full document structures through many call paths. | High |
| Legacy ChartDB compatibility clutter remains in runtime and docs | Confirmed | `backend/src/config/env.ts`, `backend/src/services/auth-service.ts`, `backend/src/utils/request-share-token.ts`, `frontend/src/lib/api/request.ts`, `frontend/src/lib/env.ts`, docs under `docs/` | The codebase still carries aliases for env keys, cookies, headers, backup format names, and outdated documentation names. | Create a time-bounded compatibility removal plan and reduce default compatibility behavior. | Medium-High |
| Shared schema-sync types file is too broad | Confirmed | `packages/schema-sync-core/src/types.ts` | Connection DTOs, canonical schema types, risk warnings, change plans, and apply job types are all defined in one file. Cross-cutting edits are harder to review safely. | Split types into domain modules such as canonical schema, plan/apply, audit, and connection config. | Medium |
| Documentation drift is material, not cosmetic | Confirmed | `docs/architecture/backend-persistence-foundation.md`, `docs/audits/*`, `docs/repository-organization-plan.md` | Multiple docs still reference pre-rebrand names and old paths, reducing trust in written guidance. | Refresh architecture and operational docs alongside code hardening. | Medium |
| Frontend provider behavior has almost no direct test coverage | Confirmed | `frontend/test/setup.ts`, absence of provider-focused frontend tests | The most fragile orchestration code has little to no targeted automated test coverage. | Add focused tests around storage bootstrap, remote fallback, collaboration refresh, and stale-session handling. | High |

Maintainability summary:
- SchemaDash’s current pain comes from concentration of behavior, not from lack of abstractions.
- The immediate goal should be better seams, not repo-wide restructuring.

## 6. Scalability Assessment

| Area | Evidence | Affected files/modules | Current risk | Why it becomes problematic at scale | Recommended direction |
| --- | --- | --- | --- | --- | --- |
| Catalog storage and repository query design | Confirmed | `backend/src/repositories/app-repository.ts`, `backend/src/services/persistence-service.ts` | High | Whole-table reads and in-memory joins become expensive as projects, collections, and diagrams grow. | Add pagination, summary queries, server-side counts, and search-specific indexes. |
| Diagram document storage model | Confirmed | `backend/src/repositories/app-repository.ts` | Medium-High | Large diagram JSON documents are parsed for list flows and rewritten in full on updates. | Separate summary metadata from full document storage and consider patch-oriented versioning. |
| Frontend local cache scaling | Confirmed | `frontend/src/context/storage-context/storage-provider.tsx` | High | IndexedDB hydration and full snapshot rewrites get slower as diagram size and quantity grow. | Keep lightweight summary tables, patch child collections incrementally, and avoid full hydration for list screens. |
| Collaboration scaling across users and instances | Confirmed | `backend/src/services/diagram-collaboration-broker.ts`, `frontend/src/context/schemadash-context/schemadash-provider.tsx` | High | In-memory presence/event delivery cannot support multi-instance deployments or resilient collaboration at larger user counts. | Add a broker interface with a distributed backend option and define clearer collaboration transport contracts. |
| Schema-sync history retention | Confirmed | `backend/src/repositories/metadata-repository.ts`, `backend/src/services/schema-sync-service.ts`, `backend/src/services/apply-service.ts` | High | Snapshots, plans, apply jobs, and audits accumulate with no pruning, retention policy, or archival path. | Add TTL/retention controls, listing endpoints, and cleanup jobs before usage grows. |
| Self-hosted deployment database choice | Likely | `backend/src/repositories/app-repository.ts`, `backend/src/repositories/metadata-repository.ts` | Medium-High | SQLite with `better-sqlite3` is pragmatic for small deployments, but write concurrency and multi-instance operational patterns become limiting as self-hosted usage grows. | Keep SQLite for small deployments, but document scale limits and define a roadmap for higher-concurrency persistence if needed. |
| Canonical schema and diff computation | Confirmed | `frontend/src/features/schema-sync/lib/canonical-adapters.ts`, `packages/schema-sync-core/src/types.ts`, `backend/src/services/schema-sync-service.ts` | Medium | Whole-schema introspection, canonicalization, hashing, and diffing become heavier as schema size grows. | Introduce snapshot metadata summaries, partial diff strategies, and benchmark large-schema paths. |

Scalability summary:
- The current system is reasonable for small self-hosted deployments.
- Larger multi-user or heavily used self-hosted sync scenarios will stress both query shape and collaboration architecture quickly.

## 7. Observability / Debuggability Assessment

| Issue | Evidence | Affected files/modules | Assessment | Recommended improvement |
| --- | --- | --- | --- | --- |
| Frontend relies heavily on `console.warn` for important sync/collaboration failures | Confirmed | `frontend/src/context/storage-context/storage-provider.tsx`, `frontend/src/context/schemadash-context/schemadash-provider.tsx` | Errors are visible in devtools but not surfaced as structured diagnostics or supportable status states. | Add a shared frontend diagnostics channel for persistence/collaboration events and expose user-visible sync health states. |
| Error responses do not include correlation identifiers | Confirmed | `backend/src/app.ts`, `backend/src/config/logger.ts` | The backend creates request IDs and logs them, but responses do not return an ID in error payloads. Frontend errors are hard to correlate with server logs. | Include `requestId` in error responses and propagate it into client diagnostics. |
| Health endpoints are shallow and not role-sensitive | Confirmed | `backend/src/routes/health-routes.ts` | Health checks only report DB pings and configuration snippets; they do not reflect collaboration broker health, schema-sync backlog size, or retention problems. | Add internal-only detailed health/metrics and keep public liveness minimal. |
| Schema apply diagnostics exist but are not operationally rich | Confirmed | `backend/src/services/apply-service.ts`, `backend/src/routes/schema-sync-routes.ts`, `backend/src/repositories/metadata-repository.ts` | Apply jobs store logs and executed SQL, but there is no streaming status, duration metrics, or aggregate visibility across jobs. | Add structured step logs, durations, per-job summaries, and a retention-aware listing surface. |
| Request helper collapses upstream failures into poor client errors | Confirmed | `frontend/src/lib/api/request.ts` | Non-JSON proxy failures can become `SyntaxError` instead of actionable request diagnostics. | Normalize transport and server failures into structured client-side error types. |
| Auth diagnostics are partially structured but not end-to-end traceable | Confirmed | `backend/src/services/auth-service.ts`, `backend/src/routes/auth-routes.ts` | Auth logs are better than many other areas, but the frontend still receives limited structured context and no correlation token. | Extend auth responses and logs with request ID, auth mode hints, and safer structured error codes on the client. |
| No explicit sync queue / sync run status surface | Confirmed | `frontend/src/context/storage-context/storage-provider.tsx`, `frontend/src/context/schemadash-context/schemadash-provider.tsx` | Pending timers and in-flight syncs live in refs only; operators and users cannot easily inspect the state. | Expose sync state transitions, queue depth, last successful flush, last error, and offline/degraded mode in the UI and logs. |

Observability summary:
- The backend already uses structured logging, which is a good base.
- What is missing is correlation, richer runtime status surfaces, and actionable frontend diagnostics.

## 8. Prioritized Improvement Backlog

### P0 — must address immediately

| Short title | Category | Affected files | Why priority level was chosen | Estimated implementation risk | Dependency notes |
| --- | --- | --- | --- | --- | --- |
| Lock down operational routes when auth is disabled | Security / operational safety | `backend/src/config/env.ts`, `backend/src/security/request-access.ts`, `backend/src/routes/schema-sync-routes.ts`, `backend/src/routes/persistence-routes.ts` | Current defaults can expose schema-sync, backups, and persistence mutation to unauthenticated callers. | Medium | Blocks safe self-hosted sync work. |
| Remove browser-side deployment credentials for SQL generation | Security | `.env.example`, `frontend/src/lib/env.ts`, `frontend/src/lib/data/sql-export/export-sql-script.ts` | Deployment credentials in the browser are not acceptable for production-grade self-hosting. | Medium | Should be resolved before broader self-hosted sync rollout. |
| Require stable secret-key configuration for auth and stored connections | Security / reliability | `backend/src/config/env.ts`, `backend/src/services/connections-service.ts`, `backend/src/security/encryption.ts`, `backend/src/services/auth-service.ts` | Unstable keys break encrypted data and session continuity. | Low-Medium | Blocks trustworthy secret storage and long-lived deployments. |
| Stop using long-lived share tokens in EventSource query strings | Security | `backend/src/utils/request-share-token.ts`, `frontend/src/context/schemadash-context/schemadash-provider.tsx`, `frontend/src/lib/api/request.ts` | Current sharing model leaks tokens into easier-to-log surfaces. | Medium | Should be addressed before deeper sync/collaboration expansion. |
| Define stable sync/collaboration boundaries before major replacement work | Maintainability / reliability | `frontend/src/context/storage-context/storage-provider.tsx`, `frontend/src/context/schemadash-context/schemadash-provider.tsx`, `backend/src/services/persistence-service.ts` | Current orchestration files are already at high risk; replacing local sync directly inside them would compound instability. | Medium-High | Blocks safe local sync replacement. |

### P1 — should address before major sync replacement

| Short title | Category | Affected files | Why priority level was chosen | Estimated implementation risk | Dependency notes |
| --- | --- | --- | --- | --- | --- |
| Replace full-catalog bootstrap with delta-friendly sync | Performance / scalability | `frontend/src/context/storage-context/storage-provider.tsx`, `backend/src/services/persistence-service.ts`, `backend/src/repositories/app-repository.ts` | Startup and refresh work will get worse as catalog size grows. | Medium-High | Easier after stable sync boundaries are introduced. |
| Stop rewriting full local diagram snapshots on normal saves | Performance / reliability | `frontend/src/context/storage-context/storage-provider.tsx` | Current save path does too much work and increases sync/reload conflict surface. | Medium | Strongly recommended before local sync replacement. |
| Add transaction support and retention policy for metadata state | Reliability / scalability | `backend/src/repositories/metadata-repository.ts`, `backend/src/services/schema-sync-service.ts`, `backend/src/services/apply-service.ts` | Diff/apply metadata will keep growing and can become inconsistent. | Medium | Important for self-hosted operational trust. |
| Add rate limiting to bootstrap/login/OIDC entry points | Security | `backend/src/routes/auth-routes.ts`, `backend/src/services/auth-service.ts` | Brute-force and abuse controls are currently absent. | Low-Medium | Independent, can be done in parallel. |
| Add direct tests for storage and editor provider orchestration | Developer experience / maintainability | `frontend/src/context/storage-context/storage-provider.tsx`, `frontend/src/context/schemadash-context/schemadash-provider.tsx`, `frontend/test/` | The highest-risk frontend code lacks focused automated tests. | Medium | Best added before replacing sync internals. |
| Introduce request correlation and richer sync diagnostics | Observability | `backend/src/app.ts`, `backend/src/config/logger.ts`, `frontend/src/lib/api/request.ts`, provider files | Needed to debug pre-existing sync problems before replacing the subsystem. | Low-Medium | Helps every other migration step. |

### P2 — should address during or after sync replacement

| Short title | Category | Affected files | Why priority level was chosen | Estimated implementation risk | Dependency notes |
| --- | --- | --- | --- | --- | --- |
| Optimize canonical adapter and layout regeneration paths | Performance | `frontend/src/features/schema-sync/lib/canonical-adapters.ts`, `packages/schema-sync-core/src/types.ts` | Important for larger schemas, but not the first blocker to safe replacement work. | Medium | Can be staged alongside sync changes. |
| Introduce summary-oriented repository queries and DTOs | Performance / maintainability | `backend/src/repositories/app-repository.ts`, `backend/src/services/persistence-service.ts` | Important for long-term scale and cleaner service boundaries. | Medium | Best done incrementally as services split. |
| Expose explicit offline/degraded/sync-queue UI state | Observability / operational safety | `frontend/src/context/storage-context/storage-provider.tsx`, `frontend/src/context/schemadash-context/schemadash-provider.tsx` | Makes local sync replacement safer and more understandable. | Medium | Works well during sync redesign. |
| Prepare collaboration broker abstraction for non-local backends | Scalability / reliability | `backend/src/services/diagram-collaboration-broker.ts`, `backend/src/services/persistence-service.ts` | Needed for larger deployments, but not the first precondition for local sync replacement. | Medium-High | Should align with long-term collaboration roadmap. |

### P3 — longer-term cleanup

| Short title | Category | Affected files | Why priority level was chosen | Estimated implementation risk | Dependency notes |
| --- | --- | --- | --- | --- | --- |
| Remove default legacy ChartDB runtime compatibility paths | Maintainability / security | env, auth, request, sharing, backup files | Valuable cleanup, but less urgent than the hard blockers above. | Medium | Schedule after migration communication. |
| Split shared schema-sync type definitions into domain modules | Maintainability | `packages/schema-sync-core/src/types.ts` | Improves long-term reviewability more than immediate safety. | Low-Medium | Can happen after boundary stabilization. |
| Refresh stale architecture and audit docs | Maintainability / DX | `docs/architecture/*`, `docs/audits/*`, `docs/repository-organization-plan.md` | Important to restore trust in docs, but secondary to security and sync blockers. | Low | Should follow the first wave of hardening. |

## 9. Risk-Aware Recommendations for the Local Sync Project

### Improvements to do before replacing sync

- Lock down schema-sync, backup, and persistence write operations so self-hosted deployments are not implicitly open when auth is disabled.
- Remove browser-side deployment credentials for LLM-backed SQL generation.
- Require a stable `SCHEMADASH_SECRET_KEY` whenever encrypted connections, sessions, or auth are enabled.
- Introduce narrower boundaries around:
  - local diagram cache
  - remote catalog persistence
  - diagram sync scheduling
  - collaboration session lifecycle
  - sharing/access checks
- Add targeted tests for the current storage and editor providers before changing sync internals.
- Add request correlation and sync diagnostics so migration regressions are debuggable.

### Improvements that can be done during local sync work

- Replace full snapshot rewrite paths with patch-oriented local persistence.
- Introduce delta-based catalog sync and summary-oriented repository queries.
- Add explicit offline, degraded, and pending-sync status surfaces to the UI.
- Separate `PersistenceService` into diagram lifecycle, sharing, and backup sub-services behind a compatibility façade.

### Improvements that should be postponed until after sync replacement

- Full legacy ChartDB cleanup across env aliases, cookie/header fallbacks, and docs.
- Broader schema-sync core type module splitting.
- Larger collaboration-broker scaling work beyond a boundary abstraction.
- Broader repository/database strategy changes beyond what is required for the sync project.

### High-risk files to avoid touching directly if possible

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`
- `backend/src/repositories/metadata-repository.ts`
- `frontend/src/features/schema-sync/lib/canonical-adapters.ts`
- `packages/schema-sync-core/src/types.ts`

These files already carry broad responsibilities. Prefer adding thin boundary layers around them before changing internal behavior.

### Adapter and service boundaries that should be introduced

- Frontend `DiagramCacheAdapter`: local Dexie reads/writes and summary queries only.
- Frontend `RemoteCatalogService`: collections/projects/diagram summary sync only.
- Frontend `DiagramSyncCoordinator`: queueing, flush, retry, conflict classification, and degraded-mode state.
- Frontend `DiagramCollaborationClient`: session activation, heartbeats, presence, stream connection, and remote refresh policy.
- Backend `ProjectCatalogService`: collections/projects/summary listing.
- Backend `DiagramLifecycleService`: get/update/upsert/delete diagram document flows.
- Backend `SharingAccessService`: project/diagram sharing resolution and share-token handling.
- Backend `DiagramSessionService`: collaboration session and presence behavior.
- Backend `BackupService`: export/import only.

These boundaries reduce the risk that local sync replacement becomes a cross-cutting rewrite.

## 10. Implementation Readiness Score

Current readiness for major local sync replacement: 4/10

Top blockers:
- unsafe operational/auth defaults for self-hosted deployments
- oversized frontend and backend orchestration files
- full-scan/full-snapshot behavior in current persistence flows
- weak metadata transactionality and retention for schema-sync operations
- thin observability around sync and collaboration failures

Top enablers already present:
- shared schema-sync core package instead of completely duplicated logic
- meaningful backend tests around persistence/auth/sharing/collaboration routes
- structured backend logging base
- explicit repository/service separation, even if current boundaries are too broad

Recommended sequencing:
1. Hardening pass for auth, secrets, share-token handling, and operational route safety.
2. Boundary extraction around storage, sync, collaboration, and persistence services without broad behavior changes.
3. Test and observability improvements around the current sync/collaboration paths.
4. Incremental performance fixes that remove full scans and full snapshot rewrites.
5. Local self-hosted sync replacement behind the new boundaries.

Practical assessment:
- Safe for small targeted improvements: yes.
- Safe for a major sync replacement immediately: no.
- Safe for a major sync replacement after a focused pre-hardening phase: yes.
