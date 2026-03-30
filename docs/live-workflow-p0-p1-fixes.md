# Live Workflow P0 / P1 Hardening Scope

## Scope Source

This hardening pass is intentionally limited to the P0 and P1 items from:

- `docs/live-workflow-final-audit.md`
- `docs/live-workflow-release-readiness-checklist.md`
- `docs/live-database-development-compare-versions-design.md`
- `docs/live-db-compare-feature-map.md`

## In Scope

### P0

1. **Unify workflow baseline state after migration apply**
   - Keep the newer workflow live snapshot state aligned with the legacy `diagram.schemaSync` compatibility metadata that still powers the Schema Sync toolbar path.

2. **Stop trusting client canonical schema as authoritative snapshot truth**
   - Remove product reliance on client-supplied canonical snapshot payloads where immutable version/restore behavior can instead rely on authoritative stored diagram documents.

### P1

1. **Add restore and workflow audit traceability surfaces**
   - Improve the visibility of workflow execution identifiers and restore-result trace details so failures and destructive actions are easier to troubleshoot safely.

2. **Mobile Review / Migration parity**
   - Already addressed on the branch baseline through the mobile navbar entry point.
   - Only verification/documentation work remains in this hardening pass; no further product expansion is planned unless a small regression is found.

## Out of Scope

- P2 and P3 audit backlog items
- backup/export support for workflow snapshots/versions
- compare baseline preference UX
- performance/scalability optimization
- broad refactors of editor/storage/persistence core
- redesign of versions, compare, migration, or restore architecture

## Planned Implementation Strategy

- Prefer additive guards and compatibility synchronization over structural rewrites.
- Avoid changing the highest-risk editor/storage/persistence files unless no narrower option exists.
- Keep Development as the only mutable head.
- Keep Versions immutable and Compare read-only.

## Planned Validation

- Targeted backend workflow/migration/restore tests
- Targeted frontend workflow/migration/restore/version tests
- Additional regression coverage for:
  - compatibility metadata advancement after workflow migration apply
  - version compare baselines preferring stored immutable diagram documents over client canonical payloads
  - workflow/restore traceability surfaces
