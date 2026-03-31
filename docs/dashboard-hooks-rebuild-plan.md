# Dashboard Hooks Rebuild Plan

## Scope Note

On branch `restructe/05-dashboard-hooks-to-native-structure-and-system-style`, `frontend/src/features/dashboard` does not currently exist.

To satisfy the required mapping and methodology review, this plan documents:

1. the last known historical file under `frontend/src/features/dashboard/hooks`
2. the current dashboard runtime files that still need responsibility cleanup
3. the native SchemaDash modules and visual-system patterns that should replace dashboard-only implementations

## Existing Native Modules To Reuse

These existing SchemaDash modules already fit the dashboard/library area and should be reused instead of preserving dashboard-specific implementations:

- `frontend/src/components/button/button.tsx`
- `frontend/src/components/badge/badge.tsx`
- `frontend/src/components/card/card.tsx`
- `frontend/src/components/alert/alert.tsx`
- `frontend/src/components/empty/empty.tsx`
- `frontend/src/components/input/input.tsx`
- `frontend/src/components/select/select.tsx`
- `frontend/src/components/metric-card/metric-card.tsx`
- `frontend/src/components/status-badge/status-badge.tsx`
- `frontend/src/components/summary-list/summary-list.tsx`
- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`

## Historical `frontend/src/features/dashboard/hooks` Mapping

The current branch has no live dashboard feature subtree, so the mapping below uses the last known feature-subtree file from commit `69ef6e39526fd298fb105ace7d92f0229eb16b96`.

| Old path | Proposed / confirmed native path | Classification | What it actually does | Why the old location is structurally wrong | Why the new location is correct | Native module/pattern to reuse instead | Risk / special handling |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `frontend/src/features/dashboard/hooks/use-library-catalog.ts` | `frontend/src/pages/dashboard-page/use-library-catalog.ts` plus `frontend/src/lib/dashboard/library-catalog.ts` and `frontend/src/lib/utils/search.ts` | `generalize` | Loads library catalog data and also defines pure search, sorting, filtering, and shared-resource classification logic | It trapped page integration and shared non-UI helpers inside a feature island | Page-owned React state belongs in `pages/dashboard-page`; reusable catalog/search logic belongs in `lib/` | `useStorage`, `useAuth`, native dashboard page route pattern | Keep query behavior unchanged so collection/shared/trash/library views do not regress |

## Current Dashboard Runtime Classification

These are the current files that still need responsibility correction even though the feature subtree is already gone.

| Current path | Responsibility | Planned action | Target path after rebuild | Why this handling is correct | Existing native reuse target |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/pages/dashboard-page/use-library-catalog.ts` | Page-level hook plus pure catalog helpers/types | `split`, `merge`, `shrink` | Remains `frontend/src/pages/dashboard-page/use-library-catalog.ts`, with pure helpers moved to `frontend/src/lib/dashboard/library-catalog.ts` and `frontend/src/lib/utils/search.ts` | The page should own React state/data loading, not shared utility logic | `frontend/src/lib/dashboard/library-catalog.ts`, `frontend/src/lib/utils/search.ts` |
| `frontend/src/pages/dashboard-page/library-page.tsx` | Page composition plus local card/metric/badge UI | `merge`, `generalize`, `shrink` | Remains page composition only, with reusable UI moved into `frontend/src/components/dashboard-page/` | Library item cards and page widgets are reusable dashboard UI, not page-only internals | `MetricCard`, `StatusBadge`, `Alert`, `Card`, `Button` |
| `frontend/src/pages/dashboard-page/collections-page.tsx` | Route page plus dashboard search/hero/loading/empty UI | `merge` and `reuse` | Same path, but built on shared dashboard page widgets | This page should compose shared dashboard widgets instead of defining its own card rhythm | shared dashboard page header, search toolbar, empty/loading surfaces |
| `frontend/src/pages/dashboard-page/trash-page.tsx` | Route page plus duplicated metrics/error/loading/empty UI | `merge` and `reuse` | Same path, but built on shared dashboard page widgets and `MetricCard` | Same dashboard surface language should apply here too | shared dashboard page header, `MetricCard`, `Alert`, empty/loading surfaces |
| `frontend/src/pages/dashboard-page/profile-page.tsx` | Route page plus bespoke summary-row UI | `merge` and `reuse` | Same path, but with summary rows expressed through `frontend/src/components/summary-list/summary-list.tsx` | Summary rows are already a shared native component | `SummaryList`, `Badge`, `Card` |
| `frontend/src/pages/dashboard-page/settings-page.tsx` | Route page plus page-local preference-card UI and bespoke summary rows | `generalize` and `reuse` | Same path, with reusable preference cards moved to `frontend/src/components/dashboard-page/` | Settings preference tiles are a reusable dashboard composite widget | `SummaryList`, `Checkbox`, `Select`, `Card` |
| `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx` | Dashboard-adjacent dialog with duplicated search normalization helper | `merge` | Same path, but consumes `frontend/src/lib/utils/search.ts` | Shared search normalization should not live in multiple dashboard files | `frontend/src/lib/utils/search.ts` |
| `frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.ts` | Dialog-specific storage adapter | `keep` | same file | This logic is dialog-bound rather than page-level drift and does not need a new feature subtree | existing dialog-native structure |
| `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx` | Dashboard route shell and navigation | `keep` with minimal import-safe changes only if required | same file | High-risk shared shell already lives in the right route boundary | current dashboard shell pattern |
| `frontend/src/router.tsx` | Route integration | `keep` | same file | Route ownership already matches the native structure | current routed page pattern |

## Files Expected To Be Created

Planned additions:

- `frontend/src/lib/dashboard/library-catalog.ts`
- `frontend/src/lib/utils/search.ts`
- `frontend/src/components/dashboard-page/dashboard-page-header.tsx`
- `frontend/src/components/dashboard-page/dashboard-feedback-panel.tsx`
- `frontend/src/components/dashboard-page/library-diagram-card.tsx`
- `frontend/src/components/dashboard-page/dashboard-setting-option-card.tsx`
- `docs/codex-handoff.md` update

Additional dashboard composite components may be created under `frontend/src/components/dashboard-page/` only if they replace duplicated page-local UI cleanly.

## Files Expected To Be Removed

Runtime removals:

- no live files should remain under `frontend/src/features/dashboard`
- no live directory should remain under `frontend/src/features`

In-file removals after extraction:

- page-local `MetricCard` from `frontend/src/pages/dashboard-page/library-page.tsx`
- ad-hoc badge tone strings in `frontend/src/pages/dashboard-page/library-page.tsx`
- duplicated dashboard search normalization in `frontend/src/pages/dashboard-page/use-library-catalog.ts` and `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
- duplicated empty/loading/error surface markup across `frontend/src/pages/dashboard-page/library-page.tsx`, `frontend/src/pages/dashboard-page/collections-page.tsx`, and `frontend/src/pages/dashboard-page/trash-page.tsx`
- bespoke summary-row blocks in `frontend/src/pages/dashboard-page/profile-page.tsx` and `frontend/src/pages/dashboard-page/settings-page.tsx`

## Files That Need Special Handling

- `frontend/src/pages/dashboard-page/use-library-catalog.ts`
  - Must preserve the current data-loading behavior while helpers move into `lib/`.
- `frontend/src/pages/dashboard-page/library-page.tsx`
  - Main library surface; style cleanup must not change routing or action behavior.
- `frontend/src/pages/dashboard-page/settings-page.tsx`
  - Contains persisted preference toggles and must preserve existing `useLocalConfig` wiring exactly.
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
  - Dashboard-adjacent dialog; keep behavioral changes limited to helper reuse.

## Risky Integration Points

Files requiring narrow changes:

- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
- `frontend/src/pages/dashboard-page/library-page.tsx`
- `frontend/src/pages/dashboard-page/use-library-catalog.ts`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
- `frontend/src/router.tsx`

## Visual Mismatches To Correct

The dashboard-related UI must align with the native SchemaDash visual language by correcting these mismatches:

1. Replace the page-local library metric cards with the shared `MetricCard`.
2. Replace ad-hoc library badge color strings with the shared `StatusBadge` tone system wherever the badge is conveying status/type semantics.
3. Use the native `Alert` component for dashboard error states instead of custom red `Card` surfaces.
4. Use one reusable dashboard empty/loading surface built from native components rather than repeating custom `Card` markup per page.
5. Reuse the same hero rhythm across library, collections, trash, profile, and settings through a shared dashboard page header component.
6. Reuse `SummaryList` for profile/settings summary rows instead of custom flex-row cards.
7. Reuse shared buttons, inputs, selects, spacing, and typography without introducing dashboard-only visual language.

## Implementation Phases

### Phase 1. Audit and documentation

- Add the methodology drift audit.
- Add this rebuild plan.

### Phase 2. Reclassify reusable UI and helper responsibilities

- Split pure catalog/search logic out of the page hook into `frontend/src/lib/`.
- Extract reusable dashboard page widgets out of page files into `frontend/src/components/dashboard-page/`.

### Phase 3. Align dashboard styling to the native SchemaDash system

- Replace page-local metric, badge, alert, empty, loading, and summary-row treatments with native reusable components.
- Keep dashboard route ownership and runtime behavior stable.

### Phase 4. Verify and hand off

- Run targeted tests and build verification.
- Update `docs/codex-handoff.md`.
- Confirm `frontend/src/features/dashboard` and `frontend/src/features` are absent.

## Success Conditions

This task is successful only if all of the following are true:

- `frontend/src/features/dashboard` does not exist
- `frontend/src/features` does not exist
- page-owned hook integration remains close to `frontend/src/pages/dashboard-page/`
- reusable catalog/search logic lives under `frontend/src/lib/`
- reusable dashboard UI lives under `frontend/src/components/`
- dashboard pages use the same buttons, badges, cards, alerts, summary rows, spacing, and typography language as the rest of SchemaDash
- dashboard, profile, settings, collections, trash, and open-diagram flows remain stable
