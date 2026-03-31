# Dashboard Hooks Methodology Drift Audit

## Scope

This audit covers the dashboard/library frontend area on branch `restructe/05-dashboard-hooks-to-native-structure-and-system-style`.

The current checkout already has no live `frontend/src/features/dashboard` directory. To satisfy the required methodology audit, this document combines:

1. the historical dashboard hook that previously lived under `frontend/src/features/dashboard/hooks`
2. the current runtime files that still carry dashboard-specific architectural drift
3. the current dashboard/library UI surfaces that still need tighter SchemaDash system alignment

## Historical Feature-Subtree Drift

The last known dashboard hook under the removed feature subtree existed at commit `69ef6e39526fd298fb105ace7d92f0229eb16b96`.

Historical file list:

- `frontend/src/features/dashboard/hooks/use-library-catalog.ts`

Observed drift in that file:

- It mixed page-owned React state with pure catalog selectors and sorting/filtering helpers.
- It exported search normalization logic that was then reused by other page files, which made a page hook act like a shared utility module.
- It lived under a feature island even though the native SchemaDash structure expects:
  - page-owned integration close to `frontend/src/pages/dashboard-page/`
  - reusable non-UI logic under `frontend/src/lib/`

## Current Runtime Drift

Even though the feature subtree is already gone, the runtime dashboard area still shows methodology drift in these files:

- `frontend/src/pages/dashboard-page/use-library-catalog.ts`
  - Correctly moved near the page layer, but still mixes React hook state with pure catalog logic that should live in `frontend/src/lib/`.
- `frontend/src/pages/dashboard-page/library-page.tsx`
  - Contains page-local dashboard UI composites and ad-hoc badge/metric styling instead of reusing shared system components.
- `frontend/src/pages/dashboard-page/collections-page.tsx`
  - Reuses search normalization from a page hook and duplicates dashboard card/loading/empty styling.
- `frontend/src/pages/dashboard-page/trash-page.tsx`
  - Duplicates hero, metric, loading, empty, and error surface patterns.
- `frontend/src/pages/dashboard-page/profile-page.tsx`
  - Uses bespoke dashboard summary row styling that overlaps with the shared `SummaryList` component.
- `frontend/src/pages/dashboard-page/settings-page.tsx`
  - Uses page-local preference-card markup and bespoke summary row styling rather than reusable dashboard/system composites.
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
  - Duplicates dashboard search normalization logic instead of reusing a shared non-UI helper.

## Structural Issues By Responsibility

### Hook and helper drift

- `frontend/src/pages/dashboard-page/use-library-catalog.ts`
  - Page-level hook logic belongs here.
  - Pure catalog filtering, sort/search normalization, and DTO/view-model helpers do not.

### Shared UI drift

- `frontend/src/pages/dashboard-page/library-page.tsx`
  - Local metric and card treatments should reuse native `MetricCard`, `StatusBadge`, `Alert`, and shared dashboard page widgets.
- `frontend/src/pages/dashboard-page/profile-page.tsx`
  - Workspace snapshot rows overlap with `frontend/src/components/summary-list/summary-list.tsx`.
- `frontend/src/pages/dashboard-page/settings-page.tsx`
  - The preference option tiles are reusable dashboard/settings UI, not page-only styling.

### Page rhythm drift

- `frontend/src/pages/dashboard-page/library-page.tsx`
- `frontend/src/pages/dashboard-page/collections-page.tsx`
- `frontend/src/pages/dashboard-page/trash-page.tsx`
- `frontend/src/pages/dashboard-page/profile-page.tsx`
- `frontend/src/pages/dashboard-page/settings-page.tsx`

These pages all repeat the same hero, empty, loading, and content-shell rhythm in slightly different custom ways instead of sharing one native dashboard page language.

## Native Modules And Patterns That Should Be Reused

These existing SchemaDash modules are the right targets to reuse instead of keeping dashboard-only implementations:

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

## Visual-System Mismatches

Current dashboard-related UI issues that still need correction:

1. Library cards use ad-hoc badge class strings instead of the shared `StatusBadge` tone system.
2. Library metrics are still rendered through a page-local metric card instead of the shared `MetricCard`.
3. Collections and trash use custom loading/empty surfaces instead of a reusable dashboard empty/loading pattern built from native components.
4. Error states use raw `Card` treatments where the rest of SchemaDash already has a native `Alert` component.
5. Profile and settings summary rows use bespoke flex rows instead of the existing `SummaryList` system component.
6. Search normalization is still duplicated across the dashboard page and dashboard-adjacent dialog flow.

## High-Risk Areas

Files that require especially narrow changes:

- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
- `frontend/src/pages/dashboard-page/use-library-catalog.ts`
- `frontend/src/pages/dashboard-page/library-page.tsx`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
- `frontend/src/router.tsx`

Reasons:

- They sit on route composition, core dashboard data loading, or shared workspace actions.
- Regressions here would break dashboard navigation, library search/filtering, or diagram opening/sharing flows.

## Required Correction Direction

The dashboard rebuild should:

- keep page integration close to `frontend/src/pages/dashboard-page/`
- move pure catalog/search/view-model helpers into `frontend/src/lib/`
- move reusable dashboard UI widgets into `frontend/src/components/`
- reuse shared system components for badges, metrics, alerts, cards, summary rows, and empty states
- keep `frontend/src/features/dashboard` absent
- keep `frontend/src/features` absent
