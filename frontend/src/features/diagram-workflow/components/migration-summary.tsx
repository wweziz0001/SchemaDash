import React, { useMemo } from 'react';
import { Badge } from '@/components/badge/badge';
import type { ChangePlan, SchemaChange } from '@schemadash/schema-sync-core';

const summarizeKinds = (changes: SchemaChange[]) => {
    const labels = new Map<string, number>();
    for (const change of changes) {
        const label = change.kind
            .replace(/_/g, ' ')
            .replace(/^./, (value) => value.toUpperCase());
        labels.set(label, (labels.get(label) ?? 0) + 1);
    }

    return [...labels.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort(
            (left, right) =>
                right.count - left.count ||
                left.label.localeCompare(right.label)
        );
};

export const MigrationSummary: React.FC<{
    plan: ChangePlan;
}> = ({ plan }) => {
    const changeKinds = useMemo(
        () => summarizeKinds(plan.changes),
        [plan.changes]
    );

    return (
        <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">
                        Planned changes
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                        {plan.summary.totalChanges}
                    </div>
                </div>
                <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">
                        Warnings
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                        {plan.summary.warningChanges +
                            plan.summary.destructiveChanges}
                    </div>
                </div>
                <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">
                        Blocking
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                        {plan.summary.blockedChanges}
                    </div>
                </div>
                <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">SQL</div>
                    <div className="mt-2 text-2xl font-semibold">
                        {plan.sqlStatements.length}
                    </div>
                </div>
            </div>

            <div className="rounded-lg border p-4">
                <div className="mb-3 text-sm font-medium">
                    Planned action categories
                </div>
                <div className="flex flex-wrap gap-2">
                    {changeKinds.map((item) => (
                        <Badge key={item.label} variant="outline">
                            {item.label} {item.count}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
};
