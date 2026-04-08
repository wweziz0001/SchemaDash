import React from 'react';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import { cn } from '@/lib/utils';
import { GitBranch, Sparkles } from 'lucide-react';

export interface CurrentDevelopmentCardProps {
    active: boolean;
    latestCaptureLabel: string;
    description: string;
    onOpen: () => void;
}

export const CurrentDevelopmentCard: React.FC<CurrentDevelopmentCardProps> = ({
    active,
    latestCaptureLabel,
    description,
    onOpen,
}) => (
    <article
        className={cn(
            'rounded-3xl border shadow-sm transition-all',
            active
                ? 'border-emerald-300 bg-emerald-50/80 shadow-[0_0_0_1px_rgba(16,185,129,0.14)] dark:border-emerald-700 dark:bg-emerald-950/20'
                : 'border-border bg-card'
        )}
    >
        <div className="flex items-start gap-3 p-4">
            <div
                className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-background text-emerald-700 shadow-sm dark:text-emerald-300',
                    active &&
                        'border-emerald-300 bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40'
                )}
            >
                <GitBranch className="size-4" />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className="border-emerald-300 bg-emerald-500 text-white hover:bg-emerald-500 dark:border-emerald-600">
                        {active ? 'Current Development' : 'Mutable Head'}
                    </Badge>
                    <Badge variant="secondary">Editable</Badge>
                    <Badge variant="outline">Latest state</Badge>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <span>Current Development Version</span>
                        <Sparkles className="size-3.5 text-amber-500" />
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                        {description}
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                        Latest timeline capture {latestCaptureLabel}
                    </div>
                    <Button
                        size="sm"
                        variant={active ? 'secondary' : 'outline'}
                        className="rounded-xl px-3 text-xs font-semibold"
                        onClick={onOpen}
                    >
                        {active ? 'Viewing Development' : 'Open Development'}
                    </Button>
                </div>
            </div>
        </div>
    </article>
);
