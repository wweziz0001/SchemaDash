You are Codex acting as a senior product architect, full-stack engineer, and repository-aware implementation planner for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: analysis/live-db-development-compare-versions-design

PULL REQUEST TITLE: Design Live Database, Development, Compare, and Versions workflow for SchemaDash

GIT WORKFLOW REQUIREMENTS:
- Work only on the specified repository and branch.
- This task is design and analysis first, not feature implementation first.
- Create real git commits only for documentation outputs produced by this task.
- Do not leave the work as one giant uncommitted patch.
- Use logical commits grouped by documentation/analysis phase.
- Before finishing, provide:
  - git status
  - git log --oneline -n 20
  - short summary of what each commit did

MISSION:
Design a new product workflow for SchemaDash inspired by the premium workflow seen in ChartDB, but implemented as a local/self-hosted SchemaDash-native feature set.

The goal is to add a richer database evolution workflow built around these concepts:

1. Live Database
2. Development
3. Compare
4. Versions / Snapshots

==================================================
PRODUCT INTENT
==================================================

The desired behavior is:

A) Live Database
- The user connects SchemaDash to a real database.
- Once the connection succeeds, the UI clearly indicates that the diagram is connected to a live database.
- A top-level button/tab called "Live Database" becomes active.
- This mode shows the live state of the real database schema.

B) Development
- A separate working mode/tab called "Development" shows the user’s editable working version of the diagram.
- This is where the user can continue drawing, editing, evolving, and planning schema changes without immediately overwriting the live database view.
- Think of it as a working branch or editable design surface.

C) Compare
- A third mode/tab/action called "Compare" compares:
  - the live database schema
  - the current development schema
- The comparison should be visual on the canvas:
  - items present in Development but not in Live Database should be highlighted in green with a plus-style addition signal
  - items present in Live Database but not in Development should be highlighted in red with a minus/deletion signal
- The comparison should apply to tables and relationships, and where practical also fields/columns and metadata-level differences.

D) Versions / Snapshots
- The system should support multiple versions for the same diagram/project.
- Each version behaves like a snapshot of the document at a point in time.
- Development should feel like a working branch or mutable current version.
- Users should be able to create named or timestamped snapshots/versions for historical review and change tracking.

==================================================
IMPORTANT CONTEXT
==================================================

The current SchemaDash behavior is too limited:
- when connecting to a real database, it currently only offers either:
  1. replace the current diagram with what exists in the real database
  2. create a new diagram from the real database
- this is not enough

The new design should support a richer workflow where:
- live schema and development schema coexist
- visual comparison is first-class
- versions/snapshots exist per diagram
- the product feels more like schema evolution workflow, not only import/export

==================================================
TASK
==================================================

Before implementing anything major, analyze the repository and create a design document that explains how to add this workflow safely and cleanly to SchemaDash.

Create a documentation file such as:

docs/live-database-development-compare-versions-design.md

==================================================
REQUIRED CONTENT OF THE DESIGN DOCUMENT
==================================================

1. Executive Summary
- summarize the target workflow
- explain why the current workflow is insufficient
- explain the value of Live Database + Development + Compare + Versions

2. Current State Analysis
- identify how database import/connection currently works
- identify current schema sync related files/modules
- identify current version/history/changelog related files/modules if any
- identify what already exists that can be reused
- identify what is missing

3. Proposed Product Model
Define the product concepts clearly:
- Live Database
- Development
- Compare
- Version / Snapshot
- current editable version
- published / immutable snapshot if relevant
- branch-like behavior if relevant

Explain how these concepts relate to:
- diagrams
- projects
- collections
- sync state
- collaboration/sharing if relevant

4. Proposed Data Model
Design the necessary backend/data model changes.
Identify entities that may be needed, for example:
- live database connection metadata
- live schema snapshot
- development schema state
- compare result model or derived compare state
- diagram versions / snapshots
- version metadata
- sync status / last synced timestamp
- comparison baseline metadata

For each proposed entity/model:
- purpose
- main fields
- persistence location
- relationship to existing diagram/project models

5. Proposed UI / UX Model
Design the interface changes needed:
- top toolbar buttons/tabs for Live Database / Development / Compare
- connection success indicator
- status chip like "Last synced"
- compare mode visual conventions
- version/snapshot UI
- changelog/versions page interactions if relevant
- clear state transitions between modes

Include guidance for:
- visual compare styling
- addition/removal indicators
- relation compare behavior
- empty states
- failure states
- connection states

6. Compare Engine Design
Design how comparison should work:
- what is being compared
- schema normalization/canonicalization strategy
- table compare
- field compare
- relationship compare
- metadata compare if relevant
- how to detect added/removed/changed items
- whether compare results are persisted or computed on demand
- how layout should be preserved during compare mode rendering

7. Version / Snapshot Design
Design how versions should work:
- how a version is created
- whether versions are immutable
- whether Development points to a mutable head/current working state
- whether versions are per diagram
- whether compare can compare against a version as well as Live Database
- how snapshots interact with collaboration and sharing if relevant

8. Risk / Coupling Analysis
Use the known high-risk areas carefully.
Explicitly assess impact on:
- frontend/src/context/storage-context/storage-provider.tsx
- frontend/src/context/schemadash-context/schemadash-provider.tsx
- backend/src/services/persistence-service.ts
- backend/src/repositories/app-repository.ts
- backend/src/repositories/metadata-repository.ts
- frontend/src/features/schema-sync/lib/canonical-adapters.ts
- packages/schema-sync-core/src/types.ts

For each risky area:
- explain likely impact
- recommend whether to modify or avoid
- suggest safer extension points

9. Recommended Architecture Strategy
Recommend the safest implementation strategy, such as:
- new focused services/modules
- adapter layers
- compare engine boundaries
- snapshot service boundaries
- local live-schema state boundaries
- minimal changes to orchestration files

10. Phased Implementation Plan
Create a staged plan such as:
- Phase 1: design/data model groundwork
- Phase 2: live database state support
- Phase 3: development/live split
- Phase 4: compare mode visual engine
- Phase 5: versions/snapshots
- Phase 6: polish and validation

For each phase:
- goal
- affected files
- risk level
- test/verification requirements

11. Readiness and Recommendation
At the end, state:
- what should be implemented first
- what should wait
- what is high risk
- whether the system is ready for this feature set
- the recommended order of delivery

==================================================
RULES
==================================================

- This task is design-first, not implementation-first.
- Do NOT start broad refactoring.
- Do NOT implement the feature set yet unless a tiny code/documentation change is absolutely needed for accurate analysis.
- Use real repository file paths only.
- Be concrete and architecture-aware.
- Do not hallucinate features that do not exist.
- Distinguish clearly between:
  - existing reusable parts
  - missing parts
  - inferred risks
  - recommended new modules

==================================================
OPTIONAL EXTRA OUTPUT
==================================================

If useful, also create:

docs/live-db-compare-feature-map.md

This compact file should contain:
- Feature
- Purpose
- Main files involved
- New files likely needed
- Risk level

==================================================
FINAL OUTPUT REQUIREMENTS
==================================================

At the end provide:
- document path(s) created
- concise summary of the proposed architecture
- top 5 implementation priorities
- top 5 high-risk areas
- what can be reused from the current system
- git status
- git log --oneline -n 20

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- a real design document is created
- the document clearly covers Live Database, Development, Compare, and Versions
- the design is grounded in the actual repository
- the design is careful about high-risk files
- the output is useful as a blueprint for implementation
