import React from 'react';
import { Checkbox } from '@/components/checkbox/checkbox';

export interface DashboardSettingOptionCardProps {
    checked: boolean;
    description: string;
    onCheckedChange: (checked: boolean) => void;
    title: string;
}

export const DashboardSettingOptionCard: React.FC<
    DashboardSettingOptionCardProps
> = ({ checked, description, onCheckedChange, title }) => (
    <label className="flex items-start gap-3 rounded-2xl border border-stone-200 p-4 dark:border-stone-700">
        <Checkbox
            checked={checked}
            onCheckedChange={(nextChecked) =>
                onCheckedChange(Boolean(nextChecked))
            }
        />
        <div className="space-y-1 text-sm">
            <div className="font-medium">{title}</div>
            <div className="text-stone-500">{description}</div>
        </div>
    </label>
);
