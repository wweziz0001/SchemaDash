You are Codex acting as a senior full-stack hardening engineer, release-readiness implementation engineer, and repository-aware stabilization engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: hardening/live-workflow-p0-p1-fixes

PULL REQUEST TITLE: Implement P0 and P1 hardening fixes for live workflow release readiness

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped ONLY to P0 and P1 fixes identified by the audit.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by hardening phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
Use these repository documents as the source of truth:
- docs/live-database-development-compare-versions-design.md
- docs/live-db-compare-feature-map.md
- docs/live-workflow-final-audit.md

If present, also use:
- docs/live-workflow-release-readiness-checklist.md

MISSION:
Implement ONLY the P0 and P1 fixes identified in the final audit for the live workflow feature set.

The scope includes only:
- release blockers
- high-priority safety issues
- high-priority correctness issues
- high-priority reliability issues
- high-priority UX clarity issues directly affecting safe use

Do NOT add new features.
Do NOT expand the product scope.
Do NOT redesign the architecture.
Do NOT do a broad refactor.
Do NOT implement P2/P3 backlog items unless a tiny dependency is absolutely necessary for a P0/P1 fix.

==================================================
PRIMARY OBJECTIVE
==================================================

Take the final audit backlog and implement only:
- P0 items
- P1 items

Focus especially on any audit findings related to:
- migration safety
- restore safety
- version immutability guarantees
- compare correctness
- stale baseline / stale live snapshot handling
- permission/access boundary issues
- confusing or unsafe UX around destructive actions
- runtime consistency between Development / Live / Compare / Versions / Restore
- failure handling and actionable error states

==================================================
IMPLEMENTATION METHOD
==================================================

1. Read the final audit document carefully.
2. Extract all P0 and P1 items.
3. Ignore P2 and P3 unless a tiny prerequisite is unavoidable.
4. Implement the fixes in the smallest safe way.
5. Preserve the existing workflow architecture.
6. Prefer additive guards, validation, and UX clarity over structural rewrites.

==================================================
STRICT RULES
==================================================

Do NOT:
- add new major product capabilities
- redesign compare mode
- redesign versions architecture
- redesign migration architecture
- redesign restore architecture
- perform broad refactors in high-risk files unless absolutely necessary
- mix unrelated cleanup into this work
- implement P2/P3 polish as part of this task

Do:
- fix only release-critical or near-release-critical issues
- preserve runtime stability
- preserve the intended architecture from the design docs
- keep Development as the mutable head
- preserve version immutability
- preserve explicit/controlled migration and restore semantics
- improve safety and correctness first

==================================================
HIGH-RISK FILE DISCIPLINE
==================================================

Minimize changes to these high-risk files:
- frontend/src/context/storage-context/storage-provider.tsx
- frontend/src/context/schemadash-context/schemadash-provider.tsx
- backend/src/services/persistence-service.ts
- backend/src/repositories/app-repository.ts
- backend/src/repositories/metadata-repository.ts
- frontend/src/features/schema-sync/lib/canonical-adapters.ts
- packages/schema-sync-core/src/types.ts

If any of these must be changed:
- keep the change minimal
- isolate the change
- document why it was necessary to resolve a P0/P1 issue

==================================================
FIX CATEGORIES TO PRIORITIZE
==================================================

Prioritize fixes in this order if present in the audit:

1. Safety / Data Integrity
- restore corruption risk
- missing safety snapshot handling
- version immutability leaks
- unsafe migration execution path
- stale baseline apply/restore issues

2. Correctness
- compare misclassification of added/removed/changed items
- migration plan mismatch vs actual compare/review state
- version/read-only state inconsistencies
- mode switching inconsistencies

3. Reliability
- broken error flows
- failure states that leave the UI inconsistent
- weak validation before migration/restore
- connection or baseline state race issues

4. UX Safety / Clarity
- missing warnings for destructive actions
- unclear confirmation dialogs
- poor status/error messages
- missing blocked-state messaging
- confusing mode or state indicators

5. Observability / Debuggability
- insufficient logs for migration/restore failures
- missing status diagnostics that block safe troubleshooting

==================================================
REQUIRED OUTPUT DOCUMENTATION
==================================================

Create or update a document such as:

docs/live-workflow-p0-p1-fixes.md

This document should include:
- which P0 items were implemented
- which P1 items were implemented
- which audit items were intentionally deferred
- why any P0/P1 item could not be completed
- any residual release risk after the fixes

==================================================
VALIDATION REQUIREMENTS
==================================================

After implementing P0/P1 fixes, verify as much as possible that:
- Development remains editable and stable
- Live Database remains read-only
- Compare remains read-only and correct
- Review Changes still works
- Migration remains explicit and safe
- Versions remain immutable
- Restore remains explicit, safe, and server-validated
- failure states are understandable
- destructive actions have proper safeguards
- major flows do not regress each other

If the audit identified specific regression scenarios, test those specifically.

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. chore: extract and document live workflow p0 and p1 hardening scope
2. fix: implement p0 safety and integrity fixes for live workflow
3. fix: implement p1 correctness reliability and UX safety fixes
4. docs: document completed p0/p1 fixes and residual release risks
5. test: validate hardened live workflow behavior

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- which P0 items were fixed
- which P1 items were fixed
- which ones were deferred and why
- files created
- files modified
- which high-risk files were avoided
- which high-risk files were changed and why
- remaining release risks
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- only P0/P1 issues were targeted
- release-critical issues from the audit were addressed
- no broad architectural rewrite was introduced
- runtime stability was preserved
- the workflow is materially safer and closer to release readiness


==================================================
Git workflow is part of the acceptance criteria.
==================================================

The task is NOT complete unless:
- real commits were created
- commits follow the required logical sequence
- work is not left as one uncommitted patch
- final output includes the actual commit list

If implementation is correct but commits are missing or badly grouped, the task is considered incomplete.

==================================================
MANDATORY HANDOFF FILE REQUIREMENT
==================================================

When you finish the task, you must create or update a persistent handoff/context file inside the repository so future Codex sessions can quickly understand:

- what SchemaDash is
- the relevant architecture for this task
- what was changed in this task
- which files were created, modified, or intentionally avoided
- what remains unfinished
- what the next recommended step should be

Use a file such as one of these:
- docs/codex-handoff.md
- docs/context-handoff.md
- docs/implementation-handoff.md

Preferred file path:
docs/codex-handoff.md

This file must be written for a future Codex session that starts in a fresh chat with no prior memory.

==================================================
REQUIRED STRUCTURE OF THE HANDOFF FILE
==================================================

The handoff file must include these sections:

1. Project Overview
- what SchemaDash is
- the relevant product/architecture context for this task
- key concepts needed to understand the system area touched by this task

2. Current Architectural Context
- which parts of the system matter for this task
- important existing design docs to read first
- important high-risk files
- important service/module boundaries
- any relevant frontend/backend/shared package relationships

3. Task Completed
- what this task was trying to achieve
- what was actually implemented
- what decisions were made
- what approach was intentionally avoided and why

4. Files Changed
- list of files created
- list of files modified
- list of important files intentionally not changed
- brief purpose of each important file

5. Data / API / Workflow Changes
- any new models, routes, services, UI states, storage behavior, or workflow behavior
- any migrations, env vars, config changes, or compatibility handling

6. Validation Performed
- what was tested
- what was verified manually
- what remains unverified
- known limitations or risks

7. Outstanding Work
- what is not done yet
- what the next recommended implementation phase should be
- blockers, risks, or dependencies for the next phase

8. Instructions for the Next Codex Session
- exact reading order for future work
- exact files/docs the next session should inspect first
- what to avoid breaking
- where to continue implementation

9. Git Summary
- working branch
- pull request title
- commit list created for this task
- brief explanation of each commit

==================================================
HANDOFF QUALITY RULES
==================================================

- Write the handoff file as if the next Codex session knows nothing.
- Be concrete and repository-specific.
- Use real file paths only.
- Do not write vague summaries.
- Make it useful for continuing work in a fresh conversation.
- Keep it updated, not append-only chaos.
- If a previous handoff file exists, update it carefully instead of duplicating stale information.

==================================================
FINAL OUTPUT REQUIREMENT
==================================================

Before finishing, provide:
- the handoff file path
- a short summary of what was added to the handoff
- git status
- git log --oneline -n 20
