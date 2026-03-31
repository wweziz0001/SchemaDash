import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import type { DiagramWorkflowVersionSummary } from '@/lib/api/diagram-workflow-client';
import {
    getRestoreVersionHeading,
    getRestoreWarningLines,
} from '@/lib/diagram-workflow/restore-messages';

export interface RestoreWarningPanelProps {
    version: Pick<DiagramWorkflowVersionSummary, 'name' | 'versionLabel'>;
}

export const RestoreWarningPanel: React.FC<RestoreWarningPanelProps> = ({
    version,
}) => {
    const warningLines = getRestoreWarningLines(version);

    return (
        <Alert variant="destructive">
            <AlertTitle>
                Restore {getRestoreVersionHeading(version)} into Development
            </AlertTitle>
            <AlertDescription>
                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-destructive/40 px-2 py-0.5">
                        Stored snapshot remains immutable
                    </span>
                    <span className="rounded-full border border-destructive/40 px-2 py-0.5">
                        Development will be replaced
                    </span>
                </div>
                <ul className="list-disc space-y-1 pl-4">
                    {warningLines.map((line) => (
                        <li key={line}>{line}</li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
};
