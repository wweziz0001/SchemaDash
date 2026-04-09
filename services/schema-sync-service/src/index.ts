import { buildSchemaSyncServiceApp } from './app.js';
import { schemaSyncServiceEnv } from './config/env.js';

const app = buildSchemaSyncServiceApp();

for (const warning of schemaSyncServiceEnv.runtimeWarnings ?? []) {
    app.log.warn(
        {
            event: 'config.warning',
        },
        warning
    );
}

app.log.info(
    {
        host: schemaSyncServiceEnv.host,
        port: schemaSyncServiceEnv.port,
        metadataDbPath: schemaSyncServiceEnv.metadataDbPath,
    },
    'Starting SchemaDash schema sync service'
);

app.listen({
    host: schemaSyncServiceEnv.host,
    port: schemaSyncServiceEnv.port,
}).catch((error) => {
    app.log.error(error);
    process.exit(1);
});
