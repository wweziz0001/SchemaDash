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
import { WorkflowModeSwitcher } from '@/features/diagram-workflow/components/workflow-mode-switcher';
import { useOptionalDiagramWorkflow } from '@/features/diagram-workflow/context/diagram-workflow-context';
import { LiveStatusChip } from '@/features/diagram-workflow/components/live-status-chip';
import { CompareSummaryChip } from '@/features/diagram-workflow/components/compare-summary-chip';
import { VersionsPanel } from '@/features/diagram-workflow/components/versions-panel';
import { VersionViewBadge } from '@/features/diagram-workflow/components/version-view-badge';
import { ReviewDropdown } from '@/features/diagram-workflow/components/review-dropdown';

export interface TopNavbarMobileProps {}

export const TopNavbarMobile: React.FC<TopNavbarMobileProps> = () => {
    const { enabled, user, logout } = useAuth();
    const workflow = useOptionalDiagramWorkflow();
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
        <nav className="flex flex-col justify-between border-b px-3 md:h-12 md:flex-row md:items-center md:px-4">
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
                        <VersionsPanel />
                        <ReviewDropdown />
                        {workflow?.activeMode === 'development' ? (
                            <SchemaSyncToolbarButton />
                        ) : null}
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
                        <LanguageNav />
                    </div>
                </div>
                <Menu />
            </div>

            <div className="flex flex-1 justify-center pb-2 pt-1">
                <DiagramName />
            </div>
            <div className="flex justify-center pb-2">
                <WorkflowModeSwitcher />
            </div>
            <div className="flex justify-center px-2 pb-2">
                <CompareSummaryChip />
            </div>
            <div className="flex justify-center px-2 pb-2">
                <LiveStatusChip />
            </div>
            <div className="flex justify-center px-2 pb-2">
                <VersionViewBadge />
            </div>
        </nav>
    );
};
