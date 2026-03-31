# Admin Frontend Methodology Drift Audit

## Scope

This audit covers the SchemaDash admin frontend surface on branch `restructe/04-admin-to-native-structure-and-system-style`.

Relevant runtime files:

- `frontend/src/pages/admin-page/admin-page.tsx`
- `frontend/src/pages/admin-page/admin-route-guard.tsx`
- `frontend/src/pages/admin-page/admin-page.test.tsx`
- `frontend/src/lib/api/admin-client.ts`
- `frontend/src/router.tsx`
- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`

Relevant backend API files:

- `backend/src/routes/admin-routes.ts`
- `backend/src/routes/health-routes.ts`
- `backend/src/services/admin-service.ts`

## Current Branch Reality

The current branch does **not** contain `frontend/src/features/admin` or `frontend/src/features`.

That means the previous feature-first admin subtree has already been removed structurally, but the admin frontend still shows methodology drift in two important ways:

1. page-local admin UI primitives and view-model helpers are still embedded inside `frontend/src/pages/admin-page/admin-page.tsx` instead of being classified by responsibility
2. the admin page still uses a partially bespoke visual language instead of leaning on the same native SchemaDash component rhythm used by the dashboard/library/settings/profile pages

## Historical Feature-Subtree Inventory

The last known admin feature-subtree files were moved in commit `207820cbf8a3ac9a2ab6f721fb6505b5d059ee01`:

| Historical path | What it did | Current native location | Structural finding |
| --- | --- | --- | --- |
| `frontend/src/features/admin/api/admin-client.ts` | Admin overview HTTP client and response typing | `frontend/src/lib/api/admin-client.ts` | The old feature location was wrong because transport code belongs in `lib/api`, not in a feature island. |
| `frontend/src/features/admin/components/admin-route-guard.tsx` | Route-level admin access guard | `frontend/src/pages/admin-page/admin-route-guard.tsx` | The old feature location was wrong because route protection belongs with the routed page boundary. |

No other `frontend/src/features/admin/*` files exist in git history on this branch lineage.

## Remaining Structural Drift

### 1. `frontend/src/pages/admin-page/admin-page.tsx` is overpacked

The page currently owns:

- route-level page composition
- admin API loading state
- date/time formatting
- auth-provider labels
- status/role badge class maps
- local metric card rendering
- local summary list rendering
- table row rendering for users
- page-specific error/loading surface styling

Finding:

- The file is acting as page, view-model helper module, and local component bucket at the same time.
- This is structurally weaker than the rest of SchemaDash, where non-UI helpers live in `frontend/src/lib/` and reusable presentational pieces live in `frontend/src/components/`.

### 2. Admin response typing is still coupled to the transport module

`frontend/src/lib/api/admin-client.ts` currently owns both:

- HTTP transport
- admin overview domain types

Finding:

- This is serviceable, but it is not the cleanest native shape for SchemaDash.
- The page and tests depend on admin domain types that are more stable than the transport implementation, so the type surface should live under an admin-oriented `frontend/src/lib/` module and be imported by the client.

### 3. Admin page UI primitives were rebuilt locally instead of reused or generalized

The admin page defines local versions of:

- `MetricCard`
- `SummaryList`
- badge tone maps for role/status

Finding:

- SchemaDash already has reusable native building blocks such as `Button`, `Badge`, `Card`, `Table`, `Alert`, and `MetricCard`.
- Rebuilding local primitives inside the page produces a small admin-only component language and increases duplication.

## Visual Drift Findings

The admin page broadly follows the same palette family as the rest of the product, but it still diverges from the native SchemaDash system style in several places.

### 1. Custom admin-only badge styling

The hero badge uses a dark amber treatment:

- `border-amber-500/30 bg-amber-500/10 text-amber-200`

Finding:

- This does not match the standard badge treatment used by `library-page`, `settings-page`, and `profile-page`, which use the lighter amber outline pattern shared across dashboard pages.

### 2. Custom primary action styling instead of the page-level button pattern

The refresh button uses:

- `bg-amber-400 text-stone-950 hover:bg-amber-300`

Finding:

- Dashboard/library pages use a consistent dark-stone / amber-dark-mode primary CTA style on top-level page actions.
- The admin page should follow the same CTA treatment instead of its own warm-only variant.

### 3. Local metric card design diverges from native metric treatment

The page-local metric card introduces:

- custom icon bubble treatment
- bespoke spacing and text sizing
- page-local card shell constants

Finding:

- SchemaDash already uses shared card and metric surfaces.
- Admin metrics should feel like the same product language as the library/dashboard summaries, not a separate dashboard kit.

### 4. Error and loading states are custom instead of native

Current admin states use custom cards and uppercase loading copy.

Finding:

- SchemaDash already has `Alert`, `Card`, and empty/loading surface patterns that should be reused for consistency.

### 5. Role and status tones are hardcoded inline

The role/status visual system currently lives as page-local class maps.

Finding:

- This makes the admin page harder to maintain and prevents the same tone mapping from being reused by future admin widgets.

## Native Reuse Targets

These existing native modules and patterns should be reused or extended instead of keeping admin-specific one-offs:

- `frontend/src/components/button/button.tsx`
- `frontend/src/components/badge/badge.tsx`
- `frontend/src/components/card/card.tsx`
- `frontend/src/components/table/table.tsx`
- `frontend/src/components/alert/alert.tsx`
- `frontend/src/components/metric-card/metric-card.tsx`
- `frontend/src/pages/dashboard-page/library-page.tsx`
- `frontend/src/pages/dashboard-page/profile-page.tsx`
- `frontend/src/pages/dashboard-page/settings-page.tsx`
- `frontend/src/hooks/use-auth.ts`
- `frontend/src/router.tsx`

## Risk Points

High-risk integration points for this correction:

- `frontend/src/pages/admin-page/admin-page.tsx`
- `frontend/src/pages/admin-page/admin-route-guard.tsx`
- `frontend/src/lib/api/admin-client.ts`
- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
- `frontend/src/router.tsx`

Why they are risky:

- `admin-page.tsx` is the primary runtime surface and test target.
- `admin-route-guard.tsx` affects route protection behavior.
- `admin-client.ts` is the transport boundary used by multiple tests.
- `dashboard-shell-layout.tsx` controls whether admins can reach the page.
- `router.tsx` defines the routed integration point.

## Audit Conclusion

The repository no longer has a literal `frontend/src/features/admin` subtree, which is good and should remain true after this task.

The remaining work is a methodology and design-system correction:

- split admin view-model helpers and domain typing out of the page where appropriate
- move reusable presentational widgets into `frontend/src/components/`
- keep route/page wiring under `frontend/src/pages/admin-page/`
- keep transport under `frontend/src/lib/api/`
- keep admin domain helpers under `frontend/src/lib/`
- replace the bespoke admin visual treatment with the same button, badge, card, alert, spacing, and rhythm patterns used elsewhere in SchemaDash
