import React from 'react';
import type { DiagramWorkflowVersionSummary } from '@/lib/api/diagram-workflow-client';
import {
    getRestoreVersionHeading,
    getRestoreWarningLines,
} from '@/lib/diagram-workflow/restore-messages';
import { AlertTriangle, GitBranch, ShieldCheck } from 'lucide-react';

export interface RestoreWarningPanelProps {
    version: Pick<DiagramWorkflowVersionSummary, 'name' | 'versionLabel'>;
}

export const RestoreWarningPanel: React.FC<RestoreWarningPanelProps> = ({
    version,
}) => {
    const warningLines = getRestoreWarningLines(version);

    return (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 shadow-sm dark:border-rose-900 dark:bg-rose-950/25">
            <div className="flex flex-wrap items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                    <AlertTriangle className="size-5" />
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                    <div>
                        <div className="text-sm font-semibold text-foreground">
                            Revert Development to{' '}
                            {getRestoreVersionHeading(version)}
                        </div>
                        <p className="pt-1 text-sm text-muted-foreground">
                            This replaces the current Development diagram with a
                            copied snapshot while keeping the stored version
                            immutable.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white px-2.5 py-1 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
                            <GitBranch className="size-3.5" />
                            Development will be replaced
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                            <ShieldCheck className="size-3.5" />
                            Safety snapshot created first
                        </span>
                    </div>

                    <ul className="space-y-2">
                        {warningLines.map((line) => (
                            <li
                                key={line}
                                className="rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-sm text-foreground dark:border-white/5 dark:bg-white/5"
                            >
                                {line}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};
