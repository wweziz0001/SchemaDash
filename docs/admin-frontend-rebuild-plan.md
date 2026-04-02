# Admin Frontend Rebuild Plan

## Scope Note

On branch `restructe/04-admin-to-native-structure-and-system-style`, `frontend/src/features/admin` does not currently exist.

To satisfy the required methodology audit and path mapping, this plan documents:

1. the last known admin feature-subtree files from the branch history
2. the current admin runtime files that still need responsibility cleanup
3. the visual-system corrections required so the admin page matches the rest of SchemaDash

## Existing Native Modules To Reuse

These native modules already fit the admin frontend and should be reused instead of keeping admin-only patterns:

- `frontend/src/components/button/button.tsx`
- `frontend/src/components/badge/badge.tsx`
- `frontend/src/components/card/card.tsx`
- `frontend/src/components/table/table.tsx`
- `frontend/src/components/alert/alert.tsx`
- `frontend/src/components/metric-card/metric-card.tsx`
- `frontend/src/hooks/use-auth.ts`
- `frontend/src/pages/dashboard-page/library-page.tsx`
- `frontend/src/pages/dashboard-page/profile-page.tsx`
- `frontend/src/pages/dashboard-page/settings-page.tsx`
- `frontend/src/router.tsx`

## Historical `frontend/src/features/admin` Mapping

The current branch has no live files under `frontend/src/features/admin`, so the mapping below uses the last known admin feature-subtree paths from commit `207820cbf8a3ac9a2ab6f721fb6505b5d059ee01`.

| Old path | Proposed / confirmed native path | Classification | What it actually does | Why the old location is structurally wrong | Why the new location is correct | Native module/pattern to reuse instead | Risk / special handling |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/features/admin/api/admin-client.ts` | `frontend/src/lib/api/admin-client.ts` plus `frontend/src/lib/admin/admin-overview.ts` | `generalize` | Fetches `GET /api/admin/overview` and exposes admin overview domain typing | HTTP transport and stable domain types do not belong in a feature island | `lib/api` is the transport boundary; `lib/admin` is the correct place for stable admin-specific DTOs/helpers | `frontend/src/lib/api/request.ts` | Keep payload shape unchanged because tests and backend route contracts depend on it |
| `frontend/src/features/admin/components/admin-route-guard.tsx` | `frontend/src/pages/admin-page/admin-route-guard.tsx` | `move` | Protects the `/admin` route for authenticated admins only | Route protection is page integration, not reusable feature-owned UI | `pages/admin-page` is the route boundary consumed by `frontend/src/router.tsx` | `frontend/src/hooks/use-auth.ts` and existing loading-shell pattern from `frontend/src/app.tsx` | Keep logic narrow so non-admin redirect behavior does not regress |

## Current Admin Runtime Classification

These are the current files that still need responsibility correction even though the feature subtree is already gone.

| Current path | Responsibility | Planned action | Target path after rebuild | Why this handling is correct | Existing native reuse target |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/pages/admin-page/admin-page.tsx` | Route-level page composition, admin loading, local view helpers, local presentational widgets, visual styling | `merge`, `generalize`, and `shrink` | Remains `frontend/src/pages/admin-page/admin-page.tsx`, but only as page composition | The page should own route composition, not its own mini component library and helper layer | `Button`, `Badge`, `Card`, `Table`, `Alert`, `MetricCard`, dashboard-page hero rhythm |
| `frontend/src/pages/admin-page/admin-route-guard.tsx` | Page route guard | `keep` with minimal review | `frontend/src/pages/admin-page/admin-route-guard.tsx` | Already sits in the right native boundary | `frontend/src/app.tsx` loading-shell pattern |
| `frontend/src/lib/api/admin-client.ts` | HTTP client plus admin types | `split` and `generalize` | `frontend/src/lib/api/admin-client.ts` and `frontend/src/lib/admin/admin-overview.ts` | Stable admin DTOs/helpers should not be trapped in the transport module | `frontend/src/lib/api/request.ts` |
| `frontend/src/pages/admin-page/admin-page.test.tsx` | Page behavior test | `update` | same file | Test should follow the new lib/component boundaries while preserving behavior expectations | existing Vitest + React Testing Library page tests |
| `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx` | Sidebar route entrypoint for admin users | `keep` with minimal import-safe changes only if needed | same file | This is a high-risk shared shell and should only change if the admin page contract changes | existing dashboard shell nav pattern |
| `frontend/src/router.tsx` | Lazy route integration | `keep` with minimal import-safe changes only if needed | same file | This already matches native route organization | current routed page pattern |

## Page-Local Pieces To Extract Or Merge

These are not separate files today, but they are the main remaining methodology drift inside `frontend/src/pages/admin-page/admin-page.tsx`.

| Current in-page construct | Proposed destination | Classification | Why |
| --- | --- | --- | --- |
| page-local `MetricCard` | `frontend/src/components/metric-card/metric-card.tsx` or a small admin composite under `frontend/src/components/` | `merge` / `generalize` | Metric surfaces should use the same native component language as the rest of the product |
| page-local `SummaryList` | `frontend/src/components/summary-list/summary-list.tsx` | `generalize` | Key/value summary rows are reusable presentational UI, not page-only logic |
| `statusBadgeClassNames` and `roleBadgeClassNames` | `frontend/src/components/status-badge/status-badge.tsx` | `generalize` | Badge tone mapping is UI logic that should be reusable across admin widgets |
| `authProviderLabels` and date formatting helpers | `frontend/src/lib/admin/admin-overview.ts` | `move` | These are pure admin view-model helpers, not route composition |

## Files Expected To Be Created

Planned additions:

- `frontend/src/lib/admin/admin-overview.ts`
- `frontend/src/components/status-badge/status-badge.tsx`
- `frontend/src/components/summary-list/summary-list.tsx`
- `docs/codex-handoff.md` update

Additional admin composite components may be created under `frontend/src/components/` only if they eliminate page-local duplication cleanly.

## Files Expected To Be Removed

Runtime removals:

- no live files remain under `frontend/src/features/admin`
- no live directory remains under `frontend/src/features`

Redundant in-page implementations to remove from `frontend/src/pages/admin-page/admin-page.tsx`:

- local metric card component
- local summary list component
- local role/status badge class maps where replaced by shared reusable components
- transport-coupled admin type declarations once moved to `frontend/src/lib/admin/admin-overview.ts`

## Risky Integration Points

Files requiring special handling:

- `frontend/src/pages/admin-page/admin-page.tsx`
  - High risk because it is the primary runtime/admin test surface.
- `frontend/src/lib/api/admin-client.ts`
  - High risk because request shape and typings must stay compatible with backend and tests.
- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
  - High risk because it is a shared authenticated shell and should not receive broad styling changes.
- `frontend/src/router.tsx`
  - High risk because route integration regressions can hide the page completely.
- `frontend/src/components/metric-card/metric-card.tsx`
  - Only safe to touch if the change is additive and backward-compatible.

## Visual Mismatches To Correct

The admin page must align with the native SchemaDash visual language by correcting these mismatches:

1. Replace the admin-only hero badge treatment with the same amber outline style used by `library-page`, `settings-page`, and `profile-page`.
2. Replace the custom refresh CTA styling with the same primary page-action language used in the library and other dashboard pages.
3. Replace the bespoke admin metric card styling with shared metric/card patterns.
4. Replace custom error and loading panels with native `Alert`/`Card` surface patterns.
5. Replace inline badge class maps with a reusable badge tone wrapper that still composes the native `Badge` component.
6. Keep the same spacing rhythm already used in other dashboard pages:
   - hero section
   - 3-to-5 card metric row
   - rounded card surfaces
   - restrained `text-stone-*` typography hierarchy

## Implementation Phases

### Phase 1. Audit and documentation

- Add the methodology drift audit.
- Add this rebuild plan.

### Phase 2. Reclassify reusable UI and helper responsibilities

- Extract reusable presentational UI out of `admin-page.tsx`.
- Split pure admin helper/domain typing out of the transport module.

### Phase 3. Align admin styling to the native SchemaDash system

- Update the page hero badge/button treatment.
- Use native alert/loading/card patterns.
- Keep the existing admin information architecture while changing only the presentation layer needed for consistency.

### Phase 4. Verify and hand off

- Run targeted tests and build verification.
- Update `docs/codex-handoff.md`.
- Confirm `frontend/src/features/admin` and `frontend/src/features` are absent.

## Success Conditions

This task is successful only if all of the following are true:

- `frontend/src/features/admin` does not exist
- `frontend/src/features` does not exist
- admin domain helpers live under `frontend/src/lib/`
- reusable admin UI primitives are no longer trapped inside `frontend/src/pages/admin-page/admin-page.tsx`
- the admin page uses the same SchemaDash button, badge, card, alert, table, spacing, and typography language as nearby dashboard pages
- route behavior and admin overview loading remain stable
