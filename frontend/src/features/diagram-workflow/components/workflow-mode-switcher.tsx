import React from 'react';
import { Button } from '@/components/button/button';
import { cn } from '@/lib/utils';
import { Database, GitCompareArrows, PencilLine } from 'lucide-react';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';

export const WorkflowModeSwitcher: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();

    if (!workflow?.diagramId) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 rounded-xl border bg-muted/20 p-1 shadow-sm">
            <span className="hidden pl-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground xl:inline-flex">
                Workflow
            </span>
            <div className="flex items-center gap-1">
                <Button
                    size="sm"
                    variant={
                        workflow.activeMode === 'development'
                            ? 'secondary'
                            : 'ghost'
                    }
                    className={cn(
                        'h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium shadow-none',
                        workflow.activeMode === 'development'
                            ? 'bg-background text-foreground ring-1 ring-border'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => workflow.setActiveMode('development')}
                >
                    <PencilLine className="size-3.5" />
                    <span>Development</span>
                </Button>
                <Button
                    size="sm"
                    variant={
                        workflow.activeMode === 'live' ? 'secondary' : 'ghost'
                    }
                    className={cn(
                        'h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium shadow-none',
                        workflow.activeMode === 'live'
                            ? 'bg-background text-foreground ring-1 ring-border'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => workflow.setActiveMode('live')}
                    disabled={!workflow.liveModeEnabled}
                    title={
                        workflow.liveModeEnabled
                            ? 'Open the last synced live schema snapshot'
                            : 'Bind and sync a live database to enable this view'
                    }
                >
                    <Database className="size-3.5" />
                    <span>Live Database</span>
                </Button>
                <Button
                    size="sm"
                    variant={
                        workflow.activeMode === 'compare'
                            ? 'secondary'
                            : 'ghost'
                    }
                    className={cn(
                        'h-8 gap-1.5 rounded-lg px-2.5 text-xs font-medium shadow-none',
                        workflow.activeMode === 'compare'
                            ? 'bg-background text-foreground ring-1 ring-border'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => workflow.setActiveMode('compare')}
                    disabled={!workflow.compareModeEnabled}
                    title={
                        workflow.compareModeEnabled
                            ? 'Inspect live database versus development in a read-only compare view'
                            : 'Sync a live database and load a development diagram to enable compare'
                    }
                >
                    <GitCompareArrows className="size-3.5" />
                    <span>Compare</span>
                </Button>
            </div>
        </div>
    );
};
