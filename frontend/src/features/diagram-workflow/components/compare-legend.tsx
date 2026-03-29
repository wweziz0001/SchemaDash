import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import { SquareDot, SquareMinus, SquarePlus } from 'lucide-react';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';

const LegendRow: React.FC<{
    label: string;
    description: string;
    tone: 'added' | 'removed' | 'changed';
}> = ({ label, description, tone }) => (
    <div className="flex items-start gap-2 text-xs text-muted-foreground">
        {tone === 'added' ? (
            <SquarePlus className="mt-0.5 size-3.5 shrink-0 text-green-600" />
        ) : tone === 'removed' ? (
            <SquareMinus className="mt-0.5 size-3.5 shrink-0 text-red-600" />
        ) : (
            <SquareDot className="mt-0.5 size-3.5 shrink-0 text-sky-600" />
        )}
        <div className="min-w-0">
            <div className="font-medium text-foreground">{label}</div>
            <div>{description}</div>
        </div>
    </div>
);

export const CompareLegend: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();

    if (workflow?.activeMode !== 'compare') {
        return null;
    }

    return (
        <Card className="w-[280px] border bg-background/95 shadow-lg backdrop-blur">
            <CardHeader className="space-y-1 p-3 pb-2">
                <CardTitle className="text-sm">Compare Review</CardTitle>
                <p className="text-xs text-muted-foreground">
                    Read-only inspection of the live snapshot versus the current
                    development diagram.
                </p>
            </CardHeader>
            <CardContent className="space-y-3 p-3 pt-0">
                <LegendRow
                    label="Development-only"
                    description="Green highlight marks schema items that exist only in Development."
                    tone="added"
                />
                <LegendRow
                    label="Live-only"
                    description="Red highlight marks items that still exist only in the Live Database snapshot."
                    tone="removed"
                />
                <LegendRow
                    label="Changed"
                    description="Blue highlight marks matched entities whose properties differ between Live and Development."
                    tone="changed"
                />
            </CardContent>
        </Card>
    );
};
