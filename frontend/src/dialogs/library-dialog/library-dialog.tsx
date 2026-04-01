import React, {
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    Archive,
    ChevronRight,
    FolderKanban,
    LayoutGrid,
    RefreshCw,
    Settings,
    Shield,
    Trash2,
    Upload,
    UserRound,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/button/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import { DashboardSettingOptionCard } from '@/components/dashboard-page/dashboard-setting-option-card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import { DiagramIcon } from '@/components/diagram-icon/diagram-icon';
import { Input } from '@/components/input/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { SummaryList } from '@/components/summary-list/summary-list';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/table/table';
import type { SavedCollection } from '@/context/storage-context/storage-context';
import { useAuth } from '@/hooks/use-auth';
import { useConfig } from '@/hooks/use-config';
import { useLocalConfig } from '@/hooks/use-local-config';
import { adminClient } from '@/lib/api/admin-client';
import { RequestError } from '@/lib/api/request';
import {
    getDiagramSummaryItems,
    getPlatformSummaryItems,
    getProjectSummaryItems,
    type AdminOverviewResponse,
} from '@/lib/admin/admin-overview';
import type {
    LibraryDiagramItem,
    LibrarySort,
    LibraryView,
} from '@/lib/dashboard/library-catalog';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import type { DatabaseType } from '@/lib/domain/database-type';
import { cn } from '@/lib/utils';
import { matchesSearch, normalizeSearchTerm } from '@/lib/utils/search';
import { useLibraryCatalog } from '@/pages/dashboard-page/use-library-catalog';

const sortOptions: Array<{ label: string; value: LibrarySort }> = [
    { label: 'Last updated', value: 'updated' },
    { label: 'Created', value: 'created' },
    { label: 'Name', value: 'name' },
    { label: 'Table count', value: 'tables' },
];

const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
});

type LibraryDialogTab =
    | 'all'
    | 'shared'
    | 'unorganized'
    | 'collections'
    | 'trash'
    | 'profile'
    | 'settings'
    | 'admin';

type UtilitySectionId =
    | 'profile-identity'
    | 'profile-workspace'
    | 'settings-appearance'
    | 'settings-canvas'
    | 'settings-defaults'
    | 'admin-overview'
    | 'admin-health'
    | 'admin-users';

const isUtilityTab = (value: LibraryDialogTab) =>
    value === 'profile' || value === 'settings' || value === 'admin';

const isProjectLibraryTab = (value: LibraryDialogTab) =>
    value === 'all' ||
    value === 'shared' ||
    value === 'unorganized' ||
    value === 'trash';

const tabDefinitions: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: LibraryDialogTab;
}> = [
    { icon: LayoutGrid, label: 'All Diagrams', value: 'all' },
    { icon: ChevronRight, label: 'Shared with Me', value: 'shared' },
    { icon: Archive, label: 'Unorganized', value: 'unorganized' },
    { icon: FolderKanban, label: 'Collections', value: 'collections' },
    { icon: Trash2, label: 'Trash', value: 'trash' },
    { icon: UserRound, label: 'Profile', value: 'profile' },
    { icon: Settings, label: 'Settings', value: 'settings' },
    { icon: Shield, label: 'Admin', value: 'admin' },
];

const profileSections = [
    {
        id: 'profile-identity' as const,
        label: 'Identity',
        description: 'Signed-in user context and access details.',
    },
    {
        id: 'profile-workspace' as const,
        label: 'Workspace snapshot',
        description: 'Counts for collections, projects, and diagrams.',
    },
];

const settingsSections = [
    {
        id: 'settings-appearance' as const,
        label: 'Appearance',
        description: 'Theme preference for the current session.',
    },
    {
        id: 'settings-canvas' as const,
        label: 'Canvas',
        description: 'Diagram display and canvas toggles.',
    },
    {
        id: 'settings-defaults' as const,
        label: 'Defaults',
        description: 'Saved workspace and deployment defaults.',
    },
];

const adminSections = [
    {
        id: 'admin-overview' as const,
        label: 'Overview',
        description: 'High-level admin metrics.',
    },
    {
        id: 'admin-health' as const,
        label: 'Health',
        description: 'Platform and workspace readiness.',
    },
    {
        id: 'admin-users' as const,
        label: 'Users',
        description: 'Most recent authenticated users.',
    },
];

const TabButton = ({
    active,
    disabled,
    icon: Icon,
    label,
    onClick,
}: {
    active: boolean;
    disabled?: boolean;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
}) => (
    <button
        type="button"
        disabled={disabled}
        className={cn(
            'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors',
            active ? 'border-foreground/20 bg-accent' : 'hover:bg-accent/50',
            disabled && 'cursor-not-allowed opacity-50'
        )}
        onClick={onClick}
    >
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">{label}</span>
    </button>
);

const ListButton = ({
    active,
    description,
    label,
    meta,
    onClick,
}: {
    active: boolean;
    description?: string | null;
    label: string;
    meta?: React.ReactNode;
    onClick: () => void;
}) => (
    <button
        type="button"
        className={cn(
            'rounded-md border px-3 py-2 text-left transition-colors',
            active ? 'border-foreground/20 bg-accent' : 'hover:bg-accent/50'
        )}
        onClick={onClick}
    >
        <div className="truncate text-sm font-medium">{label}</div>
        {description ? (
            <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {description}
            </div>
        ) : null}
        {meta ? (
            <div className="mt-1 text-xs text-muted-foreground">{meta}</div>
        ) : null}
    </button>
);

const getLibraryCopy = (
    tab: LibraryDialogTab,
    selectedCollection?: SavedCollection | null
) => {
    switch (tab) {
        case 'shared':
            return {
                description:
                    'Diagrams shared into your authenticated workspace.',
                panelTitle: 'Shared projects',
                panelDescription:
                    'Choose a shared project and reopen one of its diagrams.',
                detailTitle: 'Shared diagrams',
            };
        case 'unorganized':
            return {
                description:
                    'Projects that still need a collection assignment.',
                panelTitle: 'Unorganized projects',
                panelDescription:
                    'Review the projects that are not organized into a collection yet.',
                detailTitle: 'Unorganized diagrams',
            };
        case 'trash':
            return {
                description:
                    'Deleted projects kept in the local workspace cache.',
                panelTitle: 'Deleted projects',
                panelDescription:
                    'Review diagrams that belong to projects marked as deleted.',
                detailTitle: 'Trash contents',
            };
        case 'collections':
            return {
                description:
                    'Browse collection groups and the diagrams they contain.',
                panelTitle: 'Collections',
                panelDescription:
                    'Pick a collection to inspect all projects and diagrams inside it.',
                detailTitle: selectedCollection?.name ?? 'Collection',
            };
        case 'all':
        default:
            return {
                description:
                    'All saved diagrams available in the current workspace.',
                panelTitle: 'Projects',
                panelDescription:
                    'Choose a project to inspect and reopen its diagrams.',
                detailTitle: 'All diagrams',
            };
    }
};

const emptyUtilityContext = {
    config: undefined,
    updateConfig: async () => undefined,
};

const emptyLocalConfigContext = {
    setShowCardinality: () => undefined,
    setShowDBViews: () => undefined,
    setShowFieldAttributes: () => undefined,
    setShowMiniMapOnCanvas: () => undefined,
    setTheme: () => undefined,
    showCardinality: true,
    showDBViews: true,
    showFieldAttributes: true,
    showMiniMapOnCanvas: true,
    theme: 'system' as 'system' | 'light' | 'dark',
};

export interface LibraryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTab?: LibraryDialogTab;
}

export const LibraryDialog: React.FC<LibraryDialogProps> = ({
    initialTab = 'all',
    open,
    onOpenChange,
}) => {
    const navigate = useNavigate();
    const auth = useAuth();
    const configContext = useConfig() ?? emptyUtilityContext;
    const localConfig = useLocalConfig() ?? emptyLocalConfigContext;
    const { config, updateConfig } = configContext;
    const {
        setShowCardinality,
        setShowDBViews,
        setShowFieldAttributes,
        setShowMiniMapOnCanvas,
        setTheme,
        showCardinality,
        showDBViews,
        showFieldAttributes,
        showMiniMapOnCanvas,
        theme,
    } = localConfig;

    const [activeTab, setActiveTab] = useState<LibraryDialogTab>(initialTab);
    const [selectedProjectId, setSelectedProjectId] = useState<string>();
    const [selectedDiagramId, setSelectedDiagramId] = useState<string>();
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>();
    const [selectedUtilitySection, setSelectedUtilitySection] =
        useState<UtilitySectionId>('settings-appearance');
    const [searchTerm, setSearchTerm] = useState('');
    const [adminOverview, setAdminOverview] =
        useState<AdminOverviewResponse | null>(null);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState<string | null>(null);

    const deferredSearch = useDeferredValue(searchTerm);
    const normalizedSearch = useMemo(
        () => normalizeSearchTerm(deferredSearch, { lowerCase: true }),
        [deferredSearch]
    );

    const baseCatalog = useLibraryCatalog({
        enabled: open,
        view: 'all',
    });

    const activeLibraryView: LibraryView = useMemo(() => {
        switch (activeTab) {
            case 'shared':
                return 'shared';
            case 'unorganized':
                return 'unorganized';
            case 'trash':
                return 'trash';
            case 'collections':
                return 'collection';
            case 'all':
            default:
                return 'all';
        }
    }, [activeTab]);

    const libraryTabActive = !isUtilityTab(activeTab);
    const selectedCollection =
        baseCatalog.collections.find(
            (collection) => collection.id === selectedCollectionId
        ) ?? null;
    const activeCatalog = useLibraryCatalog({
        collectionId:
            activeTab === 'collections' ? selectedCollectionId : undefined,
        enabled:
            open &&
            libraryTabActive &&
            (activeTab !== 'collections' || Boolean(selectedCollectionId)),
        view: activeLibraryView,
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        setActiveTab(initialTab);
        setSearchTerm('');
        setSelectedCollectionId(undefined);
        setSelectedProjectId(undefined);
        setSelectedDiagramId(undefined);
        setSelectedUtilitySection(
            initialTab === 'profile'
                ? 'profile-identity'
                : initialTab === 'admin'
                  ? 'admin-overview'
                  : 'settings-appearance'
        );
    }, [initialTab, open]);

    useEffect(() => {
        if (activeTab !== 'collections' || selectedCollectionId) {
            return;
        }

        if (baseCatalog.collections.length > 0) {
            setSelectedCollectionId(baseCatalog.collections[0]?.id);
        }
    }, [activeTab, baseCatalog.collections, selectedCollectionId]);

    useEffect(() => {
        if (!libraryTabActive) {
            return;
        }

        activeCatalog.setSearch(searchTerm);
    }, [activeCatalog, libraryTabActive, searchTerm]);

    const projectItems = useMemo(() => {
        if (!isProjectLibraryTab(activeTab) || !selectedProjectId) {
            return [];
        }

        return activeCatalog.items.filter(
            (item) => item.project.id === selectedProjectId
        );
    }, [activeCatalog.items, activeTab, selectedProjectId]);

    const selectedProject = useMemo(
        () =>
            activeCatalog.projects.find(
                (project) => project.id === selectedProjectId
            ),
        [activeCatalog.projects, selectedProjectId]
    );

    const diagramRows = useMemo(() => {
        if (activeTab === 'collections') {
            return activeCatalog.items;
        }

        return projectItems;
    }, [activeCatalog.items, activeTab, projectItems]);

    const selectedDiagram = useMemo(
        () =>
            diagramRows.find((item) => item.diagram.id === selectedDiagramId) ??
            null,
        [diagramRows, selectedDiagramId]
    );

    useEffect(() => {
        if (!isProjectLibraryTab(activeTab)) {
            return;
        }

        setSelectedProjectId((currentProjectId) => {
            if (
                currentProjectId &&
                activeCatalog.projects.some(
                    (project) => project.id === currentProjectId
                )
            ) {
                return currentProjectId;
            }

            return activeCatalog.projects[0]?.id;
        });
    }, [activeCatalog.projects, activeTab]);

    useEffect(() => {
        if (activeTab === 'collections') {
            return;
        }

        setSelectedDiagramId((currentDiagramId) => {
            if (
                currentDiagramId &&
                projectItems.some(
                    (item) => item.diagram.id === currentDiagramId
                )
            ) {
                return currentDiagramId;
            }

            return projectItems[0]?.diagram.id;
        });
    }, [activeTab, projectItems]);

    useEffect(() => {
        if (activeTab !== 'collections') {
            return;
        }

        setSelectedDiagramId((currentDiagramId) => {
            if (
                currentDiagramId &&
                activeCatalog.items.some(
                    (item) => item.diagram.id === currentDiagramId
                )
            ) {
                return currentDiagramId;
            }

            return activeCatalog.items[0]?.diagram.id;
        });
    }, [activeCatalog.items, activeTab]);

    const utilitySections = useMemo(() => {
        if (activeTab === 'profile') {
            return profileSections;
        }

        if (activeTab === 'admin') {
            return adminSections;
        }

        return settingsSections;
    }, [activeTab]);

    const filteredUtilitySections = useMemo(() => {
        if (!isUtilityTab(activeTab) || !normalizedSearch) {
            return utilitySections;
        }

        return utilitySections.filter((section) =>
            matchesSearch(
                [section.label, section.description],
                normalizedSearch
            )
        );
    }, [activeTab, normalizedSearch, utilitySections]);

    useEffect(() => {
        if (!isUtilityTab(activeTab)) {
            return;
        }

        setSelectedUtilitySection((currentSection) => {
            if (
                filteredUtilitySections.some(
                    (section) => section.id === currentSection
                )
            ) {
                return currentSection;
            }

            return filteredUtilitySections[0]?.id ?? currentSection;
        });
    }, [activeTab, filteredUtilitySections]);

    const isAdmin = auth.enabled && auth.user?.role === 'admin';

    const loadAdminOverview = useCallback(async () => {
        if (!isAdmin) {
            setAdminOverview(null);
            setAdminError(null);
            return;
        }

        setAdminLoading(true);
        setAdminError(null);

        try {
            const response = await adminClient.getOverview();
            setAdminOverview(response);
        } catch (error) {
            if (error instanceof RequestError) {
                setAdminError(error.message);
            } else {
                setAdminError('Unable to load the admin overview right now.');
            }
        } finally {
            setAdminLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        if (!open || activeTab !== 'admin') {
            return;
        }

        void loadAdminOverview();
    }, [activeTab, loadAdminOverview, open]);

    const filteredCollections = useMemo(() => {
        if (!normalizedSearch) {
            return baseCatalog.collections;
        }

        return baseCatalog.collections.filter((collection) =>
            matchesSearch(
                [collection.name, collection.description],
                normalizedSearch
            )
        );
    }, [baseCatalog.collections, normalizedSearch]);

    const libraryCopy = getLibraryCopy(activeTab, selectedCollection);

    const openDiagram = useCallback(
        async (diagramId?: string) => {
            if (!diagramId) {
                return;
            }

            await updateConfig({
                config: {
                    defaultDiagramId: diagramId,
                },
            });
            onOpenChange(false);
            navigate(`/diagrams/${diagramId}`);
        },
        [navigate, onOpenChange, updateConfig]
    );

    const renderDiagramTable = (items: LibraryDiagramItem[]) => {
        if (items.length === 0) {
            return (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    No diagrams available in this view.
                </div>
            );
        }

        return (
            <Table>
                <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                        <TableHead />
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">
                            Project
                        </TableHead>
                        <TableHead>Last modified</TableHead>
                        <TableHead className="text-center">Tables</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow
                            key={`${item.project.id}-${item.diagram.id}`}
                            data-state={
                                selectedDiagramId === item.diagram.id
                                    ? 'selected'
                                    : undefined
                            }
                            className="cursor-pointer"
                            onClick={() =>
                                setSelectedDiagramId(item.diagram.id)
                            }
                            onDoubleClick={() => {
                                if (activeTab !== 'trash') {
                                    void openDiagram(item.diagram.id);
                                }
                            }}
                        >
                            <TableCell>
                                <div className="flex justify-center">
                                    <DiagramIcon
                                        databaseType={
                                            item.diagram
                                                .databaseType as DatabaseType
                                        }
                                        databaseEdition={
                                            (item.diagram.databaseEdition ??
                                                undefined) as
                                                | DatabaseEdition
                                                | undefined
                                        }
                                    />
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">
                                    {item.diagram.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {item.diagram.description ??
                                        item.project.description ??
                                        'Saved schema diagram'}
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                {item.project.name}
                            </TableCell>
                            <TableCell>
                                {dateFormatter.format(item.diagram.updatedAt)}
                            </TableCell>
                            <TableCell className="text-center">
                                {item.diagram.tableCount}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    };

    const renderUtilityDetail = () => {
        if (activeTab === 'profile') {
            if (selectedUtilitySection === 'profile-workspace') {
                return (
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle>Workspace snapshot</CardTitle>
                            <CardDescription>
                                Current saved workspace counts available in this
                                session.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SummaryList
                                items={[
                                    {
                                        label: 'Collections',
                                        value: baseCatalog.collections.length,
                                    },
                                    {
                                        label: 'Active projects',
                                        value: baseCatalog.projects.length,
                                    },
                                    {
                                        label: 'Saved diagrams',
                                        value: baseCatalog.items.length,
                                    },
                                ]}
                            />
                        </CardContent>
                    </Card>
                );
            }

            return (
                <Card className="shadow-none">
                    <CardHeader>
                        <CardTitle>Identity</CardTitle>
                        <CardDescription>
                            The current user context attached to this SchemaDash
                            session.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SummaryList
                            items={[
                                {
                                    label: 'Display name',
                                    value:
                                        auth.user?.displayName ??
                                        'Local SchemaDash user',
                                },
                                {
                                    label: 'Email',
                                    value: auth.user?.email ?? 'Not applicable',
                                },
                                {
                                    label: 'Role',
                                    value: auth.user?.role ?? 'local',
                                },
                                {
                                    label: 'Auth provider',
                                    value:
                                        auth.user?.authProvider ??
                                        auth.mode ??
                                        'local',
                                },
                                {
                                    label: 'Status',
                                    value:
                                        auth.user?.status ??
                                        (auth.authenticated
                                            ? 'active'
                                            : 'local'),
                                },
                            ]}
                        />
                    </CardContent>
                </Card>
            );
        }

        if (activeTab === 'settings') {
            if (selectedUtilitySection === 'settings-canvas') {
                return (
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle>Canvas preferences</CardTitle>
                            <CardDescription>
                                Toggle the default diagram presentation options
                                for the current browser session.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <DashboardSettingOptionCard
                                checked={showCardinality}
                                description="Keep relationship cardinality markers visible in diagrams."
                                onCheckedChange={setShowCardinality}
                                title="Show cardinality"
                            />
                            <DashboardSettingOptionCard
                                checked={showFieldAttributes}
                                description="Display PK, nullability, and field metadata on the canvas."
                                onCheckedChange={setShowFieldAttributes}
                                title="Show field attributes"
                            />
                            <DashboardSettingOptionCard
                                checked={showMiniMapOnCanvas}
                                description="Keep the minimap visible by default."
                                onCheckedChange={setShowMiniMapOnCanvas}
                                title="Show minimap"
                            />
                            <DashboardSettingOptionCard
                                checked={showDBViews}
                                description="Include database views when the source supports them."
                                onCheckedChange={setShowDBViews}
                                title="Show database views"
                            />
                        </CardContent>
                    </Card>
                );
            }

            if (selectedUtilitySection === 'settings-defaults') {
                return (
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle>Defaults</CardTitle>
                            <CardDescription>
                                Persistent workspace configuration and current
                                deployment readiness.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SummaryList
                                items={[
                                    {
                                        label: 'Authentication mode',
                                        value: auth.enabled
                                            ? (auth.mode ?? 'enabled')
                                            : 'disabled',
                                    },
                                    {
                                        label: 'Server reachability',
                                        value: auth.serverReachable
                                            ? 'Online'
                                            : 'Offline',
                                    },
                                    {
                                        label: 'Default diagram id',
                                        value:
                                            config?.defaultDiagramId ??
                                            'Not set',
                                    },
                                ]}
                            />
                        </CardContent>
                    </Card>
                );
            }

            return (
                <Card className="shadow-none">
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>
                            Choose how SchemaDash should follow the current
                            system theme.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Theme</div>
                            <Select
                                onValueChange={(value) =>
                                    setTheme(
                                        value as 'light' | 'dark' | 'system'
                                    )
                                }
                                value={theme}
                            >
                                <SelectTrigger className="max-w-sm">
                                    <SelectValue placeholder="Choose theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="system">
                                        System
                                    </SelectItem>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (!isAdmin) {
            return (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Admin access is required to open this section.
                </div>
            );
        }

        if (adminLoading && !adminOverview) {
            return (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Loading admin overview...
                </div>
            );
        }

        if (adminError) {
            return (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    {adminError}
                </div>
            );
        }

        if (!adminOverview) {
            return (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Admin overview is unavailable.
                </div>
            );
        }

        if (selectedUtilitySection === 'admin-health') {
            return (
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle>Platform health</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SummaryList
                                items={getPlatformSummaryItems(adminOverview)}
                            />
                        </CardContent>
                    </Card>
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle>Project inventory</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SummaryList
                                items={getProjectSummaryItems(adminOverview)}
                            />
                        </CardContent>
                    </Card>
                    <Card className="shadow-none">
                        <CardHeader>
                            <CardTitle>Diagram activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SummaryList
                                items={getDiagramSummaryItems(adminOverview)}
                            />
                        </CardContent>
                    </Card>
                </div>
            );
        }

        if (selectedUtilitySection === 'admin-users') {
            return (
                <Card className="shadow-none">
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Users</CardTitle>
                            <CardDescription>
                                Recently provisioned accounts and role
                                assignments.
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => void loadAdminOverview()}
                        >
                            <RefreshCw className="mr-2 size-4" />
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent className="max-h-[28rem] overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-background">
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {adminOverview.users.recent.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            {user.displayName}
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell className="capitalize">
                                            {user.role}
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            {user.status}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card className="shadow-none">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Admin overview</CardTitle>
                        <CardDescription>
                            Quick metrics for the current self-hosted
                            deployment.
                        </CardDescription>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void loadAdminOverview()}
                    >
                        <RefreshCw className="mr-2 size-4" />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent>
                    <SummaryList
                        items={[
                            {
                                label: 'Users',
                                value: adminOverview.metrics.users,
                            },
                            {
                                label: 'Admins',
                                value: adminOverview.metrics.admins,
                            },
                            {
                                label: 'Collections',
                                value: adminOverview.metrics.collections,
                            },
                            {
                                label: 'Projects',
                                value: adminOverview.metrics.projects,
                            },
                            {
                                label: 'Diagrams',
                                value: adminOverview.metrics.diagrams,
                            },
                        ]}
                    />
                </CardContent>
            </Card>
        );
    };

    const detailTitle = (() => {
        if (activeTab === 'collections') {
            return selectedCollection?.name ?? 'Collection';
        }

        if (isProjectLibraryTab(activeTab)) {
            return selectedProject?.name ?? libraryCopy.detailTitle;
        }

        return utilitySections.find(
            (section) => section.id === selectedUtilitySection
        )?.label;
    })();

    const detailDescription = (() => {
        if (activeTab === 'collections') {
            return selectedCollection?.description ?? libraryCopy.description;
        }

        if (isProjectLibraryTab(activeTab)) {
            return (
                selectedProject?.description ??
                (selectedProject
                    ? `${selectedProject.diagramCount} saved diagrams`
                    : libraryCopy.description)
            );
        }

        return utilitySections.find(
            (section) => section.id === selectedUtilitySection
        )?.description;
    })();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex h-[38rem] max-h-screen flex-col overflow-y-auto md:min-w-[94vw] xl:min-w-[76vw]"
                showClose
            >
                <DialogHeader>
                    <DialogTitle>Workspace dialog</DialogTitle>
                    <DialogDescription>
                        Open the workspace library, settings, profile, and admin
                        tools without leaving the current editor.
                    </DialogDescription>
                </DialogHeader>
                <DialogInternalContent className="pr-2">
                    <div className="flex h-full flex-col gap-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="workspace-dialog-search"
                                className="text-xs font-medium text-muted-foreground"
                            >
                                Search
                            </label>
                            <Input
                                id="workspace-dialog-search"
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder={
                                    libraryTabActive
                                        ? 'Search projects, diagrams, or collections'
                                        : 'Filter sections in this dialog'
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                {libraryTabActive
                                    ? 'Use the same focused search pattern as the Open dialog, but across library views.'
                                    : 'Filter the available sections without leaving the modal.'}
                            </p>
                        </div>

                        <div className="grid h-full gap-4 md:grid-cols-[220px_240px_minmax(0,1fr)]">
                            <div className="flex min-h-0 flex-col gap-3 rounded-lg border p-3">
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Workspace
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Library, profile, settings, and admin
                                        tools in one modal.
                                    </p>
                                </div>
                                <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto">
                                    {tabDefinitions.map((tab) => (
                                        <TabButton
                                            key={tab.value}
                                            active={activeTab === tab.value}
                                            disabled={
                                                tab.value === 'shared' &&
                                                !(auth.enabled && auth.user)
                                            }
                                            icon={tab.icon}
                                            label={tab.label}
                                            onClick={() => {
                                                setActiveTab(tab.value);
                                                setSearchTerm('');
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-col gap-3 rounded-lg border p-3">
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        {activeTab === 'collections'
                                            ? libraryCopy.panelTitle
                                            : isProjectLibraryTab(activeTab)
                                              ? libraryCopy.panelTitle
                                              : 'Sections'}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {activeTab === 'collections'
                                            ? libraryCopy.panelDescription
                                            : isProjectLibraryTab(activeTab)
                                              ? libraryCopy.panelDescription
                                              : 'Choose the section to open in the detail panel.'}
                                    </p>
                                </div>

                                <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto">
                                    {activeTab === 'collections' ? (
                                        filteredCollections.length > 0 ? (
                                            filteredCollections.map(
                                                (collection) => (
                                                    <ListButton
                                                        key={collection.id}
                                                        active={
                                                            selectedCollectionId ===
                                                            collection.id
                                                        }
                                                        description={
                                                            collection.description
                                                        }
                                                        label={collection.name}
                                                        meta={`${collection.projectCount} projects`}
                                                        onClick={() =>
                                                            setSelectedCollectionId(
                                                                collection.id
                                                            )
                                                        }
                                                    />
                                                )
                                            )
                                        ) : (
                                            <div className="px-1 pt-2 text-sm text-muted-foreground">
                                                No collections match this
                                                search.
                                            </div>
                                        )
                                    ) : isProjectLibraryTab(activeTab) ? (
                                        activeCatalog.projects.length > 0 ? (
                                            activeCatalog.projects.map(
                                                (project) => (
                                                    <ListButton
                                                        key={project.id}
                                                        active={
                                                            selectedProjectId ===
                                                            project.id
                                                        }
                                                        description={
                                                            project.description
                                                        }
                                                        label={project.name}
                                                        meta={`${project.diagramCount} diagrams`}
                                                        onClick={() =>
                                                            setSelectedProjectId(
                                                                project.id
                                                            )
                                                        }
                                                    />
                                                )
                                            )
                                        ) : (
                                            <div className="px-1 pt-2 text-sm text-muted-foreground">
                                                No projects available in this
                                                view.
                                            </div>
                                        )
                                    ) : filteredUtilitySections.length > 0 ? (
                                        filteredUtilitySections.map(
                                            (section) => (
                                                <ListButton
                                                    key={section.id}
                                                    active={
                                                        selectedUtilitySection ===
                                                        section.id
                                                    }
                                                    description={
                                                        section.description
                                                    }
                                                    label={section.label}
                                                    onClick={() =>
                                                        setSelectedUtilitySection(
                                                            section.id
                                                        )
                                                    }
                                                />
                                            )
                                        )
                                    ) : (
                                        <div className="px-1 pt-2 text-sm text-muted-foreground">
                                            No sections match this search.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-col rounded-lg border p-3">
                                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-sm font-semibold">
                                            {detailTitle ?? 'Details'}
                                        </h2>
                                        {detailDescription ? (
                                            <p className="text-sm text-muted-foreground">
                                                {detailDescription}
                                            </p>
                                        ) : null}
                                    </div>

                                    {libraryTabActive ? (
                                        <div className="flex flex-wrap gap-2">
                                            <Select
                                                onValueChange={(value) =>
                                                    activeCatalog.setSort(
                                                        value as LibrarySort
                                                    )
                                                }
                                                value={activeCatalog.sort}
                                            >
                                                <SelectTrigger className="h-8 w-[180px]">
                                                    <SelectValue placeholder="Sort by" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sortOptions.map(
                                                        (option) => (
                                                            <SelectItem
                                                                key={
                                                                    option.value
                                                                }
                                                                value={
                                                                    option.value
                                                                }
                                                            >
                                                                {option.label}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="min-h-0 flex-1 overflow-auto">
                                    {libraryTabActive ? (
                                        <>
                                            {activeTab === 'collections' &&
                                            selectedCollection ? (
                                                <div className="mb-3 grid gap-3 sm:grid-cols-3">
                                                    <Card className="shadow-none">
                                                        <CardContent className="p-4">
                                                            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                                                Projects
                                                            </div>
                                                            <div className="mt-2 text-2xl font-semibold">
                                                                {
                                                                    activeCatalog
                                                                        .projects
                                                                        .length
                                                                }
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card className="shadow-none">
                                                        <CardContent className="p-4">
                                                            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                                                Diagrams
                                                            </div>
                                                            <div className="mt-2 text-2xl font-semibold">
                                                                {
                                                                    activeCatalog
                                                                        .items
                                                                        .length
                                                                }
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card className="shadow-none">
                                                        <CardContent className="p-4">
                                                            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                                                Results
                                                            </div>
                                                            <div className="mt-2 text-2xl font-semibold">
                                                                {activeCatalog.search
                                                                    ? 'Filtered'
                                                                    : 'All'}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            ) : null}

                                            {activeCatalog.loading ? (
                                                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                                                    Loading workspace data...
                                                </div>
                                            ) : null}

                                            {!activeCatalog.loading
                                                ? renderDiagramTable(
                                                      diagramRows
                                                  )
                                                : null}
                                        </>
                                    ) : (
                                        renderUtilityDetail()
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogInternalContent>

                <DialogFooter className="flex !justify-between gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>

                    {libraryTabActive ? (
                        <div className="flex gap-2">
                            <Button asChild type="button" variant="secondary">
                                <Link
                                    to="/workspace?action=import"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <Upload className="mr-2 size-4" />
                                    Import
                                </Link>
                            </Button>
                            <Button asChild type="button" variant="secondary">
                                <Link
                                    to="/workspace?action=create"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Create diagram
                                </Link>
                            </Button>
                            <Button
                                type="button"
                                disabled={
                                    !selectedDiagram || activeTab === 'trash'
                                }
                                onClick={() =>
                                    void openDiagram(
                                        selectedDiagram?.diagram.id
                                    )
                                }
                            >
                                Open
                            </Button>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setActiveTab('all');
                                setSearchTerm('');
                            }}
                        >
                            Browse diagrams
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
