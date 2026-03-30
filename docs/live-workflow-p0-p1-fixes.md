# Live Workflow P0 / P1 Hardening Fixes

## Scope Source

This hardening pass was limited to the P0 and P1 items from:

- `docs/live-workflow-final-audit.md`
- `docs/live-workflow-release-readiness-checklist.md`
- `docs/live-database-development-compare-versions-design.md`
- `docs/live-db-compare-feature-map.md`

## Implemented P0 Items

### 1. Unify workflow baseline state after migration apply

Status: **Implemented**

What changed:

- `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
  - after workflow migration apply returns, the dialog now updates the legacy `diagram.schemaSync` compatibility metadata through storage-backed diagram persistence
  - successful apply now advances:
    - `baselineSnapshotId`
    - `baselineFingerprint`
    - `lastImportedAt`
    - `lastPreviewPlanId`
    - `lastPreviewedAt`
    - `lastAuditId`
    - `lastPostApplySnapshotId`
  - failed apply now still records returned audit/post-apply metadata when available without masking the primary failure

Why this matters:

- The older Schema Sync toolbar path still exists.
- Before this fix, workflow migration apply could update workflow live state while leaving the legacy compatibility baseline stale.
- After this fix, the same diagram document metadata used by the legacy path is advanced alongside workflow apply results.

### 2. Stop trusting client canonical schema as authoritative snapshot truth

Status: **Implemented**

What changed:

- `frontend/src/features/diagram-workflow/lib/version-canonical.ts`
  - added a helper that derives the compare baseline from the immutable stored `diagramDocument` when a version snapshot includes one
- `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
  - compare-against-version now prefers canonical schema derived from the stored immutable diagram document instead of blindly trusting the stored client canonical payload

Why this matters:

- Version snapshots and restore-generated safety snapshots already store immutable diagram documents.
- Using those immutable documents as the authoritative compare source removes product reliance on the client-supplied canonical snapshot payload for the main version-compare path.

## Implemented P1 Items

### 1. Add restore and workflow audit traceability surfaces

Status: **Implemented**

What changed:

- `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
  - migration execution results now show:
    - Job ID
    - Audit ID
    - Post-apply snapshot ID
    - Updated workflow live snapshot ID
- `frontend/src/features/diagram-workflow/lib/restore-messages.ts`
  - restore success messaging now includes the resulting Development document version

Why this matters:

- Operators can now correlate workflow apply results with backend job/audit/snapshot identifiers directly from the UI.
- Restore success output now leaves a clearer trace of the resulting Development state.

### 2. Mobile Review / Migration parity

Status: **Already present on branch baseline; no additional implementation required in this task**

Notes:

- The mobile navbar entry point was already added on the audited baseline branch this hardening work started from.
- Manual real-device QA remains outstanding and is documented as residual risk rather than additional implementation scope.

## Intentionally Deferred Items

- **P1 mobile real-device QA**
  - Deferred because it is validation work, not a repository code change.
- **P2/P3 items**
  - Deferred intentionally to keep the hardening pass limited to release-critical and near-release-critical items.

## Residual Release Risk After These Fixes

- Workflow snapshot/version backup portability is still not implemented.
- Stored default compare source is still not honored by the frontend.
- Real-device QA for mobile review/migration flows is still pending.
- Migration/restore observability is improved, but there is still no deeper restore history/audit UI beyond versions and success/failure messaging.
- Version compare now prefers immutable diagram documents, but snapshots without stored diagram documents still fall back to the stored canonical payload.

## Files Touched by the Hardening Work

Created:

- `docs/live-workflow-p0-p1-fixes.md`
- `frontend/src/features/diagram-workflow/lib/version-canonical.ts`

Modified:

- `frontend/src/features/diagram-workflow/components/migration-dialog.tsx`
- `frontend/src/features/diagram-workflow/context/diagram-workflow-context.tsx`
- `frontend/src/features/diagram-workflow/lib/restore-messages.ts`
- `docs/codex-handoff.md`

## Validation Summary

Targeted validation run for the hardened paths:

- `npm run test:ci -w @schemadash/schema-sync-core -- src/__tests__/compare.test.ts src/__tests__/diff-column-matching.test.ts`
- `npm run test:ci -w @schemadash/backend -- test/diagram-workflow-service.test.ts test/diagram-migration-service.test.ts test/diagram-version-restore-service.test.ts`
- `npm run test:web:ci -- frontend/src/features/diagram-workflow/components/migration-dialog.test.tsx frontend/src/features/diagram-workflow/components/restore-version-dialog.test.tsx frontend/src/features/diagram-workflow/lib/version-canonical.test.ts frontend/src/features/diagram-workflow/components/review-dropdown.test.tsx frontend/src/features/diagram-workflow/components/workflow-mode-switcher.test.tsx frontend/src/features/diagram-workflow/components/workflow-development-diagram-sync.test.tsx frontend/src/features/diagram-workflow/lib/compare-render-model.test.ts`

All targeted suites passed.

The validated regression scenarios were:

- workflow migration apply advances legacy compatibility metadata
- version compare prefers immutable stored diagram documents
- migration result traceability surfaces render expected execution references
- restore success messaging includes the resulting Development document version
