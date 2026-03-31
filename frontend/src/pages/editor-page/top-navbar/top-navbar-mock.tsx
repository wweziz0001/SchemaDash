import React from 'react';

import SchemaDashLogo from '@/assets/logo-light.png';
import SchemaDashDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';

export const TopNavbarMock: React.FC = () => {
    const { effectiveTheme } = useTheme();
    return (
        <nav className="flex h-[150px] flex-col justify-between border-b bg-background/95 px-3 backdrop-blur md:h-12 md:flex-row md:items-center md:px-4">
            <div className="flex flex-1 flex-col justify-between gap-x-1 md:flex-row md:justify-normal">
                <div className="flex items-center justify-between pt-[8px] font-primary md:py-0">
                    <a
                        href="https://schemadash.io"
                        className="cursor-pointer"
                        rel="noreferrer"
                    >
                        <img
                            src={
                                effectiveTheme === 'light'
                                    ? SchemaDashLogo
                                    : SchemaDashDarkLogo
                            }
                            alt="SchemaDash"
                            className="h-8 max-w-fit"
                        />
                    </a>
                </div>
            </div>
        </nav>
    );
};
