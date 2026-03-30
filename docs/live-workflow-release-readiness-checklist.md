# Live Workflow Release Readiness Checklist

## Current Recommendation

- Release mode: **Beta / feature-flagged only**
- Full release: **Blocked**

## Readiness Checks

| Area | Status | Notes |
| --- | --- | --- |
| Development remains the only editable head | Pass | Confirmed in implementation and targeted tests |
| Live Database remains read-only and separately stored | Pass | Binding and refresh do not replace Development |
| Compare is derived and read-only | Pass | Compare render model and workflow mode behavior are in place |
| Review Changes is available and readable | Partial | Entry point now exists on desktop and mobile, but mobile dialog usability still needs manual QA |
| Migration has explicit planning, validation, and apply safety | Pass | Preview, validation, destructive confirmation, and result handling are present |
| Versions are immutable and inspectable | Pass | Stored separately, read-only UI, compare against version supported |
| Restore creates a safety snapshot and replaces Development safely | Pass | Explicit confirmation, stale-base rejection, automatic safety version |
| Workflow and legacy schema-sync baseline state stay aligned | Fail | Migration apply updates workflow state but not the legacy compatibility metadata |
| Snapshot canonical integrity is authoritative | Fail | Version creation and restore safety snapshots trust client-supplied canonical schema |
| Workflow snapshots/versions are covered by backup/export | Fail | No workflow backup/export compatibility found |
| Targeted automated tests for the workflow pass | Pass | Core, backend, and frontend workflow-focused suites passed |
| Mobile workflow access is complete | Partial | Mobile navbar now exposes Review/Migration, but real-device workflow QA is still pending |

## Release Blockers

- Align the new workflow migration path with the still-available legacy Schema Sync baseline metadata path.
- Remove or reduce trust in client-supplied canonical schema for persisted versions and safety snapshots.

## Should-Fix-Soon

- Run real-device QA for mobile review and migration flows.
- Improve restore and workflow traceability surfaces.

## Can-Wait Items

- Honor stored default compare source in the frontend.
- Define workflow snapshot/version backup portability.
- Optimize large compare/review/version scenarios.
