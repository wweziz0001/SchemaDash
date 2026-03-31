import React from 'react';
import { Card, CardContent } from '@/components/card/card';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/empty/empty';
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
            <CardContent className={cn('py-6', contentClassName)}>
                <Empty className="min-h-[17rem] border-none bg-transparent p-6">
                    <EmptyHeader className="max-w-xl">
                        {icon ? (
                            <EmptyMedia
                                variant="icon"
                                className="size-14 rounded-2xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-300"
                            >
                                {icon}
                            </EmptyMedia>
                        ) : null}
                        {title ? <EmptyTitle>{title}</EmptyTitle> : null}
                        {description ? (
                            <EmptyDescription>{description}</EmptyDescription>
                        ) : null}
                    </EmptyHeader>
                </Empty>
            </CardContent>
        </Card>
    );
};
