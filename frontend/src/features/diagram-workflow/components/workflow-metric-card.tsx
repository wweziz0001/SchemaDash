import React from 'react';
import { cn } from '@/lib/utils';

export interface WorkflowMetricCardProps {
    label: string;
    value: React.ReactNode;
    detail?: React.ReactNode;
    className?: string;
}

export const WorkflowMetricCard: React.FC<WorkflowMetricCardProps> = ({
    label,
    value,
    detail,
    className,
}) => (
    <div
        className={cn(
            'rounded-xl border bg-background/80 p-4 shadow-sm',
            className
        )}
    >
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">
            {value}
        </div>
        {detail ? (
            <div className="mt-2 text-xs leading-5 text-muted-foreground">
                {detail}
            </div>
        ) : null}
    </div>
);
