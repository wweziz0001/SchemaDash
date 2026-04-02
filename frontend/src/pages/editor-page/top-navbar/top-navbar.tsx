import React, { useCallback } from 'react';
import SchemaDashLogo from '@/assets/logo-light.png';
import SchemaDashDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { DiagramName } from './diagram-name';
import { LastSaved } from './last-saved';
import { LanguageNav } from './language-nav/language-nav';
import { Menu } from './menu/menu';
import { Button } from '@/components/button/button';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { ActiveDiagramParticipants } from './active-diagram-participants';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { VersionViewBadge } from './workflow/version-view-badge';
import { WorkflowActionsMenu } from './workflow/workflow-actions-menu';
import { SchemaSyncToolbarButton } from './workflow/schema-sync-toolbar-button';
import { WorkflowModeSwitcher } from './workflow/workflow-mode-switcher';

export interface TopNavbarProps {}

export const TopNavbar: React.FC<TopNavbarProps> = () => {
    const { effectiveTheme } = useTheme();
    const { enabled, user, logout } = useAuth();
    const workflow = useOptionalDiagramWorkflow();
    const isAdmin = enabled && user?.role === 'admin';
    const showWorkflowChrome = !!workflow?.diagramId;

    const renderStars = useCallback(() => {
        return (
            <iframe
                src={`https://ghbtns.com/github-btn.html?user=wweziz0001&repo=SchemaDash&type=star&size=large&text=false`}
                width="10"
                height="10"
                title="GitHub"
            ></iframe>
        );
    }, []);

    return (
        <nav className="flex flex-col justify-between border-b bg-background/95 px-3 backdrop-blur md:min-h-12 md:flex-row md:items-center md:px-4">
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
            <div className="hidden flex-1 items-center justify-end gap-3 py-2 sm:flex md:py-0">
                {showWorkflowChrome ? (
                    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                        <WorkflowModeSwitcher />
                        <WorkflowActionsMenu />
                        <VersionViewBadge />
                    </div>
                ) : null}
                {showWorkflowChrome ? (
                    <div className="h-6 w-px shrink-0 bg-border" />
                ) : null}
                <div className="flex items-center gap-2">
                    {workflow?.activeMode === 'development' ? (
                        <SchemaSyncToolbarButton />
                    ) : null}
                    <LastSaved />
                    <ActiveDiagramParticipants />
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
            </div>
        </nav>
    );
};
