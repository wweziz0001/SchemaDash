import React from 'react';
import { Button } from '@/components/button/button';
import { cn } from '@/lib/utils';
import { Database, GitBranch, GitCompareArrows } from 'lucide-react';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';

export const WorkflowModeSwitcher: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();

    if (!workflow?.diagramId) {
        return null;
    }

    return (
        <div className="absolute right-1/3 z-10 flex -translate-x-1/2 items-center">
            <div
                data-orientation="vertical"
                role="none"
                className="mx-2 h-6 w-px shrink-0 bg-border"
            />
            <div className="flex h-fit max-h-7 items-center rounded-md border bg-muted/30 p-0">
                <Button
                    size="sm"
                    variant={
                        workflow.activeMode === 'live' ? 'secondary' : 'ghost'
                    }
                    className={cn(
                        'h-6 gap-1.5 rounded-none rounded-l-[5px] px-2.5 text-xs font-medium shadow-none',
                        workflow.activeMode === 'live'
                            ? 'bg-background text-foreground ring-1 ring-border'
                            : 'text-muted-foreground hover:text-accent-foreground'
                    )}
                    onClick={() => workflow.setActiveMode('live')}
                    disabled={!workflow.liveModeEnabled}
                    title={
                        workflow.liveModeEnabled
                            ? 'Open the last synced live schema snapshot'
                            : 'Bind and sync a live database to enable this view'
                    }
                >
                    <Database
                        className={cn(
                            'size-3.5',
                            workflow.activeMode === 'live'
                                ? 'text-teal-600 dark:text-teal-400'
                                : 'text-muted-foreground'
                        )}
                    />
                    <span>Live Database</span>
                </Button>
                <Button
                    size="sm"
                    variant={
                        workflow.activeMode === 'development'
                            ? 'secondary'
                            : 'ghost'
                    }
                    className={cn(
                        'h-6 gap-1.5 rounded-none rounded-r-[5px] px-2.5 text-xs font-medium shadow-none',
                        workflow.activeMode === 'development'
                            ? 'bg-background text-foreground ring-1 ring-border'
                            : 'text-muted-foreground hover:text-accent-foreground'
                    )}
                    onClick={() => workflow.setActiveMode('development')}
                >
                    <GitBranch
                        className={cn(
                            'size-3.5',
                            workflow.activeMode === 'development'
                                ? 'text-teal-600 dark:text-teal-400'
                                : 'text-muted-foreground'
                        )}
                    />
                    <span>Development</span>
                </Button>
            </div>
            <div
                data-orientation="vertical"
                role="none"
                className="mx-2 h-6 w-px shrink-0 bg-border"
            />
            <div className="flex items-center gap-0">
                <Button
                    size="sm"
                    variant={
                        workflow.activeMode === 'compare'
                            ? 'secondary'
                            : 'ghost'
                    }
                    className={cn(
                        'h-6 gap-1.5 rounded-lg px-2.5 text-xs font-medium shadow-none',
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
                    <GitCompareArrows
                        className={cn(
                            'size-3.5',
                            workflow.activeMode === 'compare'
                                ? 'text-teal-600 dark:text-teal-400'
                                : 'text-muted-foreground'
                        )}
                    />
                    <span>Compare</span>
                </Button>
            </div>
        </div>
    );
};
