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
import { WorkflowModeSwitcher } from '@/features/diagram-workflow/components/workflow-mode-switcher';
import { useOptionalDiagramWorkflow } from '@/features/diagram-workflow/context/diagram-workflow-context';
import { LiveStatusChip } from '@/features/diagram-workflow/components/live-status-chip';
import { CompareSummaryChip } from '@/features/diagram-workflow/components/compare-summary-chip';
import { ReviewDropdown } from '@/features/diagram-workflow/components/review-dropdown';
import { VersionsPanel } from '@/features/diagram-workflow/components/versions-panel';
import { VersionViewBadge } from '@/features/diagram-workflow/components/version-view-badge';

export interface TopNavbarProps {}

export const TopNavbar: React.FC<TopNavbarProps> = () => {
    const { effectiveTheme } = useTheme();
    const { enabled, user, logout } = useAuth();
    const workflow = useOptionalDiagramWorkflow();
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
        <nav className="flex flex-col justify-between border-b px-3 md:h-12 md:flex-row md:items-center md:px-4">
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
                <Menu />
            </div>
            <DiagramName />
            <div className="hidden flex-1 items-center justify-end gap-2 sm:flex">
                <WorkflowModeSwitcher />
                <CompareSummaryChip />
                <LiveStatusChip />
                <VersionViewBadge />
                <ReviewDropdown />
                <VersionsPanel />
                {workflow?.activeMode === 'development' ? (
                    <SchemaSyncToolbarButton />
                ) : null}
                <LastSaved />
                <ActiveDiagramParticipants />
                <CurrentDiagramShareButton />
                <Button asChild variant="outline" size="sm">
                    <Link to="/">Library</Link>
                </Button>
                {enabled ? (
                    <>
                        <span className="max-w-40 truncate text-sm text-muted-foreground">
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
        </nav>
    );
};
