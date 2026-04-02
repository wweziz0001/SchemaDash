import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import { DashboardFeedbackPanel } from '@/components/dashboard-page/dashboard-feedback-panel';
import { DashboardPageHeader } from '@/components/dashboard-page/dashboard-page-header';
import { MetricCard } from '@/components/metric-card/metric-card';
import { useLibraryCatalog } from './use-library-catalog';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
});

export const TrashPage: React.FC = () => {
    const { collections, error, loading, projects } = useLibraryCatalog({
        view: 'trash',
    });

    return (
        <div className="space-y-6">
            <Helmet>
                <title>SchemaDash - Trash</title>
            </Helmet>

            <DashboardPageHeader
                contentClassName="gap-3"
                title="Trash"
                description="Deleted projects stay visible here so you can audit what has been removed from the main library without losing context about its saved diagram inventory."
            />

            <section className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    detail="Currently held in trash."
                    label="Deleted projects"
                    value={projects.length}
                />
                <MetricCard
                    detail="Diagram summaries still available for audit."
                    label="Contained diagrams"
                    value={projects.reduce(
                        (count, project) => count + project.diagramCount,
                        0
                    )}
                />
                <MetricCard
                    detail="Active collection taxonomy remains intact."
                    label="Collections in workspace"
                    value={collections.length}
                />
            </section>

            {error ? (
                <Alert
                    variant="destructive"
                    className="border-rose-200/80 bg-rose-50/80 dark:border-rose-500/30 dark:bg-rose-500/10"
                >
                    <AlertTitle>Trash unavailable</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : null}

            {loading ? (
                <DashboardFeedbackPanel state="loading" title="Loading trash" />
            ) : null}

            {!loading && projects.length === 0 ? (
                <DashboardFeedbackPanel
                    title="Trash is empty"
                    description="Deleted projects will appear here when they are removed from the main library."
                    icon={<Trash2 className="size-6 text-stone-500" />}
                />
            ) : null}

            {!loading && projects.length > 0 ? (
                <section className="grid gap-4 xl:grid-cols-2">
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            className="border-stone-200/80 bg-white/85 shadow-sm dark:border-stone-800/80 dark:bg-stone-900/80"
                        >
                            <CardHeader>
                                <CardTitle>{project.name}</CardTitle>
                                <CardDescription>
                                    {project.description ??
                                        'Deleted project retained for workspace audit.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 text-sm text-stone-600 dark:text-stone-300 sm:grid-cols-2">
                                <div>{project.diagramCount} diagrams</div>
                                <div>{project.visibility} visibility</div>
                                <div>{project.access} access</div>
                                <div>
                                    Updated{' '}
                                    {dateFormatter.format(project.updatedAt)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </section>
            ) : null}
        </div>
    );
};
