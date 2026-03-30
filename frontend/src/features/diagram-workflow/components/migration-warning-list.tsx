import React from 'react';
import { Badge } from '@/components/badge/badge';
import { cn } from '@/lib/utils';
import type { DiagramMigrationIssue } from '../api/diagram-migration-client';

const severityVariant = {
    info: 'outline',
    warning: 'secondary',
    blocking: 'destructive',
} as const;

const severitySurfaceClassName = {
    info: 'border-sky-200 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/20',
    warning:
        'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20',
    blocking: 'border-destructive/40 bg-destructive/5',
} as const;

export const MigrationWarningList: React.FC<{
    title: string;
    issues: DiagramMigrationIssue[];
}> = ({ title, issues }) => {
    if (issues.length === 0) {
        return (
            <div className="rounded-xl border border-dashed bg-muted/15 p-4">
                <div className="text-sm font-medium">{title}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                    No notes, warnings, or blocking issues were reported.
                </div>
            </div>
        );
    }

    const issueCounts = {
        info: issues.filter((issue) => issue.severity === 'info').length,
        warning: issues.filter((issue) => issue.severity === 'warning').length,
        blocking: issues.filter((issue) => issue.severity === 'blocking')
            .length,
    };

    return (
        <div className="rounded-xl border bg-card/60 p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-medium">{title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                        Review these findings before validating or applying the
                        current plan.
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {issueCounts.info > 0 ? (
                        <Badge variant="outline">Info {issueCounts.info}</Badge>
                    ) : null}
                    {issueCounts.warning > 0 ? (
                        <Badge variant="secondary">
                            Warnings {issueCounts.warning}
                        </Badge>
                    ) : null}
                    {issueCounts.blocking > 0 ? (
                        <Badge variant="destructive">
                            Blocking {issueCounts.blocking}
                        </Badge>
                    ) : null}
                </div>
            </div>
            <div className="mt-4 space-y-3">
                {issues.map((issue) => (
                    <div
                        key={`${issue.code}:${issue.title}`}
                        className={cn(
                            'rounded-xl border p-4 shadow-sm',
                            severitySurfaceClassName[issue.severity]
                        )}
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium">{issue.title}</div>
                            <Badge variant={severityVariant[issue.severity]}>
                                {issue.severity}
                            </Badge>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                            {issue.message}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
