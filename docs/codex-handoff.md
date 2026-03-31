# Codex Handoff

## 1. Project Overview

SchemaDash is a full-stack schema design and review product.

- `frontend/` is a Vite + React + Tailwind application for the authenticated library shell, editor, shared viewers, templates/examples, auth flows, and admin surfaces.
- `backend/` is a Fastify API that owns auth, persistence, sharing, collaboration, schema-sync, health, and admin routes.
- `packages/schema-sync-core/` is the shared schema engine used by both frontend and backend.

Relevant product context for this task:

- The admin surface is intentionally small and read-only.
- Admin frontend behavior belongs inside the native SchemaDash structure:
  - reusable UI in `frontend/src/components/`
  - route integration in `frontend/src/pages/admin-page/`
  - admin HTTP transport in `frontend/src/lib/api/`
  - stable admin DTOs/helpers in `frontend/src/lib/admin/`
- The admin page must visually match the authenticated library/settings/profile pages instead of introducing an admin-only design language.

Current admin product scope:

- Protected `/admin` route for authenticated admin users only.
- Overview metrics for users, admins, collections, projects, diagrams, and active sessions.
- Platform health summary from `GET /api/admin/overview`.
- Read-only user table with status, role, auth provider, and activity visibility.

## 2. Current Architectural Context

Read these first for future admin work:

1. `docs/codex-handoff.md`
2. `docs/admin-frontend-rebuild-plan.md`
3. `docs/audits/admin-frontend-methodology-drift.md`
4. `docs/operations/admin-dashboard.md`
5. `docs/CODEBASE_STRUCTURE.md`

Important frontend files for this area:

- `frontend/src/pages/admin-page/admin-page.tsx`
- `frontend/src/pages/admin-page/admin-route-guard.tsx`
- `frontend/src/lib/api/admin-client.ts`
- `frontend/src/lib/admin/admin-overview.ts`
- `frontend/src/components/status-badge/status-badge.tsx`
- `frontend/src/components/summary-list/summary-list.tsx`
- `frontend/src/components/metric-card/metric-card.tsx`
- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
- `frontend/src/router.tsx`

Important backend files for this area:

- `backend/src/routes/admin-routes.ts`
- `backend/src/routes/health-routes.ts`
- `backend/src/services/admin-service.ts`

High-risk files:

- `frontend/src/pages/admin-page/admin-page.tsx`
- `frontend/src/pages/admin-page/admin-route-guard.tsx`
- `frontend/src/lib/api/admin-client.ts`
- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
- `frontend/src/router.tsx`

Important service/module boundaries:

- `frontend/src/lib/api/admin-client.ts` is now transport-only.
- `frontend/src/lib/admin/admin-overview.ts` owns stable admin DTOs plus pure view-model helpers and formatting helpers.
- `frontend/src/pages/admin-page/admin-page.tsx` is now primarily page composition.
- `frontend/src/pages/admin-page/admin-route-guard.tsx` remains the route protection boundary.
- `backend/src/routes/admin-routes.ts` exposes `GET /api/admin/overview`.
- `backend/src/services/admin-service.ts` remains the authoritative source of the overview payload shape.

Relevant frontend/backend relationship:

- `frontend/src/lib/api/admin-client.ts` fetches `GET /api/admin/overview`.
- `backend/src/routes/admin-routes.ts` guards the route with `requireAdminUser`.
- `backend/src/services/admin-service.ts` assembles the overview metrics, platform summary, and user/project/diagram breakdowns consumed by the page.

## 3. Task Completed

Task objective:

- Correct the admin frontend methodology drift.
- Keep admin aligned with native SchemaDash structure instead of a feature-island pattern.
- Make the admin page visually match the rest of SchemaDash.

What was implemented:

- Added an audit doc:
  - `docs/audits/admin-frontend-methodology-drift.md`
- Added a rebuild plan doc:
  - `docs/admin-frontend-rebuild-plan.md`
- Confirmed the historical `frontend/src/features/admin` subtree is already absent on this branch and kept it absent.
- Extracted reusable presentational pieces out of `frontend/src/pages/admin-page/admin-page.tsx`:
  - `frontend/src/components/status-badge/status-badge.tsx`
  - `frontend/src/components/summary-list/summary-list.tsx`
- Generalized the shared metric card so admin can reuse native metric surfaces:
  - `frontend/src/components/metric-card/metric-card.tsx`
- Split stable admin types/helpers out of the transport module:
  - `frontend/src/lib/admin/admin-overview.ts`
  - `frontend/src/lib/api/admin-client.ts`
- Rebuilt `frontend/src/pages/admin-page/admin-page.tsx` around native components/helpers instead of page-local UI primitives.
- Aligned admin visuals with the existing authenticated page language:
  - same hero rhythm as library/settings/profile
  - same amber outline badge treatment
  - same top-level CTA style
  - native alert/loading surface treatment
  - native card/table/spacing/typography patterns
- Updated the admin page test harness to wrap the page in `HelmetProvider`.
- Updated one stale audit reference that still pointed at the removed admin feature subtree.

Key decisions:

- Keep route-level admin wiring under `frontend/src/pages/admin-page/` and `frontend/src/router.tsx`.
- Keep backend contracts unchanged.
- Avoid introducing any admin-only provider/context layer because the current admin surface does not justify one.
- Reuse existing SchemaDash primitives instead of inventing a separate admin component library.

Approach intentionally avoided:

- No backend admin redesign.
- No broad dashboard-shell refactor.
- No compatibility stubs under `frontend/src/features/admin`.
- No admin-specific theme or design language.
- No unrelated changes to `frontend/vite.config.ts`.

## 4. Files Changed

Files created:

- `docs/audits/admin-frontend-methodology-drift.md`
  - Audit of structural drift, visual mismatches, and native reuse targets.
- `docs/admin-frontend-rebuild-plan.md`
  - Required path mapping, classification, risk notes, and implementation plan.
- `frontend/src/components/status-badge/status-badge.tsx`
  - Reusable wrapper around the native `Badge` component for consistent status/role tones.
- `frontend/src/components/summary-list/summary-list.tsx`
  - Reusable key/value summary row list for admin overview panels.
- `frontend/src/lib/admin/admin-overview.ts`
  - Stable admin overview types plus pure format/summary helpers.

Files modified:

- `docs/codex-handoff.md`
  - Rewritten for this admin task so future sessions start with the right context.
- `docs/audits/authenticated-layout-audit.md`
  - Updated stale admin path references away from the removed feature subtree.
- `frontend/src/components/metric-card/metric-card.tsx`
  - Made the shared metric card more flexible so admin could reuse it instead of defining a local duplicate.
- `frontend/src/lib/api/admin-client.ts`
  - Reduced to transport-only responsibility.
- `frontend/src/pages/admin-page/admin-page.tsx`
  - Main admin page rebuilt around native components/helpers and native styling patterns.
- `frontend/src/pages/admin-page/admin-page.test.tsx`
  - Updated to use `HelmetProvider` after adding a page title.
- `frontend/src/pages/dashboard-page/dashboard-shell-layout.test.tsx`
  - Updated imports to use the new admin type module.

Important files intentionally not changed:

- `frontend/src/pages/admin-page/admin-route-guard.tsx`
  - Already in the correct native location and behaviorally stable.
- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
  - High-risk shared shell; left unchanged because admin integration did not require runtime nav changes.
- `frontend/src/router.tsx`
  - Already reflects the correct page boundary for `/admin`.
- `backend/src/routes/admin-routes.ts`
  - Backend route contract kept stable.
- `backend/src/services/admin-service.ts`
  - Payload assembly kept stable.
- `frontend/vite.config.ts`
  - Had an unrelated pre-existing working-tree change and was intentionally avoided.

Files/directories intentionally absent:

- `frontend/src/features/admin`
- `frontend/src/features`

## 5. Data / API / Workflow Changes

Behavioral/API changes:

- No backend routes changed.
- No admin overview payload shape changed.
- No new environment variables, migrations, or config keys were introduced.

Frontend structure/workflow changes:

- Admin overview typing moved out of `frontend/src/lib/api/admin-client.ts` into `frontend/src/lib/admin/admin-overview.ts`.
- Admin summary formatting and label helpers now live in `frontend/src/lib/admin/admin-overview.ts`.
- Admin page rendering now relies on reusable presentational modules instead of page-local mini-components.
- Admin page now sets a document title via `Helmet`.

Compatibility handling:

- Existing tests were updated to import the moved admin types.
- The standalone admin page test was updated to include `HelmetProvider`.

## 6. Validation Performed

Validation completed:

- `npx tsc -p tsconfig.json --noEmit`
- `npx vitest run --config frontend/vitest.config.ts frontend/src/pages/admin-page/admin-page.test.tsx frontend/src/pages/dashboard-page/dashboard-shell-layout.test.tsx`
- `npm run build:web`
- Confirmed `find frontend/src -type d | grep '/features\\(/\\|$\\)'` returns no matches

What was verified:

- TypeScript passes after the admin type/helper split.
- Admin page tests pass with the new `Helmet` usage.
- Dashboard shell admin route coverage still passes after the type import changes.
- Frontend production build succeeds.
- `frontend/src/features/admin` and `frontend/src/features` are absent.

What remains unverified manually:

- Browser-level visual QA of `/admin` against a live backend session.
- Manual verification of the refresh action against a running deployment.
- Manual dark-mode inspection of the admin page in a browser.

Known limitations / risks:

- The admin page is still a single route component, even though it is substantially slimmer than before.
- No end-to-end browser test was added for `/admin`.
- Future admin feature growth may justify a dedicated `frontend/src/components/admin-overview/` folder, but it was not necessary yet.

## 7. Outstanding Work

Not done yet:

- No admin action dialogs were added; the page remains intentionally read-only.
- No manual browser QA against a live authenticated deployment was performed in this task.
- No backend admin capabilities beyond the existing overview endpoint were expanded.

Recommended next step:

1. Manually QA `/admin` in both light and dark themes against a running backend.
2. If new admin widgets are added later, continue using `frontend/src/components/` for reusable surfaces and `frontend/src/lib/admin/` for stable admin helpers.
3. If admin gains mutating actions in the future, route those through `frontend/src/dialogs/` rather than rebuilding page-local modal logic.

Blockers/risks for future work:

- Avoid broad edits to `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx` and `frontend/src/router.tsx` unless route behavior actually changes.
- Keep `frontend/src/lib/admin/admin-overview.ts` aligned with `backend/src/services/admin-service.ts` whenever the payload evolves.

## 8. Instructions for the Next Codex Session

Read in this order:

1. `docs/codex-handoff.md`
2. `docs/admin-frontend-rebuild-plan.md`
3. `docs/audits/admin-frontend-methodology-drift.md`
4. `docs/operations/admin-dashboard.md`
5. `frontend/src/lib/admin/admin-overview.ts`
6. `frontend/src/lib/api/admin-client.ts`
7. `frontend/src/pages/admin-page/admin-page.tsx`
8. `frontend/src/pages/admin-page/admin-route-guard.tsx`
9. `frontend/src/components/status-badge/status-badge.tsx`
10. `frontend/src/components/summary-list/summary-list.tsx`

Avoid breaking:

- `frontend/src/pages/admin-page/admin-route-guard.tsx`
- `frontend/src/lib/api/admin-client.ts`
- `frontend/src/lib/admin/admin-overview.ts`
- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
- `frontend/src/router.tsx`

Continue implementation here if more admin work is requested:

- Start with `frontend/src/pages/admin-page/admin-page.tsx` for page composition changes.
- Put pure admin helpers beside `frontend/src/lib/admin/admin-overview.ts`.
- Put future reusable admin widgets in `frontend/src/components/`.
- Put future admin dialogs in `frontend/src/dialogs/`.

## 9. Git Summary

Working branch:

- `restructe/04-admin-to-native-structure-and-system-style`

Pull request title:

- `Rebuild admin frontend using native SchemaDash structure and native system styling`

Commit list created for this task:

- `chore: audit admin frontend methodology drift and style divergence`
  - Added the admin methodology/style audit doc.
- `docs: add admin frontend rebuild plan`
  - Added the required rebuild plan with historical path mapping and implementation phases.
- `refactor: move reusable admin ui and dialogs into native folders`
  - Extracted reusable admin UI pieces into native `components/` modules and removed page-local UI duplication.
- `refactor: move admin helpers and page integration into native structure`
  - Split stable admin types/helpers into `frontend/src/lib/admin/` and updated runtime/tests to use the new boundary.
- `refactor: align admin page with native SchemaDash visual system and remove admin feature subtree`
  - Aligned admin hero/actions/loading/error surfaces with the native product language and cleared the stale admin feature-path reference.
- `test: validate admin frontend behavior and style consistency after correction`
  - Records the final validation pass and this updated handoff context.
