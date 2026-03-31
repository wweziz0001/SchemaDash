import React from 'react';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import type { DiagramWorkflowVersionSummary } from '@/lib/api/diagram-workflow-client';
import {
    formatVersionTimestamp,
    getVersionDisplayLabel,
    getVersionOriginLabel,
} from '@/lib/diagram-workflow/version-labels';

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
    <article className="space-y-4 rounded-xl border bg-card/60 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
                <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">
                        {getVersionOriginLabel(version.origin)}
                    </Badge>
                    <Badge variant="secondary">Immutable snapshot</Badge>
                    {active ? <Badge variant="secondary">Open</Badge> : null}
                    {compareBaseline ? (
                        <Badge variant="secondary">Compare Baseline</Badge>
                    ) : null}
                </div>
                <h3 className="pt-1 text-sm font-semibold">
                    {getVersionDisplayLabel(version)}
                </h3>
                <p className="text-xs text-muted-foreground">
                    {formatVersionTimestamp(version.createdAt)}
                    {version.createdBy
                        ? ` by ${version.createdBy.displayName}`
                        : ''}
                </p>
            </div>
            <Badge variant="outline">Read-only review</Badge>
        </div>

        {version.description ? (
            <p className="text-sm text-muted-foreground">
                {version.description}
            </p>
        ) : (
            <p className="text-sm text-muted-foreground">
                No version note was added for this snapshot.
            </p>
        )}

        <div className="flex flex-wrap gap-2">
            <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={onOpen}
            >
                Open read-only
            </Button>
            {onCompare ? (
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={onCompare}
                >
                    Compare to Development
                </Button>
            ) : null}
            {onRestore ? (
                <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-lg"
                    onClick={onRestore}
                >
                    Restore to Development
                </Button>
            ) : null}
        </div>
    </article>
);
