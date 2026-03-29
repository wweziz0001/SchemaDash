You are Codex acting as a senior full-stack engineer and repository-aware implementation engineer for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: feature/compare-mode-visual-engine

PULL REQUEST TITLE: Implement compare mode visual engine for Live Database vs Development

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- Keep changes scoped to Compare mode only.
- Create real git commits during the work.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by implementation phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

CONTEXT:
Use these design documents in the repository as the source of truth:
- docs/live-database-development-compare-versions-design.md
- docs/live-db-compare-feature-map.md

Important design conclusions from those documents:
- Compare must be a derived, read-only visualization between:
  - baseline: Live Database snapshot (and later versions)
  - target: current Development diagram
- Development remains the current mutable head.
- Compare should use canonical schema as the source of truth.
- Do NOT use ChangePlan directly as the UI compare model.
- Prefer additive new compare types/modules in packages/schema-sync-core.
- Minimize changes to high-risk files and avoid turning SchemaDashProvider into a multi-branch editor.

MISSION:
Implement ONLY the Compare phase for Live Database vs Development.

Do NOT implement Versions UI.
Do NOT implement Restore to Development.
Do NOT expand the feature into a full multi-version workflow.
Do NOT broadly refactor the editor core.

==================================================
PHASE SCOPE
==================================================

Implement these parts only:

1. Compare core contracts
- Add compare-specific types in the shared schema-sync core package.
- Add a compare engine that accepts canonical schema inputs and returns render-oriented compare results.
- The compare model must support at minimum:
  - table status: added / removed / changed / unchanged
  - field status: added / removed / changed / unchanged
  - relationship status: added / removed / changed / unchanged
- Include summary counts where useful.

2. Compare baseline plumbing
- Use the current live snapshot as the baseline.
- Use the current Development diagram converted to canonical schema as the target.
- Compute compare results on demand.
- Do not persist compare results as a primary stored entity in this phase.

3. Compare mode UI activation
- Enable the Compare mode/tab in the editor chrome only when both:
  - a Live Database snapshot exists
  - a Development diagram exists
- Compare mode must be read-only.

4. Compare rendering layer
- Render visual compare results on the canvas using the design intent from the docs:
  - items present in Development but not in Live: green highlight with addition indicator
  - items present in Live but not in Development: red highlight with removal indicator
  - changed items: neutral changed styling that is visibly distinct from pure add/remove
- Apply compare treatment to:
  - tables
  - relationships
  - fields/columns where practical in this phase
- Preserve existing Development layout as much as possible for shared and development-side items.
- Show live-only items in a safe readable position if no direct layout exists.

5. Compare read-only experience
- Ensure Compare mode does not allow editing mutations.
- Ensure Compare mode visually communicates that it is an inspection/review state.

==================================================
IMPLEMENTATION STRATEGY
==================================================

Follow the design docs.

Preferred new/additive modules include:

Shared compare core:
- packages/schema-sync-core/src/compare.ts
- packages/schema-sync-core/src/compare-types.ts

Frontend compare feature layer:
- frontend/src/features/diagram-workflow/lib/compare-render-model.ts
- frontend/src/features/diagram-workflow/components/compare-legend.tsx
- frontend/src/features/diagram-workflow/components/compare-summary-chip.tsx

You may add other focused files if needed, but keep the design layered.

Minimize changes to these high-risk files:
- frontend/src/context/storage-context/storage-provider.tsx
- frontend/src/context/schemadash-context/schemadash-provider.tsx
- backend/src/services/persistence-service.ts
- backend/src/repositories/app-repository.ts
- backend/src/repositories/metadata-repository.ts
- frontend/src/features/schema-sync/lib/canonical-adapters.ts
- packages/schema-sync-core/src/types.ts

If a high-risk file must be modified:
- keep the change minimal
- isolate the change
- explain why it was necessary

==================================================
COMPARE ENGINE REQUIREMENTS
==================================================

Use canonical schema as the compare source of truth.

Recommended approach:
- convert Development Diagram -> CanonicalSchema using existing adapter path
- use stored live snapshot canonical schema as baseline
- compare canonical-to-canonical only

Do NOT:
- compare diagram-to-diagram as the primary source of truth
- overload ChangePlan to serve as the UI diff model

Table matching priority:
1. sync.sourceId when available
2. qualified schema.table identity
3. controlled rename heuristics only if already supported safely

Field matching priority:
1. sync.sourceId when available
2. normalized field/column name

Relationship matching priority:
1. sync.sourceId when available
2. stable endpoint signature

Detect at minimum:
- added
- removed
- changed
- unchanged

Changed properties should include where practical:
- type
- nullability
- default
- PK/unique participation
- FK endpoint/action differences

==================================================
VISUAL REQUIREMENTS
==================================================

Compare mode should visually communicate:

Development-only:
- green outline or green-tinted emphasis
- plus/addition badge or marker

Live-only:
- red outline or red-tinted emphasis
- minus/removal badge or marker

Changed:
- a distinct neutral changed state
- clearly not confused with add/remove

Also provide:
- a small compare legend
- a compact compare summary in the editor chrome or compare header

The result should be readable on dense diagrams.
Do not overdecorate.
Prefer practical, product-grade compare clarity.

==================================================
READ-ONLY RULES
==================================================

Compare mode must:
- be non-editable
- not mutate Development
- not mutate Live snapshot state
- not start collaboration editing flows
- behave like a review surface

==================================================
RULES
==================================================

Do NOT:
- implement versions/snapshots UI in this task
- implement restore-to-development in this task
- replace the current editor architecture
- introduce broad refactors unrelated to compare
- persist compare results as long-term source-of-truth data

Do:
- keep the implementation additive
- compute compare results on demand
- preserve runtime stability
- keep Compare visually useful and testable
- keep Development as the authoritative mutable head

==================================================
VALIDATION REQUIREMENTS
==================================================

Verify:
- Compare tab activates only when baseline + Development exist
- Compare mode is read-only
- compare engine correctly classifies added/removed/changed items
- development-only tables render with green compare treatment
- live-only tables render with red compare treatment
- changed entities render with distinct changed styling
- relationships also reflect compare state where implemented
- Development mode still behaves normally after Compare integration
- Live Database mode still behaves normally after Compare integration

==================================================
REQUIRED COMMIT SEQUENCE
==================================================

1. feat: add canonical compare contracts and compare engine
2. feat: add compare mode state and baseline plumbing
3. feat: add compare canvas rendering and visual indicators
4. feat: add compare legend summary and read-only UX
5. test: validate compare classification and rendering behavior

==================================================
REQUIRED OUTPUT
==================================================

At the end provide:
- files created
- files modified
- which high-risk files were avoided
- which high-risk files were changed and why
- what remains for later phases
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- Compare mode exists and is usable
- Compare is based on canonical schema comparison
- Compare is read-only
- add/remove/change states are visually distinguishable
- Live vs Development comparison works without overwriting Development
- no Versions/Restore work was mixed into this phase
- no broad editor-core rewrite was introduced


Git workflow is part of the acceptance criteria.

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
