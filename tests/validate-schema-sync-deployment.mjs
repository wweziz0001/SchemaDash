import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import yaml from 'js-yaml';

const compose = yaml.load(fs.readFileSync('docker-compose.yml', 'utf8'));
const serviceDockerfile = fs.readFileSync(
    'services/schema-sync-service/Dockerfile',
    'utf8'
);

assert.ok(
    compose.services['schema-sync-adapter'],
    'compose is missing schema-sync-adapter'
);
assert.ok(compose.services.api, 'compose is missing api');
assert.ok(
    Object.prototype.hasOwnProperty.call(
        compose.volumes,
        'schemadash-schema-sync-data'
    ),
    'compose is missing schemadash-schema-sync-data volume'
);

assert.equal(
    compose.services['schema-sync-adapter'].build.dockerfile,
    'services/schema-sync-service/Dockerfile',
    'schema-sync-adapter should build from the standalone service Dockerfile'
);
assert.deepEqual(
    compose.services['schema-sync-adapter'].profiles,
    ['schema-sync'],
    'schema-sync-adapter should remain behind the optional schema-sync profile'
);
assert.match(
    JSON.stringify(compose.services['schema-sync-adapter'].healthcheck),
    /4020\/readyz/,
    'schema-sync-adapter healthcheck should probe /readyz'
);
assert.equal(
    compose.services.api.environment.SCHEMADASH_SCHEMA_SYNC_ENABLED,
    '${SCHEMADASH_SCHEMA_SYNC_ENABLED:-false}',
    'api should default schema sync to disabled'
);
assert.equal(
    compose.services.api.environment.SCHEMADASH_SCHEMA_SYNC_SERVICE_URL,
    '${SCHEMADASH_SCHEMA_SYNC_SERVICE_URL:-http://schema-sync-adapter:4020}',
    'api should default to the internal compose hostname for the standalone service'
);
assert.match(
    JSON.stringify(compose.services.api.healthcheck),
    /api\/livez/,
    'api healthcheck should use /api/livez so unrelated features stay healthy'
);

assert.match(
    serviceDockerfile,
    /EXPOSE 4020/,
    'schema sync service Dockerfile should expose port 4020'
);
assert.match(
    serviceDockerfile,
    /SCHEMADASH_SCHEMA_SYNC_SERVICE_DATA_DIR=\/app\/data/,
    'schema sync service Dockerfile should set the persistent data dir'
);
assert.match(
    serviceDockerfile,
    /HEALTHCHECK[\s\S]*4020\/readyz/,
    'schema sync service Dockerfile should define a readiness-based healthcheck'
);

const tryCommand = (command, args) => {
    const result = spawnSync(command, args, {
        stdio: 'pipe',
        encoding: 'utf8',
    });

    if (result.error && result.error.code === 'ENOENT') {
        console.log(
            `Skipped ${command} ${args.join(
                ' '
            )} because ${command} is not installed in this environment.`
        );
        return;
    }

    if (result.status !== 0) {
        throw new Error(
            `${command} ${args.join(' ')} failed.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
        );
    }
};

tryCommand('docker', ['compose', 'config']);
tryCommand('docker', [
    'build',
    '-f',
    'services/schema-sync-service/Dockerfile',
    '-t',
    'schemadash-schema-sync-service:validation',
    '.',
]);

console.log('Schema sync deployment validation passed.');
