import React from 'react';
import { Badge } from '@/components/badge/badge';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useOptionalDiagramWorkflow } from '@/features/diagram-workflow/context/diagram-workflow-context';
import {
    formatVersionTimestamp,
    getVersionDisplayLabel,
} from '@/features/diagram-workflow/lib/version-labels';

const getModeLabel = (mode: string | undefined) => {
    if (mode === 'live') {
        return 'Live Database';
    }

    if (mode === 'compare') {
        return 'Compare';
    }

    if (mode === 'version') {
        return 'Version Review';
    }

    return 'Development';
};

export interface ChangelogTabProps {}

export const ChangelogTab: React.FC<ChangelogTabProps> = () => {
    const workflow = useOptionalDiagramWorkflow();
    const latestVersion = workflow?.versions[0];
    const currentVersion =
        workflow?.selectedVersion ?? workflow?.compareVersion ?? latestVersion;

    return (
        <div className="flex flex-1 flex-col overflow-hidden px-2 pb-2">
            <ScrollArea className="h-full">
                <div className="space-y-3 pb-2">
                    <section className="rounded-xl border bg-card/60 p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">Workflow layers</Badge>
                            <Badge variant="outline">
                                Active {getModeLabel(workflow?.activeMode)}
                            </Badge>
                        </div>
                        <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                            <p>
                                Development remains the mutable head where edits
                                happen first.
                            </p>
                            <p>
                                Compare is derived and read-only, while stored
                                versions remain immutable snapshots for review
                                and safe restore.
                            </p>
                            <p>
                                Restore always copies a stored version back into
                                Development without mutating the snapshot
                                itself.
                            </p>
                        </div>
                    </section>

                    <section className="rounded-xl border bg-card/60 p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">Current focus</Badge>
                            {workflow?.compareSourceKind === 'version' ? (
                                <Badge variant="outline">
                                    Compare baseline from snapshot
                                </Badge>
                            ) : null}
                        </div>
                        <div className="mt-3 space-y-2">
                            <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Snapshot in context
                                </div>
                                <div className="pt-1 text-sm font-medium">
                                    {currentVersion
                                        ? getVersionDisplayLabel(currentVersion)
                                        : 'No snapshot selected'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Access
                                </div>
                                <div className="pt-1 text-sm font-medium capitalize">
                                    {workflow?.workflow?.diagramAccess ??
                                        'Unavailable'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Latest capture
                                </div>
                                <div className="pt-1 text-sm font-medium">
                                    {latestVersion
                                        ? formatVersionTimestamp(
                                              latestVersion.createdAt
                                          )
                                        : 'No versions captured yet'}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border bg-muted/15 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                                {workflow?.versions.length ?? 0} stored version
                                {(workflow?.versions.length ?? 0) === 1
                                    ? ''
                                    : 's'}
                            </Badge>
                            {workflow?.workflow?.connectionName ? (
                                <Badge variant="outline">
                                    {workflow.workflow.connectionName}
                                </Badge>
                            ) : null}
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Use this section as the read-only reference surface
                            for snapshot history, while the main version list
                            tab stays optimized for filtering, opening,
                            comparing, and restoring.
                        </p>
                    </section>
                </div>
            </ScrollArea>
        </div>
    );
};
