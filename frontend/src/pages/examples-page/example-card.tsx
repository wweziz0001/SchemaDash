import React, { useRef } from 'react';
import type { Example } from './examples-data/examples-data';
import { randomColor } from '@/lib/colors';
import { Import } from 'lucide-react';
import { Label } from '@/components/label/label';
import { Button } from '@/components/button/button';
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
import { Spinner } from '@/components/spinner/spinner';

export interface ExampleCardProps {
    example: Example;
    utilizeExample: () => void;
    loading: boolean;
}

export const ExampleCard: React.FC<ExampleCardProps> = ({
    example,
    utilizeExample,
    loading,
}) => {
    const { effectiveTheme } = useTheme();
    const color = useRef(randomColor());

    return (
        <div
            onClick={utilizeExample}
            className="group flex h-96 w-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-border/80 bg-card/90 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.4)] transition duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_26px_60px_-34px_rgba(8,47,73,0.35)]"
        >
            <div className="h-3" style={{ backgroundColor: color.current }} />
            <div className="flex h-14 items-center justify-between border-b border-border/70 bg-muted/30 px-4">
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger className="rounded-xl border border-border/70 bg-background/80 p-2 shadow-sm">
                            <img
                                src={
                                    databaseSecondaryLogoMap[
                                        example.diagram.databaseType
                                    ]
                                }
                                className="h-5 max-w-fit"
                                alt="database"
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            {
                                databaseTypeToLabelMap[
                                    example.diagram.databaseType
                                ]
                            }
                        </TooltipContent>
                    </Tooltip>
                    <Label className="cursor-pointer text-base font-bold tracking-tight">
                        {example.name}
                    </Label>
                </div>
                <div className="flex flex-row">
                    {loading ? (
                        <Spinner className="size-5" />
                    ) : (
                        <Button
                            variant="ghost"
                            className="size-10 rounded-xl p-0"
                        >
                            <Import className="size-5" />
                        </Button>
                    )}
                </div>
            </div>
            <div className="grow overflow-hidden border-b border-border/70 bg-background/80 p-2">
                <img
                    src={
                        effectiveTheme === 'dark'
                            ? example.imageDark
                            : example.image
                    }
                    alt={example.name}
                    className="size-full rounded-2xl object-cover transition duration-200 group-hover:scale-[1.01]"
                />
            </div>
            <div className="flex p-4 text-sm leading-6 text-muted-foreground">
                {example.description}
            </div>
        </div>
    );
};
