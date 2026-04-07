import React from 'react';
import { Badge } from '@/components/badge/badge';
import { History } from 'lucide-react';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import {
    formatVersionRelativeTime,
    formatVersionTimestamp,
    getVersionDisplayLabel,
} from '@/lib/diagram-workflow/version-labels';

export const VersionViewBadge: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const version =
        workflow?.activeMode === 'version'
            ? workflow.selectedVersion
            : workflow?.compareSourceKind === 'version'
              ? workflow.compareVersion
              : undefined;

    if (!version) {
        return null;
    }

    const stateLabel =
        workflow?.activeMode === 'compare' ? 'Diff Baseline' : 'Viewing';

    return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-pink-200 bg-pink-50/80 px-3 py-1.5 shadow-sm dark:border-pink-900 dark:bg-pink-950/25">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-pink-900 dark:text-pink-100">
                <History className="size-3" />
                Snapshot
            </span>
            <Badge className="border-pink-300 bg-pink-500 text-white hover:bg-pink-500 dark:border-pink-600">
                {stateLabel}
            </Badge>
            <Badge variant="secondary">Immutable</Badge>
            <Badge variant="outline">{getVersionDisplayLabel(version)}</Badge>
            <Badge variant="outline">
                {formatVersionRelativeTime(version.createdAt)}
            </Badge>
            {version.createdBy ? (
                <Badge variant="outline">{version.createdBy.displayName}</Badge>
            ) : null}
            <Badge
                variant="outline"
                title={formatVersionTimestamp(version.createdAt)}
            >
                Saved {formatVersionTimestamp(version.createdAt)}
            </Badge>
        </div>
    );
};
