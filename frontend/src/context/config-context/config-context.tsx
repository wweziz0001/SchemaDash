import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import type { SchemaDashConfig } from '@/lib/domain/config';

export interface ConfigContext {
    config?: SchemaDashConfig;
    updateConfig: (params: {
        config?: Partial<SchemaDashConfig>;
        updateFn?: (config: SchemaDashConfig) => SchemaDashConfig;
    }) => Promise<void>;
}

export const ConfigContext = createContext<ConfigContext>({
    config: undefined,
    updateConfig: emptyFn,
});
