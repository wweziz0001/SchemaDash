import { describe, expect, it } from 'vitest';
import type {
    SavedCollection,
    SavedDiagram,
    SavedProject,
} from '@/context/storage-context/storage-context';
import {
    buildLibraryDiagramItems,
    buildLibraryProjectQuery,
    filterProjectsForLibraryView,
    filterSharedLibraryItems,
    filterSharedProjects,
    sortLibraryItems,
} from '../library-catalog';

const createProject = (overrides: Partial<SavedProject>): SavedProject => ({
    id: 'project-1',
    name: 'Project',
    description: null,
    collectionId: null,
    ownerUserId: 'user-1',
    visibility: 'workspace',
    status: 'active',
    sharingScope: 'authenticated',
    sharingAccess: 'edit',
    access: 'owner',
    diagramCount: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    ...overrides,
});

const createDiagram = (overrides: Partial<SavedDiagram>): SavedDiagram => ({
    id: 'diagram-1',
    projectId: 'project-1',
    ownerUserId: 'user-1',
    name: 'Diagram',
    description: null,
    databaseType: 'postgresql',
    databaseEdition: null,
    visibility: 'workspace',
    status: 'active',
    sharingScope: 'authenticated',
    sharingAccess: 'edit',
    access: 'owner',
    tableCount: 4,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    ...overrides,
});

const createCollection = (
    overrides: Partial<SavedCollection>
): SavedCollection => ({
    id: 'collection-1',
    name: 'Collection',
    description: null,
    ownerUserId: 'user-1',
    projectCount: 1,
    diagramCount: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-03-01T00:00:00.000Z'),
    ...overrides,
});

describe('library-catalog helpers', () => {
    it('builds the expected project query for collection and unorganized views', () => {
        expect(
            buildLibraryProjectQuery({
                view: 'unorganized',
                search: 'orders',
            })
        ).toEqual({
            search: 'orders',
            unassigned: true,
        });

        expect(
            buildLibraryProjectQuery({
                view: 'collection',
                collectionId: 'collection-1',
                search: 'erp',
            })
        ).toEqual({
            search: 'erp',
            collectionId: 'collection-1',
        });
    });

    it('filters deleted projects out of active views and keeps only deleted projects in trash', () => {
        const activeProject = createProject({ id: 'active-project' });
        const deletedProject = createProject({
            id: 'deleted-project',
            status: 'deleted',
        });

        expect(
            filterProjectsForLibraryView([activeProject, deletedProject], 'all')
        ).toEqual([activeProject]);
        expect(
            filterProjectsForLibraryView(
                [activeProject, deletedProject],
                'trash'
            )
        ).toEqual([deletedProject]);
    });

    it('builds shared catalog items and shared projects from mixed ownership data', () => {
        const collection = createCollection({ id: 'collection-1' });
        const ownedProject = createProject({
            id: 'owned-project',
            collectionId: 'collection-1',
            ownerUserId: 'user-1',
            access: 'owner',
        });
        const sharedProject = createProject({
            id: 'shared-project',
            ownerUserId: 'user-2',
            access: 'view',
        });
        const ownedDiagram = createDiagram({
            id: 'owned-diagram',
            projectId: ownedProject.id,
            ownerUserId: 'user-1',
            access: 'owner',
            updatedAt: new Date('2026-03-03T00:00:00.000Z'),
        });
        const sharedDiagram = createDiagram({
            id: 'shared-diagram',
            projectId: sharedProject.id,
            ownerUserId: 'user-2',
            access: 'view',
            updatedAt: new Date('2026-03-04T00:00:00.000Z'),
        });

        const items = buildLibraryDiagramItems({
            collectionById: new Map([[collection.id, collection]]),
            projectDiagrams: [
                {
                    project: ownedProject,
                    diagrams: [ownedDiagram],
                },
                {
                    project: sharedProject,
                    diagrams: [sharedDiagram],
                },
            ],
            userId: 'user-1',
        });

        expect(items).toHaveLength(2);
        expect(filterSharedLibraryItems(items)).toHaveLength(1);
        expect(filterSharedLibraryItems(items)[0]?.diagram.id).toBe(
            'shared-diagram'
        );
        expect(
            filterSharedProjects(
                [
                    { project: ownedProject, diagrams: [ownedDiagram] },
                    { project: sharedProject, diagrams: [sharedDiagram] },
                ],
                'user-1'
            )
        ).toEqual([sharedProject]);
        expect(sortLibraryItems(items, 'updated')[0]?.diagram.id).toBe(
            'shared-diagram'
        );
    });
});
