import React from 'react';
import { Badge, type BadgeProps } from '@/components/badge/badge';
import { cn } from '@/lib/utils';

const toneClassNames = {
    neutral:
        'border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-800',
    info: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/10',
    success:
        'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/10',
    warning:
        'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/10',
    danger: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/10',
} as const;

export type StatusBadgeTone = keyof typeof toneClassNames;

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
    tone?: StatusBadgeTone;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    className,
    tone = 'neutral',
    ...props
}) => (
    <Badge
        variant="outline"
        className={cn(toneClassNames[tone], className)}
        {...props}
    />
);
