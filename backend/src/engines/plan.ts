import type { CanonicalSchema, ChangePlan } from '@schemadash/schema-sync-core';
import { AppError } from '../utils/app-error.js';
import type { SchemaSyncAdapter } from './types.js';

export const renderChangePlanForAdapter = ({
    plan,
    targetSchema,
    adapter,
}: {
    plan: ChangePlan;
    targetSchema: CanonicalSchema;
    adapter: SchemaSyncAdapter;
}): ChangePlan => {
    if (targetSchema.engine !== adapter.engine) {
        throw new AppError(
            `Target schema engine ${targetSchema.engine} does not match adapter engine ${adapter.engine}.`,
            409,
            'schema_sync_engine_mismatch'
        );
    }

    return {
        ...plan,
        engine: adapter.engine,
        sqlStatements: adapter.renderPlan({
            changes: plan.changes,
            targetSchema,
        }),
    };
};
