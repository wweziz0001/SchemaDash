import React from 'react';

export interface MapLoadingStripProps {
    inset?: boolean;
}

export const MapLoadingStrip: React.FC<MapLoadingStripProps> = ({
    inset = false,
}) => {
    return (
        <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 z-30 ${
                inset ? 'px-4 pt-1 md:px-6' : ''
            }`}
        >
            <div className="h-0.5 overflow-hidden rounded-full bg-border/50">
                <div className="map-loading-strip h-full w-1/3 rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-pink-500" />
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
