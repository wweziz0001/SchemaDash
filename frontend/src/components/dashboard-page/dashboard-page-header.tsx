import React from 'react';
import { Badge } from '@/components/badge/badge';
import { cn } from '@/lib/utils';

export interface DashboardPageHeaderProps extends React.HTMLAttributes<HTMLElement> {
    title: string;
    description: React.ReactNode;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    icon?: React.ReactNode;
    contentClassName?: string;
}

export const DashboardPageHeader: React.FC<DashboardPageHeaderProps> = ({
    actions,
    badge,
    children,
    className,
    contentClassName,
    description,
    icon,
    title,
    ...props
}) => (
    <section
        className={cn(
            'rounded-[28px] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,245,244,0.92))] p-6 shadow-sm dark:border-stone-800/80 dark:bg-[linear-gradient(135deg,rgba(28,25,23,0.94),rgba(12,10,9,0.9))]',
            className
        )}
        {...props}
    >
        <div
            className={cn(
                'flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between',
                contentClassName
            )}
        >
            <div className="min-w-0 flex-1 space-y-3">
                {badge ? (
                    badge
                ) : icon ? (
                    <Badge
                        variant="outline"
                        className="w-fit border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                    >
                        {icon}
                    </Badge>
                ) : null}
                <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-stone-950 dark:text-stone-50 sm:text-4xl">
                        {title}
                    </h1>
                    <p className="max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-300 sm:text-base">
                        {description}
                    </p>
                </div>
                {children}
            </div>
            {actions ? (
                <div className="flex flex-col gap-3 md:flex-row">{actions}</div>
            ) : null}
        </div>
    </section>
);
