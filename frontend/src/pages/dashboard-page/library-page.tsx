import React from 'react';
import { Database, Upload } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { DashboardFeedbackPanel } from '@/components/dashboard-page/dashboard-feedback-panel';
import { DashboardPageHeader } from '@/components/dashboard-page/dashboard-page-header';
import { DashboardSearchToolbar } from '@/components/dashboard-page/dashboard-search-toolbar';
import { LibraryDiagramCard } from '@/components/dashboard-page/library-diagram-card';
import { MetricCard } from '@/components/metric-card/metric-card';
import type {
    LibraryDiagramItem,
    LibrarySort,
} from '@/lib/dashboard/library-catalog';

const sortOptions: Array<{ label: string; value: LibrarySort }> = [
    { label: 'Last updated', value: 'updated' },
    { label: 'Created', value: 'created' },
    { label: 'Name', value: 'name' },
    { label: 'Table count', value: 'tables' },
];

export const LibraryPage = ({
    emptyState,
    error,
    items,
    loading,
    metrics,
    search,
    setSearch,
    sort,
    setSort,
    subtitle,
    title,
}: {
    emptyState: {
        description: string;
        title: string;
    };
    error: string | null;
    items: LibraryDiagramItem[];
    loading: boolean;
    metrics: {
        collections: number;
        diagrams: number;
        projects: number;
    };
    search: string;
    setSearch: (value: string) => void;
    sort: LibrarySort;
    setSort: (value: LibrarySort) => void;
    subtitle: string;
    title: string;
}) => (
    <div className="space-y-6">
        <Helmet>
            <title>{`SchemaDash - ${title}`}</title>
        </Helmet>

        <DashboardPageHeader
            badge={
                <Badge
                    variant="outline"
                    className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                >
                    Main library
                </Badge>
            }
            title={title}
            description={subtitle}
            actions={
                <>
                    <Button
                        asChild
                        variant="outline"
                        className="rounded-xl border-stone-200 bg-transparent text-stone-700 hover:bg-stone-100 hover:text-stone-950 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-stone-50"
                    >
                        <Link to="/workspace?action=import">
                            <Upload className="mr-2 size-4" />
                            Import
                        </Link>
                    </Button>
                    <Button
                        asChild
                        className="rounded-xl bg-stone-950 text-stone-50 hover:bg-stone-900 dark:bg-amber-300 dark:text-stone-950 dark:hover:bg-amber-200"
                    >
                        <Link to="/workspace?action=create">
                            Create diagram
                        </Link>
                    </Button>
                </>
            }
        />

        <section className="grid gap-4 md:grid-cols-3">
            <MetricCard
                description="Visible in this view."
                title="Diagrams"
                value={metrics.diagrams}
            />
            <MetricCard
                description="Projects represented here."
                title="Projects"
                value={metrics.projects}
            />
            <MetricCard
                description="Collections currently synced."
                title="Collections"
                value={metrics.collections}
            />
        </section>

        <DashboardSearchToolbar
            inputLabel={`${title} search`}
            onSearchChange={setSearch}
            placeholder="Search diagrams, projects, descriptions, and collections"
            search={search}
        >
            <Select
                onValueChange={(value) => setSort(value as LibrarySort)}
                value={sort}
            >
                <SelectTrigger className="h-11 w-full rounded-xl border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-950/70 lg:w-[220px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </DashboardSearchToolbar>

        {error ? (
            <Alert
                variant="destructive"
                className="border-rose-200/80 bg-rose-50/80 dark:border-rose-500/30 dark:bg-rose-500/10"
            >
                <AlertTitle>Library unavailable</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : null}

        {loading ? (
            <DashboardFeedbackPanel
                state="loading"
                title="Loading library data"
            />
        ) : null}

        {!loading && items.length === 0 ? (
            <DashboardFeedbackPanel
                title={emptyState.title}
                description={emptyState.description}
                icon={<Database className="size-6 text-stone-500" />}
            />
        ) : null}

        {!loading && items.length > 0 ? (
            <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                {items.map((item) => (
                    <LibraryDiagramCard
                        key={`${item.project.id}-${item.diagram.id}`}
                        item={item}
                    />
                ))}
            </section>
        ) : null}
    </div>
);
