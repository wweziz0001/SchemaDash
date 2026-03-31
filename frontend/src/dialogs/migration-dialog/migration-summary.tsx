import React, { useMemo } from 'react';
import { Badge } from '@/components/badge/badge';
import { MetricCard } from '@/components/metric-card/metric-card';
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
                <MetricCard
                    label="Planned changes"
                    value={plan.summary.totalChanges}
                    detail="Canonical operations in the current migration plan."
                />
                <MetricCard
                    label="Warnings"
                    value={
                        plan.summary.warningChanges +
                        plan.summary.destructiveChanges
                    }
                    detail="Warning and destructive changes that deserve extra review."
                />
                <MetricCard
                    label="Blocking"
                    value={plan.summary.blockedChanges}
                    detail="Blocked changes that must be resolved before apply."
                />
                <MetricCard
                    label="SQL"
                    value={plan.sqlStatements.length}
                    detail="Generated statements in the current preview."
                />
            </div>

            <div className="rounded-xl border bg-card/60 p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-medium">
                        Planned action categories
                    </div>
                    <Badge variant="outline">
                        {changeKinds.length} categor
                        {changeKinds.length === 1 ? 'y' : 'ies'}
                    </Badge>
                </div>
                <div className="mb-3 text-sm text-muted-foreground">
                    Most frequent canonical change kinds in this preview.
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
