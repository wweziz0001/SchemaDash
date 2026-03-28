# SchemaDash System Improvements Backlog

Compact action list derived from `docs/system-improvements-assessment.md`.

## P0

| Title | Category | Affected files | Why first |
| --- | --- | --- | --- |
| Lock down operational routes when auth is disabled | Security / operational safety | `backend/src/config/env.ts`, `backend/src/security/request-access.ts`, `backend/src/routes/schema-sync-routes.ts`, `backend/src/routes/persistence-routes.ts` | Current self-hosted defaults can expose schema-sync, backup, and persistence writes to unauthenticated callers. |
| Remove browser-side deployment credentials for SQL generation | Security | `.env.example`, `frontend/src/lib/env.ts`, `frontend/src/lib/data/sql-export/export-sql-script.ts` | Deployment AI credentials should not be shipped to browsers. |
| Require stable secret-key configuration for encrypted features | Security / reliability | `backend/src/config/env.ts`, `backend/src/services/connections-service.ts`, `backend/src/security/encryption.ts`, `backend/src/services/auth-service.ts` | Missing stable keys break sessions and encrypted connection storage across restarts. |
| Stop using long-lived share tokens in EventSource query strings | Security | `backend/src/utils/request-share-token.ts`, `frontend/src/context/schemadash-context/schemadash-provider.tsx`, `frontend/src/lib/api/request.ts` | Current sharing tokens are easier to leak through logs, URLs, and proxies. |
| Introduce safe sync/collaboration boundaries before replacement work | Maintainability / reliability | `frontend/src/context/storage-context/storage-provider.tsx`, `frontend/src/context/schemadash-context/schemadash-provider.tsx`, `backend/src/services/persistence-service.ts` | Replacing sync directly inside current orchestration files is too risky. |

## P1

| Title | Category | Affected files | Why before sync replacement |
| --- | --- | --- | --- |
| Replace full-catalog bootstrap with delta-friendly sync | Performance / scalability | `frontend/src/context/storage-context/storage-provider.tsx`, `backend/src/services/persistence-service.ts`, `backend/src/repositories/app-repository.ts` | Startup and refresh work is proportional to total catalog size. |
| Stop rewriting whole local diagram snapshots on normal saves | Performance / reliability | `frontend/src/context/storage-context/storage-provider.tsx` | Full snapshot rewrites create unnecessary local churn and widen conflict windows. |
| Add metadata transactionality and retention policy | Reliability / scalability | `backend/src/repositories/metadata-repository.ts`, `backend/src/services/schema-sync-service.ts`, `backend/src/services/apply-service.ts` | Diff/apply history can become inconsistent and unbounded. |
| Add rate limiting to bootstrap/login/OIDC flows | Security | `backend/src/routes/auth-routes.ts`, `backend/src/services/auth-service.ts` | Authentication entry points currently lack abuse controls. |
| Add focused provider orchestration tests | DX / maintainability | `frontend/src/context/storage-context/storage-provider.tsx`, `frontend/src/context/schemadash-context/schemadash-provider.tsx`, `frontend/test/` | The highest-risk frontend behavior is barely tested. |
| Add request correlation and sync diagnostics | Observability | `backend/src/app.ts`, `backend/src/config/logger.ts`, `frontend/src/lib/api/request.ts`, provider files | Migration work will be hard to debug without better tracing. |

## P2

| Title | Category | Affected files | Why later |
| --- | --- | --- | --- |
| Optimize canonical adapter and layout regeneration paths | Performance | `frontend/src/features/schema-sync/lib/canonical-adapters.ts`, `packages/schema-sync-core/src/types.ts` | Important for larger schemas, but not the first blocker to safe sync work. |
| Introduce summary-oriented repository queries and DTOs | Performance / maintainability | `backend/src/repositories/app-repository.ts`, `backend/src/services/persistence-service.ts` | Best done incrementally as services split. |
| Expose explicit offline/degraded/sync queue state | Observability / operational safety | provider files | Strongly helpful during sync redesign, but secondary to hardening and boundaries. |
| Prepare collaboration broker abstraction for non-local backends | Scalability / reliability | `backend/src/services/diagram-collaboration-broker.ts`, `backend/src/services/persistence-service.ts` | Needed for larger deployments, but not the first precondition. |

## P3

| Title | Category | Affected files | Why deferred |
| --- | --- | --- | --- |
| Remove legacy ChartDB runtime compatibility paths | Maintainability / security | env, auth, sharing, request, backup files | Useful cleanup after migration risk is lower. |
| Split shared schema-sync types into smaller modules | Maintainability | `packages/schema-sync-core/src/types.ts` | Improves long-term maintainability more than immediate safety. |
| Refresh stale architecture and audit docs | Maintainability / DX | `docs/architecture/*`, `docs/audits/*`, `docs/repository-organization-plan.md` | Important, but secondary to the operational blockers above. |

## Blockers For Local Self-Hosted Sync

- Lock down operational routes when auth is disabled.
- Remove browser-side deployment credentials for SQL generation.
- Require stable secret-key configuration for encrypted features.
- Stop using long-lived share tokens in EventSource query strings.
- Introduce safer sync/collaboration boundaries before replacement work.
