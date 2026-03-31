import React from 'react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/avatar/avatar';
import {
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/sidebar/sidebar';
import { useAuth } from '@/hooks/use-auth';

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

export interface SidebarAccountTriggerButtonProps {
    className?: string;
}

export const SidebarAccountTriggerButton: React.FC<
    SidebarAccountTriggerButtonProps
> = ({ className }) => {
    const { user } = useAuth();
    const avatarSrc = getUserAvatarSrc(user);
    const initials = getUserInitials(user?.displayName, user?.email);

    return (
        <SidebarMenuItem>
            <SidebarMenuButton className={className} type="button">
                <Avatar className="size-7 border border-border/70">
                    {avatarSrc ? (
                        <AvatarImage
                            alt={user?.displayName || 'SchemaDash user'}
                            src={avatarSrc}
                        />
                    ) : null}
                    <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <span>Account</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
};
