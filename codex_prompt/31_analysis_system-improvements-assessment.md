You are Codex acting as a senior software architect, security reviewer, performance analyst, and production-readiness engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: analysis/system-improvements-assessment

PULL REQUEST TITLE: Assess required performance, security, reliability, and maintainability improvements for SchemaDash

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- This task is analysis-first, not implementation-first.
- Create real git commits only for documentation outputs produced by this task.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by documentation/analysis phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

MISSION:
Before implementing major changes such as local self-hosted schema sync replacement, perform a structured engineering assessment of SchemaDash and identify the improvements required to make the system stronger in terms of:

1. performance
2. security
3. reliability / resilience
4. maintainability
5. scalability
6. observability / debuggability
7. developer experience
8. operational safety

IMPORTANT:
This task is primarily an assessment and documentation task.
Do NOT start broad refactoring.
Do NOT replace major features yet.
Do NOT perform a repository-wide restructuring.
Do NOT implement the local sync replacement yet unless a tiny code change is absolutely necessary to complete or verify the assessment.
Focus on auditing, identifying weaknesses, prioritizing improvements, and documenting them clearly.

CONTEXT TO USE:
A prior codebase analysis identified the following architectural realities:

- frontend/src/context/storage-context/storage-provider.tsx is highly coupled and mixes local Dexie schema, remote persistence sync, sharing-aware fetches, collaboration session lifecycle, and cached entity conversion.
- frontend/src/context/schemadash-context/schemadash-provider.tsx is another large orchestration point for editor state, storage coordination, remote refresh handling, access mode, and collaboration reactions.
- backend/src/services/persistence-service.ts is a broad service boundary covering bootstrap, collections, projects, diagrams, sharing, sessions, collaboration, and backup import/export.
- Schema sync is intentionally split across three layers:
  - frontend adapters
  - shared core package
  - backend services
- Sharing and collaboration are cross-cutting and should be modified carefully.
- The repository still carries legacy ChartDB compatibility paths in env parsing and request headers.
- High-risk files include:
  - frontend/src/context/storage-context/storage-provider.tsx
  - frontend/src/context/schemadash-context/schemadash-provider.tsx
  - backend/src/services/persistence-service.ts
  - backend/src/repositories/app-repository.ts
  - backend/src/repositories/metadata-repository.ts
  - frontend/src/features/schema-sync/lib/canonical-adapters.ts
  - packages/schema-sync-core/src/types.ts

==================================================
PRIMARY TASK
==================================================

Create a structured engineering assessment for SchemaDash that identifies:

- what is currently weak
- what should be improved
- why it matters
- how risky it is
- what priority it should have
- what files/modules are involved
- what should be addressed before major feature work
- what can wait until later

==================================================
REQUIRED DOCUMENTATION OUTPUT
==================================================

Create a documentation file in the repository, for example:

docs/system-improvements-assessment.md

This file must include the following sections:

==================================================
1. EXECUTIVE SUMMARY
==================================================

Provide a concise summary of:
- the overall health of the system
- the main categories of technical risk
- the most urgent improvement areas
- the biggest blockers to safe future development

==================================================
2. PERFORMANCE ASSESSMENT
==================================================

Identify performance-related weaknesses such as:
- large orchestration providers
- unnecessary rerenders / state churn
- expensive data conversion layers
- hot paths in editor/canvas behavior
- sync-related inefficiencies
- repository/database access inefficiencies
- repeated parsing/serialization work
- expensive startup/bootstrap logic
- unoptimized frontend rendering patterns
- unbounded queries / persistence operations
- risk of slow collaboration or sharing-related flows

For each issue, include:
- title
- affected files/modules
- why it matters
- likely impact
- severity
- recommended improvement
- whether it should be fixed before local sync replacement

==================================================
3. SECURITY ASSESSMENT
==================================================

Audit the system for security improvement opportunities such as:
- token handling
- secret storage
- auth mode handling
- session/cookie security
- OIDC robustness
- input validation
- DB connection handling
- sync endpoint protection
- sharing token behavior
- access control boundaries
- privilege boundaries
- unsafe defaults
- legacy compatibility paths that may weaken security
- trust proxy / deployment assumptions
- logging of sensitive information
- error exposure

For each issue, include:
- title
- affected files/modules
- why it matters
- severity
- recommended mitigation
- whether it is required before implementing local self-hosted sync

==================================================
4. RELIABILITY / RESILIENCE ASSESSMENT
==================================================

Assess issues such as:
- single large service boundaries
- failure propagation across layers
- brittle orchestration files
- lack of retries / fallback behavior
- weak error classification
- weak state recovery
- poor sync failure handling
- persistence edge cases
- stale docs/config causing operational mistakes
- risky coupling across collaboration/sharing/storage/sync

For each issue, include:
- affected files/modules
- failure mode
- likely production impact
- recommended hardening

==================================================
5. MAINTAINABILITY ASSESSMENT
==================================================

Identify:
- over-coupled files
- oversized modules
- mixed responsibilities
- weak feature boundaries
- stale naming / legacy ChartDB compatibility clutter
- risky cross-layer type coupling
- docs drift
- fragile abstractions
- areas that make future work dangerous

For each issue, include:
- affected files/modules
- why it makes development harder
- refactor direction
- urgency

==================================================
6. SCALABILITY ASSESSMENT
==================================================

Identify areas that may become problematic as:
- number of diagrams grows
- collaboration grows
- sync history grows
- projects/collections grow
- self-hosted deployments become larger
- more auth/users/shares are used

Assess:
- storage model risks
- repository/query design concerns
- sync state accumulation
- frontend state scaling
- multi-user coordination risks

==================================================
7. OBSERVABILITY / DEBUGGABILITY ASSESSMENT
==================================================

Assess:
- quality of logging
- ability to debug auth/sync/persistence failures
- missing metrics/status surfaces
- missing structured diagnostics
- whether errors are actionable
- whether frontend/backend failures can be traced well

Recommend improvements such as:
- structured logs
- log correlation
- clearer sync run status
- more useful auth diagnostics
- safer but more actionable error messages

==================================================
8. PRIORITIZED IMPROVEMENT BACKLOG
==================================================

Create a prioritized backlog grouped into:

P0 — must address immediately
P1 — should address before major sync replacement
P2 — should address during or after sync replacement
P3 — longer-term cleanup

For each item include:
- short title
- category
- affected files
- why priority level was chosen
- estimated implementation risk
- dependency notes

==================================================
9. RISK-AWARE RECOMMENDATIONS FOR THE LOCAL SYNC PROJECT
==================================================

Based on the assessment, explain:

- what improvements should be done BEFORE replacing sync
- what improvements can be done DURING the local sync work
- what improvements should be postponed until AFTER sync replacement
- what high-risk files should be avoided if possible
- what adapter/service boundaries should be introduced to reduce risk

==================================================
10. IMPLEMENTATION READINESS SCORE
==================================================

Provide a practical readiness summary such as:
- current readiness for major sync replacement
- top blockers
- top enablers
- recommended next sequencing

==================================================
ASSESSMENT RULES
==================================================

- Be concrete and repository-specific.
- Use real file paths only.
- Do not hallucinate issues that are not supported by the codebase.
- Distinguish clearly between:
  - confirmed issues
  - likely issues
  - inferred risks
- Prefer practical engineering guidance over generic theory.
- Where uncertainty exists, state it clearly.
- Pay special attention to the already-identified high-risk files.

==================================================
OPTIONAL SECOND DOCUMENT
==================================================

If helpful, also create:

docs/system-improvements-backlog.md

This smaller document should summarize the prioritized improvements in a compact engineering action list.

==================================================
OUTPUT REQUIREMENTS
==================================================

At the end provide:
- document path(s) created
- summary of the most important findings
- top 5 improvements to do first
- which ones are blockers for local self-hosted sync
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- a real assessment document is created
- the assessment is concrete and file-aware
- performance/security/reliability/maintainability issues are prioritized
- the output is useful for guiding the next sync-replacement phase
- no broad unrelated implementation work was performed
