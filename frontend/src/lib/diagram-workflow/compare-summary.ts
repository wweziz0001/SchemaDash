import type { CompareSchemaResult } from '@schemadash/schema-sync-core/compare-types';

export const getCompareDifferenceCount = (
    compareResult?: Pick<CompareSchemaResult, 'summary'> | null
) => {
    if (!compareResult) {
        return 0;
    }

    return (
        compareResult.summary.tables.total +
        compareResult.summary.fields.total +
        compareResult.summary.relationships.total
    );
};
