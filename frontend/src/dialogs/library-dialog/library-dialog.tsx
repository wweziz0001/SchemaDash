import React, { useEffect, useMemo, useState } from 'react';
import {
    Archive,
    ChevronRight,
    FolderKanban,
    LayoutGrid,
    Layers3,
    Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import { DashboardFeedbackPanel } from '@/components/dashboard-page/dashboard-feedback-panel';
import { DashboardSearchToolbar } from '@/components/dashboard-page/dashboard-search-toolbar';
import { LibraryDiagramCard } from '@/components/dashboard-page/library-diagram-card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { StatusBadge } from '@/components/status-badge/status-badge';
import type { SavedCollection } from '@/context/storage-context/storage-context';
import { useAuth } from '@/hooks/use-auth';
import type { LibrarySort, LibraryView } from '@/lib/dashboard/library-catalog';
import { cn } from '@/lib/utils';
import { useLibraryCatalog } from '@/pages/dashboard-page/use-library-catalog';

const sortOptions: Array<{ label: string; value: LibrarySort }> = [
    { label: 'Last updated', value: 'updated' },
    { label: 'Created', value: 'created' },
    { label: 'Name', value: 'name' },
    { label: 'Table count', value: 'tables' },
];

type LibraryDialogSelection =
    | { kind: 'all' }
    | { kind: 'shared' }
    | { kind: 'unorganized' }
    | { kind: 'collection'; collectionId: string };

const defaultSelection: LibraryDialogSelection = { kind: 'all' };

const LibraryDialogNavButton = ({
    active,
    badge,
    disabled,
    icon: Icon,
    label,
    onClick,
}: {
    active: boolean;
    badge?: React.ReactNode;
    disabled?: boolean;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
}) => (
    <button
        className={cn(
            'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition',
            active
                ? 'border-stone-200 bg-stone-100 text-stone-950 shadow-sm dark:border-stone-700 dark:bg-stone-800 dark:text-stone-50'
                : 'border-transparent bg-transparent text-stone-600 hover:border-stone-200 hover:bg-stone-100/80 hover:text-stone-950 dark:text-stone-300 dark:hover:border-stone-700 dark:hover:bg-stone-800/80 dark:hover:text-stone-50',
            disabled && 'cursor-not-allowed opacity-50'
        )}
        disabled={disabled}
        onClick={onClick}
        type="button"
    >
        <Icon
            className={cn(
                'size-4 shrink-0',
                active
                    ? 'text-stone-900 dark:text-stone-50'
                    : 'text-stone-400 dark:text-stone-500'
            )}
        />
        <span className="flex-1 truncate font-medium">{label}</span>
        {badge ? (
            <span className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
                {badge}
            </span>
        ) : null}
    </button>
);

const LibraryDialogStatCard = ({
    label,
    value,
    detail,
    icon: Icon,
}: {
    detail: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
}) => (
    <Card className="rounded-2xl border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
        <CardContent className="flex items-start justify-between gap-4 p-5">
            <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    {label}
                </div>
                <div className="text-3xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
                    {value}
                </div>
                <p className="text-sm leading-6 text-stone-500 dark:text-stone-300">
                    {detail}
                </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
                <Icon className="size-4" />
            </div>
        </CardContent>
    </Card>
);

const resolveLibraryCopy = (
    selection: LibraryDialogSelection,
    collection: SavedCollection | null
) => {
    switch (selection.kind) {
        case 'shared':
            return {
                badge: 'Shared workspace',
                emptyState: {
                    title: 'Nothing shared with you yet',
                    description:
                        'Shared diagrams and projects from other workspace members will appear here as soon as access is granted.',
                },
                title: 'Shared with Me',
                subtitle:
                    'Review diagrams shared into your workspace without leaving the current editor session.',
            };
        case 'unorganized':
            return {
                badge: 'Needs organization',
                emptyState: {
                    title: 'Nothing is unorganized',
                    description:
                        'Projects without a collection show up here, so it is easier to keep the saved workspace tidy.',
                },
                title: 'Unorganized',
                subtitle:
                    'Track diagrams that still need a collection and reorganize the workspace with less context switching.',
            };
        case 'collection':
            return {
                badge: 'Collection view',
                emptyState: {
                    title: 'No diagrams in this collection',
                    description:
                        'Projects saved into this collection will appear here as soon as diagrams are attached to them.',
                },
                title: collection?.name ?? 'Collection',
                subtitle:
                    collection?.description ??
                    'Review the diagrams that belong to this collection from one focused modal.',
            };
        case 'all':
        default:
            return {
                badge: 'Library',
                emptyState: {
                    title: 'No saved diagrams yet',
                    description:
                        'Create a new diagram or import an existing schema to start building your saved SchemaDash library.',
                },
                title: 'All Diagrams',
                subtitle:
                    'Browse every saved diagram you can access and reopen schema work without leaving the editor.',
            };
    }
};

export interface LibraryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const LibraryDialog: React.FC<LibraryDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const { enabled, user } = useAuth();
    const [selection, setSelection] =
        useState<LibraryDialogSelection>(defaultSelection);
    const view: LibraryView =
        selection.kind === 'collection' ? 'collection' : selection.kind;
    const collectionId =
        selection.kind === 'collection' ? selection.collectionId : undefined;
    const sharedViewEnabled = enabled && Boolean(user);
    const catalog = useLibraryCatalog({
        collectionId,
        enabled: open && (view !== 'shared' || sharedViewEnabled),
        view,
    });

    useEffect(() => {
        if (!open) {
            setSelection(defaultSelection);
        }
    }, [open]);

    const activeCollection =
        selection.kind === 'collection'
            ? (catalog.collections.find(
                  (collection) => collection.id === selection.collectionId
              ) ?? null)
            : null;
    const copy = resolveLibraryCopy(selection, activeCollection);
    const activeSortLabel =
        sortOptions.find((option) => option.value === catalog.sort)?.label ??
        'Last updated';
    const helperBadges = useMemo(
        () => [
            `${catalog.items.length} results`,
            `${catalog.projects.length} projects`,
            activeSortLabel,
        ],
        [activeSortLabel, catalog.items.length, catalog.projects.length]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                blurBackground
                className="h-[min(820px,calc(100vh-2rem))] max-w-[min(1120px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border-stone-200 bg-white p-0 shadow-2xl shadow-stone-950/10 dark:border-stone-800 dark:bg-stone-950 dark:shadow-black/30"
                showClose
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Library settings modal</DialogTitle>
                    <DialogDescription>
                        Browse your saved library content from the user menu
                        without leaving the current editor view.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid h-full min-h-0 lg:grid-cols-[240px,minmax(0,1fr)]">
                    <aside className="flex min-h-0 flex-col border-b border-stone-200 bg-stone-50/80 px-4 py-5 dark:border-stone-800 dark:bg-stone-900/70 lg:border-b-0 lg:border-r">
                        <div className="border-b border-stone-200 px-2 pb-4 dark:border-stone-800">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                                Workspace
                            </div>
                            <div className="mt-3 text-[2rem] font-semibold tracking-tight text-stone-950 dark:text-stone-50">
                                Library
                            </div>
                            <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-300">
                                Open saved diagrams in a focused modal instead
                                of leaving the editor.
                            </p>
                        </div>

                        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-2 py-4">
                            <div className="space-y-2">
                                <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                                    Views
                                </div>
                                <div className="space-y-1">
                                    <LibraryDialogNavButton
                                        active={selection.kind === 'all'}
                                        badge={catalog.items.length}
                                        icon={LayoutGrid}
                                        label="All Diagrams"
                                        onClick={() =>
                                            setSelection({ kind: 'all' })
                                        }
                                    />
                                    <LibraryDialogNavButton
                                        active={selection.kind === 'shared'}
                                        disabled={!sharedViewEnabled}
                                        icon={ChevronRight}
                                        label="Shared with Me"
                                        onClick={() =>
                                            setSelection({ kind: 'shared' })
                                        }
                                    />
                                    <LibraryDialogNavButton
                                        active={
                                            selection.kind === 'unorganized'
                                        }
                                        icon={Archive}
                                        label="Unorganized"
                                        onClick={() =>
                                            setSelection({
                                                kind: 'unorganized',
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                                    Collections
                                </div>
                                <div className="space-y-1">
                                    {catalog.collections.length > 0 ? (
                                        catalog.collections.map(
                                            (collection) => (
                                                <LibraryDialogNavButton
                                                    key={collection.id}
                                                    active={
                                                        selection.kind ===
                                                            'collection' &&
                                                        selection.collectionId ===
                                                            collection.id
                                                    }
                                                    badge={
                                                        collection.projectCount
                                                    }
                                                    icon={FolderKanban}
                                                    label={collection.name}
                                                    onClick={() =>
                                                        setSelection({
                                                            kind: 'collection',
                                                            collectionId:
                                                                collection.id,
                                                        })
                                                    }
                                                />
                                            )
                                        )
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-3 py-4 text-sm text-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-500">
                                            No collections yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>

                    <DialogInternalContent className="max-h-full">
                        <div className="space-y-4 p-4 md:p-5">
                            <div className="flex flex-col gap-4 border-b border-stone-200 pb-4 dark:border-stone-800 md:flex-row md:items-start md:justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="flex size-9 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300">
                                        <LayoutGrid className="size-4" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <div className="text-xl font-semibold text-stone-950 dark:text-stone-50">
                                                {copy.title}
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className="rounded-full border-stone-200 bg-stone-50 px-2.5 py-0.5 text-stone-600 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
                                            >
                                                {copy.badge}
                                            </Badge>
                                        </div>
                                        <p className="max-w-3xl text-sm leading-6 text-stone-500 dark:text-stone-300">
                                            {copy.subtitle}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {helperBadges.map((badge) => (
                                                <StatusBadge
                                                    key={badge}
                                                    className="rounded-full px-2.5 py-0.5"
                                                    tone="neutral"
                                                >
                                                    {badge}
                                                </StatusBadge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-10 rounded-xl border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-950 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-stone-50"
                                    >
                                        <Link
                                            to="/workspace?action=import"
                                            onClick={() => onOpenChange(false)}
                                        >
                                            <Upload className="mr-2 size-4" />
                                            Import
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        className="h-10 rounded-xl bg-stone-950 text-stone-50 hover:bg-stone-900 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200"
                                    >
                                        <Link
                                            to="/workspace?action=create"
                                            onClick={() => onOpenChange(false)}
                                        >
                                            Create diagram
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <section className="grid gap-4 md:grid-cols-3">
                                <LibraryDialogStatCard
                                    detail="Visible in this modal view."
                                    icon={LayoutGrid}
                                    label="Diagrams"
                                    value={catalog.items.length}
                                />
                                <LibraryDialogStatCard
                                    detail="Projects represented here."
                                    icon={Layers3}
                                    label="Projects"
                                    value={catalog.projects.length}
                                />
                                <LibraryDialogStatCard
                                    detail="Collections available in workspace."
                                    icon={FolderKanban}
                                    label="Collections"
                                    value={catalog.collections.length}
                                />
                            </section>

                            <Card className="rounded-2xl border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900">
                                <CardHeader className="border-b border-stone-200 pb-4 dark:border-stone-800">
                                    <CardTitle className="text-base text-stone-950 dark:text-stone-50">
                                        Saved diagrams
                                    </CardTitle>
                                    <CardDescription className="text-sm leading-6 text-stone-500 dark:text-stone-300">
                                        Search, sort, and reopen diagrams from
                                        the current editor session.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-5">
                                    {!sharedViewEnabled &&
                                    selection.kind === 'shared' ? (
                                        <Card className="rounded-2xl border-stone-200 bg-stone-50 shadow-sm dark:border-stone-800 dark:bg-stone-950">
                                            <CardHeader>
                                                <CardTitle className="text-base">
                                                    Shared access appears here
                                                </CardTitle>
                                                <CardDescription className="text-sm leading-6">
                                                    Enable authenticated
                                                    accounts to surface projects
                                                    and diagrams shared by other
                                                    workspace members.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0 text-sm leading-6 text-stone-500 dark:text-stone-300">
                                                This deployment is currently
                                                running without signed-in
                                                sharing context.
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <>
                                            <DashboardSearchToolbar
                                                className="rounded-2xl border-stone-200 bg-stone-50 shadow-none dark:border-stone-800 dark:bg-stone-950"
                                                inputLabel={`${copy.title} search`}
                                                onSearchChange={
                                                    catalog.setSearch
                                                }
                                                placeholder="Search diagrams, projects, descriptions, and collections"
                                                search={catalog.search}
                                            >
                                                <Select
                                                    onValueChange={(value) =>
                                                        catalog.setSort(
                                                            value as LibrarySort
                                                        )
                                                    }
                                                    value={catalog.sort}
                                                >
                                                    <SelectTrigger className="h-11 w-full rounded-xl border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900 lg:w-[220px]">
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
                                                                    {
                                                                        option.label
                                                                    }
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </DashboardSearchToolbar>

                                            <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300 lg:flex-row lg:items-center lg:justify-between">
                                                <div>
                                                    Showing{' '}
                                                    {catalog.items.length}{' '}
                                                    diagrams across{' '}
                                                    {catalog.projects.length}{' '}
                                                    projects in this library
                                                    view.
                                                </div>
                                                <StatusBadge
                                                    className="rounded-full px-2.5 py-0.5"
                                                    tone="neutral"
                                                >
                                                    {activeSortLabel}
                                                </StatusBadge>
                                            </div>

                                            {catalog.error ? (
                                                <Alert
                                                    variant="destructive"
                                                    className="border-rose-200/80 bg-rose-50/80 dark:border-rose-500/30 dark:bg-rose-500/10"
                                                >
                                                    <AlertTitle>
                                                        Library unavailable
                                                    </AlertTitle>
                                                    <AlertDescription>
                                                        {catalog.error}
                                                    </AlertDescription>
                                                </Alert>
                                            ) : null}

                                            {catalog.loading ? (
                                                <DashboardFeedbackPanel
                                                    className="rounded-2xl"
                                                    state="loading"
                                                    title="Loading library data"
                                                />
                                            ) : null}

                                            {!catalog.loading &&
                                            catalog.items.length === 0 ? (
                                                <DashboardFeedbackPanel
                                                    className="rounded-2xl"
                                                    title={
                                                        copy.emptyState.title
                                                    }
                                                    description={
                                                        copy.emptyState
                                                            .description
                                                    }
                                                    icon={
                                                        <Layers3 className="size-6 text-stone-500" />
                                                    }
                                                />
                                            ) : null}

                                            {!catalog.loading &&
                                            catalog.items.length > 0 ? (
                                                <section className="grid gap-4 xl:grid-cols-2">
                                                    {catalog.items.map(
                                                        (item) => (
                                                            <LibraryDiagramCard
                                                                key={`${item.project.id}-${item.diagram.id}`}
                                                                item={item}
                                                            />
                                                        )
                                                    )}
                                                </section>
                                            ) : null}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </DialogInternalContent>
                </div>
            </DialogContent>
        </Dialog>
    );
};
