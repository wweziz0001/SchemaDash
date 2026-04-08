import React from 'react';
import type { DiagramWorkflowVersionSummary } from '@/lib/api/diagram-workflow-client';
import { getRestoreVersionHeading } from '@/lib/diagram-workflow/restore-messages';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export interface RestoreWarningPanelProps {
    version: Pick<DiagramWorkflowVersionSummary, 'name' | 'versionLabel'>;
}

export const RestoreWarningPanel: React.FC<RestoreWarningPanelProps> = ({
    version,
}) => {
    return (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm dark:border-rose-900 dark:bg-rose-950/20">
            <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                    <AlertTriangle className="size-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="text-sm font-semibold text-foreground">
                        Development will be replaced with{' '}
                        {getRestoreVersionHeading(version)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                        The saved version stays immutable, and SchemaDash
                        creates a safety snapshot of the current Development
                        state first.
                    </p>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                        <ShieldCheck className="size-3.5" />
                        Safety snapshot created automatically
                    </div>
                </div>
            </div>
        </section>
    );
};
