import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import { cn } from '@/lib/utils';

export interface DashboardFeedbackPanelProps {
    title?: string;
    description?: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    contentClassName?: string;
    state?: 'empty' | 'loading';
}

export const DashboardFeedbackPanel: React.FC<DashboardFeedbackPanelProps> = ({
    className,
    contentClassName,
    description,
    icon,
    state = 'empty',
    title,
}) => {
    if (state === 'loading') {
        return (
            <Card
                className={cn(
                    'border-dashed border-stone-200/80 bg-white/70 dark:border-stone-800/80 dark:bg-stone-900/70',
                    className
                )}
            >
                <CardContent
                    className={cn(
                        'py-16 text-center text-sm uppercase tracking-[0.24em] text-stone-400',
                        contentClassName
                    )}
                >
                    {title}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card
            className={cn(
                'border-dashed border-stone-200/80 bg-white/70 dark:border-stone-800/80 dark:bg-stone-900/70',
                className
            )}
        >
            <CardHeader className="sr-only">
                <CardTitle>{title}</CardTitle>
                {description ? (
                    <CardDescription>{description}</CardDescription>
                ) : null}
            </CardHeader>
            <CardContent
                className={cn(
                    'flex flex-col items-center justify-center gap-3 py-16 text-center',
                    contentClassName
                )}
            >
                {icon ? (
                    <div className="rounded-2xl bg-stone-100 p-4 dark:bg-stone-800">
                        {icon}
                    </div>
                ) : null}
                <div className="space-y-1">
                    {title ? (
                        <h2 className="text-xl font-semibold">{title}</h2>
                    ) : null}
                    {description ? (
                        <p className="max-w-xl text-sm leading-6 text-stone-500">
                            {description}
                        </p>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
};
