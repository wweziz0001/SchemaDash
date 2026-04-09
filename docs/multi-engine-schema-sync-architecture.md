# Multi-Engine Schema Sync Architecture

## 1. Executive Summary

SchemaDash already has a working PostgreSQL live schema sync MVP:

- saved connection management
- live schema import into the editor
- canonical baseline/target diffing
- migration SQL preview
- safe apply with destructive confirmations
- audit trail, execution logs, and drift detection

The MVP works because SchemaDash already has a meaningful canonical-schema pipeline. The problem is that nearly every layer in that pipeline still assumes PostgreSQL, including:

- shared schema-sync contracts
- frontend Development-to-canonical export
- backend introspection
- SQL rendering
- apply behavior

That is manageable for one engine, but it becomes dangerous once MySQL, MariaDB, and SQL Server are added. Without an explicit adapter architecture, SchemaDash would accumulate engine-specific conditionals in the shared core and eventually lose the fidelity that matters most:

- Development schema behavior
- canonical schema behavior
- migration preview behavior
- apply behavior

The goal of this architecture is to convert SchemaDash from "a PostgreSQL-oriented schema sync system" into "a multi-engine schema sync platform with a clean engine-agnostic core and engine-specific adapters."

The design priorities are:

1. Preserve preview/apply fidelity across engines.
2. Keep Development schema export aligned with live introspection semantics.
3. Make PostgreSQL the first adapter in a formal adapter system.
4. Add MySQL, MariaDB, and SQL Server incrementally without destabilizing existing workflows.

Related audit: [docs/audits/schema-sync-postgres-coupling-audit.md](/root/data/SchemaDash/docs/audits/schema-sync-postgres-coupling-audit.md)

## Implementation Status

Status on branch `sync/01-extract-postgres-first-schema-sync-adapter`:

- shared engine ids and capability types now exist in
  `packages/schema-sync-core/src/engines.ts`
- PostgreSQL now has a formal backend adapter implementation under
  `backend/src/engines/postgresql/`
- backend services now resolve adapters through
  `backend/src/engines/registry.ts` instead of importing PostgreSQL behavior
  directly
- apply preflight, statement grouping, connection testing, and live
  introspection now run through the PostgreSQL adapter path
- a lightweight frontend engine-definition seam now exists in
  `frontend/src/lib/schema-sync/engine-definitions.ts`

Important current limitations after this extraction:

- `packages/schema-sync-core/src/diff.ts` still contains PostgreSQL-shaped
  validation and warning language
- `packages/schema-sync-core/src/sql.ts` remains the legacy PostgreSQL SQL
  renderer, even though live preview/apply now consume it through the adapter
  wrapper
- `packages/schema-sync-core/src/type-normalization.ts` is still
  PostgreSQL-biased
- connection payloads in `packages/schema-sync-core/src/api.ts` remain
  PostgreSQL-shaped; this task intentionally avoided premature multi-engine
  connection DTO changes

This is an intentional intermediate state: PostgreSQL behavior stays stable for
production Live Schema Sync, while the runtime architecture now has an explicit
adapter seam for future engines.

## 2. Current State Audit

### What is already engine-agnostic

The repository already has several reusable platform pieces:

- `packages/schema-sync-core/src/compare.ts`
  - compare/review logic over canonical schemas
- `packages/schema-sync-core/src/diff.ts`
  - structural diffing and change-plan creation
- `packages/schema-sync-core/src/hash.ts`
  - canonical fingerprinting for drift detection
- `backend/src/services/schema-sync-service.ts`
  - orchestration around import + diff
- `backend/src/services/apply-service.ts`
  - orchestration around apply + audit
- `backend/src/services/diagram-migration-service.ts`
  - workflow-aware migration preview/validate/apply
- `backend/src/repositories/metadata-repository.ts`
  - persistence for connections, snapshots, plans, jobs, and audits

The architectural win to preserve is that the editor, backend, and metadata layers already revolve around canonical schemas and persisted plans rather than raw SQL pasted from the browser.

### What is implicitly PostgreSQL-specific

The following modules are framed as shared, but they encode PostgreSQL assumptions:

- `packages/schema-sync-core/src/types.ts`
  - `engine` only allows `postgresql`
  - custom type support is PostgreSQL-shaped
  - change kinds include PostgreSQL enum operations
- `packages/schema-sync-core/src/api.ts`
  - connection secret shape is PostgreSQL-only
  - connection payloads default to PostgreSQL
- `packages/schema-sync-core/src/type-normalization.ts`
  - normalization rules are PostgreSQL aliases
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
  - Development export/import always targets PostgreSQL
  - default schema assumptions use `public`
  - PostgreSQL naming and data-type rules are hard-coded

### What is strongly coupled to PostgreSQL

- `backend/src/postgres/introspection.ts`
  - direct PostgreSQL catalog introspection and connection testing
- `backend/src/services/connections-service.ts`
  - imports `testPostgresConnection`
- `backend/src/services/schema-sync-service.ts`
  - imports `introspectPostgresSchema`
- `backend/src/services/diagram-migration-service.ts`
  - imports `introspectPostgresSchema`
- `backend/src/services/apply-service.ts`
  - imports `introspectPostgresSchema`
  - uses `pg.Client` directly
  - classifies PostgreSQL non-transactional enum statements directly
- `packages/schema-sync-core/src/sql.ts`
  - renders PostgreSQL SQL only

### Where canonical schema boundaries already exist

Canonical boundaries already exist in the right places:

- live import path:
  - database -> backend introspection -> `CanonicalSchema`
- Development path:
  - editor diagram -> frontend canonical export -> `CanonicalSchema`
- planning path:
  - baseline canonical schema + target canonical schema -> `ChangePlan`
- safety path:
  - plan + baseline fingerprint + live re-introspection -> apply

These boundaries should be strengthened, not replaced.

### Where SQL generation, introspection, and apply are tied to PostgreSQL

- SQL generation:
  - `packages/schema-sync-core/src/sql.ts`
- introspection:
  - `backend/src/postgres/introspection.ts`
- connection behavior:
  - `backend/src/services/connections-service.ts`
- apply semantics:
  - `backend/src/services/apply-service.ts`

Those concerns should move behind explicit engine contracts.

## 3. Target Architecture Overview

### Design principle

The system should be split into:

- engine-agnostic orchestration and canonical planning
- engine-specific adapters for connectivity, introspection, rendering, validation, and execution semantics

### Proposed layers

#### A. Core schema sync orchestration layer

Owns the workflow that is shared across all engines:

- load connection metadata
- resolve the engine adapter
- import live schema
- store baseline/target snapshots
- create a plan
- persist preview artifacts
- validate destructive approval
- re-check drift
- execute the persisted engine execution plan
- write audits and apply jobs

This stays in backend services such as:

- `backend/src/services/schema-sync-service.ts`
- `backend/src/services/diagram-migration-service.ts`
- `backend/src/services/apply-service.ts`

but those services should depend on an adapter registry instead of PostgreSQL modules directly.

#### B. Canonical schema layer

Owns the cross-engine canonical representation used for:

- compare/review
- drift fingerprints
- change planning
- migration warnings
- audit snapshots

This remains in `packages/schema-sync-core/`, but it should be refactored into engine-neutral modules plus small engine-definition helpers.

#### C. Engine adapter interface layer

Owns the contract between orchestration and engine-specific behavior:

- engine-aware connection validation
- live introspection
- engine-specific canonical normalization rules
- capability reporting
- plan validation
- SQL rendering
- apply preflights
- transaction/execution policy

This should live in `backend/src/engines/`.

#### D. Introspection layer

Each adapter owns its database-specific catalog/query logic and returns canonical schema plus adapter metadata.

Examples:

- PostgreSQL: `pg_catalog`, enum/composite discovery
- MySQL/MariaDB: `information_schema`, auto-increment and charset/collation decisions
- SQL Server: `sys.*` catalogs, `identity`, `dbo`, default constraints

#### E. Migration planning layer

Planning should become a two-stage process:

1. shared structural planning
   - baseline canonical schema -> target canonical schema -> `MigrationOperation[]`
2. engine rendering and validation
   - operations + target engine capability rules -> rendered statements + preflights + warnings

The current `ChangePlan` concept should survive, but the shared core should stop pretending SQL generation is engine-neutral.

#### F. Apply / execution layer

Apply should remain orchestrated centrally, but execution semantics must come from the adapter:

- which statements are preview-only vs executable
- which preflights are required
- which statements must run outside transactions
- how drift should be checked
- whether batched execution is safe

#### G. Capability / support matrix layer

Each engine should publish a machine-readable capability profile:

- supported
- partially supported
- preview-only
- apply-blocked
- unsafe without manual confirmation

The UI, planner, and backend apply validation should all read from the same capability profile.

## 4. Adapter Interface Design

The design should use two related contracts.

### A. Shared engine definition

This is safe to use from frontend and backend because it contains no driver code.

Responsibilities:

- engine id and labels
- default namespace rules
- identifier casing/qualification rules
- static capability declarations
- canonical export/import helpers used by the editor
- engine-specific type normalization helpers used by compare/review display

Illustrative shape:

```ts
export interface SchemaEngineDefinition {
  id: DatabaseEngine;
  label: string;
  defaultNamespace: string;
  namespaceModel: 'schema' | 'database';
  capabilities: EngineCapabilities;
  canonicalMapping: {
    diagramToCanonical(input: DiagramToCanonicalInput): CanonicalSchema;
    canonicalToDiagram(input: CanonicalToDiagramInput): Diagram;
  };
  normalizeComparableType(typeName: string): string | null;
}
```

### B. Backend live adapter

This is the runtime adapter used by the backend services.

Responsibilities:

- validate/test connections
- introspect live schema
- enrich/normalize canonical metadata when needed
- expose capabilities
- validate a migration plan for the engine
- render SQL preview and execution policy
- classify destructive or blocked operations
- run engine-specific preflights

Illustrative shape:

```ts
export interface SchemaSyncAdapter {
  engine: DatabaseEngine;
  getCapabilities(): EngineCapabilities;
  testConnection(input: TestConnectionInput): Promise<TestConnectionResult>;
  introspectSchema(input: IntrospectionInput): Promise<IntrospectionResult>;
  validatePlan(input: ValidatePlanInput): PlanValidationResult;
  renderPlan(input: RenderPlanInput): RenderedExecutionPlan;
  classifyPlan(input: ClassifyPlanInput): AdapterWarning[];
  buildPreflightChecks(input: PreflightInput): PreflightCheck[];
  applyPlan?(input: ApplyPlanInput): Promise<ApplyResult>;
}
```

### Contract guidance

- `testConnection()` is adapter-owned because driver behavior and metadata discovery differ by engine.
- `introspectSchema()` must always return canonical schema plus adapter metadata.
- `validatePlan()` must not mutate plan state. It adds engine-specific warnings and blocks.
- `renderPlan()` must produce the exact statement groups that preview will show and apply will execute.
- `buildPreflightChecks()` is where engine-specific nullability or data-conversion checks belong.
- `applyPlan()` is optional because SchemaDash can keep shared apply orchestration if adapters provide execution policy plus preflights instead.

### Recommendation

Keep orchestration shared and do not let adapters fully own audit/job persistence. Let adapters own the engine semantics and let services own the control flow.

## 5. Canonical Model Strategy

The canonical model should remain shared across engines, but it should stop pretending every engine has the same physical features.

### Core rule

Canonical schema should represent the logical intent that compare/review/migration planning needs, while adapter metadata captures engine-specific physical details that cannot safely be generalized away.

### Recommended canonical modeling approach

#### Primary keys

- Keep primary keys as canonical logical constraints.
- Preserve column order.
- Add optional adapter metadata where clustered/nonclustered or storage behavior matters.

#### Unique constraints

- Keep as logical uniqueness constraints.
- Distinguish between:
  - true unique constraints
  - unique indexes represented as uniqueness guarantees
- Preserve enough source metadata so adapters can render the right physical form.

#### Indexes

- Keep canonical index definitions for compare/review and migration planning.
- Add optional metadata for engine-specific index options rather than forcing them into the common shape immediately.

#### Nullability

- Keep as a canonical boolean on columns.
- Engine-specific preflight requirements should not live on the column model itself.

#### Default values

- Store canonical default expression strings plus optional normalized/default metadata.
- Do not assume defaults are textually portable across engines.
- For fidelity, each adapter should normalize imported defaults and render exported defaults using engine-local rules.

#### Identity / auto increment / serial

- Replace PostgreSQL-shaped identity fields with an engine-neutral concept such as:
  - `generation.kind: 'identity' | 'auto_increment' | 'sequence' | 'none'`
  - plus adapter metadata for engine-specific rendering
- Do not model `serial` as a canonical engine-independent type.

#### Enum / custom types

- Move away from PostgreSQL-only custom type assumptions in the shared change model.
- Keep logical enum intent in canonical schema.
- Represent engine-specific backing strategy in adapter metadata:
  - PostgreSQL: native enum type
  - MySQL/MariaDB: native enum column type
  - SQL Server: likely check constraint or lookup table strategy in early phases

The shared planner should compare logical enum intent, but each adapter decides whether that intent is:

- natively supported
- partially supported
- preview-only
- blocked for apply

#### Foreign keys

- Keep canonical FK shape with:
  - local columns
  - referenced namespace/table/columns
  - update/delete actions
- Reference validation must be adapter-aware because uniqueness rules differ in detail by engine.

#### Schema / database naming differences

- Introduce a neutral concept such as `namespace`.
- Preserve `schemaName` in persisted canonical data for backward compatibility at first, but define it semantically as the engine namespace container.

Mapping examples:

- PostgreSQL: namespace = schema
- SQL Server: namespace = schema
- MySQL/MariaDB: namespace = database/catalog

This avoids forcing MySQL into fake schema semantics while limiting churn to the current model.

#### Views

- Keep `kind: 'view'` in canonical tables for compare/review and import.
- Phase 1 multi-engine rollout should treat views as:
  - importable
  - comparable
  - preview-blocked or limited for apply until engine support is explicit

### Important fidelity rule

Live introspection and Development export must produce the same canonical semantics for a given engine. That means the engine definition used by the frontend cannot drift from the adapter logic used by the backend.

## 6. Capability Matrix Design

### Capability model

Each engine should expose structured capabilities, not just a marketing list.

Recommended shape:

```ts
type CapabilitySupport = 'full' | 'partial' | 'preview_only' | 'unsupported';

interface EngineCapabilities {
  connection: {
    testConnection: CapabilitySupport;
    multipleNamespaces: CapabilitySupport;
  };
  introspection: {
    tables: CapabilitySupport;
    views: CapabilitySupport;
    enums: CapabilitySupport;
    customTypes: CapabilitySupport;
    checkConstraints: CapabilitySupport;
  };
  migration: {
    createTable: CapabilitySupport;
    dropTable: CapabilitySupport;
    renameTable: CapabilitySupport;
    moveNamespace: CapabilitySupport;
    addColumn: CapabilitySupport;
    dropColumn: CapabilitySupport;
    alterColumnType: CapabilitySupport;
    alterNullability: CapabilitySupport;
    alterDefault: CapabilitySupport;
    primaryKeys: CapabilitySupport;
    uniqueConstraints: CapabilitySupport;
    indexes: CapabilitySupport;
    foreignKeys: CapabilitySupport;
    enums: CapabilitySupport;
    views: CapabilitySupport;
  };
  apply: {
    transactionalDdl: CapabilitySupport;
    nonTransactionalOperationsPresent: boolean;
    destructiveApprovalRequired: boolean;
  };
}
```

### Why this matters

The same capability object should drive:

- planner blocking/warnings
- preview messaging
- apply validation
- UI support badges
- test expectations

### Example capability profiles

#### PostgreSQL

- `tables`, `indexes`, `foreignKeys`, `checkConstraints`: `full`
- `views`: `partial`
- `enums`: `partial`
  - additive enum changes may be supported, destructive enum changes blocked
- `customTypes`: `partial`
  - non-enum custom type automation remains blocked
- `transactionalDdl`: `partial`
  - some operations, like enum value additions, require special handling

#### MySQL

- `tables`, `indexes`, `foreignKeys`, `alterDefault`: `full`
- `checkConstraints`: `partial`
  - depends on server version and current product scope
- `moveNamespace`: `unsupported`
  - because namespace/database semantics differ from PostgreSQL schemas
- `enums`: `partial`
  - native enum columns exist, but not PostgreSQL-style shared enum types
- `transactionalDdl`: `partial` or `unsupported` depending on operation

#### MariaDB

- similar to MySQL but published separately
- capability profile should not be inferred from MySQL at runtime even if implementations share code paths
- `checkConstraints`, online alter behavior, and DDL semantics may diverge enough to justify separate capability values

#### SQL Server

- `tables`, `indexes`, `foreignKeys`, `views`: `full`
- `moveNamespace`: `partial`
  - schema transfer semantics are different from PostgreSQL
- `enums`: `unsupported`
  - early phases should likely model enum intent as preview-only or blocked
- `transactionalDdl`: `partial`
  - depends on operation and server behavior
- `default constraints`: `full`, but rendering and introspection semantics differ substantially

## 7. SQL Generation Strategy

### Core rule

Shared planning should decide *what changed*. Adapters should decide *how that change is rendered and executed for one engine*.

### What belongs in shared planning

- baseline vs target structural diff
- rename detection heuristics
- high-level migration operations
- generic risk concepts:
  - destructive drop
  - set-not-null needs validation
  - possible rename ambiguity
- summary counts
- canonical fingerprinting

### What belongs in engine renderers

- statement syntax
- quoting rules
- transactional grouping
- engine-specific ordering constraints
- preflight SQL
- engine-specific capability blocking
- default-expression rendering
- identity/auto-increment rendering
- enum/custom-type rendering

### Proposed plan structure

Instead of treating `sqlStatements: string[]` as the full plan, persist a richer rendered plan:

```ts
interface RenderedExecutionPlan {
  engine: DatabaseEngine;
  adapterVersion: string;
  operations: MigrationOperation[];
  statements: Array<{
    id: string;
    phase: 'preflight' | 'outside_transaction' | 'transactional' | 'postflight';
    sql: string;
  }>;
  preflightChecks: PreflightCheck[];
  warnings: AdapterWarning[];
}
```

### Preview/apply fidelity requirement

Preview and apply must use the same rendered execution plan.

Recommended rule:

- preview stores the exact rendered plan produced by the adapter
- apply re-checks drift and approval, then executes that stored rendered plan
- apply does not re-render SQL unless the plan is intentionally invalidated and regenerated

This preserves the current MVP strength and extends it across engines.

### Avoid leaking PostgreSQL syntax

The current `packages/schema-sync-core/src/sql.ts` should be replaced over time with:

- shared operation planning in core
- engine-local renderers in backend adapters

If frontend preview ever needs richer per-operation display, it should consume rendered plan metadata, not generate SQL itself.

## 8. Incremental Rollout Strategy

### Phase 1: Extract engine contracts and isolate PostgreSQL assumptions

Goals:

- define `DatabaseEngine` as more than PostgreSQL
- introduce engine registry and adapter contract
- move direct PostgreSQL calls behind adapter lookups
- split shared connection/canonical/plan types into clearer modules

Do not:

- change user-facing behavior
- add a second engine yet

### Phase 2: Move PostgreSQL into a first-class adapter

Goals:

- keep current PostgreSQL behavior identical
- move:
  - connection testing
  - introspection
  - SQL rendering
  - preflight logic
  - transaction policy
  into `backend/src/engines/postgresql/`
- keep PostgreSQL as the reference implementation for the new contract

Success criterion:

- preview/apply output for PostgreSQL stays unchanged or changes only intentionally with tests

### Phase 3: Add MySQL adapter

Goals:

- add connection schema and registry entry
- implement live introspection into canonical schema
- implement capability profile
- support compare/review and preview first
- only enable apply for the operation subset that passes fidelity checks

Recommendation:

- treat views and enum-like semantics conservatively in the first MySQL phase

### Phase 4: Add MariaDB adapter

Goals:

- reuse MySQL-compatible pieces where safe
- publish a separate capability profile
- keep MariaDB as its own adapter package even if it shares utility modules

### Phase 5: Add SQL Server adapter

Goals:

- introduce SQL Server namespace/default-constraint/identity semantics carefully
- support compare/review/import before broad apply coverage
- block operations whose preview/apply fidelity is not proven yet

### Phase 6: Add cross-engine regression suites

Goals:

- fixture-driven canonical fidelity tests
- preview/apply parity tests
- capability profile tests
- engine snapshot compatibility tests

## 9. Testing Strategy

### Engine-specific introspection tests

Each adapter should have fixture-backed tests that verify:

- live catalog rows are mapped to canonical schema correctly
- default namespace behavior is correct
- identity/auto-increment semantics are preserved
- constraints and index metadata are mapped consistently

### Canonical fidelity tests

These are the most important cross-layer tests:

- introspect live schema -> canonical
- canonical -> diagram
- diagram -> canonical
- compare fingerprints remain stable where no user-visible schema change occurred

For each supported engine, the round trip should prove that Development export and live import share the same semantics.

### Migration preview tests

For every engine:

- baseline canonical schema + target canonical schema -> operations
- operations + adapter renderer -> persisted rendered plan
- warnings and capability blocking are asserted explicitly

### Apply behavior tests

For every engine:

- apply uses the stored rendered preview plan
- destructive approval gates behave correctly
- drift rejection blocks stale plans
- engine-specific preflights run before execution
- audit and apply-job logs remain consistent

### Capability matrix tests

Add tests that assert the declared capability profile for each adapter. This avoids accidental silent support expansion or regression.

### Regression tests for mismatched semantics

Add named regression cases for:

- enum handling differences
- default-expression normalization mismatches
- namespace/schema naming drift
- identity vs auto-increment mismatches
- unique constraint vs unique index interpretation
- check constraint support differences

## 10. Risk / Coupling Analysis

### What should be avoided

- adding engine `switch` logic throughout existing shared files
- implementing MySQL or SQL Server directly inside current PostgreSQL modules
- letting frontend canonical export stay PostgreSQL-specific while backend adds more adapters
- re-rendering SQL at apply time instead of executing the stored preview rendering
- over-generalizing canonical schema too early and losing fidelity-critical metadata

### What should be isolated first

1. adapter registry and engine contract
2. PostgreSQL connection testing and introspection
3. PostgreSQL SQL rendering
4. PostgreSQL apply preflights and transaction policy
5. frontend canonical export/import engine definition seam

### Files/modules likely to need refactoring

- `packages/schema-sync-core/src/types.ts`
- `packages/schema-sync-core/src/api.ts`
- `packages/schema-sync-core/src/diff.ts`
- `packages/schema-sync-core/src/sql.ts`
- `packages/schema-sync-core/src/type-normalization.ts`
- `frontend/src/lib/schema-sync/canonical-adapters.ts`
- `backend/src/services/connections-service.ts`
- `backend/src/services/schema-sync-service.ts`
- `backend/src/services/diagram-migration-service.ts`
- `backend/src/services/apply-service.ts`
- `backend/src/postgres/introspection.ts`

### Where future adapter work could create correctness bugs

- default-expression normalization
- identity/auto-increment representation
- enum/custom-type semantics
- namespace/schema/database name mapping
- apply transaction behavior
- destructive warning classification
- FK uniqueness validation
- view handling

The most important bug class to avoid is preview/apply mismatch caused by different engine logic running at different phases.

## 11. Recommended File / Module Layout

The target layout should fit the current repo structure instead of inventing a new package topology.

### Shared package

Recommended direction inside `packages/schema-sync-core/src/`:

- `canonical/`
  - canonical schema types
  - shared normalization helpers that are truly engine-agnostic
- `engines/`
  - shared engine ids and static engine definitions
  - capability types
  - shared canonical mapping contracts
- `planning/`
  - migration operation types
  - structural diffing
  - shared warnings and summaries
- `compare/`
  - compare/review output types and logic
- `api/`
  - request/response schemas split by domain
- `legacy/`
  - optional temporary compatibility wrappers while current imports are migrated

### Backend

Recommended direction inside `backend/src/`:

- `engines/registry.ts`
  - resolves adapters by engine
- `engines/types.ts`
  - backend adapter contracts
- `engines/postgresql/`
  - `adapter.ts`
  - `connection.ts`
  - `introspection.ts`
  - `renderer.ts`
  - `preflights.ts`
  - `capabilities.ts`
- `engines/mysql/`
  - same shape as PostgreSQL adapter
- `engines/mariadb/`
  - same shape as MySQL, but separate adapter identity
- `engines/sqlserver/`
  - same shape with SQL Server semantics

### Frontend

Recommended direction inside `frontend/src/lib/schema-sync/`:

- `engine-definitions.ts`
  - shared engine definition lookup
- `canonical-mappers/`
  - `postgresql.ts`
  - `mysql.ts`
  - `mariadb.ts`
  - `sqlserver.ts`
- `index.ts`
  - engine-aware `diagramToCanonicalSchema()` and `canonicalSchemaToDiagram()` entrypoints

### Tests and fixtures

Recommended additions:

- `packages/schema-sync-core/src/__tests__/fixtures/`
  - engine-neutral planning fixtures
- `backend/test/engines/postgresql/`
- `backend/test/engines/mysql/`
- `backend/test/engines/mariadb/`
- `backend/test/engines/sqlserver/`
- `backend/test/fixtures/schema-sync/`
  - canonical snapshots and rendered plan fixtures

## 12. Recommended Next Step

After this document is approved, the first implementation step should be:

**Extract the engine contract and convert PostgreSQL into the first registered adapter without changing PostgreSQL user-visible behavior.**

Concretely, that means:

1. introduce `DatabaseEngine` and engine capability types that include PostgreSQL, MySQL, MariaDB, and SQL Server
2. add a backend adapter registry
3. move current PostgreSQL connection testing and introspection behind that registry
4. move PostgreSQL SQL rendering and apply preflight policy out of the shared core and behind the PostgreSQL adapter
5. add an engine-aware seam for frontend canonical export/import so Development schema export can stay aligned with live import semantics later

That step is the lowest-risk way to unlock future adapters while preserving the current MVP's preview/apply fidelity.
