import React from 'react';
import { Badge } from '@/components/badge/badge';
import { GitBranch, GitCompareArrows, History } from 'lucide-react';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { getChangelogEntryTitle } from '@/lib/diagram-workflow/changelog-entry-format';
import { getVersionDisplayLabel } from '@/lib/diagram-workflow/version-labels';

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
        workflow.compareSourceKind === 'changelog' &&
        workflow.compareChangelogEntry
            ? getChangelogEntryTitle(workflow.compareChangelogEntry)
            : workflow.compareSourceKind === 'version' &&
                workflow.compareVersion
              ? getVersionDisplayLabel(workflow.compareVersion)
              : 'Live Database';
    const totalAdded =
        summary.tables.added +
        summary.fields.added +
        summary.relationships.added;
    const totalChanged =
        summary.tables.changed +
        summary.fields.changed +
        summary.relationships.changed;
    const totalRemoved =
        summary.tables.removed +
        summary.fields.removed +
        summary.relationships.removed;

    return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-sky-200 bg-sky-50/80 px-3 py-2 shadow-sm dark:border-sky-900 dark:bg-sky-950/25">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-900 dark:text-sky-100">
                <GitCompareArrows className="size-3" />
                Viewing Diffs
            </span>
            <Badge variant="secondary" title="Compare mode summary">
                Read-only
            </Badge>
            <Badge variant="outline" title="Current compare baseline">
                <History className="mr-1 size-3" />
                {baselineLabel}
            </Badge>
            <Badge variant="outline" title="Current compare target">
                <GitBranch className="mr-1 size-3" />
                Development
            </Badge>
            <Badge
                variant="outline"
                title="Added entities across tables, fields, and relationships"
            >
                Added {totalAdded}
            </Badge>
            <Badge
                variant="outline"
                title="Changed entities across tables, fields, and relationships"
            >
                Changed {totalChanged}
            </Badge>
            <Badge
                variant="outline"
                title="Removed entities across tables, fields, and relationships"
            >
                Removed {totalRemoved}
            </Badge>
        </div>
    );
};
