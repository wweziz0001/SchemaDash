import React from 'react';
import { Badge } from '@/components/badge/badge';
import { History } from 'lucide-react';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import {
    formatVersionTimestamp,
    getVersionDisplayLabel,
} from '@/lib/diagram-workflow/version-labels';

export const VersionViewBadge: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const version = workflow?.selectedVersion;

    if (workflow?.activeMode !== 'version' || !version) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-amber-50/70 px-2 py-1 shadow-sm dark:bg-amber-950/30">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900 dark:text-amber-100">
                <History className="size-3" />
                Snapshot
            </span>
            <Badge variant="secondary">Immutable Snapshot</Badge>
            <Badge variant="outline">{getVersionDisplayLabel(version)}</Badge>
            <Badge variant="outline">
                {formatVersionTimestamp(version.createdAt)}
            </Badge>
            {version.createdBy ? (
                <Badge variant="outline">{version.createdBy.displayName}</Badge>
            ) : null}
        </div>
    );
};
