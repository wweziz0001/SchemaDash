# SchemaDash Codebase Structure

## 1. Project Overview

SchemaDash is a web-based database diagram editor that has grown into a full-stack platform for diagram persistence, sharing, collaboration, optional authentication, and PostgreSQL schema synchronization. The frontend still owns the interactive canvas and import/export workflows, while the backend now owns durable persistence, access control, live collaboration session tracking, and operational schema-sync actions.

High-level architecture summary:

- `frontend/` is a Vite + React + Tailwind application that renders the dashboard, editor, shared viewers, dialogs, and admin surface.
- `backend/` is a Fastify API that manages auth, saved projects/diagrams, sharing, collaboration sessions, health endpoints, and PostgreSQL schema-sync operations.
- `packages/schema-sync-core/` is the shared contract layer for canonical schema types, diffing, risk classification, SQL generation, and API request/response schemas.
- `frontend/src/lib/domain/*` defines the browser-side diagram model, while `backend/src/schemas/persistence.ts` and the repository layer define persisted backend records and collaboration/session payloads.

Key runtime parts of the system:

- Browser app: route-driven React UI, local Dexie cache, canvas/editor state, dialogs, export/import tooling.
- API server: Fastify app with auth-aware middleware, route registration, SQLite-backed repositories, and PostgreSQL introspection/apply services.
- Shared schema-sync core: Zod-validated request contracts plus canonical diff and SQL plan logic reused by frontend and backend.
- Optional local infrastructure: Dockerized `web`, `api`, and `postgres` services via [`docker-compose.yml`](../docker-compose.yml).

## 2. Root Folder Structure

### Root

- `package.json` -> workspace root, shared development/build/test orchestration, and monorepo tooling.
- `tsconfig.json` -> TypeScript project references for the frontend app and node config.
- `.env.example` -> deployment and local development environment variables for frontend runtime, backend auth/persistence, and Docker ports.
- `docker-compose.yml` -> local full-stack deployment with `web`, `api`, and `postgres`.
- `README.md` -> product overview, setup instructions, and links to architecture/operations docs.

### `frontend/`

Purpose: main browser application.

Key subfolders:

- `frontend/src/components/` -> shared UI primitives and reusable composite widgets.
- `frontend/src/context/` -> cross-cutting React providers for storage, editor state, dialogs, history, theme, diff, layout, and keyboard shortcuts.
- `frontend/src/dialogs/` -> global dialog entrypoints for create/open/save/import/export/editor actions.
- `frontend/src/pages/` -> routed pages: dashboard, editor, shared viewers, admin, templates, examples.
- `frontend/src/lib/` -> domain models, import/export logic, DBML support, SQL tooling, utility helpers, and runtime env access.
- `frontend/src/assets/`, `frontend/public/`, `frontend/src/templates-data/` -> images, examples, and template data.
- `frontend/test/` -> frontend test support.
- `frontend/package.json` -> frontend-specific dependencies and scripts.
- `frontend/Dockerfile` -> production web image builder for the frontend bundle.
- `frontend/src/features/` does not exist anymore; former feature-owned code has been redistributed into the native folders above.

Important entry files:

- `frontend/src/main.tsx`
- `frontend/src/app.tsx`
- `frontend/src/router.tsx`
- `frontend/vite.config.ts`
- `frontend/tailwind.config.js`

### `backend/`

Purpose: API server, persistence, auth, sharing, collaboration, and schema-sync operations.

Key subfolders:

- `backend/src/routes/` -> Fastify route registration for auth, admin, health, persistence, and schema sync.
- `backend/src/services/` -> business logic for auth, persistence, connection management, apply orchestration, collaboration, and admin overview.
- `backend/src/repositories/` -> SQLite repositories for app data and schema-sync metadata.
- `backend/src/schemas/` -> Zod request/record schemas used by services and routes.
- `backend/src/config/` -> environment parsing and logger configuration.
- `backend/src/security/` -> encryption and request access guards.
- `backend/src/postgres/` -> PostgreSQL introspection and connection test logic.
- `backend/test/` -> backend tests.

Important entry files:

- `backend/src/index.ts`
- `backend/src/app.ts`
- `backend/src/context/app-context.ts`
- `backend/src/config/env.ts`

### `packages/schema-sync-core/`

Purpose: shared schema-sync engine and contracts consumed by both frontend and backend.

Key subfolders:

- `packages/schema-sync-core/src/types.ts` -> canonical schema and change-plan types.
- `packages/schema-sync-core/src/api.ts` -> request/response Zod schemas for connection, import, diff, apply, and audit endpoints.
- `packages/schema-sync-core/src/diff.ts`, `risk.ts`, `sql.ts`, `hash.ts` -> diffing, risk classification, SQL generation, and fingerprinting.
- `packages/schema-sync-core/src/__tests__/` -> core engine tests.

Important entry files:

- `packages/schema-sync-core/src/index.ts`
- `packages/schema-sync-core/package.json`

### `docs/`

Purpose: architecture, auth, operations, audits, and migration notes.

Key subfolders:

- `docs/architecture/` -> collaboration, schema-sync, backup, collections, and sharing architecture.
- `docs/auth/` -> optional auth and OIDC setup.
- `docs/operations/` -> self-hosting and admin docs.
- `docs/audits/` -> implementation audits and structure reviews.
- `docs/migration/` -> rebrand/migration notes.

### `deploy/`

Purpose: deployment-time web server configuration.

- `deploy/nginx/default.conf.template` -> nginx template used by the production web image.

### `scripts/`

Purpose: deployment helper scripts.

- `scripts/docker/web-entrypoint.sh` -> injects runtime env into the web container before nginx starts.

### `tests/`

Purpose: top-level integration/end-to-end tests.

- `tests/e2e/` -> end-to-end test coverage outside the frontend/backend package-local test suites.

### `.github/` and `.husky/`

- `.github/workflows/` -> CI and automation workflows.
- `.husky/pre-commit` -> local git hook entrypoint.

## 3. Feature Inventory

### Authentication and access control

- Description: optional password or OIDC authentication, bootstrap admin setup, session cookies, and role-gated API access.
- Scope: full-stack.

### Dashboard and library management

- Description: library-style landing experience for all diagrams, collections, unorganized projects, shared-with-me items, trash, profile, and settings.
- Scope: frontend-heavy with backend persistence.

### Diagram editor and canvas

- Description: main schema editing workspace, React Flow canvas, side panels, top navigation, history, filters, and diagram state management.
- Scope: frontend-only for rendering and editing, but depends on persistence for saved diagrams and collaboration state.

### Persistence: projects, diagrams, and collections

- Description: durable save/open/update/delete flows, collection grouping, project/diagram organization, and local-cache-to-backend synchronization.
- Scope: full-stack.

### Sharing and scoped access

- Description: project/diagram sharing settings, share tokens, authenticated sharing, read-only shared routes, and share-user lookup.
- Scope: full-stack.

### Real-time collaboration and presence

- Description: diagram edit sessions, heartbeats, server-sent events, presence tracking, participant metadata, and remote refresh handling.
- Scope: full-stack.

### Schema sync and safe apply

- Description: stored PostgreSQL connections, live schema import, canonical diff preview, SQL generation, risk warnings, apply jobs, audits, and baseline advancement.
- Scope: full-stack with a shared core package.

### Import/export and backup

- Description: SQL import, DBML import/export, metadata import, image export, diagram export/import, backup archive export/import, and AI-assisted cross-dialect SQL export.
- Scope: mostly frontend with backend backup endpoints.

### Templates and examples

- Description: template catalog, template cloning flow, and examples browsing.
- Scope: frontend-only.

### Admin and deployment operations

- Description: admin overview dashboard, health endpoints, deployment config, and Docker/nginx setup.
- Scope: full-stack.

### Shared UI/design system

- Description: reusable buttons, cards, dialogs, table primitives, sidebar pieces, form inputs, toasts, and utility components used throughout the app.
- Scope: frontend-only.

## 4. Feature -> File Map

### Authentication and access control

Purpose: authenticate users, bootstrap the first admin, protect backend routes, and expose frontend session state.

Frontend:

- `frontend/src/app.tsx`
- `frontend/src/lib/api/auth-client.ts`
- `frontend/src/context/auth-context/auth-provider.tsx`
- `frontend/src/context/auth-context/auth-context.ts`
- `frontend/src/hooks/use-auth.ts`
- `frontend/src/pages/bootstrap-page/bootstrap-page.tsx`
- `frontend/src/pages/sign-in-page/sign-in-page.tsx`

Backend:

- `backend/src/routes/auth-routes.ts`
- `backend/src/services/auth-service.ts`
- `backend/src/services/oidc-provider.ts`
- `backend/src/security/request-access.ts`
- `backend/src/schemas/auth.ts`

Shared / model / config:

- `backend/src/config/env.ts`
- `backend/src/repositories/app-repository.ts`
- `.env.example`

Notes:

- `frontend/src/app.tsx` blocks the routed app until auth session state is known.
- Route access for schema sync and admin features depends on `request.auth` created in `backend/src/app.ts`.

### Dashboard and library management

Purpose: provide the saved-project library shell and collection/project browsing experience.

Frontend:

- `frontend/src/router.tsx`
- `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
- `frontend/src/pages/dashboard-page/all-diagrams-page.tsx`
- `frontend/src/pages/dashboard-page/shared-with-me-page.tsx`
- `frontend/src/pages/dashboard-page/unorganized-page.tsx`
- `frontend/src/pages/dashboard-page/collections-page.tsx`
- `frontend/src/pages/dashboard-page/collection-detail-page.tsx`
- `frontend/src/pages/dashboard-page/trash-page.tsx`
- `frontend/src/pages/dashboard-page/profile-page.tsx`
- `frontend/src/pages/dashboard-page/settings-page.tsx`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`

Backend:

- `backend/src/routes/persistence-routes.ts`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`

Shared / model / config:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/lib/api/persistence-client.ts`
- `frontend/src/lib/persistence/persistence-types.ts`
- `backend/src/schemas/persistence.ts`

Notes:

- Dashboard pages rely on the storage abstraction instead of calling the API directly.
- Collections, projects, and diagrams are tightly linked through the app repository schema.

### Diagram editor and canvas

Purpose: render and edit diagrams, manage editor state, and coordinate canvas interactions and tool dialogs.

Frontend:

- `frontend/src/pages/editor-page/editor-page.tsx`
- `frontend/src/pages/editor-page/use-diagram-loader.tsx`
- `frontend/src/pages/editor-page/canvas/canvas.tsx`
- `frontend/src/pages/editor-page/editor-sidebar/editor-sidebar.tsx`
- `frontend/src/pages/editor-page/side-panel/side-panel.tsx`
- `frontend/src/pages/editor-page/top-navbar/top-navbar.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `frontend/src/context/canvas-context/canvas-provider.tsx`
- `frontend/src/context/history-context/history-provider.tsx`
- `frontend/src/context/history-context/redo-undo-stack-provider.tsx`
- `frontend/src/context/diagram-filter-context/diagram-filter-provider.tsx`
- `frontend/src/dialogs/create-relationship-dialog/create-relationship-dialog.tsx`
- `frontend/src/dialogs/table-schema-dialog/table-schema-dialog.tsx`

Backend:

- No editor rendering logic lives on the backend, but saved editor state is read/written through persistence routes and collaboration session endpoints.

Shared / model / config:

- `frontend/src/lib/domain/diagram.ts`
- `frontend/src/lib/domain/db-table.ts`
- `frontend/src/lib/domain/db-field.ts`
- `frontend/src/lib/domain/db-relationship.ts`
- `frontend/src/lib/domain/db-custom-type.ts`
- `frontend/src/lib/domain/note.ts`
- `frontend/src/lib/domain/area.ts`

Notes:

- Editor state is frontend-owned, but save/load and collaboration status come from the storage layer.
- `SchemaDashProvider` is the main editor orchestration boundary.

### Persistence: projects, diagrams, and collections

Purpose: save, open, update, delete, and cache persisted projects and diagrams while preserving a local-first editing experience.

Frontend:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/lib/api/persistence-client.ts`
- `frontend/src/lib/persistence/persistence-types.ts`
- `frontend/src/lib/persistence/diagram-serialization.ts`
- `frontend/src/dialogs/save-diagram-dialog/save-diagram-dialog.tsx`
- `frontend/src/dialogs/open-diagram-dialog/open-diagram-dialog.tsx`
- `frontend/src/pages/editor-page/use-diagram-loader.tsx`

Backend:

- `backend/src/routes/persistence-routes.ts`
- `backend/src/services/persistence-service.ts`
- `backend/src/services/persistence-search.ts`
- `backend/src/repositories/app-repository.ts`

Shared / model / config:

- `backend/src/schemas/persistence.ts`
- `frontend/src/lib/domain/config.ts`
- `frontend/src/context/config-context/config-provider.tsx`

Notes:

- `StorageProvider` bridges browser Dexie tables and backend persistence endpoints.
- Local browser storage still exists, but the backend becomes the durable source of truth when reachable.

### Sharing and scoped access

Purpose: expose project/diagram sharing controls, user-level access grants, and token-based shared routes.

Frontend:

- `frontend/src/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api.ts`
- `frontend/src/dialogs/open-diagram-dialog/sharing-settings-dialog.tsx`
- `frontend/src/pages/shared-project-page/shared-project-page.tsx`
- `frontend/src/pages/shared-project-page/shared-project-diagram-page.tsx`
- `frontend/src/pages/shared-project-page/shared-diagram-page.tsx`
- `frontend/src/pages/shared-project-page/shared-diagram-loader.tsx`
- `frontend/src/lib/persistence/share-token.ts`
- `frontend/src/lib/api/request.ts`

Backend:

- `backend/src/routes/persistence-routes.ts`
- `backend/src/services/persistence-service.ts`
- `backend/src/utils/request-share-token.ts`
- `backend/src/repositories/app-repository.ts`

Shared / model / config:

- `backend/src/schemas/persistence.ts`
- `frontend/src/lib/api/persistence-client.ts`
- `frontend/src/lib/persistence/persistence-types.ts`

Notes:

- Share-token access is threaded through request headers and specific `/api/shared/*` routes.
- Sharing is coupled to persistence, not a separate service boundary.

### Real-time collaboration and presence

Purpose: track active diagram sessions, publish collaboration events, and surface remote participants and live refresh state.

Frontend:

- `frontend/src/context/storage-context/storage-provider.tsx`
- `frontend/src/context/schemadash-context/schemadash-provider.tsx`
- `frontend/src/pages/editor-page/canvas/live-presence-cursors.tsx`
- `frontend/src/pages/editor-page/top-navbar/active-diagram-participants.tsx`

Backend:

- `backend/src/routes/persistence-routes.ts`
- `backend/src/services/diagram-collaboration-broker.ts`
- `backend/src/services/diagram-presence.ts`
- `backend/src/services/persistence-service.ts`
- `backend/src/repositories/app-repository.ts`

Shared / model / config:

- `backend/src/schemas/persistence.ts`
- `frontend/src/lib/api/persistence-client.ts`
- `frontend/src/lib/persistence/persistence-types.ts`
- `frontend/src/lib/persistence/collaboration-client-id.ts`

Notes:

- Collaboration uses persisted diagram sessions plus server-sent events, not CRDT/OT merging.
- Remote document refresh behavior is implemented in `SchemaDashProvider`, not in a separate collaboration feature folder.

### Schema sync and safe apply

Purpose: manage live PostgreSQL connections, import canonical schemas, preview diffs, classify risk, generate SQL, and apply approved plans.

Frontend:

- `frontend/src/lib/api/schema-sync-client.ts`
- `frontend/src/dialogs/schema-sync-dialog/schema-sync-dialog.tsx`
- `frontend/src/pages/editor-page/top-navbar/workflow/schema-sync-toolbar-button.tsx`
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
- `frontend/src/lib/domain/schema-sync.ts`

Backend:

- `backend/src/routes/schema-sync-routes.ts`
- `backend/src/services/connections-service.ts`
- `backend/src/services/schema-sync-service.ts`
- `backend/src/services/apply-service.ts`
- `backend/src/postgres/introspection.ts`
- `backend/src/repositories/metadata-repository.ts`
- `backend/src/security/encryption.ts`

Shared / model / config:

- `packages/schema-sync-core/src/api.ts`
- `packages/schema-sync-core/src/types.ts`
- `packages/schema-sync-core/src/diff.ts`
- `packages/schema-sync-core/src/risk.ts`
- `packages/schema-sync-core/src/sql.ts`
- `packages/schema-sync-core/src/hash.ts`

Notes:

- This is the clearest full-stack boundary in the repo: frontend diagram model <-> canonical adapters <-> shared schema-sync core <-> backend services.
- Operational access is admin-only when auth is enabled.

### Import/export and backup

Purpose: move schema data into and out of the editor through SQL, DBML, metadata, images, diagrams, and backup archives.

Frontend:

- `frontend/src/dialogs/import-database-dialog/import-database-dialog.tsx`
- `frontend/src/dialogs/import-diagram-dialog/import-diagram-dialog.tsx`
- `frontend/src/dialogs/export-diagram-dialog/export-diagram-dialog.tsx`
- `frontend/src/dialogs/export-image-dialog/export-image-dialog.tsx`
- `frontend/src/dialogs/export-sql-dialog/export-sql-dialog.tsx`
- `frontend/src/dialogs/export-backup-dialog/export-backup-dialog.tsx`
- `frontend/src/dialogs/import-backup-dialog/import-backup-dialog.tsx`
- `frontend/src/lib/data/import-metadata/*`
- `frontend/src/lib/data/sql-import/*`
- `frontend/src/lib/data/sql-export/*`
- `frontend/src/lib/dbml/dbml-import/*`
- `frontend/src/lib/dbml/dbml-export/*`
- `frontend/src/lib/dbml/apply-dbml/*`
- `frontend/src/lib/project-backup/project-backup-format.ts`

Backend:

- `backend/src/routes/persistence-routes.ts`
- `backend/src/services/persistence-service.ts`
- `backend/src/schemas/project-backup.ts`

Shared / model / config:

- `frontend/src/lib/import-method/*`
- `frontend/src/lib/data/default-schemas.ts`
- `frontend/src/lib/databases.ts`

Notes:

- Most import/export logic remains frontend-local.
- Backup import/export is the main place where backend persistence and transfer format are tightly coupled.

### Templates and examples

Purpose: expose ready-made diagrams and examples users can browse and clone.

Frontend:

- `frontend/src/router.tsx`
- `frontend/src/pages/templates-page/templates-page.tsx`
- `frontend/src/pages/template-page/template-page.tsx`
- `frontend/src/pages/clone-template-page/clone-template-page.tsx`
- `frontend/src/pages/examples-page/examples-page.tsx`
- `frontend/src/pages/examples-page/examples-data/examples-data.ts`
- `frontend/src/templates-data/templates-data.ts`
- `frontend/src/templates-data/template-utils.ts`
- `frontend/src/assets/templates/*`
- `frontend/src/assets/examples/*`

Backend:

- No backend implementation; templates/examples are frontend-delivered content.

Shared / model / config:

- `frontend/src/router.tsx` route loaders fetch and filter template data before page render.

Notes:

- These flows are isolated and relatively safe compared with persistence or schema sync.

### Admin and deployment operations

Purpose: expose a basic self-hosted admin overview and runtime health/deployment controls.

Frontend:

- `frontend/src/lib/api/admin-client.ts`
- `frontend/src/pages/admin-page/admin-route-guard.tsx`
- `frontend/src/pages/admin-page/admin-page.tsx`

Backend:

- `backend/src/routes/admin-routes.ts`
- `backend/src/routes/health-routes.ts`
- `backend/src/services/admin-service.ts`
- `backend/src/config/env.ts`
- `backend/src/config/logger.ts`

Shared / model / config:

- `.env.example`
- `docker-compose.yml`
- `Dockerfile`
- `backend/Dockerfile`
- `deploy/nginx/default.conf.template`
- `scripts/docker/web-entrypoint.sh`

Notes:

- Admin UI is small, but it depends on the auth and persistence layers being healthy.
- Health endpoints are also used by Docker health checks.

## 5. Entrypoints and Core Flows

### Key entrypoints

- Frontend app entry: `frontend/src/main.tsx`
- Frontend app shell: `frontend/src/app.tsx`
- Frontend routing entry: `frontend/src/router.tsx`
- Editor root/provider stack: `frontend/src/pages/editor-page/editor-page.tsx`
- Dashboard root/layout: `frontend/src/pages/dashboard-page/dashboard-shell-layout.tsx`
- Backend server entry: `backend/src/index.ts`
- Backend app builder: `backend/src/app.ts`
- Backend dependency assembly: `backend/src/context/app-context.ts`
- API registration points:
    - `backend/src/routes/auth-routes.ts`
    - `backend/src/routes/admin-routes.ts`
    - `backend/src/routes/health-routes.ts`
    - `backend/src/routes/persistence-routes.ts`
    - `backend/src/routes/schema-sync-routes.ts`
- Backend database initialization:
    - `backend/src/repositories/app-repository.ts`
    - `backend/src/repositories/metadata-repository.ts`
- Frontend API request wrapper: `frontend/src/lib/api/request.ts`
- Shared schema-sync package entry: `packages/schema-sync-core/src/index.ts`

### App startup flow

1. `frontend/src/main.tsx` loads polyfills, CSS, i18n, and renders `App`.
2. `frontend/src/app.tsx` wraps the app with `HelmetProvider`, `TooltipProvider`, and `AuthProvider`.
3. `AuthProvider` calls `GET /api/auth/session` through `authClient`.
4. If auth is required and the current route is not a shared route, `App` shows bootstrap or sign-in UI.
5. Otherwise, `RouterProvider` mounts routes from `frontend/src/router.tsx`.
6. Editor routes then create the larger provider stack in `frontend/src/pages/editor-page/editor-page.tsx`.

### Backend startup flow

1. `backend/src/index.ts` loads parsed env from `backend/src/config/env.ts`.
2. `buildApp()` in `backend/src/app.ts` creates the Fastify instance and app context.
3. `createAppContext()` wires repositories and services together.
4. Repositories initialize SQLite tables/migrations.
5. `onRequest` middleware authenticates the request and rejects protected routes when needed.
6. Route modules register feature endpoints.
7. `app.listen()` starts the API on the configured host/port.

### Authentication flow

1. Frontend calls `frontend/src/lib/api/auth-client.ts`.
2. Backend auth routes delegate to `backend/src/services/auth-service.ts`.
3. `AuthService` handles bootstrap, password login, OIDC redirect/callback, and cookie-backed session lookup.
4. `backend/src/security/request-access.ts` enforces authenticated/admin/operational access per route.
5. `frontend/src/app.tsx` and `frontend/src/pages/admin-page/admin-route-guard.tsx` consume the resulting session state.

### Opening a diagram flow

1. User lands on `/workspace` or `/diagrams/:diagramId`.
2. `frontend/src/pages/editor-page/use-diagram-loader.tsx` decides whether to load a specific diagram, open create/import/open dialogs, or redirect to the configured default diagram.
3. `SchemaDashProvider` loads and owns the in-memory diagram state.
4. `StorageProvider` supplies `loadDiagram`, local caching, and remote persistence lookup.
5. If the diagram is persisted, collaboration session state is also subscribed through the storage layer.

### Schema sync flow

1. The schema-sync dialog loads connection summaries through `schema-sync-client`.
2. Import: `POST /api/schema/import-live` returns a canonical schema and baseline snapshot id.
3. Frontend converts the canonical schema into the editor model with `frontend/src/lib/schema-sync/canonical-adapters.ts`.
4. Preview: current diagram is converted back into canonical form and sent to `POST /api/schema/diff`.
5. Backend uses `packages/schema-sync-core/` plus `SchemaSyncService` to produce a `ChangePlan`.
6. Apply: frontend submits the plan id plus destructive confirmation to `POST /api/schema/apply`.
7. `ApplyService` re-checks drift, runs preflight validation, executes SQL, and records audit/apply job state.

### Import flow

1. Import dialogs collect SQL, DBML, or metadata text.
2. Frontend parsers in `frontend/src/lib/data/sql-import/*`, `frontend/src/lib/dbml/dbml-import/*`, or `frontend/src/lib/data/import-metadata/*` convert that input into a `Diagram`.
3. `SchemaDashProvider` adds imported tables/relationships/custom types into the current editor session.

### Export flow

1. Export dialogs pull current diagram state from `SchemaDashProvider`.
2. SQL export uses `frontend/src/lib/data/sql-export/export-sql-script.ts`, with deterministic or AI-assisted generation depending on source/target dialect.
3. Image export uses `frontend/src/dialogs/export-image-dialog/export-image-dialog.tsx` plus export-image context/hooks.
4. Backup export/import uses `frontend/src/lib/api/persistence-client.ts` against `/api/backups/export` and `/api/backups/import`.

### Shared-viewer flow

1. User opens a `/shared/...` route from `frontend/src/router.tsx`.
2. Shared pages fetch data through `persistenceClient.getSharedProject`, `getSharedProjectDiagram`, or `getSharedDiagram`.
3. Share tokens are passed via route params and request headers.
4. Shared diagram pages mount `EditorPage` in read-only mode unless access is `edit`.

## 6. Shared UI / Design System Map

Shared UI primitives live in `frontend/src/components/`. The folder is organized by component type rather than by feature.

Primary reusable primitives:

- Buttons and links: `frontend/src/components/button/`, `frontend/src/components/link/`
- Dialogs and drawers: `frontend/src/components/dialog/`, `frontend/src/components/drawer/`, `frontend/src/components/sheet/`, `frontend/src/components/alert-dialog/`
- Sidebar and navigation: `frontend/src/components/sidebar/`, `frontend/src/components/menubar/`, `frontend/src/components/breadcrumb/`, `frontend/src/components/dropdown-menu/`
- Cards and display shells: `frontend/src/components/card/`, `frontend/src/components/badge/`, `frontend/src/components/empty/`, `frontend/src/components/empty-state/`, `frontend/src/components/skeleton/`
- Forms and selection: `frontend/src/components/input/`, `frontend/src/components/textarea/`, `frontend/src/components/checkbox/`, `frontend/src/components/select/`, `frontend/src/components/select-box/`, `frontend/src/components/combobox/`, `frontend/src/components/label/`
- Tables and structured data: `frontend/src/components/table/`, `frontend/src/components/pagination/`, `frontend/src/components/tree-view/`
- Overlay/help interactions: `frontend/src/components/tooltip/`, `frontend/src/components/popover/`, `frontend/src/components/hover-card/`, `frontend/src/components/context-menu/`
- Feedback: `frontend/src/components/toast/`, `frontend/src/components/spinner/`, `frontend/src/components/alert/`
- Editor-specific shared widgets: `frontend/src/components/diagram-icon/`, `frontend/src/components/code-snippet/`, `frontend/src/components/color-picker/`, `frontend/src/components/file-uploader/`, `frontend/src/components/resizable/`, `frontend/src/components/scroll-area/`

Feature dependencies:

- Dashboard and admin pages depend heavily on `button`, `card`, `table`, `badge`, `avatar`, and navigation primitives.
- Dialog flows reuse `components/dialog/*`, plus form controls and `toast`.
- Editor layouts reuse `resizable`, `scroll-area`, `tabs`, `tooltip`, and diagram-specific widgets.
- Sharing, auth, and schema-sync dialogs sit on top of the same primitive layer rather than owning separate UI frameworks.

## 7. Configuration Map

- `package.json` -> root scripts, workspaces, shared dependencies, frontend tooling, and top-level dev/test commands.
- `backend/package.json` -> backend-only build/dev/test scripts.
- `packages/schema-sync-core/package.json` -> shared core build/test package settings.
- `tsconfig.json` -> root project references.
- `frontend/tsconfig.app.json` -> browser TypeScript config and `@/*` alias.
- `frontend/tsconfig.node.json` -> Vite/node config typing.
- `backend/tsconfig.json` -> backend TypeScript compilation to `backend/dist`.
- `frontend/vite.config.ts` -> Vite root, React plugin, aliasing, preload injection, build asset rules, and `/api` proxy.
- `frontend/tailwind.config.js` -> Tailwind scanning, tokens, typography, colors, and animations.
- `frontend/postcss.config.js` -> Tailwind and Autoprefixer.
- `eslint.config.mjs` -> flat ESLint config for React, TypeScript, hooks, Tailwind, CSS modules, accessibility, and Prettier.
- `.env.example` -> canonical list of supported env vars.
- `backend/src/config/env.ts` -> actual backend env parsing, defaults, legacy alias support, and data directory resolution.
- `frontend/src/lib/env.ts` -> frontend runtime env access for API base URL, cloud visibility, analytics, and AI export config.
- `docker-compose.yml` -> local stack topology and health checks.
- `Dockerfile` -> frontend production image build.
- `backend/Dockerfile` -> backend production image build.
- `deploy/nginx/default.conf.template` -> nginx reverse-proxy/static hosting template.
- `scripts/docker/web-entrypoint.sh` -> runtime web env injection.

## 8. Risk / Coupling Notes

- `frontend/src/context/storage-context/storage-provider.tsx` is a high-coupling file. It mixes local Dexie schema, remote persistence sync, sharing-aware fetches, collaboration session lifecycle, and cached entity conversion.
- `frontend/src/context/schemadash-context/schemadash-provider.tsx` is another large orchestration point. It owns editor state, storage coordination, remote refresh handling, access mode, and collaboration reactions.
- `backend/src/services/persistence-service.ts` is a broad service boundary covering bootstrap, collections, projects, diagrams, sharing, sessions, collaboration, and backup import/export. Future refactors should split carefully.
- Schema sync is intentionally split across three layers: frontend adapters, shared core package, and backend services. Changes to canonical schema types ripple across all three.
- Sharing and collaboration are spread through routes, persistence service logic, request-share-token utilities, storage provider behavior, and shared pages. Access bugs are likely to be cross-cutting.
- The repository still carries legacy `ChartDB` compatibility paths in env parsing and request headers, which increases mental overhead for configuration work.
- Some docs appear stale relative to the current filesystem. Example: `README.md` links to `docs/repository-organization.md`, but that file is not present in the repository at the time of this analysis.
- Auth mode strongly changes runtime behavior: route protection, admin visibility, operational schema-sync access, and session cookie handling all depend on `SCHEMADASH_AUTH_MODE`.
- The frontend import/export stack is distributed across dialogs, lib parsers, DBML tooling, SQL tooling, and editor state updates rather than a single feature boundary.

## 9. Recommended Next Steps

- Clean up later:
    - Split `StorageProvider`, `SchemaDashProvider`, and `PersistenceService` into narrower modules.
    - Consolidate stale or overlapping architecture docs so README links match real files.
    - Separate collaboration concerns from generic persistence where possible.

- Leave alone for now:
    - `packages/schema-sync-core/` boundaries are useful and should stay shared.
    - Backend route registration in `backend/src/app.ts` is clear and stable.
    - The route/page split in `frontend/src/router.tsx` is understandable and already lazy-loaded.

- Safe areas to modify:
    - Templates/examples pages and data files.
    - Admin page presentation.
    - Shared UI primitives when changes are small and tested.
    - New docs under `docs/`.

- High-risk areas:
    - `frontend/src/context/storage-context/storage-provider.tsx`
    - `frontend/src/context/schemadash-context/schemadash-provider.tsx`
    - `backend/src/services/persistence-service.ts`
    - `backend/src/repositories/app-repository.ts`
    - `backend/src/repositories/metadata-repository.ts`
    - `frontend/src/lib/schema-sync/canonical-adapters.ts`
    - `packages/schema-sync-core/src/types.ts`
