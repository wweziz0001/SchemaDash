import React from 'react';
import { cn } from '@/lib/utils';

export interface SummaryListItem {
    key?: React.Key;
    label: React.ReactNode;
    value: React.ReactNode;
}

export interface SummaryListProps extends Omit<
    React.HTMLAttributes<HTMLDListElement>,
    'children'
> {
    items: SummaryListItem[];
    rowClassName?: string;
    labelClassName?: string;
    valueClassName?: string;
}

export const SummaryList: React.FC<SummaryListProps> = ({
    className,
    items,
    labelClassName,
    rowClassName,
    valueClassName,
    ...props
}) => (
    <dl className={cn('space-y-3', className)} {...props}>
        {items.map((item) => (
            <div
                key={item.key ?? String(item.label)}
                className={cn(
                    'flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-100/80 px-4 py-3 dark:border-stone-800 dark:bg-stone-950/60',
                    rowClassName
                )}
            >
                <dt className={cn('text-sm text-stone-500', labelClassName)}>
                    {item.label}
                </dt>
                <dd
                    className={cn(
                        'text-sm font-medium text-stone-950 dark:text-stone-100',
                        valueClassName
                    )}
                >
                    {item.value}
                </dd>
            </div>
        ))}
    </dl>
);
