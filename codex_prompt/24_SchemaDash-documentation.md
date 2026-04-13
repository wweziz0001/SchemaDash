You are Codex acting as a senior software architect and codebase analyst for SchemaDash.

TARGET REPOSITORY: https://github.com/wweziz0001/SchemaDash

WORKING BRANCH: SchemaDash-documentation

PULL REQUEST TITLE: generate a clear project-structure document

MISSION:
Analyze the current codebase and generate a clear project-structure document that explains:

1. the file/folder structure of the system
2. the major features/modules الموجودة في النظام
3. the files related to each feature
4. the relationship between frontend, backend, shared logic, config, and data models
5. the important entrypoints and core architectural flows

IMPORTANT:
This task is documentation and analysis first.
Do NOT start by refactoring the codebase.
Do NOT move files.
Do NOT rename files.
Do NOT change behavior unless a tiny change is absolutely required to complete the documentation accurately.
Focus on understanding and documenting the current system.

==================================================
REQUIRED OUTPUT
==================================================

Create a documentation file in the repository, for example one of these:
- SYSTEM_MAP.md
- CODEBASE_STRUCTURE.md
- FEATURE_FILE_MAP.md

The file must contain the following sections:

==================================================
1. PROJECT OVERVIEW
==================================================
- short explanation of what SchemaDash is
- high-level architecture summary
- key runtime parts of the system

==================================================
2. ROOT FOLDER STRUCTURE
==================================================
Document the main top-level folders and what each one is responsible for.

Example style:
- frontend/ → frontend application
- backend/ → backend services / APIs
- shared/ → shared types / utilities
- docs/ → internal documentation
- scripts/ → helper scripts
- deploy/ → deployment artifacts

For each important folder:
- explain purpose
- mention key subfolders
- mention important entry files

==================================================
3. FEATURE INVENTORY
==================================================
Identify the main features/modules currently present in the system.

Examples:
- authentication
- dashboard
- editor/canvas
- schema sync
- diagrams/projects
- sharing/collaboration
- settings/profile
- import/export
- templates/examples
- admin
- history/versions/changelog
- notifications/toasts
- design system / UI components

For each feature:
- provide a short description
- describe what it does
- note whether it is frontend-only, backend-only, or full-stack

==================================================
4. FEATURE → FILE MAP
==================================================
For every major feature, list the main related files and folders.

For each feature include:
- feature name
- purpose
- main frontend files
- main backend files
- shared/model/config files
- notes about dependencies on other features

The output should be readable and grouped, for example:

### Schema Sync
Purpose: handles schema synchronization and sync UI/workflows

Frontend:
- frontend/src/features/schema-sync/...
- frontend/src/dialogs/... if related
- frontend/src/pages/... if related

Backend:
- backend/src/... if related
- API routes/services/jobs used by sync

Shared / Config:
- shared types
- env/config files
- DB models
- migrations

Notes:
- depends on diagrams/projects
- depends on database connection settings
- depends on token/config state

==================================================
5. ENTRYPOINTS AND CORE FLOWS
==================================================
Document the key entrypoints such as:
- frontend app entry
- backend app entry
- routing entry
- global layout/root providers
- API registration points
- database initialization
- job/worker startup if present

Then describe major flows such as:
- app startup flow
- authentication flow
- opening a diagram flow
- schema sync flow
- import flow
- export flow

==================================================
6. SHARED UI / DESIGN SYSTEM MAP
==================================================
Document the reusable UI layer:
- buttons
- dialogs
- sidebar
- tabs
- cards
- inputs/selects
- empty states
- shared layout components

Explain where the shared UI primitives live and which features depend on them.

==================================================
7. CONFIGURATION MAP
==================================================
Document important config files and what they control:
- package.json
- tsconfig
- tailwind config
- postcss config
- vite/next config
- eslint config
- env files
- docker/deployment files

==================================================
8. RISK / COUPLING NOTES
==================================================
Add a section identifying:
- tightly coupled areas
- fragile areas
- features spread across too many files
- places where future refactoring should be careful
- places where UI/backend/config are strongly connected

==================================================
9. RECOMMENDED NEXT STEPS
==================================================
After the documentation, provide a short section with:
- what should be cleaned up later
- what should be left alone for now
- what areas are safe to modify
- what areas are high risk

==================================================
QUALITY RULES
==================================================

- Be concrete, not vague.
- Use real file paths from the repository.
- Do not hallucinate files that do not exist.
- Group related files intelligently.
- Prefer feature-based understanding, not only folder listing.
- Highlight cross-cutting concerns when relevant.
- Keep the document practical for future engineering work.

==================================================
OPTIONAL EXTRA
==================================================

If useful, also create an additional compact file such as:
- FEATURE_INDEX.md
or
- FILE_OWNERSHIP_MAP.md

This compact file should contain a shorter summary table of:
Feature | Purpose | Main Files | Notes

==================================================
SUCCESS CRITERIA
==================================================

The task is successful only if:
- the documentation file is created in the repository
- the major features are identified correctly
- the important files for each feature are mapped clearly
- the document is useful for future maintenance and refactoring
- no unnecessary code refactor was performed

Start by analyzing the repository structure and then generate the documentation file.

Git workflow is part of the acceptance criteria.

The task is NOT complete unless:

real commits were created
commits follow the required logical sequence
work is not left as one uncommitted patch
final output includes the actual commit list
If implementation is correct but commits are missing or badly grouped, the task is considered incomplete.
