import React from 'react';
import { Badge } from '@/components/badge/badge';
import { GitCompareArrows } from 'lucide-react';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import { getVersionDisplayLabel } from '../lib/version-labels';

const formatSummary = ({
    added,
    changed,
    removed,
}: {
    added: number;
    changed: number;
    removed: number;
}) => `+${added} ~${changed} -${removed}`;

export const CompareSummaryChip: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();

    if (
        workflow?.activeMode !== 'compare' ||
        !workflow.compareRenderModel?.compareResult
    ) {
        return null;
    }

    const { summary } = workflow.compareRenderModel.compareResult;
    const baselineLabel =
        workflow.compareSourceKind === 'version' && workflow.compareVersion
            ? `Baseline ${getVersionDisplayLabel(workflow.compareVersion)}`
            : 'Baseline Live Database';

    return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-sky-50/70 px-2 py-1 shadow-sm dark:bg-sky-950/30">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-900 dark:text-sky-100">
                <GitCompareArrows className="size-3" />
                Compare
            </span>
            <Badge variant="secondary" title="Compare mode summary">
                Read-only
            </Badge>
            <Badge variant="outline" title="Current compare baseline">
                {baselineLabel}
            </Badge>
            <Badge variant="outline" title="Table compare summary">
                Tables {formatSummary(summary.tables)}
            </Badge>
            <Badge variant="outline" title="Field compare summary">
                Fields {formatSummary(summary.fields)}
            </Badge>
            <Badge variant="outline" title="Relationship compare summary">
                Relationships {formatSummary(summary.relationships)}
            </Badge>
        </div>
    );
};
