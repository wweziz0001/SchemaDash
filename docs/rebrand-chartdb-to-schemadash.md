# SchemaDash to SchemaDash Rebrand Audit

This document tracks the repository-wide rename from `SchemaDash` to `SchemaDash` and classifies the affected areas by migration risk.

## Rename Classification

### User-facing branding: rename everywhere

- Application titles, headings, nav labels, dialogs, tooltips, and empty states
- Browser metadata, Open Graph metadata, Twitter metadata, and public image references
- README, CLA, self-hosting docs, auth docs, and other product-facing documentation
- Public site links, docs links, GitHub star widgets, and social references that currently point at `chartdb`

### Repository and package metadata: rename where safe

- Root package name `chartdb`
- Workspace package names `@chartdb/schema-sync-core` and `@chartdb/server`
- Docker, compose, and deployment-facing labels, volume names, and service-facing identifiers
- Repository links and image URLs embedded in documentation

### Internal technical identifiers: rename where practical

- Frontend context and hook modules under `src/context/schemadash-context/*` and `src/hooks/use-schemadash.ts`
- Internal symbol names such as `SchemaDashProvider`, `useSchemaDash`, `SCHEMADASH_BACKUP_FORMAT`, and branding helpers
- Runtime constants and host-name helpers tied to `chartdb.io`
- Generated asset names where the filename itself exposes the old product brand

### Compatibility-sensitive identifiers: migrate with aliases

- `SCHEMADASH_*` backend environment variables
- `VITE_HIDE_SCHEMADASH_CLOUD` and related runtime config keys
- Cookie names, local data directories, SQLite filenames, and backup envelope identifiers
- Public headers such as `x-schemadash-share-token`

## Planned Migration Strategy

1. Replace user-facing product branding with `SchemaDash`.
2. Rename safe workspace/package/module identifiers to `schemadash`.
3. Introduce `SCHEMADASH_*` environment variables as the preferred names and support legacy `SCHEMADASH_*` aliases during migration.
4. Update docs and deployment examples to prefer SchemaDash naming.
5. Rebuild generated outputs and validate tests after the rename.

## Known Risk Areas

- Self-hosted deployments may still export legacy `SCHEMADASH_*` variables.
- Persisted cookies, local data directories, and backup formats may need compatibility behavior to avoid breaking existing installs.
- Historical changelog entries contain old repository URLs and may require selective rewriting to keep links coherent after the rebrand.
- Tracked build output under `server/dist` should be regenerated after source changes instead of hand-editing compiled files.
