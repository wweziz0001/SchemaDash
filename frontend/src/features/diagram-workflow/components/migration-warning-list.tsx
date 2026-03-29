import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import { Badge } from '@/components/badge/badge';
import type { DiagramMigrationIssue } from '../api/diagram-migration-client';

const severityVariant = {
    info: 'outline',
    warning: 'secondary',
    blocking: 'destructive',
} as const;

export const MigrationWarningList: React.FC<{
    title: string;
    issues: DiagramMigrationIssue[];
}> = ({ title, issues }) => {
    if (issues.length === 0) {
        return (
            <Alert>
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>
                    No notes, warnings, or blocking issues were reported.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-3">
            <div className="text-sm font-medium">{title}</div>
            {issues.map((issue) => (
                <Alert
                    key={`${issue.code}:${issue.title}`}
                    variant={
                        issue.severity === 'blocking'
                            ? 'destructive'
                            : 'default'
                    }
                >
                    <div className="flex items-center gap-2">
                        <AlertTitle>{issue.title}</AlertTitle>
                        <Badge variant={severityVariant[issue.severity]}>
                            {issue.severity}
                        </Badge>
                    </div>
                    <AlertDescription>{issue.message}</AlertDescription>
                </Alert>
            ))}
        </div>
    );
};
