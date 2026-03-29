import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import type { DiagramWorkflowVersionSummary } from '../api/diagram-workflow-client';
import {
    getRestoreVersionHeading,
    getRestoreWarningLines,
} from '../lib/restore-messages';

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
                <ul className="list-disc space-y-1 pl-4">
                    {warningLines.map((line) => (
                        <li key={line}>{line}</li>
                    ))}
                </ul>
            </AlertDescription>
        </Alert>
    );
};
