import React, { useEffect, useState } from 'react';
import { ConfigContext } from './config-context';

import { useStorage } from '@/hooks/use-storage';
import type { SchemaDashConfig } from '@/lib/domain/config';

export const ConfigProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { getConfig, updateConfig: updateDataConfig } = useStorage();
    const [config, setConfig] = useState<SchemaDashConfig | undefined>();

    useEffect(() => {
        const loadConfig = async () => {
            const config = await getConfig();
            setConfig(config);
        };

        loadConfig();
    }, [getConfig]);

    const updateConfig: ConfigContext['updateConfig'] = async ({
        config,
        updateFn,
    }) => {
        const promise = new Promise<void>((resolve) => {
            setConfig((prevConfig) => {
                let baseConfig: SchemaDashConfig = { defaultDiagramId: '' };
                if (prevConfig) {
                    baseConfig = prevConfig;
                }

                const updatedConfig = updateFn
                    ? updateFn(baseConfig)
                    : { ...baseConfig, ...config };

                updateDataConfig(updatedConfig).then(() => {
                    resolve();
                });
                return updatedConfig;
            });
        });

        return promise;
    };

    return (
        <ConfigContext.Provider
            value={{
                config,
                updateConfig,
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};
