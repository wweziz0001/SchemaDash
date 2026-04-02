import React from 'react';
import { Button } from '@/components/button/button';
import { DatabaseZap } from 'lucide-react';
import { useDialog } from '@/hooks/use-dialog';

export const SchemaSyncToolbarButton: React.FC = () => {
    const { openSchemaSyncDialog } = useDialog();

    return (
        <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-xs"
            onClick={() => openSchemaSyncDialog()}
        >
            <DatabaseZap className="size-4" />
            Schema Sync
        </Button>
    );
};
