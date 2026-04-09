import type { SchemaSyncAdapter } from '../types.js';
import { getPostgresqlCapabilities } from './capabilities.js';
import {
    testPostgresqlConnection,
    createPostgresqlClient,
} from './connection.js';
import { introspectPostgresqlSchema } from './introspection.js';
import { renderPostgresqlPlan } from './renderer.js';
import {
    splitPostgresqlStatements,
    validatePostgresqlApplyPreflight,
} from './apply.js';

export const postgresqlSchemaSyncAdapter: SchemaSyncAdapter = {
    engine: 'postgresql',
    getCapabilities: getPostgresqlCapabilities,
    testConnection: testPostgresqlConnection,
    introspectSchema: introspectPostgresqlSchema,
    renderPlan: renderPostgresqlPlan,
    createClient: createPostgresqlClient,
    splitStatements: splitPostgresqlStatements,
    validateApplyPreflight: validatePostgresqlApplyPreflight,
};
