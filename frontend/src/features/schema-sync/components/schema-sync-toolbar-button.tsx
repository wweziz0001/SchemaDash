import React from 'react';
import { Button } from '@/components/button/button';
import { DatabaseZap } from 'lucide-react';
import { useSchemaSync } from '../hooks/use-schema-sync';

export const SchemaSyncToolbarButton: React.FC = () => {
    const { setOpen } = useSchemaSync();

    return (
        <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-xl px-3 text-xs font-semibold"
            onClick={() => setOpen(true)}
        >
            <DatabaseZap className="size-4" />
            Sync schema
        </Button>
    );
};
