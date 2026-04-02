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
import { ActiveDiagramParticipants } from './active-diagram-participants';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { VersionViewBadge } from './workflow/version-view-badge';
import { WorkflowActionsMenu } from './workflow/workflow-actions-menu';
import { WorkflowModeSwitcher } from './workflow/workflow-mode-switcher';

export interface TopNavbarMobileProps {}

export const TopNavbarMobile: React.FC<TopNavbarMobileProps> = () => {
    const { enabled, user, logout } = useAuth();
    const workflow = useOptionalDiagramWorkflow();
    const isAdmin = enabled && user?.role === 'admin';
    const showWorkflowChrome = !!workflow?.diagramId;
    const renderStars = useCallback(() => {
        return (
            <iframe
                src="https://ghbtns.com/github-btn.html?user=wweziz0001&repo=SchemaDash&type=star&size=small&text=false"
                width="10"
                height="10"
                title="GitHub"
            ></iframe>
        );
    }, []);

    const { toggleSidebar } = useSidebar();

    return (
        <nav className="flex flex-col justify-between border-b bg-background/95 px-3 backdrop-blur md:h-12 md:flex-row md:items-center md:px-4">
            <div className="flex flex-1 flex-col justify-between gap-x-1 md:flex-row md:justify-normal">
                <div className="flex items-center justify-between pt-[8px] font-primary md:py-0">
                    <div className="flex items-center gap-2">
                        <Button
                            size={'icon'}
                            variant="ghost"
                            onClick={toggleSidebar}
                        >
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
                        <WorkflowActionsMenu />
                        {workflow?.activeMode === 'development' ? (
                            <SchemaSyncToolbarButton />
                        ) : null}
                        <ActiveDiagramParticipants />
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
                        <LanguageNav />
                    </div>
                </div>
                <Menu />
            </div>

            <div className="flex flex-1 justify-center pb-2 pt-1">
                <DiagramName />
            </div>
            {showWorkflowChrome ? (
                <div className="pb-3">
                    <div className="rounded-xl border bg-muted/15 p-2 shadow-sm">
                        <div className="flex justify-center pb-2">
                            <WorkflowModeSwitcher />
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            <VersionViewBadge />
                        </div>
                    </div>
                </div>
            ) : null}
        </nav>
    );
};
