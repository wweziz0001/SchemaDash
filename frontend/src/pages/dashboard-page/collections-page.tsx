import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FolderKanban } from 'lucide-react';
import { Link, useOutletContext } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import { Button } from '@/components/button/button';
import { DashboardFeedbackPanel } from '@/components/dashboard-page/dashboard-feedback-panel';
import { DashboardPageHeader } from '@/components/dashboard-page/dashboard-page-header';
import { DashboardSearchToolbar } from '@/components/dashboard-page/dashboard-search-toolbar';
import type { DashboardShellContextValue } from './dashboard-shell-context';
import { normalizeSearchTerm } from './use-library-catalog';

export const CollectionsPage: React.FC = () => {
    const { collections, loadingCollections } =
        useOutletContext<DashboardShellContextValue>();
    const [search, setSearch] = useState('');
    const normalizedSearch = useMemo(
        () => normalizeSearchTerm(search)?.toLowerCase(),
        [search]
    );

    const filteredCollections = useMemo(() => {
        if (!normalizedSearch) {
            return collections;
        }

        return collections.filter((collection) =>
            [collection.name, collection.description]
                .filter(Boolean)
                .some((value) =>
                    value?.toLowerCase().includes(normalizedSearch)
                )
        );
    }, [collections, normalizedSearch]);

    return (
        <div className="space-y-6">
            <Helmet>
                <title>SchemaDash - Collections</title>
            </Helmet>

            <DashboardPageHeader
                contentClassName="gap-3"
                title="Collections"
                description="Collections give your saved projects a durable information architecture, making it easier to browse teams, domains, and long-lived schema work."
            />

            <DashboardSearchToolbar
                inputLabel="Collections search"
                onSearchChange={setSearch}
                placeholder="Search collections"
                search={search}
            />

            {loadingCollections ? (
                <DashboardFeedbackPanel
                    state="loading"
                    title="Loading collections"
                />
            ) : null}

            {!loadingCollections && filteredCollections.length === 0 ? (
                <DashboardFeedbackPanel
                    title="No collections found"
                    description="Collections created through the saved project flows will show up here automatically."
                    icon={<FolderKanban className="size-6 text-stone-500" />}
                />
            ) : null}

            {!loadingCollections && filteredCollections.length > 0 ? (
                <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                    {filteredCollections.map((collection) => (
                        <Card
                            key={collection.id}
                            className="border-stone-200/80 bg-white/85 shadow-sm dark:border-stone-800/80 dark:bg-stone-900/80"
                        >
                            <CardHeader>
                                <CardTitle>{collection.name}</CardTitle>
                                <CardDescription>
                                    {collection.description ??
                                        'Use this collection to group related SchemaDash projects.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 text-sm text-stone-600 dark:text-stone-300 sm:grid-cols-2">
                                    <div>
                                        {collection.projectCount} projects
                                    </div>
                                    <div>
                                        {collection.diagramCount} diagrams
                                    </div>
                                </div>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full rounded-xl border-stone-200 bg-transparent text-stone-700 hover:bg-stone-100 hover:text-stone-950 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-stone-50"
                                >
                                    <Link to={`/collections/${collection.id}`}>
                                        Open collection
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </section>
            ) : null}
        </div>
    );
};
