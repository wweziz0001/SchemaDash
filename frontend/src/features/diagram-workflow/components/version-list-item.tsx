import React from 'react';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import type { DiagramWorkflowVersionSummary } from '../api/diagram-workflow-client';
import {
    formatVersionTimestamp,
    getVersionDisplayLabel,
    getVersionOriginLabel,
} from '../lib/version-labels';

export interface VersionListItemProps {
    version: DiagramWorkflowVersionSummary;
    active?: boolean;
    compareBaseline?: boolean;
    onOpen: () => void;
    onCompare?: () => void;
    onRestore?: () => void;
}

export const VersionListItem: React.FC<VersionListItemProps> = ({
    version,
    active = false,
    compareBaseline = false,
    onOpen,
    onCompare,
    onRestore,
}) => (
    <article className="space-y-3 rounded-lg border bg-background p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
                <h3 className="text-sm font-semibold">
                    {getVersionDisplayLabel(version)}
                </h3>
                <p className="text-xs text-muted-foreground">
                    {formatVersionTimestamp(version.createdAt)}
                    {version.createdBy
                        ? ` by ${version.createdBy.displayName}`
                        : ''}
                </p>
            </div>
            <div className="flex flex-wrap gap-1">
                <Badge variant="outline">
                    {getVersionOriginLabel(version.origin)}
                </Badge>
                {active ? <Badge variant="secondary">Open</Badge> : null}
                {compareBaseline ? (
                    <Badge variant="secondary">Compare Baseline</Badge>
                ) : null}
            </div>
        </div>

        {version.description ? (
            <p className="text-sm text-muted-foreground">
                {version.description}
            </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onOpen}>
                Open read-only
            </Button>
            {onCompare ? (
                <Button variant="outline" size="sm" onClick={onCompare}>
                    Compare to Development
                </Button>
            ) : null}
            {onRestore ? (
                <Button variant="destructive" size="sm" onClick={onRestore}>
                    Restore to Development
                </Button>
            ) : null}
        </div>
    </article>
);
