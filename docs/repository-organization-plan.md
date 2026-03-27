# SchemaDash Repository Organization Plan

## Purpose

This document defines the target repository structure for the SchemaDash structural refactor. It is based on:

- an audit of the current SchemaDash repository
- an audit of ExcaliDash's repository organization patterns
- a low-risk goal of improving discoverability and architectural clarity without changing SchemaDash's product identity

## Current SchemaDash structure summary

Current major areas:

- frontend application code lives directly in the repository root through `src/`, `public/`, `index.html`, and frontend build/test configs
- backend code lives in `server/`
- shared schema-sync domain logic lives in `packages/schema-sync-core/`
- self-hosted and container support files live at the root beside frontend source assets
- docs are stored in one flat `docs/` directory

Main structure issues:

- the root mixes application runtime code, workspace orchestration, and deployment assets
- the frontend/backend split is conceptually present but not physically symmetrical
- deployment support files are not grouped by purpose
- docs are difficult to scan by category
- there is no obvious reserved home for future e2e coverage

## Relevant ExcaliDash structural lessons

The most useful organizational ideas from ExcaliDash are repository-level, not product-level:

- explicit top-level `frontend/` and `backend/` roots
- dedicated `e2e/` placement for end-to-end coverage
- dedicated OIDC/Keycloak placement for identity-related operational artifacts
- clear `scripts/` placement for helper and operational tooling
- strong repository-root operational discoverability via Compose files, `Makefile`, `RELEASE.md`, and `VERSION`
- development instructions that map directly to physical directories

SchemaDash should adopt the clarity of those patterns without copying ExcaliDash's application behavior.

## Proposed target folder tree

```text
.
├── .github/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── config/
│   │   ├── context/
│   │   ├── postgres/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── security/
│   │   ├── services/
│   │   └── utils/
│   └── test/
├── deploy/
│   └── nginx/
│       └── default.conf.template
├── docs/
│   ├── architecture/
│   ├── audits/
│   ├── auth/
│   ├── migration/
│   ├── operations/
│   ├── repository-organization-plan.md
│   └── repository-organization.md
├── frontend/
│   ├── components.json
│   ├── index.html
│   ├── postcss.config.js
│   ├── public/
│   ├── src/
│   ├── tailwind.config.js
│   ├── test/
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── vitest.config.ts
├── packages/
│   └── schema-sync-core/
├── scripts/
│   └── docker/
│       └── web-entrypoint.sh
├── tests/
│   └── e2e/
│       └── README.md
├── Dockerfile
├── Makefile
├── RELEASE.md
├── VERSION
├── docker-compose.yml
├── eslint.config.mjs
├── package.json
└── tsconfig.json
```

## Old-to-new path mapping

| Current path | Target path | Reason |
| --- | --- | --- |
| `src/` | `frontend/src/` | makes the frontend application explicit |
| `public/` | `frontend/public/` | keeps frontend assets with the frontend app |
| `index.html` | `frontend/index.html` | groups frontend runtime entry files |
| `components.json` | `frontend/components.json` | colocates frontend tooling config |
| `postcss.config.js` | `frontend/postcss.config.js` | colocates frontend build config |
| `tailwind.config.js` | `frontend/tailwind.config.js` | colocates frontend build config |
| `tsconfig.app.json` | `frontend/tsconfig.app.json` | colocates frontend TypeScript config |
| `tsconfig.node.json` | `frontend/tsconfig.node.json` | colocates frontend Vite/node config |
| `vite.config.ts` | `frontend/vite.config.ts` | colocates frontend bundler config |
| `vitest.config.ts` | `frontend/vitest.config.ts` | colocates frontend test config |
| `src/test/setup.ts` | `frontend/test/setup.ts` | gives frontend test harness an obvious home |
| `server/` | `backend/` | aligns physical naming with architecture language |
| `server/src/__tests__/` | `backend/test/` | improves backend test discoverability |
| `default.conf.template` | `deploy/nginx/default.conf.template` | groups deployment-specific nginx assets |
| `entrypoint.sh` | `scripts/docker/web-entrypoint.sh` | groups container helper scripts |
| flat auth docs in `docs/` | `docs/auth/` | improves auth/OIDC discoverability |
| flat operational docs in `docs/` | `docs/operations/` | improves self-hosted discoverability |
| flat architecture docs in `docs/` | `docs/architecture/` | groups implementation/reference docs |
| flat audit docs in `docs/` | `docs/audits/` | keeps historical audits together |
| `docs/rebrand-chartdb-to-schemadash.md` | `docs/migration/rebrand-chartdb-to-schemadash.md` | isolates migration history from active product docs |

## Rationale for each major move

### 1. Create an explicit `frontend/`

This is the largest discoverability gain with the least architectural risk. SchemaDash already behaves like a frontend workspace; it simply does not occupy a dedicated directory today.

### 2. Rename `server/` to `backend/`

This matches the repository's architecture language and aligns with the pattern that works well in ExcaliDash. It also makes the root read as a system map: frontend, backend, shared package, deployment, scripts, docs.

### 3. Keep `packages/schema-sync-core/` unchanged

This package already has a strong boundary and should remain a stable shared domain workspace. Moving it would add churn without improving clarity.

### 4. Move deployment support files into `deploy/` and `scripts/`

The root should still surface the main operator entry points such as `Dockerfile` and `docker-compose.yml`, but helper assets should be grouped by function.

### 5. Categorize docs

The existing doc set is valuable, but a flat folder makes it harder to find:

- auth and OIDC guidance
- self-hosting and operations guidance
- architecture/reference notes
- audit snapshots

### 6. Reserve a home for e2e coverage

SchemaDash does not need a large e2e suite to justify the folder. A small `tests/e2e/` area is enough to make the intended placement obvious for future work.

### 7. Add root-level process files

Adding `Makefile`, `RELEASE.md`, and `VERSION` improves operator and maintainer discoverability, echoing one of the strongest repository-level habits in ExcaliDash.

## Risks and compatibility considerations

### Build and workspace risks

- frontend config files moving under `frontend/` will require updated Vite, Vitest, TypeScript, Docker, and npm script paths
- renaming `server/` to `backend/` will require workspace and Docker path updates
- the lockfile may need regeneration because npm workspaces include the backend path

### Documentation and link risks

- README and docs currently link to flat `docs/` paths and root `src/` asset paths
- internal references will need to be updated after files move

### Test risks

- backend tests moved out of `src/` will require updated relative imports
- the frontend test setup path will need to be updated in Vitest config

### Churn controls

To keep this refactor low-risk:

- backend source module boundaries under `backend/src/` will stay mostly intact
- frontend feature/module internals will stay mostly intact
- the shared schema-sync package will remain where it is
- root `docker-compose.yml` and root `Dockerfile` will remain operator entry points

## Validation criteria before implementation

The implementation should satisfy all of the following:

- the new tree fits the current SchemaDash build and runtime model
- the refactor improves discoverability without forcing a monorepo redesign
- build, test, and Docker paths can be updated with limited, understandable churn
- the result borrows ExcaliDash's organization quality without making SchemaDash structurally imitate unrelated features
