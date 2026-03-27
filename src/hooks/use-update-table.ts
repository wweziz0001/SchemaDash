import { useCallback, useState, useEffect } from 'react';
import { useSchemaDash } from './use-schemadash';
import { useDebounce } from './use-debounce-v2';
import type { DBTable } from '@/lib/domain';

// Hook for updating table properties with debouncing for performance
export const useUpdateTable = (table: DBTable) => {
    const { updateTable: schemaDashUpdateTable } = useSchemaDash();
    const [localTableName, setLocalTableName] = useState(table.name);

    // Debounced update function
    const debouncedUpdate = useDebounce(
        useCallback(
            (value: string) => {
                if (value.trim() && value.trim() !== table.name) {
                    schemaDashUpdateTable(table.id, { name: value.trim() });
                }
            },
            [schemaDashUpdateTable, table.id, table.name]
        ),
        1000 // 1000ms debounce
    );

    // Update local state immediately for responsive UI
    const handleTableNameChange = useCallback(
        (value: string) => {
            setLocalTableName(value);
            debouncedUpdate(value);
        },
        [debouncedUpdate]
    );

    // Update local state when table name changes externally
    useEffect(() => {
        setLocalTableName(table.name);
    }, [table.name]);

    return {
        tableName: localTableName,
        handleTableNameChange,
    };
};
