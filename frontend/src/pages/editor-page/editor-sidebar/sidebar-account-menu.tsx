import React, { useEffect, useMemo, useState } from 'react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/avatar/avatar';
import { Button } from '@/components/button/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { LibraryDialog } from '@/dialogs/library-dialog/library-dialog';
import { SharingSettingsDialog } from '@/dialogs/open-diagram-dialog/sharing-settings-dialog';
import { useSharingSettingsDialogApi } from '@/dialogs/open-diagram-dialog/use-sharing-settings-dialog-api';
import {
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/sidebar/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useStorage } from '@/hooks/use-storage';
import { useTheme } from '@/hooks/use-theme';
import type { SavedDiagram } from '@/context/storage-context/storage-context';
import { cn } from '@/lib/utils';
import {
    LayoutGrid,
    LogOut,
    Moon,
    Settings,
    Share2,
    SunMedium,
    UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getUserInitials = (
    displayName?: string | null,
    email?: string | null
) => {
    const source = displayName?.trim() || email?.trim() || 'SchemaDash';
    return source
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
};

const getUserAvatarSrc = (user: unknown): string | null => {
    if (!user || typeof user !== 'object') {
        return null;
    }

    const candidateKeys = ['avatarUrl', 'avatar_url', 'imageUrl', 'picture'];

    for (const key of candidateKeys) {
        const value = (user as Record<string, unknown>)[key];
        if (typeof value === 'string' && value.trim()) {
            return value;
        }
    }

    return null;
};

export interface SidebarAccountMenuProps {
    className?: string;
}

export const SidebarAccountMenu: React.FC<SidebarAccountMenuProps> = ({
    className,
}) => {
    const navigate = useNavigate();
    const { user, enabled, authenticated, logout } = useAuth();
    const { currentDiagram } = useSchemaDash();
    const { getSavedDiagram } = useStorage();
    const { effectiveTheme, setTheme } = useTheme();
    const sharingApi = useSharingSettingsDialogApi();
    const [menuOpen, setMenuOpen] = useState(false);
    const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
    const [sharingDialogOpen, setSharingDialogOpen] = useState(false);
    const [savedDiagram, setSavedDiagram] = useState<
        SavedDiagram | undefined
    >();
    const avatarSrc = getUserAvatarSrc(user);
    const initials = getUserInitials(user?.displayName, user?.email);
    const displayName =
        user?.displayName?.trim() ||
        user?.email?.trim() ||
        'Local SchemaDash user';
    const secondaryLabel = user?.email?.trim() || 'Local workspace';

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (!currentDiagram?.id) {
                setSavedDiagram(undefined);
                return;
            }

            try {
                const nextSavedDiagram = await getSavedDiagram(
                    currentDiagram.id
                );
                if (!cancelled) {
                    setSavedDiagram(nextSavedDiagram);
                }
            } catch {
                if (!cancelled) {
                    setSavedDiagram(undefined);
                }
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [currentDiagram?.id, getSavedDiagram]);

    const shareSubject = useMemo(
        () =>
            savedDiagram && !savedDiagram.localOnly
                ? {
                      type: 'diagram' as const,
                      id: savedDiagram.id,
                      name: savedDiagram.name,
                  }
                : null,
        [savedDiagram]
    );

    const canManageDiagramVisibility = Boolean(
        savedDiagram &&
        !savedDiagram.localOnly &&
        savedDiagram.access === 'owner'
    );

    const handleNavigate = (to: string) => {
        setMenuOpen(false);
        navigate(to);
    };

    const handleOpenSharing = () => {
        setMenuOpen(false);
        setSharingDialogOpen(true);
    };

    const handleOpenLibrary = () => {
        setMenuOpen(false);
        setLibraryDialogOpen(true);
    };

    const handleLogout = () => {
        setMenuOpen(false);
        void logout();
    };

    return (
        <>
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <SidebarMenuItem>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            aria-label="Open account menu"
                            className={className}
                            type="button"
                        >
                            <Avatar className="size-8 rounded-xl border border-sidebar-border bg-sidebar-accent/40 shadow-sm">
                                {avatarSrc ? (
                                    <AvatarImage
                                        alt={
                                            user?.displayName ||
                                            'SchemaDash user'
                                        }
                                        src={avatarSrc}
                                    />
                                ) : null}
                                <AvatarFallback className="rounded-xl bg-sidebar-accent text-[11px] font-semibold text-sidebar-accent-foreground">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <span>Account</span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                </SidebarMenuItem>

                <DropdownMenuContent
                    align="end"
                    className="w-64 rounded-2xl p-1.5"
                    side="right"
                    sideOffset={12}
                >
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2">
                        <Avatar className="size-10 rounded-2xl border border-border/70 bg-muted/60">
                            {avatarSrc ? (
                                <AvatarImage
                                    alt={user?.displayName || 'SchemaDash user'}
                                    src={avatarSrc}
                                />
                            ) : null}
                            <AvatarFallback className="rounded-2xl bg-muted text-xs font-semibold text-foreground">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-foreground">
                                {displayName}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                                {secondaryLabel}
                            </div>
                        </div>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        className="gap-2 rounded-xl px-3 py-2"
                        onSelect={() => handleNavigate('/')}
                    >
                        <LayoutGrid className="size-4 text-muted-foreground" />
                        <span>All Diagrams</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="gap-2 rounded-xl px-3 py-2"
                        onSelect={() => handleNavigate('/profile')}
                    >
                        <UserRound className="size-4 text-muted-foreground" />
                        <span>Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="gap-2 rounded-xl px-3 py-2"
                        disabled={!canManageDiagramVisibility}
                        onSelect={handleOpenSharing}
                    >
                        <Share2 className="size-4 text-muted-foreground" />
                        <span>Diagram Visibility</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="gap-2 rounded-xl px-3 py-2"
                        onSelect={handleOpenLibrary}
                    >
                        <Settings className="size-4 text-muted-foreground" />
                        <span>Settings</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <div className="p-1">
                        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-1">
                            <Button
                                aria-pressed={effectiveTheme === 'light'}
                                className={cn(
                                    'h-8 w-full justify-center rounded-lg px-2 text-xs',
                                    effectiveTheme === 'light' && 'shadow-none'
                                )}
                                onClick={() => setTheme('light')}
                                size="sm"
                                type="button"
                                variant={
                                    effectiveTheme === 'light'
                                        ? 'secondary'
                                        : 'ghost'
                                }
                            >
                                <SunMedium className="size-4" />
                                <span>Light</span>
                            </Button>
                            <Button
                                aria-pressed={effectiveTheme === 'dark'}
                                className={cn(
                                    'h-8 w-full justify-center rounded-lg px-2 text-xs',
                                    effectiveTheme === 'dark' && 'shadow-none'
                                )}
                                onClick={() => setTheme('dark')}
                                size="sm"
                                type="button"
                                variant={
                                    effectiveTheme === 'dark'
                                        ? 'secondary'
                                        : 'ghost'
                                }
                            >
                                <Moon className="size-4" />
                                <span>Dark</span>
                            </Button>
                        </div>
                    </div>

                    {enabled && authenticated ? (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="gap-2 rounded-xl px-3 py-2 text-destructive focus:text-destructive"
                                onSelect={handleLogout}
                            >
                                <LogOut className="size-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>

            <SharingSettingsDialog
                open={sharingDialogOpen}
                onOpenChange={setSharingDialogOpen}
                subject={shareSubject}
                loadSharing={sharingApi.loadSharing}
                searchUsers={sharingApi.searchUsers}
                addPerson={sharingApi.addPerson}
                updatePerson={sharingApi.updatePerson}
                removePerson={sharingApi.removePerson}
                updateGeneralAccess={sharingApi.updateGeneralAccess}
            />
            <LibraryDialog
                initialTab="settings"
                open={libraryDialogOpen}
                onOpenChange={setLibraryDialogOpen}
            />
        </>
    );
};
