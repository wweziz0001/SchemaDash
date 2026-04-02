import React from 'react';
import { cn } from '@/lib/utils';

export interface MetricCardProps {
    label: React.ReactNode;
    value: React.ReactNode;
    detail?: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
    headerClassName?: string;
    labelClassName?: string;
    valueClassName?: string;
    detailClassName?: string;
    iconWrapperClassName?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    detail,
    className,
    icon,
    headerClassName,
    labelClassName,
    valueClassName,
    detailClassName,
    iconWrapperClassName,
}) => (
    <div
        className={cn(
            'rounded-xl border bg-background/80 p-4 shadow-sm',
            className
        )}
    >
        <div
            className={cn(
                'flex items-start justify-between gap-3',
                headerClassName
            )}
        >
            <div className="min-w-0">
                <div
                    className={cn(
                        'text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground',
                        labelClassName
                    )}
                >
                    {label}
                </div>
                <div
                    className={cn(
                        'mt-2 text-2xl font-semibold tracking-tight',
                        valueClassName
                    )}
                >
                    {value}
                </div>
            </div>
            {icon ? (
                <div
                    className={cn(
                        'rounded-full border border-stone-200 bg-stone-100 p-3 dark:border-stone-700 dark:bg-stone-950/80',
                        iconWrapperClassName
                    )}
                >
                    {icon}
                </div>
            ) : null}
        </div>
        {detail ? (
            <div
                className={cn(
                    'mt-2 text-xs leading-5 text-muted-foreground',
                    detailClassName
                )}
            >
                {detail}
            </div>
        ) : null}
    </div>
);
