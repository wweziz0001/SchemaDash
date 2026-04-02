import { useAuth } from '@/hooks/use-auth';
import { useStorage } from '@/hooks/use-storage';
import type {
    SavedCollection,
    SavedProject,
} from '@/context/storage-context/storage-context';
import {
    buildLibraryDiagramItems,
    buildLibraryProjectQuery,
    filterProjectsForLibraryView,
    filterSharedLibraryItems,
    filterSharedProjects,
    sortLibraryItems,
    type LibraryDiagramItem,
    type LibrarySort,
    type LibraryView,
} from '@/lib/dashboard/library-catalog';
import { normalizeSearchTerm } from '@/lib/utils/search';
import {
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useState,
} from 'react';

export const useLibraryCatalog = (options: {
    view: LibraryView;
    collectionId?: string;
    enabled?: boolean;
}) => {
    const { listCollections, listProjects, listProjectDiagrams } = useStorage();
    const { user } = useAuth();
    const [collections, setCollections] = useState<SavedCollection[]>([]);
    const [projects, setProjects] = useState<SavedProject[]>([]);
    const [items, setItems] = useState<LibraryDiagramItem[]>([]);
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const [sort, setSort] = useState<LibrarySort>('updated');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const normalizedSearch = useMemo(
        () => normalizeSearchTerm(deferredSearch),
        [deferredSearch]
    );

    const loadCatalog = useCallback(async () => {
        if (options.enabled === false) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [nextCollections, nextProjects] = await Promise.all([
                listCollections(),
                listProjects(
                    buildLibraryProjectQuery({
                        collectionId: options.collectionId,
                        search: normalizedSearch,
                        view: options.view,
                    })
                ),
            ]);

            const collectionById = new Map(
                nextCollections.map((collection) => [collection.id, collection])
            );
            const visibleProjects = filterProjectsForLibraryView(
                nextProjects,
                options.view,
                options.collectionId
            );
            const projectDiagrams = await Promise.all(
                visibleProjects.map(async (project) => ({
                    project,
                    diagrams: await listProjectDiagrams(project.id, {
                        search: normalizedSearch,
                    }),
                }))
            );
            const nextItems =
                options.view === 'shared'
                    ? filterSharedLibraryItems(
                          buildLibraryDiagramItems({
                              collectionById,
                              projectDiagrams,
                              userId: user?.id,
                          })
                      )
                    : buildLibraryDiagramItems({
                          collectionById,
                          projectDiagrams,
                          userId: user?.id,
                      });

            setCollections(nextCollections);
            setProjects(
                options.view === 'shared'
                    ? filterSharedProjects(projectDiagrams, user?.id)
                    : visibleProjects
            );
            setItems(sortLibraryItems(nextItems, sort));
        } catch (nextError) {
            console.error(nextError);
            setError('Unable to load this library view right now.');
        } finally {
            setLoading(false);
        }
    }, [
        listCollections,
        listProjectDiagrams,
        listProjects,
        normalizedSearch,
        options.collectionId,
        options.enabled,
        options.view,
        sort,
        user?.id,
    ]);

    useEffect(() => {
        void loadCatalog();
    }, [loadCatalog]);

    return {
        collections,
        deferredSearch,
        error,
        items,
        loading,
        normalizedSearch,
        projects,
        refresh: loadCatalog,
        search,
        setSearch,
        sort,
        setSort,
    };
};

export type { LibraryDiagramItem, LibrarySort, LibraryView };
