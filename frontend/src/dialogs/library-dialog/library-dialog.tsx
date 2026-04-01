import React, { useEffect, useMemo, useState } from 'react';
import {
    Archive,
    ChevronRight,
    FolderKanban,
    LayoutGrid,
    Layers3,
    SlidersHorizontal,
    Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
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
import { MetricCard } from '@/components/metric-card/metric-card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { StatusBadge } from '@/components/status-badge/status-badge';
import { useAuth } from '@/hooks/use-auth';
import type { SavedCollection } from '@/context/storage-context/storage-context';
import {
    type LibrarySort,
    type LibraryView,
} from '@/lib/dashboard/library-catalog';
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
            'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition',
            active
                ? 'bg-stone-950 text-stone-50 shadow-lg shadow-stone-950/10 dark:bg-amber-300 dark:text-stone-950'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800/80 dark:hover:text-stone-50',
            disabled && 'cursor-not-allowed opacity-50'
        )}
        disabled={disabled}
        onClick={onClick}
        type="button"
    >
        <Icon
            className={cn(
                'size-4 shrink-0',
                active ? 'text-current' : 'text-stone-400 dark:text-stone-500'
            )}
        />
        <span className="flex-1 truncate">{label}</span>
        {badge ? (
            <span
                className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    active
                        ? 'bg-white/15 text-current dark:bg-stone-950/10'
                        : 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                )}
            >
                {badge}
            </span>
        ) : null}
    </button>
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
                    'Review diagrams that were shared into your workspace, including items you can view or edit without owning the underlying project.',
            };
        case 'unorganized':
            return {
                badge: 'Needs organization',
                emptyState: {
                    title: 'Nothing is unorganized',
                    description:
                        'Projects without a collection show up here, so it is easy to spot work that still needs a home.',
                },
                title: 'Unorganized',
                subtitle:
                    'Catch projects that have not been assigned to a collection yet and keep the saved workspace tidy as your library grows.',
            };
        case 'collection':
            return {
                badge: 'Collection view',
                emptyState: {
                    title: 'No diagrams in this collection',
                    description:
                        'Projects saved into this collection will surface here as soon as diagrams are attached to them.',
                },
                title: collection?.name ?? 'Collection',
                subtitle:
                    collection?.description ??
                    'Review the diagrams that belong to this collection and keep related schema work close together.',
            };
        case 'all':
        default:
            return {
                badge: 'Main library',
                emptyState: {
                    title: 'No saved diagrams yet',
                    description:
                        'Create a new diagram or import an existing schema to turn this library into your main SchemaDash workspace.',
                },
                title: 'All Diagrams',
                subtitle:
                    'Browse every saved diagram you can access, keep projects organized, and jump back into schema work from one intentional landing page.',
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
            `Sort: ${activeSortLabel}`,
        ],
        [activeSortLabel, catalog.items.length, catalog.projects.length]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                blurBackground
                className="h-[min(860px,calc(100vh-1.5rem))] max-w-[min(1320px,calc(100vw-1.5rem))] overflow-hidden rounded-[32px] border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,245,244,0.95))] p-0 shadow-2xl shadow-stone-950/10 dark:border-stone-800/80 dark:bg-[linear-gradient(180deg,rgba(28,25,23,0.98),rgba(12,10,9,0.96))] dark:shadow-black/30"
                showClose
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Library settings modal</DialogTitle>
                    <DialogDescription>
                        Browse your saved library content from the user menu
                        without leaving the current editor view.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid h-full min-h-0 lg:grid-cols-[260px,minmax(0,1fr)]">
                    <aside className="flex min-h-0 flex-col border-b border-stone-200/80 bg-white/75 px-4 py-5 dark:border-stone-800/80 dark:bg-stone-950/65 lg:border-b-0 lg:border-r">
                        <div className="border-b border-stone-200/80 px-2 pb-4 dark:border-stone-800/80">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">
                                Workspace
                            </div>
                            <div className="mt-2 text-xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
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
                                        <div className="rounded-2xl border border-dashed border-stone-200/80 px-3 py-4 text-sm text-stone-400 dark:border-stone-800/80">
                                            No collections yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>

                    <DialogInternalContent className="max-h-full">
                        <div className="space-y-5 p-4 md:p-6">
                            <section className="rounded-[30px] border border-stone-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(245,245,244,0.92))] p-5 shadow-sm dark:border-stone-800/80 dark:bg-[linear-gradient(135deg,rgba(28,25,23,0.96),rgba(12,10,9,0.92))]">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="space-y-3">
                                        <StatusBadge
                                            className="w-fit rounded-full px-3 py-1"
                                            tone="warning"
                                        >
                                            {copy.badge}
                                        </StatusBadge>
                                        <div className="space-y-2">
                                            <h2 className="text-3xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
                                                {copy.title}
                                            </h2>
                                            <p className="max-w-3xl text-sm leading-6 text-stone-600 dark:text-stone-300">
                                                {copy.subtitle}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {helperBadges.map((badge) => (
                                                <StatusBadge
                                                    key={badge}
                                                    className="rounded-full px-3 py-1"
                                                    tone="neutral"
                                                >
                                                    {badge}
                                                </StatusBadge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 md:flex-row">
                                        <Button
                                            asChild
                                            variant="outline"
                                            className="rounded-2xl border-stone-200 bg-transparent text-stone-700 hover:bg-stone-100 hover:text-stone-950 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-stone-50"
                                        >
                                            <Link
                                                to="/workspace?action=import"
                                                onClick={() =>
                                                    onOpenChange(false)
                                                }
                                            >
                                                <Upload className="mr-2 size-4" />
                                                Import
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            className="rounded-2xl bg-stone-950 text-stone-50 hover:bg-stone-900 dark:bg-amber-300 dark:text-stone-950 dark:hover:bg-amber-200"
                                        >
                                            <Link
                                                to="/workspace?action=create"
                                                onClick={() =>
                                                    onOpenChange(false)
                                                }
                                            >
                                                Create diagram
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </section>

                            <section className="grid gap-4 md:grid-cols-3">
                                <MetricCard
                                    className="rounded-[24px] border-stone-200/80 bg-white/85 shadow-sm dark:border-stone-800/80 dark:bg-stone-900/80"
                                    detail="Visible in this modal view."
                                    icon={<LayoutGrid className="size-4" />}
                                    label="Diagrams"
                                    value={catalog.items.length}
                                />
                                <MetricCard
                                    className="rounded-[24px] border-stone-200/80 bg-white/85 shadow-sm dark:border-stone-800/80 dark:bg-stone-900/80"
                                    detail="Projects represented here."
                                    icon={<Layers3 className="size-4" />}
                                    label="Projects"
                                    value={catalog.projects.length}
                                />
                                <MetricCard
                                    className="rounded-[24px] border-stone-200/80 bg-white/85 shadow-sm dark:border-stone-800/80 dark:bg-stone-900/80"
                                    detail="Collections loaded in workspace."
                                    icon={<FolderKanban className="size-4" />}
                                    label="Collections"
                                    value={catalog.collections.length}
                                />
                            </section>

                            <Card className="rounded-[30px] border-stone-200/80 bg-white/90 shadow-sm dark:border-stone-800/80 dark:bg-stone-950/85">
                                <CardHeader className="gap-4 border-b border-stone-200/80 pb-5 dark:border-stone-800/80 lg:flex-row lg:items-end lg:justify-between">
                                    <div className="space-y-2">
                                        <CardTitle className="text-xl text-stone-950 dark:text-stone-50">
                                            Browse and refine
                                        </CardTitle>
                                        <CardDescription className="text-sm leading-6 text-stone-500 dark:text-stone-300">
                                            Search, sort, and reopen saved
                                            diagrams without leaving the current
                                            editor session.
                                        </CardDescription>
                                    </div>
                                    <StatusBadge
                                        className="w-fit rounded-full px-3 py-1"
                                        tone="info"
                                    >
                                        Modal library
                                    </StatusBadge>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-6">
                                    {!sharedViewEnabled &&
                                    selection.kind === 'shared' ? (
                                        <Card className="rounded-[24px] border-stone-200/80 bg-stone-50/80 shadow-sm dark:border-stone-800/80 dark:bg-stone-950/60">
                                            <CardHeader>
                                                <CardTitle className="text-lg">
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
                                                className="rounded-[26px] border-stone-200/80 bg-stone-50/80 dark:border-stone-800/80 dark:bg-stone-950/60"
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
                                                    <SelectTrigger className="h-11 w-full rounded-2xl border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-950/70 lg:w-[220px]">
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

                                            <div className="flex flex-col gap-3 rounded-[24px] border border-dashed border-stone-200/80 bg-stone-50/70 px-4 py-3 text-sm text-stone-600 dark:border-stone-800/80 dark:bg-stone-950/40 dark:text-stone-300 lg:flex-row lg:items-center lg:justify-between">
                                                <div>
                                                    Showing{' '}
                                                    {catalog.items.length}{' '}
                                                    diagrams across{' '}
                                                    {catalog.projects.length}{' '}
                                                    projects in this modal
                                                    library view.
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <StatusBadge
                                                        className="rounded-full px-3 py-1"
                                                        tone="neutral"
                                                    >
                                                        Search ready
                                                    </StatusBadge>
                                                    <StatusBadge
                                                        className="rounded-full px-3 py-1"
                                                        tone="neutral"
                                                    >
                                                        <SlidersHorizontal className="mr-1 size-3.5" />
                                                        {activeSortLabel}
                                                    </StatusBadge>
                                                </div>
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
                                                    className="rounded-[26px]"
                                                    state="loading"
                                                    title="Loading library data"
                                                />
                                            ) : null}

                                            {!catalog.loading &&
                                            catalog.items.length === 0 ? (
                                                <DashboardFeedbackPanel
                                                    className="rounded-[26px]"
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
