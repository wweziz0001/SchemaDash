# Repository Structure Audit

## ExcaliDash structural patterns worth borrowing

ExcaliDash is not organized as a feature clone target, but it does show several repository-level patterns that improve discoverability and operational clarity:

- The repository root communicates the system shape immediately with dedicated top-level `frontend/`, `backend/`, `e2e/`, `oidc/keycloak/`, and `scripts/` areas.
- Self-hosted operational files are easy to find from the root:
  - `docker-compose.yml`
  - `docker-compose.prod.yml`
  - `docker-compose.oidc.yml`
  - `Makefile`
  - `RELEASE.md`
  - `VERSION`
- OIDC and local Keycloak test assets are grouped under a dedicated `oidc/` area instead of being scattered across docs and source trees.
- Release and operator workflow files are treated as first-class repository artifacts instead of being buried in prose.
- Frontend and backend development instructions naturally map to physical folders, which reduces onboarding friction and guesswork.

## Current SchemaDash structure summary

SchemaDash already has meaningful boundaries, but they are harder to see than they should be:

- The backend is isolated in `server/`, while the frontend application lives directly in the repository root.
- Root-level frontend files (`src/`, `public/`, `index.html`, Vite config, Tailwind config, Vitest config) are mixed beside deployment files (`Dockerfile`, `docker-compose.yml`, `default.conf.template`, `entrypoint.sh`) and workspace management files.
- Shared schema-sync domain logic already has a good home in `packages/schema-sync-core/`.
- Documentation is stored in a single flat `docs/` directory, mixing architecture notes, audits, auth guides, and operational/self-hosted instructions.
- Tests are present, but their organization is only partly discoverable:
  - backend route and service tests live under `server/src/__tests__/`
  - frontend and domain tests are mostly colocated under many `__tests__` directories
  - the frontend test setup file lives in `src/test/setup.ts`
  - there is no obvious top-level location reserved for future `e2e` coverage

## Structural pain points in SchemaDash

### 1. Frontend and operational concerns are mixed in the root

The repository root currently contains:

- frontend runtime code
- frontend build config
- backend workspace config
- Docker and nginx assets
- docs
- shared packages

That makes the top level busier than necessary and weakens the immediate “what are the major system parts?” signal.

### 2. Backend naming does not match the repository’s architectural language

The repo and docs frequently describe a frontend/backend system, but the filesystem uses `server/`. That is functional, yet it weakens consistency when onboarding contributors.

### 3. Deployment support files are not grouped clearly

`default.conf.template` and `entrypoint.sh` are operational assets, but today they sit beside application source roots. They work, but their placement does not communicate that they are deployment-specific support files.

### 4. Documentation categories are hard to scan

Operational docs, auth docs, architecture notes, and audit records all live together in a single flat folder. Discoverability depends on reading filenames rather than on directory structure.

### 5. Test and future e2e locations are not obvious at the repository level

The current colocated unit test strategy is valid, but there is no clear top-level signal for:

- where backend integration-style tests live
- where frontend harness/setup lives
- where future end-to-end suites should be placed

## Audit conclusion

SchemaDash should keep its existing shared-package model and avoid a disruptive monorepo rewrite. The strongest structural improvement is to make the major application surfaces explicit:

- `frontend/` for the web app
- `backend/` for the API/runtime
- `packages/schema-sync-core/` for shared schema-sync domain logic
- clearer homes for deployment assets, scripts, and categorized docs

That direction borrows ExcaliDash’s repository clarity without copying its product structure.
