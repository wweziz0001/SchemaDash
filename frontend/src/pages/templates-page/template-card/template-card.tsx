import React from 'react';
import { randomColor } from '@/lib/colors';
import {
    databaseSecondaryLogoMap,
    databaseTypeToLabelMap,
} from '@/lib/databases';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useTheme } from '@/hooks/use-theme';
import type { Template } from '../../../templates-data/templates-data';
import { Badge } from '@/components/badge/badge';

export interface TemplateCardProps {
    template: Template;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template }) => {
    const { effectiveTheme } = useTheme();
    return (
        <a href={`/templates/${template.slug}`} className="block h-full">
            <div className="group flex h-80 w-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-border/80 bg-card/90 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.4)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_26px_60px_-34px_rgba(8,47,73,0.35)]">
                <div
                    className="h-2.5"
                    style={{ backgroundColor: randomColor() }}
                />
                <div className="overflow-hidden border-b border-border/70 bg-muted/30 p-2">
                    <img
                        src={
                            effectiveTheme === 'dark'
                                ? template.imageDark
                                : template.image
                        }
                        alt={template.name}
                        className="size-full rounded-2xl object-fill transition duration-200 group-hover:scale-[1.01]"
                    />
                </div>
                <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold tracking-tight text-foreground">
                                {template.name}
                            </h3>
                            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                                {template.shortDescription}
                            </p>
                        </div>
                        <div className="mt-1 flex h-full flex-col justify-start">
                            <Tooltip>
                                <TooltipTrigger className="rounded-xl border border-border/70 bg-background/80 p-2 shadow-sm">
                                    <img
                                        src={
                                            databaseSecondaryLogoMap[
                                                template.diagram.databaseType
                                            ]
                                        }
                                        className="h-5 max-w-fit"
                                        alt="database"
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    {
                                        databaseTypeToLabelMap[
                                            template.diagram.databaseType
                                        ]
                                    }
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {template.tags.map((tag) => (
                            <Badge
                                variant="outline"
                                key={`${template.slug}_${tag}`}
                                className="bg-background/80"
                            >
                                {tag}
                            </Badge>
                        ))}
                    </div>
                    <div className="mt-auto pt-4 text-sm font-medium text-primary">
                        Open template
                    </div>
                </div>
            </div>
        </a>
    );
};
