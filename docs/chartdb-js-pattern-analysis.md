# ChartDB JS Pattern Analysis

## Scope

This document summarizes high-level product, UX, and UI patterns inferred from the uploaded ChartDB browser bundles under `/eyes/assets`.

The analysis is intentionally limited to:

- visible labels
- module names
- class-name patterns
- workflow language
- safe structural inference

It does not treat the bundled code as reusable source. Any SchemaDash implementation must remain original and adapted to SchemaDash architecture.

## Confirmed Observations

### Workflow and information architecture

- The editor chrome appears to expose multiple workflow views directly in the top toolbar, including `Development`, `Live Database`, version-oriented views, compare/diff actions, and migration-related actions.
- The uploaded bundles contain explicit product language for `Review Changes`, `Migration Script`, `Live Database`, `Development (draft)`, `Database Connection Status`, `Start Editing`, `Create development version`, `View Diffs`, and `Hide Diffs`.
- Version handling is surfaced as a first-class workflow concept rather than a buried settings flow. The toolbar strings suggest a version picker, compare-against-previous behavior, revert/delete actions, and read-only viewing of historical states.
- Connection state is visible in the chrome, including a dedicated connection status surface and a compact online/offline indicator.
- Compare/review/migration flows are grouped near each other rather than scattered across unrelated menus.

### UI design patterns

- Toolbar controls use compact pill-like controls with small heights, tight horizontal padding, and grouped actions inside subtle bordered containers.
- Segmented controls are used for workflow switching and diff toggles, with disabled states visually softened rather than hidden.
- Status is communicated through compact badges, small dots, and short labels instead of long paragraphs.
- Summary and metadata surfaces use light cards with modest padding and frequent `text-xs` and `text-sm` typography for dense but readable information.
- Dialog and overlay composition appears to favor:
  - a clear title and short explanation
  - summary rows/cards near the top
  - structured body sections
  - explicit primary actions
- Empty or blocked states appear to be framed as informative panels, not blank screens.
- The extracted class patterns point to a consistent small-spacing system around:
  - `gap-1` to `gap-4`
  - `px-2` to `px-3`
  - `py-1` to `py-2`
  - `rounded-md`

### Interaction patterns

- Diff visibility is something users can toggle, not only a passive state.
- Historical views appear to distinguish between current editable development work and immutable/read-only versions.
- Migration is presented as a reviewable step with a script-oriented preview and a "no changes detected" empty state.
- The product seems to keep edit affordances contextual: when the user is not in the editable working state, the chrome offers a route back to editing rather than pretending everything is editable.
- Connection-aware flows appear to gate review/migration actions and explain why those actions are unavailable.

## Likely Inferences

- The toolbar likely acts as a lightweight workflow hub: mode selection, status, review entry points, and version controls are all visible without forcing users into a separate page.
- The product likely uses a denser "desktop editor" layout with a central canvas and small, purpose-built overlays instead of large persistent side panels for every task.
- The workflow probably emphasizes "current draft vs baseline/history" framing:
  - editable draft/development
  - read-only live or historical baselines
  - diff/review state between them
- Version/snapshot flows likely prioritize quick inspection first, with destructive actions visually separated and harder to trigger accidentally.

## Safe High-Level Ideas Worth Adapting

### Strong ideas worth adapting

- Use a tighter workflow switcher with stronger active-state clarity and clearer disabled-state explanation.
- Present workflow status as a compact, scannable chip group in the editor chrome:
  - connection/binding state
  - sync freshness
  - editability/read-only state
- Give compare mode a stronger summary surface that explains:
  - current baseline
  - read-only nature
  - key change counts
- Rework review and migration dialogs to feel more like guided product workflows:
  - overview first
  - warnings/validation second
  - execution/action area last
- Improve versions/snapshots presentation with:
  - stronger header hierarchy
  - clearer immutable/read-only language
  - more obvious open/compare/restore actions
- Use better empty states and warning blocks instead of plain placeholder text.

### Maybe-useful ideas

- Add more visual separation between "status info" and "actions" in the top navbar.
- Introduce gentle iconography or leading labels to help users understand read-only workflow layers at a glance.
- Make destructive or high-risk actions more obviously distinct from normal navigation actions.

## Things That Must Not Be Copied Directly

- Bundled/minified implementation structure, including component decomposition and internal state flow.
- Exact class-name recipes or style combinations lifted from the extracted bundles.
- Exact toolbar layout, segmented-control markup, or button composition where reproduction would create a near-clone.
- SQL/migration script generation logic from the bundled code.
- Proprietary version-management behaviors that are not already part of SchemaDash's architecture.
- Exact wording sequences where the phrasing appears product-specific rather than generic.

## Safe Adaptation Guidance

- Reuse only the product ideas:
  - compact chrome
  - clear mode framing
  - status-first summaries
  - layered review flows
  - better read-only communication
- Keep SchemaDash's architecture intact:
  - `Development` remains the mutable head
  - `Live Database`, `Compare`, and `Versions` remain workflow layers around it
  - `Compare` stays derived and read-only
  - `Versions` stay immutable
  - restore copies into `Development`
- Favor original composition in existing SchemaDash components instead of importing new structural complexity from the analyzed bundles.
