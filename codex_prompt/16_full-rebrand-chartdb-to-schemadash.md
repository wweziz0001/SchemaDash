You are Codex acting as a senior full-stack refactoring engineer, repository-wide rebranding specialist, and production-safe migration engineer.

TARGET REPOSITORY:
https://github.com/wweziz0001/SchemaDash

WORKING BRANCH:
feature/full-rebrand-chartdb-to-schemadash

PULL REQUEST TITLE:
Perform full product and repository rebrand from ChartDB to SchemaDash

==================================================
MISSION
==================================================

Perform a FULL rebrand of the repository, product, and application from "ChartDB" to "SchemaDash".

This is not only a user-facing branding task.
This is a repository-wide rebranding and naming migration task.

You must update the system comprehensively and consistently, including:
- product name in the UI
- browser/app metadata
- documentation
- package names where safe
- internal branding identifiers where appropriate
- Docker/Compose/service names where appropriate
- config and environment naming where appropriate
- tests and snapshots where needed
- repository-visible labels and descriptions

The final result should feel like the project was originally named SchemaDash, not ChartDB.

==================================================
PRIMARY GOAL
==================================================

Rename the project comprehensively from ChartDB to SchemaDash across the codebase, product surface, operational files, and documentation, while keeping the application buildable and stable.

==================================================
REBRANDING STRATEGY
==================================================

You must use a disciplined and classified rename strategy.

Classify every occurrence of "ChartDB" or closely related chartdb naming into these categories:

1. User-facing branding
Must be renamed to SchemaDash.

Examples:
- app title
- page headings
- sidebar branding
- login/register/auth text
- admin/settings/profile pages
- dialogs/modals
- empty states
- tooltips/help text
- browser tab title
- manifest/app name
- docs branding
- README product name

2. Repository/product metadata
Must be renamed where applicable.

Examples:
- package.json name if appropriate
- homepage description
- manifest values
- Docker labels
- Compose service display labels/comments
- README headers
- docs titles

3. Internal technical identifiers
Rename these where it is safe and where doing so improves consistency.

Examples:
- package names
- internal library names
- app constants
- branding helpers
- module names
- service names
- folder names
- import paths

4. Compatibility-sensitive identifiers
Rename only if safe.
If a rename would be very risky, either:
- implement a compatibility layer
- or keep it temporarily and document it clearly

Examples:
- environment variables
- persisted config keys
- database table names if any contain branding
- snapshot fixtures
- migration-sensitive identifiers
- public API routes if externally consumed

You must not do a blind unsafe replace.
But the goal is still a near-complete rename, not a partial one.

==================================================
WHAT MUST BE RENAMED
==================================================

At minimum, inspect and update all relevant occurrences across:

A. Frontend / UI
- all visible "ChartDB" text
- branding in navigation and headers
- page titles
- auth screens
- settings/profile/admin pages
- dialogs
- notifications
- empty states
- footer/help/about text

B. HTML / Metadata / App identity
- document title
- index.html title
- meta tags
- Open Graph / social metadata if present
- web manifest
- favicon/app-name labels if present
- app description strings

C. Repository files
- README.md
- docs/*
- contributing/setup docs
- deployment docs
- architecture docs
- screenshots references if text-based
- changelog/release docs if branding-facing

D. Package / Monorepo / Workspace metadata
- package.json name
- workspace package names
- monorepo package identifiers
- internal package descriptions
- scripts labels
- CLI/help text if any

E. Folder / file / module naming
Rename where appropriate and safe:
- folders named chartdb
- packages named chartdb
- modules with branding-specific names
- helper files/constants with branding names

You must update all import paths and references if such renames are performed.

F. Backend / Server / Services
- backend branding text
- service labels and descriptions
- logging prefixes if branding-facing
- health endpoint labels if branding-facing
- admin/help text

G. Docker / Compose / Deployment
- Docker labels
- service names where safe and desirable
- compose comments and descriptions
- deployment docs
- container/app display names

H. Environment / Config
- branding-facing env documentation
- app-name constants
- config comments/descriptions

If env vars include CHARTDB-like naming:
- prefer renaming them to SCHEMADASH where safe
- if compatibility matters, support both old and new env var names temporarily
- prefer new SchemaDash names in docs
- document compatibility aliases if you keep backward support

I. Tests
- test expectations
- snapshots
- branding assertions
- fixture names if branding-facing
- e2e text assertions

==================================================
SPECIAL REQUIREMENT: FULL RENAMING INTENT
==================================================

This task is intended to rebrand nearly everything practical.

So unlike a conservative branding task, you SHOULD:
- rename internal package names where reasonable
- rename folder names where reasonable
- rename branding-related internal constants
- rename workspace/package metadata
- rename service names where reasonable
- rename env var prefixes if safe or support aliases

The only things you should avoid renaming are the ones that would create unjustified breakage without a migration path.

If there is risk:
- add compatibility handling
- document it
- prefer the new SchemaDash naming going forward

==================================================
BACKWARD COMPATIBILITY REQUIREMENTS
==================================================

Where a full internal rename could break existing environments, do this:

1. If env vars currently use CHARTDB naming:
- introduce SCHEMADASH-prefixed equivalents
- support old CHARTDB-prefixed env vars temporarily if feasible
- prefer SCHEMADASH names in docs and examples
- add fallback compatibility in code where sensible

2. If package/import renames are risky:
- update imports consistently
- ensure workspace/build config still works

3. If service/container renames are risky for local setups:
- update docs clearly
- keep runtime stable

==================================================
SEARCH / REFACTOR DISCIPLINE
==================================================

Do not do an unsafe global replace and stop there.

You must:
1. audit all occurrences
2. classify them
3. rename them intentionally
4. update imports/config/tests/docs accordingly
5. verify build and runtime integrity

==================================================
BUILD / VALIDATION REQUIREMENTS
==================================================

After the rebrand you must verify:
- app builds successfully
- tests pass or are updated appropriately
- imports resolve
- package/workspace config is valid
- Docker/Compose config remains valid
- docs are consistent
- major UI areas show SchemaDash, not ChartDB

==================================================
MANDATORY COMMIT DISCIPLINE
==================================================

You must create real git commits while working.

Rules:
- Do not leave all changes uncommitted until the end.
- Do not provide only suggested commit messages.
- Do not squash everything into one giant commit.
- Commit after each major logical phase.

Required commit sequence:
1. chore: audit all chartdb naming references and classify rename scope
2. refactor: rename core branding constants package metadata and visible product text
3. refactor: rename internal modules paths packages and service identifiers to schemadash
4. refactor: add compatibility handling for renamed config or environment references
5. docs: update README docs and deployment guidance for SchemaDash
6. test: update tests snapshots and validate build integrity after rebrand

Before finishing, provide:
- git status
- git log --oneline -n 20
- a short explanation of each commit

The task is incomplete if:
- major areas still visibly show ChartDB
- package/workspace or module naming remains inconsistently branded without justification
- docs still describe the product as ChartDB
- commit discipline was not followed

==================================================
TESTING REQUIREMENTS
==================================================

You must update or verify:
- branding-related UI assertions
- snapshots if any
- app title checks if any
- package/build integrity
- docs consistency where practical

At minimum:
1. verify major screens show SchemaDash
2. verify browser/app title shows SchemaDash
3. verify imports/build still work after module/folder/package renames
4. verify new env/config naming works if changed

==================================================
DOCUMENTATION REQUIREMENTS
==================================================

Update documentation comprehensively so the repository reads as SchemaDash.

At minimum update:
- README
- docs/*
- setup instructions
- deployment docs
- architecture docs
- environment variable docs
- Docker/Compose notes
- auth/admin/sharing docs if present

If needed, add a migration note such as:
docs/rebrand-chartdb-to-schemadash.md

This document should explain:
- what was renamed
- any compatibility aliases
- any remaining historical/internal references if unavoidable

==================================================
FINAL DELIVERABLES
==================================================

You must provide:
1. actual repository-wide code changes
2. user-facing rebrand to SchemaDash
3. internal/package/module rebrand where reasonable
4. config/env compatibility handling if needed
5. updated tests
6. updated docs
7. final engineering summary including:
   - what was renamed
   - what compatibility support was added
   - what could not be renamed safely and why
   - actual commit list created

==================================================
EXECUTION RULES
==================================================

- Work only on this full rebrand task.
- Do not introduce unrelated features.
- Prefer comprehensive consistency.
- Prefer SchemaDash naming everywhere practical.
- Where risk exists, implement a safe migration path rather than avoiding the rename entirely.
- Do not stop at analysis.
- Implement the full rebrand directly in the repository.

Start now by:
1. auditing all chartdb/chartdb-like naming references
2. classifying them by risk and scope
3. performing the full SchemaDash rebrand
4. updating imports/config/docs/tests
5. validating build integrity
6. committing in logical phases

Treat this as a true repository rebrand, not just a UI rename.
Prefer renaming internal packages, modules, paths, service identifiers, and branding constants to SchemaDash wherever the risk is manageable.

If old CHARTDB-prefixed environment variables or config names already exist, support them temporarily as backward-compatibility aliases, but make SCHEMADASH the primary documented naming.

Git workflow is part of the acceptance criteria.

The task is NOT complete unless:
- real commits were created
- commits follow the required logical sequence
- work is not left as one uncommitted patch
- final output includes the actual commit list

If implementation is correct but commits are missing or badly grouped, the task is considered incomplete.
