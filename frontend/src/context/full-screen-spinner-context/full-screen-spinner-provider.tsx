import React from 'react';
import type { FullScreenLoaderContext } from './full-screen-spinner-context';
import { fullScreenLoaderContext } from './full-screen-spinner-context';
import { MapLoadingViewportOverlay } from '@/pages/editor-page/canvas/workflow/map-loading-strip';

export const FullScreenLoaderProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const [open, setOpen] = React.useState(false);
    const [animated, setAnimated] = React.useState(true);

    const hideLoader: FullScreenLoaderContext['hideLoader'] =
        React.useCallback(() => {
            setOpen(false);
        }, []);

    const showLoader: FullScreenLoaderContext['showLoader'] = React.useCallback(
        (options) => {
            setAnimated(options?.animated ?? true);
            setOpen(true);
        },
        []
    );

    return (
        <fullScreenLoaderContext.Provider
            value={{
                showLoader,
                hideLoader,
            }}
        >
            {children}
            {open ? <MapLoadingViewportOverlay animated={animated} /> : null}
        </fullScreenLoaderContext.Provider>
    );
};
