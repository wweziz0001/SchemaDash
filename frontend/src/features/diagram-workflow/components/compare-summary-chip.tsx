import React from 'react';
import { Badge } from '@/components/badge/badge';
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
        <div className="flex flex-wrap items-center gap-1">
            <Badge variant="secondary" title="Compare mode summary">
                Compare Review
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
