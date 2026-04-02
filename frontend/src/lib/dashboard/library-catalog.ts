import type {
    SavedCollection,
    SavedDiagram,
    SavedProject,
} from '@/context/storage-context/storage-context';

export type LibraryView =
    | 'all'
    | 'shared'
    | 'unorganized'
    | 'trash'
    | 'collection';

export type LibrarySort = 'updated' | 'created' | 'name' | 'tables';

export interface LibraryDiagramItem {
    diagram: SavedDiagram;
    project: SavedProject;
    collection: SavedCollection | null;
    isShared: boolean;
    isOwnedByCurrentUser: boolean;
}

export const isSharedLibraryResource = (
    project: SavedProject,
    diagram: SavedDiagram,
    userId?: string
) => {
    if (!userId) {
        return false;
    }

    return (
        project.access !== 'owner' ||
        diagram.access !== 'owner' ||
        project.ownerUserId !== userId ||
        diagram.ownerUserId !== userId
    );
};

export const sortLibraryItems = (
    items: LibraryDiagramItem[],
    sort: LibrarySort
) => {
    return [...items].sort((left, right) => {
        if (sort === 'name') {
            return left.diagram.name.localeCompare(right.diagram.name);
        }

        if (sort === 'created') {
            return (
                right.diagram.createdAt.getTime() -
                left.diagram.createdAt.getTime()
            );
        }

        if (sort === 'tables') {
            return right.diagram.tableCount - left.diagram.tableCount;
        }

        return (
            right.diagram.updatedAt.getTime() - left.diagram.updatedAt.getTime()
        );
    });
};

export const filterProjectsForLibraryView = (
    projects: SavedProject[],
    view: LibraryView,
    collectionId?: string
) => {
    return projects.filter((project) => {
        if (view === 'trash') {
            return project.status === 'deleted';
        }

        if (project.status === 'deleted') {
            return false;
        }

        if (view === 'unorganized') {
            return project.collectionId === null;
        }

        if (view === 'collection') {
            return project.collectionId === collectionId;
        }

        return true;
    });
};

export const buildLibraryProjectQuery = (options: {
    collectionId?: string;
    search?: string;
    view: LibraryView;
}) => {
    if (options.view === 'unorganized') {
        return {
            search: options.search,
            unassigned: true,
        };
    }

    if (options.view === 'collection' && options.collectionId) {
        return {
            search: options.search,
            collectionId: options.collectionId,
        };
    }

    return {
        search: options.search,
    };
};

export const buildLibraryDiagramItems = (options: {
    collectionById: Map<string, SavedCollection>;
    projectDiagrams: Array<{
        project: SavedProject;
        diagrams: SavedDiagram[];
    }>;
    userId?: string;
}) => {
    return options.projectDiagrams.flatMap(({ project, diagrams }) =>
        diagrams.map((diagram) => ({
            diagram,
            project,
            collection: project.collectionId
                ? (options.collectionById.get(project.collectionId) ?? null)
                : null,
            isShared: isSharedLibraryResource(project, diagram, options.userId),
            isOwnedByCurrentUser:
                project.ownerUserId === options.userId &&
                diagram.ownerUserId === options.userId,
        }))
    );
};

export const filterSharedLibraryItems = (items: LibraryDiagramItem[]) =>
    items.filter((item) => item.isShared);

export const filterSharedProjects = (
    projectDiagrams: Array<{
        project: SavedProject;
        diagrams: SavedDiagram[];
    }>,
    userId?: string
) =>
    projectDiagrams
        .filter(({ project, diagrams }) =>
            diagrams.some((diagram) =>
                isSharedLibraryResource(project, diagram, userId)
            )
        )
        .map(({ project }) => project);
