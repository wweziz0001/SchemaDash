export interface AdminOverviewUser {
    id: string;
    email: string | null;
    displayName: string;
    authProvider: 'placeholder' | 'local' | 'oidc';
    status: 'provisioned' | 'active' | 'disabled';
    role: 'member' | 'admin';
    ownershipScope: 'personal' | 'workspace';
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
}

export interface AdminOverviewResponse {
    generatedAt: string;
    metrics: {
        users: number;
        admins: number;
        collections: number;
        projects: number;
        diagrams: number;
        activeSessions: number;
        sharingRecords: number | null;
    };
    platform: {
        environment: string;
        authMode: 'disabled' | 'password' | 'oidc';
        bootstrapRequired: boolean;
        adminInitialized: boolean;
        oidcConfigured: boolean;
        persistence: {
            app: 'sqlite';
            schemaSync: 'disabled' | 'external-service';
        };
    };
    users: {
        total: number;
        admins: number;
        byStatus: Record<'provisioned' | 'active' | 'disabled', number>;
        items: AdminOverviewUser[];
    };
    projects: {
        total: number;
        byStatus: Record<'active' | 'archived' | 'deleted', number>;
        byVisibility: Record<'private' | 'workspace' | 'public', number>;
    };
    diagrams: {
        total: number;
        byStatus: Record<'draft' | 'active' | 'archived', number>;
        byVisibility: Record<'private' | 'workspace' | 'public', number>;
    };
    sharing: {
        supported: boolean;
        totalRecords: number | null;
    };
}

export interface AdminSummaryItem {
    key: string;
    label: string;
    value: string | number;
}

const adminDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
});

export const adminAuthProviderLabels: Record<
    AdminOverviewUser['authProvider'],
    string
> = {
    placeholder: 'Placeholder',
    local: 'Password',
    oidc: 'OIDC',
};

export const formatAdminDateTime = (value: string | null) => {
    if (!value) {
        return 'Never';
    }

    return adminDateTimeFormatter.format(new Date(value));
};

export const getPlatformSummaryItems = (
    overview: AdminOverviewResponse
): AdminSummaryItem[] => [
    {
        key: 'environment',
        label: 'Environment',
        value: overview.platform.environment,
    },
    {
        key: 'auth-mode',
        label: 'Auth mode',
        value: overview.platform.authMode,
    },
    {
        key: 'bootstrap-state',
        label: 'Bootstrap state',
        value: overview.platform.adminInitialized
            ? 'Complete'
            : overview.platform.bootstrapRequired
              ? 'Pending'
              : 'Not required',
    },
    {
        key: 'oidc-config',
        label: 'OIDC config',
        value: overview.platform.oidcConfigured
            ? 'Configured'
            : 'Not configured',
    },
    {
        key: 'persistence',
        label: 'Persistence',
        value: `${overview.platform.persistence.app} / ${overview.platform.persistence.schemaSync}`,
    },
    {
        key: 'generated',
        label: 'Generated',
        value: formatAdminDateTime(overview.generatedAt),
    },
];

export const getProjectSummaryItems = (
    overview: AdminOverviewResponse
): AdminSummaryItem[] => [
    {
        key: 'active-projects',
        label: 'Active projects',
        value: overview.projects.byStatus.active,
    },
    {
        key: 'archived-projects',
        label: 'Archived projects',
        value: overview.projects.byStatus.archived,
    },
    {
        key: 'deleted-projects',
        label: 'Deleted projects',
        value: overview.projects.byStatus.deleted,
    },
    {
        key: 'private-projects',
        label: 'Private visibility',
        value: overview.projects.byVisibility.private,
    },
    {
        key: 'workspace-projects',
        label: 'Workspace visibility',
        value: overview.projects.byVisibility.workspace,
    },
    {
        key: 'public-projects',
        label: 'Public visibility',
        value: overview.projects.byVisibility.public,
    },
];

export const getDiagramSummaryItems = (
    overview: AdminOverviewResponse
): AdminSummaryItem[] => [
    {
        key: 'draft-diagrams',
        label: 'Draft diagrams',
        value: overview.diagrams.byStatus.draft,
    },
    {
        key: 'active-diagrams',
        label: 'Active diagrams',
        value: overview.diagrams.byStatus.active,
    },
    {
        key: 'archived-diagrams',
        label: 'Archived diagrams',
        value: overview.diagrams.byStatus.archived,
    },
    {
        key: 'public-diagrams',
        label: 'Public visibility',
        value: overview.diagrams.byVisibility.public,
    },
    {
        key: 'workspace-diagrams',
        label: 'Workspace visibility',
        value: overview.diagrams.byVisibility.workspace,
    },
    {
        key: 'sharing-records',
        label: 'Sharing records',
        value: overview.sharing.supported
            ? (overview.sharing.totalRecords ?? 0)
            : 'Not available',
    },
];
