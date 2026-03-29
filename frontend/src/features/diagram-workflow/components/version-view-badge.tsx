import React from 'react';
import { Badge } from '@/components/badge/badge';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import {
    formatVersionTimestamp,
    getVersionDisplayLabel,
} from '../lib/version-labels';

export const VersionViewBadge: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const version = workflow?.selectedVersion;

    if (workflow?.activeMode !== 'version' || !version) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1">
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
