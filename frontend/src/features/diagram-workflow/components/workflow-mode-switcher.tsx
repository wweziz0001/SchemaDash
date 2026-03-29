import React from 'react';
import { Button } from '@/components/button/button';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';

export const WorkflowModeSwitcher: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();

    if (!workflow?.diagramId) {
        return null;
    }

    return (
        <div className="flex items-center rounded-md border bg-background/80 p-1">
            <Button
                size="sm"
                variant={
                    workflow.activeMode === 'development'
                        ? 'secondary'
                        : 'ghost'
                }
                className="h-7 px-3 text-xs"
                onClick={() => workflow.setActiveMode('development')}
            >
                Development
            </Button>
            <Button
                size="sm"
                variant={workflow.activeMode === 'live' ? 'secondary' : 'ghost'}
                className="h-7 px-3 text-xs"
                onClick={() => workflow.setActiveMode('live')}
                disabled={!workflow.liveModeEnabled}
                title={
                    workflow.liveModeEnabled
                        ? 'Open the last synced live schema snapshot'
                        : 'Bind and sync a live database to enable this view'
                }
            >
                Live Database
            </Button>
            <Button
                size="sm"
                variant={
                    workflow.activeMode === 'compare' ? 'secondary' : 'ghost'
                }
                className="h-7 px-3 text-xs"
                onClick={() => workflow.setActiveMode('compare')}
                disabled={!workflow.compareModeEnabled}
                title={
                    workflow.compareModeEnabled
                        ? 'Inspect live database versus development in a read-only compare view'
                        : 'Sync a live database and load a development diagram to enable compare'
                }
            >
                Compare
            </Button>
        </div>
    );
};
