You are Codex acting as a senior full-stack auditor, product integration reviewer, and release-readiness engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: audit/live-workflow-final-review

PULL REQUEST TITLE: Audit live workflow feature set for readiness gaps risks and final improvements

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- This task is audit-first and documentation-first.
- Do not perform broad feature rewrites during the audit.
- If you make changes, keep them small, justified, and directly related to the audit output.
- Create real git commits only for documentation outputs or very small audit-related fixes.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by audit/documentation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
Use these existing design documents in the repository as the source of truth:
- docs/live-database-development-compare-versions-design.md
- docs/live-db-compare-feature-map.md

Assume the feature set has already been implemented across multiple phases:
- Development mode
- Live Database mode
- Compare mode
- Review / Migration workflow
- Versions / Snapshots workflow
- Restore to Development workflow

MISSION:
Perform a final structured audit of the complete workflow and determine:
- what is working well
- what is incomplete
- what is fragile
- what is risky
- what should be improved before release
- what can be postponed until later

This is a release-readiness and integration-quality audit for the full workflow.

==================================================
PRIMARY AUDIT SCOPE
==================================================

Audit the end-to-end workflow across these capabilities:

1. Live Database
- connection binding
- connection status
- live snapshot storage
- read-only live view
- refresh/sync behavior

2. Development
- remains the mutable head
- remains collaboration-safe
- remains stable after workflow additions

3. Compare
- compare activation rules
- compare correctness
- visual readability
- read-only behavior
- added/removed/changed classification quality

4. Review Changes
- structured grouped inspection quality
- readability on large diffs
- distinction from visual compare

5. Migration
- migration planning
- warnings/blockers
- preview quality
- apply safety
- success/failure UX
- protection from unsafe execution

6. Versions / Snapshots
- immutable snapshot behavior
- create version flow
- versions listing
- version metadata
- read-only version inspection
- compare against version if implemented

7. Restore to Development
- explicit confirmation
- safety snapshot behavior
- immutability preservation
- server-validated restore
- stable handoff back into Development

==================================================
REQUIRED DOCUMENTATION OUTPUT
==================================================

Create a final audit document in the repository, for example:

docs/live-workflow-final-audit.md

Optionally also create:
- docs/live-workflow-release-readiness-checklist.md

==================================================
REQUIRED CONTENT OF THE AUDIT DOCUMENT
==================================================

1. Executive Summary
- overall readiness level
- major strengths
- major weaknesses
- whether the workflow is ready for production-like use
- biggest remaining risks

2. Feature-by-Feature Audit
For each of these:
- Live Database
- Development
- Compare
- Review Changes
- Migration
- Versions / Snapshots
- Restore to Development

Document:
- current implementation summary
- what works well
- what is missing
- what is fragile
- what should be improved

3. Architecture Conformance Review
Check whether the implemented solution still respects the intended architecture from the design docs:
- Development remains the mutable head
- Live/Compare/Versions remain layered around it
- Compare remains derived/read-only
- Versions remain immutable
- Restore copies into Development rather than mutating versions
- broad editor-core rewrites were avoided
- high-risk files were minimized where possible

For each principle:
- mark as satisfied / partially satisfied / violated
- explain why

4. UX / Product Quality Review
Assess whether the workflow feels coherent and usable:
- toolbar/chrome clarity
- mode switching clarity
- compare readability
- review readability
- migration safety communication
- versions discoverability
- restore clarity
- empty states
- failure states
- status messaging

5. Safety / Reliability Review
Assess:
- migration safety
- restore safety
- snapshot immutability guarantees
- connection failure handling
- stale baseline handling
- compare/migration mismatch risk
- state corruption risk
- runtime recovery quality
- permission and access boundary quality where applicable

6. Technical Risk Review
Identify remaining technical risk in:
- high-risk files
- cross-layer coupling
- compare engine correctness
- version persistence and restore flow
- backend workflow services
- shared canonical type boundaries
- editor integration points

7. Performance / Scalability Review
Assess likely issues related to:
- large diagrams
- large compare sets
- many versions
- many snapshots
- heavy migration reviews
- rendering overhead
- repeated canonical conversion
- repeated compare computation

Distinguish:
- confirmed performance issues
- likely future scalability concerns

8. Observability / Debuggability Review
Assess:
- logging quality
- error clarity
- migration logs
- restore traceability
- compare troubleshooting clarity
- status surfaces in UI
- whether failures are actionable

9. Readiness Backlog
Create a prioritized backlog grouped into:
- P0: must fix before release
- P1: should fix soon
- P2: important but can wait
- P3: long-term polish

For each backlog item include:
- title
- category
- affected files/modules
- why it matters
- implementation risk
- recommended timing

10. Go / No-Go Recommendation
At the end provide:
- whether the feature set is ready for release as-is
- whether it should be released behind a feature flag / beta mode
- what the minimum release blockers are
- recommended next sequence of work

==================================================
AUDIT METHOD REQUIREMENTS
==================================================

Use real repository files only.
Be concrete and evidence-based.
Do not hallucinate missing features.
Distinguish clearly between:
- confirmed issue
- likely issue
- inferred risk
- polish opportunity

Where possible, inspect:
- routes
- services
- repositories
- shared compare/version types
- frontend workflow components
- editor integration points
- docs consistency

==================================================
RULES
==================================================

Do NOT:
- start a broad new refactor
- redesign the product during the audit
- mix unrelated work into the audit
- hide uncertainty where implementation details are unclear

Do:
- audit the implemented feature set rigorously
- compare implementation against the design intent
- identify release blockers and non-blockers clearly
- provide practical next-step guidance

==================================================
OPTIONAL SMALL FIXES
==================================================

You may make small audit-related fixes only if they are:
- clearly justified
- low risk
- directly connected to an issue found in the audit
- committed separately

Examples:
- small doc correction
- obvious misleading label
- tiny status text fix
- small missing safeguard message

Do NOT use this as permission for broad changes.

==================================================
VALIDATION REQUIREMENTS
==================================================

Where practical, verify:
- mode switching works
- compare is read-only
- migration is explicit and safe
- versions are immutable
- restore creates safety snapshot when appropriate
- Development remains editable after restore
- major flows do not obviously regress each other

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. docs: add final live workflow audit and readiness assessment

If small justified fixes are made:
2. fix: apply small audit-driven safety or UX corrections
3. docs: update audit with final post-fix notes

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- document path(s) created
- overall readiness assessment
- top 5 strengths
- top 5 remaining risks
- top 5 improvements before release
- whether release should be full / beta / blocked
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- a real audit document is created
- the audit covers the full implemented workflow
- the audit is grounded in real repository state
- release blockers and non-blockers are clearly separated
- the result is useful for deciding whether to release or continue hardening

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
