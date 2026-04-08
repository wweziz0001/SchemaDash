import type { CompareSchemaResult } from '@schemadash/schema-sync-core/compare-types';

export const getCompareDifferenceCount = (
    compareResult?: Pick<CompareSchemaResult, 'summary'> | null
) => {
    if (!compareResult) {
        return 0;
    }

    return (
        compareResult.summary.tables.added +
        compareResult.summary.tables.changed +
        compareResult.summary.tables.removed +
        compareResult.summary.fields.added +
        compareResult.summary.fields.changed +
        compareResult.summary.fields.removed +
        compareResult.summary.relationships.added +
        compareResult.summary.relationships.changed +
        compareResult.summary.relationships.removed
    );
};
