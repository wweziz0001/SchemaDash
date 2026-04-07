import React from 'react';

export interface MapLoadingStripProps {
    inset?: boolean;
    animated?: boolean;
}

export const MapLoadingStrip: React.FC<MapLoadingStripProps> = ({
    inset = false,
    animated = true,
}) => {
    return (
        <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 z-30 ${
                inset ? 'px-4 pt-1 md:px-6' : ''
            }`}
        >
            <div className="h-0.5 overflow-hidden rounded-full bg-border/50">
                <div
                    className={`h-full rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-pink-500 ${
                        animated
                            ? 'map-loading-strip w-1/3'
                            : 'w-full opacity-85'
                    }`}
                />
            </div>
        </div>
    );
};

export const MapLoadingCanvasPlaceholder: React.FC = () => {
    return (
        <div className="relative flex flex-1 overflow-hidden bg-background">
            <MapLoadingStrip inset />
            <div className="size-full bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.22)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>
    );
};

export interface MapLoadingViewportOverlayProps {
    animated?: boolean;
}

export const MapLoadingViewportOverlay: React.FC<
    MapLoadingViewportOverlayProps
> = ({ animated = true }) => {
    return (
        <div
            aria-live="polite"
            aria-busy="true"
            className="fixed inset-0 z-[120] bg-background/30 backdrop-blur-[1px]"
        >
            <span className="sr-only">Loading</span>
            <div className="absolute inset-x-0 top-[150px] md:top-12">
                <MapLoadingStrip inset animated={animated} />
            </div>
        </div>
    );
};
