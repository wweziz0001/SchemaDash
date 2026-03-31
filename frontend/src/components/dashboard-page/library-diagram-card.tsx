import React from 'react';
import {
    ArrowRight,
    Clock3,
    Database,
    FolderKanban,
    Layers3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import type { LibraryDiagramItem } from '@/pages/dashboard-page/use-library-catalog';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
});

export const LibraryDiagramCard: React.FC<{ item: LibraryDiagramItem }> = ({
    item,
}) => (
    <Card className="group border-stone-200/80 bg-white/85 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-stone-800/80 dark:bg-stone-900/80">
        <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <CardTitle className="truncate text-xl">
                        {item.diagram.name}
                    </CardTitle>
                    <CardDescription className="mt-2 line-clamp-2 min-h-10 text-sm leading-6">
                        {item.diagram.description ??
                            item.project.description ??
                            'Saved schema diagram ready for editing, review, and sharing.'}
                    </CardDescription>
                </div>
                <Badge
                    variant="outline"
                    className="border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                >
                    {item.diagram.databaseType}
                </Badge>
            </div>

            <div className="flex flex-wrap gap-2">
                {item.isShared ? (
                    <Badge
                        variant="outline"
                        className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
                    >
                        Shared access
                    </Badge>
                ) : null}
                <Badge
                    variant="outline"
                    className="border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                >
                    {item.project.name}
                </Badge>
                <Badge
                    variant="outline"
                    className="border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
                >
                    {item.collection?.name ?? 'Unorganized'}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm text-stone-600 dark:text-stone-300 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                    <Database className="size-4 text-stone-400" />
                    <span>{item.diagram.tableCount} tables</span>
                </div>
                <div className="flex items-center gap-2">
                    <Layers3 className="size-4 text-stone-400" />
                    <span>{item.diagram.visibility}</span>
                </div>
                <div className="flex items-center gap-2">
                    <FolderKanban className="size-4 text-stone-400" />
                    <span>{item.project.diagramCount} saved diagrams</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-stone-400" />
                    <span>{dateFormatter.format(item.diagram.updatedAt)}</span>
                </div>
            </div>

            <Button
                asChild
                variant="outline"
                className="w-full justify-between rounded-xl border-stone-200 bg-transparent text-stone-700 hover:bg-stone-100 hover:text-stone-950 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-stone-50"
            >
                <Link to={`/diagrams/${item.diagram.id}`}>
                    Open diagram
                    <ArrowRight className="size-4" />
                </Link>
            </Button>
        </CardContent>
    </Card>
);
