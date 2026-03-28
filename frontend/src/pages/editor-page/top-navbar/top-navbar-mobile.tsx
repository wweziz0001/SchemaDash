import React, { useCallback } from 'react';
import SchemaDashLogo from '@/assets/logo-2.png';
import { DiagramName } from './diagram-name';
import { LanguageNav } from './language-nav/language-nav';
import { Menu } from './menu/menu';
import { Button } from '@/components/button/button';
import { useSidebar } from '@/components/sidebar/use-sidebar';
import { MenuIcon } from 'lucide-react';
import { SchemaSyncToolbarButton } from '@/features/schema-sync/components/schema-sync-toolbar-button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Link } from 'react-router-dom';
import { CurrentDiagramShareButton } from './current-diagram-share-button';
import { ActiveDiagramParticipants } from './active-diagram-participants';

export interface TopNavbarMobileProps {}

export const TopNavbarMobile: React.FC<TopNavbarMobileProps> = () => {
    const { enabled, user, logout } = useAuth();
    const isAdmin = enabled && user?.role === 'admin';
    const renderStars = useCallback(() => {
        return (
            <iframe
                src="https://ghbtns.com/github-btn.html?user=wweziz0001&repo=SchemaDash&type=star&size=small&text=false"
                width="25"
                height="20"
                title="GitHub"
            ></iframe>
        );
    }, []);

    const { toggleSidebar } = useSidebar();

    return (
        <nav className="border-b border-border/70 bg-background/90 px-3 py-2 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={toggleSidebar}>
                        <MenuIcon className="size-5" />
                    </Button>
                    <a
                        href="https://schemadash.io"
                        className="cursor-pointer"
                        rel="noreferrer"
                    >
                        <img
                            src={SchemaDashLogo}
                            alt="SchemaDash"
                            className="h-8 max-w-fit"
                        />
                    </a>
                </div>

                <div className="flex items-center gap-2">
                    <SchemaSyncToolbarButton />
                    <LanguageNav />
                </div>
            </div>

            <div className="mt-3 flex justify-center">
                <div className="max-w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-2 shadow-sm">
                    <DiagramName />
                </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <ActiveDiagramParticipants />
                <CurrentDiagramShareButton />
                <Button asChild size="sm" variant="outline">
                    <Link to="/">Library</Link>
                </Button>
                {isAdmin ? (
                    <Button asChild size="sm" variant="outline">
                        <Link to="/admin">Admin</Link>
                    </Button>
                ) : null}
                {enabled ? (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void logout()}
                    >
                        Log out
                    </Button>
                ) : null}
                {renderStars()}
            </div>

            <div className="mt-3">
                <Menu />
            </div>
        </nav>
    );
};
