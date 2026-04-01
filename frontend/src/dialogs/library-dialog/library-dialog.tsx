import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import { LibraryPage } from '@/pages/dashboard-page/library-page';
import { useLibraryCatalog } from '@/pages/dashboard-page/use-library-catalog';

export interface LibraryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const LibraryDialog: React.FC<LibraryDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const {
        collections,
        error,
        items,
        loading,
        projects,
        search,
        setSearch,
        sort,
        setSort,
    } = useLibraryCatalog({
        view: 'all',
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                blurBackground
                className="max-h-[90vh] max-w-[min(1200px,calc(100vw-1.5rem))] rounded-[28px] border-stone-200/80 bg-white/95 p-0 shadow-2xl shadow-stone-950/10 dark:border-stone-800/80 dark:bg-stone-950/95 dark:shadow-black/30"
                showClose
            >
                <DialogHeader className="sr-only">
                    <DialogTitle>Library</DialogTitle>
                    <DialogDescription>
                        Browse saved diagrams without leaving the editor.
                    </DialogDescription>
                </DialogHeader>
                <DialogInternalContent className="max-h-[90vh]">
                    <div className="p-4 md:p-6">
                        <LibraryPage
                            emptyState={{
                                title: 'No saved diagrams yet',
                                description:
                                    'Create a new diagram or import an existing schema to turn this library into your main SchemaDash workspace.',
                            }}
                            error={error}
                            items={items}
                            loading={loading}
                            metrics={{
                                collections: collections.length,
                                diagrams: items.length,
                                projects: projects.length,
                            }}
                            search={search}
                            setSearch={setSearch}
                            sort={sort}
                            setSort={setSort}
                            subtitle="Browse every saved diagram you can access, keep projects organized, and jump back into schema work from one intentional landing page."
                            title="All Diagrams"
                        />
                    </div>
                </DialogInternalContent>
            </DialogContent>
        </Dialog>
    );
};
