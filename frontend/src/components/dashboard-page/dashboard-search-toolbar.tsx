import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/input/input';
import { cn } from '@/lib/utils';

export interface DashboardSearchToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    inputLabel: string;
    placeholder: string;
    className?: string;
    children?: React.ReactNode;
}

export const DashboardSearchToolbar: React.FC<DashboardSearchToolbarProps> = ({
    children,
    className,
    inputLabel,
    onSearchChange,
    placeholder,
    search,
}) => (
    <section
        className={cn(
            'rounded-[24px] border border-stone-200/80 bg-white/80 p-4 shadow-sm dark:border-stone-800/80 dark:bg-stone-900/80',
            className
        )}
    >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <Input
                    aria-label={inputLabel}
                    className="h-11 rounded-xl border-stone-200 bg-white pl-10 dark:border-stone-700 dark:bg-stone-950/70"
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder={placeholder}
                    value={search}
                />
            </div>
            {children}
        </div>
    </section>
);
