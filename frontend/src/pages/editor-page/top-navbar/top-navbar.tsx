import React, { useCallback } from 'react';
import SchemaDashLogo from '@/assets/logo-light.png';
import SchemaDashDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { DiagramName } from './diagram-name';
import { LastSaved } from './last-saved';
import { LanguageNav } from './language-nav/language-nav';
import { Menu } from './menu/menu';
import { SchemaSyncToolbarButton } from '@/features/schema-sync/components/schema-sync-toolbar-button';
import { Button } from '@/components/button/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Link } from 'react-router-dom';
import { CurrentDiagramShareButton } from './current-diagram-share-button';
import { ActiveDiagramParticipants } from './active-diagram-participants';
import { Separator } from '@/components/separator/separator';

export interface TopNavbarProps {}

export const TopNavbar: React.FC<TopNavbarProps> = () => {
    const { effectiveTheme } = useTheme();
    const { enabled, user, logout } = useAuth();
    const isAdmin = enabled && user?.role === 'admin';

    const renderStars = useCallback(() => {
        return (
            <iframe
                src={`https://ghbtns.com/github-btn.html?user=wweziz0001&repo=SchemaDash&type=star&size=large&text=false`}
                width="40"
                height="30"
                title="GitHub"
            ></iframe>
        );
    }, []);

    return (
        <nav className="border-b border-border/70 bg-background/85 px-3 backdrop-blur-sm md:px-4">
            <div className="flex min-h-14 flex-wrap items-center gap-3 py-2">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <a
                        href="https://schemadash.io"
                        className="shrink-0 cursor-pointer"
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
                    <div className="hidden min-w-0 md:flex">
                        <Menu />
                    </div>
                </div>

                <div className="order-3 flex w-full justify-center md:order-2 md:w-auto md:flex-1">
                    <div className="max-w-full rounded-2xl border border-border/70 bg-card/70 px-4 py-2 shadow-sm">
                        <DiagramName />
                    </div>
                </div>

                <div className="order-2 hidden flex-1 items-center justify-end gap-2 sm:flex md:order-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/70 px-2 py-1 shadow-sm">
                        <SchemaSyncToolbarButton />
                        <Separator
                            orientation="vertical"
                            className="hidden h-6 md:block"
                        />
                        <LastSaved />
                        <ActiveDiagramParticipants />
                        <CurrentDiagramShareButton />
                        <Button asChild variant="outline" size="sm">
                            <Link to="/">Library</Link>
                        </Button>
                        {enabled ? (
                            <>
                                <span className="max-w-40 truncate px-2 text-sm text-muted-foreground">
                                    {user?.displayName ??
                                        user?.email ??
                                        'Authenticated'}
                                </span>
                                {isAdmin ? (
                                    <Button asChild variant="outline" size="sm">
                                        <Link to="/admin">Admin</Link>
                                    </Button>
                                ) : null}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void logout()}
                                >
                                    Log out
                                </Button>
                            </>
                        ) : null}
                        {renderStars()}
                        <LanguageNav />
                    </div>
                </div>

                <div className="w-full md:hidden">
                    <Menu />
                </div>
            </div>
        </nav>
    );
};
