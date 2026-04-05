import React, {
    useCallback,
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { FolderKanban, FolderOpen, Search } from 'lucide-react';
import { Button } from '@/components/button/button';
import { DiagramIcon } from '@/components/diagram-icon/diagram-icon';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/table/table';
import { Input } from '@/components/input/input';
import { useAlert } from '@/context/alert-context/alert-context';
import type {
    SavedCollection,
    SavedDiagram,
    SavedProject,
} from '@/context/storage-context/storage-context';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useConfig } from '@/hooks/use-config';
import { useDialog } from '@/hooks/use-dialog';
import { useStorage } from '@/hooks/use-storage';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import type { DatabaseType } from '@/lib/domain/database-type';
import { cn } from '@/lib/utils';
import { matchesSearch, normalizeSearchTerm } from '@/lib/utils/search';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { DiagramRowActionsMenu } from './diagram-row-actions-menu/diagram-row-actions-menu';
import { SharingSettingsDialog } from './sharing-settings-dialog';
import { useSharingSettingsDialogApi } from './use-sharing-settings-dialog-api';

const ALL_COLLECTION_VALUE = '__all__';
const UNASSIGNED_COLLECTION_VALUE = '__unassigned__';
const libraryPaneClasses =
    'flex min-h-0 flex-col rounded-2xl border border-border/70 bg-muted/20 p-3 shadow-sm';
const paneIconClasses =
    'flex size-9 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground shadow-sm';
const statusChipClasses =
    'inline-flex items-center rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground';

const SelectableListButton = ({
    title,
    description,
    meta,
    selected,
    onClick,
}: {
    title: React.ReactNode;
    description?: React.ReactNode;
    meta?: React.ReactNode;
    selected?: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        className={cn(
            'rounded-xl border border-border/70 bg-background px-3 py-3 text-left transition-all hover:border-border hover:bg-accent/40',
            selected && 'border-foreground/20 bg-accent shadow-sm'
        )}
        onClick={onClick}
    >
        <div className="truncate text-sm font-medium text-foreground">
            {title}
        </div>
        {description ? (
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {description}
            </div>
        ) : null}
        {meta ? (
            <div className="mt-1 text-xs text-muted-foreground">{meta}</div>
        ) : null}
    </button>
);

const LibraryPaneHeader = ({
    icon: Icon,
    title,
    description,
    badge,
    action,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: React.ReactNode;
    description?: React.ReactNode;
    badge?: React.ReactNode;
    action?: React.ReactNode;
}) => (
    <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
                <div className={paneIconClasses}>
                    <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold text-foreground">
                            {title}
                        </h2>
                        {badge ? (
                            <span className={statusChipClasses}>{badge}</span>
                        ) : null}
                    </div>
                    {description ? (
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
    </div>
);

export interface OpenDiagramDialogProps extends BaseDialogProps {
    canClose?: boolean;
}

export const OpenDiagramDialog: React.FC<OpenDiagramDialogProps> = ({
    dialog,
    canClose = true,
}) => {
    const { closeOpenDiagramDialog, openCreateDiagramDialog } = useDialog();
    const { t } = useTranslation();
    const { updateConfig } = useConfig();
    const navigate = useNavigate();
    const {
        listCollections,
        createCollection,
        updateCollection,
        deleteCollection,
        listProjects,
        createProject,
        updateProject,
        deleteProject,
        listProjectDiagrams,
        updateSavedDiagram,
        deleteDiagram,
    } = useStorage();
    const sharingApi = useSharingSettingsDialogApi();
    const { showAlert } = useAlert();
    const { diagramId: currentDiagramId, loadDiagram } = useSchemaDash();
    const [collections, setCollections] = useState<SavedCollection[]>([]);
    const [projects, setProjects] = useState<SavedProject[]>([]);
    const [diagrams, setDiagrams] = useState<SavedDiagram[]>([]);
    const [selectedCollectionId, setSelectedCollectionId] =
        useState(ALL_COLLECTION_VALUE);
    const [selectedProjectId, setSelectedProjectId] = useState<
        string | undefined
    >();
    const [selectedDiagramId, setSelectedDiagramId] = useState<
        string | undefined
    >();
    const [searchTerm, setSearchTerm] = useState('');
    const [sharingSubject, setSharingSubject] = useState<{
        type: 'project' | 'diagram';
        id: string;
        name: string;
    } | null>(null);
    const lastAppliedSearchTermRef = useRef<string | undefined>();
    const deferredSearchInput = useDeferredValue(searchTerm);
    const normalizedSearchTerm = useMemo(
        () => normalizeSearchTerm(deferredSearchInput, { lowerCase: true }),
        [deferredSearchInput]
    );

    const selectedCollection = useMemo(
        () =>
            collections.find(
                (collection) => collection.id === selectedCollectionId
            ),
        [collections, selectedCollectionId]
    );

    const collectionNameById = useMemo(
        () =>
            new Map(
                collections.map((collection) => [
                    collection.id,
                    collection.name,
                ])
            ),
        [collections]
    );

    const filteredProjects = useMemo(() => {
        if (selectedCollectionId === ALL_COLLECTION_VALUE) {
            return projects;
        }

        if (selectedCollectionId === UNASSIGNED_COLLECTION_VALUE) {
            return projects.filter((project) => project.collectionId === null);
        }

        return projects.filter(
            (project) => project.collectionId === selectedCollectionId
        );
    }, [projects, selectedCollectionId]);

    const selectedProject = useMemo(
        () =>
            filteredProjects.find(
                (project) => project.id === selectedProjectId
            ),
        [filteredProjects, selectedProjectId]
    );

    const selectedDiagram = useMemo(
        () => diagrams.find((diagram) => diagram.id === selectedDiagramId),
        [diagrams, selectedDiagramId]
    );

    const totalProjectCount = projects.length;
    const unassignedProjectCount = useMemo(
        () =>
            projects.filter((project) => project.collectionId === null).length,
        [projects]
    );
    const projectCountByCollectionId = useMemo(() => {
        return projects.reduce((counts, project) => {
            if (project.collectionId) {
                counts.set(
                    project.collectionId,
                    (counts.get(project.collectionId) ?? 0) + 1
                );
            }
            return counts;
        }, new Map<string, number>());
    }, [projects]);
    const visibleCollections = useMemo(() => {
        if (!normalizedSearchTerm) {
            return collections;
        }

        return collections.filter(
            (collection) =>
                collection.id === selectedCollectionId ||
                matchesSearch(
                    [collection.name, collection.description],
                    normalizedSearchTerm
                ) ||
                (projectCountByCollectionId.get(collection.id) ?? 0) > 0
        );
    }, [
        collections,
        normalizedSearchTerm,
        projectCountByCollectionId,
        selectedCollectionId,
    ]);

    const fetchLibrary = useCallback(
        async (nextSearchTerm?: string) => {
            const [nextCollections, nextProjects] = await Promise.all([
                listCollections(),
                listProjects({ search: nextSearchTerm }),
            ]);
            setCollections(nextCollections);
            setProjects(nextProjects);
        },
        [listCollections, listProjects]
    );

    const fetchProjects = useCallback(
        async (nextSearchTerm?: string) => {
            const nextProjects = await listProjects({ search: nextSearchTerm });
            setProjects(nextProjects);
        },
        [listProjects]
    );

    const fetchProjectDiagrams = useCallback(
        async (projectId: string, nextSearchTerm?: string) => {
            const project = projects.find((item) => item.id === projectId);
            const collection = project?.collectionId
                ? collections.find((item) => item.id === project.collectionId)
                : undefined;
            const shouldShowAllProjectDiagrams = matchesSearch(
                [
                    project?.name,
                    project?.description,
                    collection?.name,
                    collection?.description,
                ],
                nextSearchTerm
            );
            const nextDiagrams = await listProjectDiagrams(projectId, {
                search: shouldShowAllProjectDiagrams
                    ? undefined
                    : nextSearchTerm,
            });
            setDiagrams(nextDiagrams);
            setSelectedDiagramId((currentDiagramSelection) => {
                if (
                    currentDiagramSelection &&
                    nextDiagrams.some(
                        (diagram) => diagram.id === currentDiagramSelection
                    )
                ) {
                    return currentDiagramSelection;
                }

                return nextDiagrams[0]?.id;
            });
        },
        [collections, listProjectDiagrams, projects]
    );

    useEffect(() => {
        if (!dialog.open) {
            return;
        }

        setSearchTerm('');
        lastAppliedSearchTermRef.current = undefined;
        setDiagrams([]);
        setSelectedDiagramId(undefined);
        void fetchLibrary();
    }, [dialog.open, fetchLibrary]);

    useEffect(() => {
        if (!dialog.open) {
            return;
        }

        if (lastAppliedSearchTermRef.current === normalizedSearchTerm) {
            return;
        }

        lastAppliedSearchTermRef.current = normalizedSearchTerm;
        if (normalizedSearchTerm) {
            void fetchProjects(normalizedSearchTerm);
            return;
        }

        void fetchLibrary();
    }, [dialog.open, fetchLibrary, fetchProjects, normalizedSearchTerm]);

    useEffect(() => {
        if (!dialog.open) {
            return;
        }

        setSelectedProjectId((currentProjectId) => {
            if (
                currentProjectId &&
                filteredProjects.some(
                    (project) => project.id === currentProjectId
                )
            ) {
                return currentProjectId;
            }

            return filteredProjects[0]?.id;
        });
    }, [dialog.open, filteredProjects]);

    useEffect(() => {
        if (!dialog.open || !selectedProjectId) {
            setDiagrams([]);
            setSelectedDiagramId(undefined);
            return;
        }

        void fetchProjectDiagrams(selectedProjectId, normalizedSearchTerm);
    }, [
        dialog.open,
        fetchProjectDiagrams,
        normalizedSearchTerm,
        selectedProjectId,
    ]);

    const openDiagram = useCallback(
        (diagramId: string) => {
            if (!diagramId) {
                return;
            }

            updateConfig({ config: { defaultDiagramId: diagramId } });
            navigate(`/diagrams/${diagramId}`);
        },
        [navigate, updateConfig]
    );

    const promptForName = useCallback((title: string, value = '') => {
        const result = window.prompt(title, value)?.trim();
        return result && result.length > 0 ? result : undefined;
    }, []);

    const promptForDescription = useCallback((title: string, value = '') => {
        const result = window.prompt(title, value)?.trim();
        return result && result.length > 0 ? result : null;
    }, []);

    const handleCreateCollection = useCallback(async () => {
        const name = promptForName(
            t('open_diagram_dialog.collection_actions.create_prompt')
        );
        if (!name) {
            return;
        }

        const description = promptForDescription(
            t('open_diagram_dialog.collection_actions.description_prompt')
        );
        const collection = await createCollection({
            name,
            description,
        });
        await fetchLibrary(normalizedSearchTerm);
        setSelectedCollectionId(collection.id);
    }, [
        createCollection,
        fetchLibrary,
        normalizedSearchTerm,
        promptForDescription,
        promptForName,
        t,
    ]);

    const handleRenameCollection = useCallback(async () => {
        if (!selectedCollection) {
            return;
        }

        const name = promptForName(
            t('open_diagram_dialog.collection_actions.rename_prompt'),
            selectedCollection.name
        );
        if (!name) {
            return;
        }

        const description = promptForDescription(
            t('open_diagram_dialog.collection_actions.description_prompt'),
            selectedCollection.description ?? ''
        );

        await updateCollection(selectedCollection.id, {
            name,
            description,
        });
        await fetchLibrary(normalizedSearchTerm);
    }, [
        fetchLibrary,
        normalizedSearchTerm,
        promptForDescription,
        promptForName,
        selectedCollection,
        t,
        updateCollection,
    ]);

    const handleDeleteCollection = useCallback(() => {
        if (!selectedCollection) {
            return;
        }

        showAlert({
            title: t('open_diagram_dialog.collection_actions.delete'),
            description: t(
                'open_diagram_dialog.collection_actions.delete_description',
                {
                    name: selectedCollection.name,
                }
            ),
            closeLabel: t('clear_diagram_alert.cancel'),
            actionLabel: t('delete_diagram_alert.delete'),
            onAction: async () => {
                await deleteCollection(selectedCollection.id);
                setSelectedCollectionId(ALL_COLLECTION_VALUE);
                await fetchLibrary(normalizedSearchTerm);
            },
        });
    }, [
        deleteCollection,
        fetchLibrary,
        normalizedSearchTerm,
        selectedCollection,
        showAlert,
        t,
    ]);

    const handleCreateProject = useCallback(async () => {
        const name = promptForName(
            t('open_diagram_dialog.project_actions.create_prompt')
        );
        if (!name) {
            return;
        }

        const description = promptForDescription(
            t('open_diagram_dialog.project_actions.description_prompt')
        );
        const project = await createProject({
            name,
            description,
            collectionId:
                selectedCollectionId === ALL_COLLECTION_VALUE ||
                selectedCollectionId === UNASSIGNED_COLLECTION_VALUE
                    ? null
                    : selectedCollectionId,
        });
        await fetchLibrary(normalizedSearchTerm);
        setSelectedProjectId(project.id);
    }, [
        createProject,
        fetchLibrary,
        normalizedSearchTerm,
        promptForDescription,
        promptForName,
        selectedCollectionId,
        t,
    ]);

    const handleRenameProject = useCallback(async () => {
        if (!selectedProject) {
            return;
        }

        const name = promptForName(
            t('open_diagram_dialog.project_actions.rename_prompt'),
            selectedProject.name
        );
        if (!name) {
            return;
        }

        const description = promptForDescription(
            t('open_diagram_dialog.project_actions.description_prompt'),
            selectedProject.description ?? ''
        );

        await updateProject(selectedProject.id, {
            name,
            description,
        });
        await fetchLibrary(normalizedSearchTerm);
    }, [
        fetchLibrary,
        normalizedSearchTerm,
        promptForDescription,
        promptForName,
        selectedProject,
        t,
        updateProject,
    ]);

    const handleMoveProject = useCallback(
        async (nextCollectionValue: string) => {
            if (!selectedProject) {
                return;
            }

            await updateProject(selectedProject.id, {
                collectionId:
                    nextCollectionValue === UNASSIGNED_COLLECTION_VALUE
                        ? null
                        : nextCollectionValue,
            });
            await fetchLibrary(normalizedSearchTerm);
        },
        [fetchLibrary, normalizedSearchTerm, selectedProject, updateProject]
    );

    const handleDeleteProject = useCallback(() => {
        if (!selectedProject) {
            return;
        }

        showAlert({
            title: t('open_diagram_dialog.project_actions.delete'),
            description: t(
                'open_diagram_dialog.project_actions.delete_description',
                {
                    name: selectedProject.name,
                }
            ),
            closeLabel: t('clear_diagram_alert.cancel'),
            actionLabel: t('delete_diagram_alert.delete'),
            onAction: async () => {
                const diagramsInProject = await listProjectDiagrams(
                    selectedProject.id
                );
                await deleteProject(selectedProject.id);
                if (
                    diagramsInProject.some(
                        (diagram) => diagram.id === currentDiagramId
                    )
                ) {
                    navigate('/');
                }
                await fetchLibrary(normalizedSearchTerm);
            },
        });
    }, [
        currentDiagramId,
        deleteProject,
        fetchLibrary,
        listProjectDiagrams,
        navigate,
        normalizedSearchTerm,
        selectedProject,
        showAlert,
        t,
    ]);

    const handleRenameDiagram = useCallback(
        async (diagram: SavedDiagram) => {
            const name = promptForName(
                t('open_diagram_dialog.diagram_actions.rename_prompt'),
                diagram.name
            );
            if (!name) {
                return;
            }

            await updateSavedDiagram(diagram.id, {
                name,
                description: diagram.description,
                projectId: diagram.projectId,
            });

            if (diagram.id === currentDiagramId) {
                await loadDiagram(diagram.id);
            }

            await fetchProjectDiagrams(diagram.projectId, normalizedSearchTerm);
            await fetchLibrary(normalizedSearchTerm);
        },
        [
            currentDiagramId,
            fetchLibrary,
            fetchProjectDiagrams,
            loadDiagram,
            normalizedSearchTerm,
            promptForName,
            t,
            updateSavedDiagram,
        ]
    );

    const handleDeleteDiagram = useCallback(
        (diagram: SavedDiagram) => {
            showAlert({
                title: t('delete_diagram_alert.title'),
                description: t('delete_diagram_alert.description'),
                closeLabel: t('delete_diagram_alert.cancel'),
                actionLabel: t('delete_diagram_alert.delete'),
                onAction: async () => {
                    await deleteDiagram(diagram.id);
                    if (diagram.id === currentDiagramId) {
                        navigate('/');
                    }
                    await fetchLibrary(normalizedSearchTerm);
                    await fetchProjectDiagrams(
                        diagram.projectId,
                        normalizedSearchTerm
                    );
                },
            });
        },
        [
            currentDiagramId,
            deleteDiagram,
            fetchLibrary,
            fetchProjectDiagrams,
            navigate,
            normalizedSearchTerm,
            showAlert,
            t,
        ]
    );

    const handleOpenProjectSharing = useCallback(() => {
        if (!selectedProject || selectedProject.localOnly) {
            return;
        }

        setSharingSubject({
            type: 'project',
            id: selectedProject.id,
            name: selectedProject.name,
        });
    }, [selectedProject]);

    const handleOpenDiagramSharing = useCallback((diagram: SavedDiagram) => {
        if (diagram.localOnly) {
            return;
        }

        setSharingSubject({
            type: 'diagram',
            id: diagram.id,
            name: diagram.name,
        });
    }, []);

    const projectSectionTitle = selectedCollection
        ? selectedCollection.name
        : selectedCollectionId === UNASSIGNED_COLLECTION_VALUE
          ? t('open_diagram_dialog.unassigned_collection')
          : t('open_diagram_dialog.all_projects');

    const projectSectionDescription = selectedCollection?.description
        ? selectedCollection.description
        : selectedCollectionId === UNASSIGNED_COLLECTION_VALUE
          ? t('open_diagram_dialog.unassigned_collection_description')
          : t('open_diagram_dialog.all_projects_description');

    const formatSharingSummary = useCallback(
        (
            scope: SavedProject['sharingScope'],
            access: SavedProject['sharingAccess']
        ) => {
            if (scope === 'private') {
                return t('open_diagram_dialog.sharing.mode_private');
            }

            if (scope === 'authenticated') {
                return access === 'edit'
                    ? t('open_diagram_dialog.sharing.authenticated_edit')
                    : t('open_diagram_dialog.sharing.authenticated_view');
            }

            return access === 'edit'
                ? 'Anyone with the link can edit'
                : t('open_diagram_dialog.sharing.link_view');
        },
        [t]
    );

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open && canClose) {
                    closeOpenDiagramDialog();
                }
            }}
        >
            <DialogContent
                className="flex h-[42rem] max-h-[92vh] w-[min(96vw,88rem)] max-w-none flex-col gap-0 overflow-hidden rounded-[24px] border-border/70 p-0 shadow-2xl"
                showClose={canClose}
            >
                <div className="border-b border-border/70 p-5 sm:px-6">
                    <DialogHeader className="gap-1 pr-8">
                        <DialogTitle>
                            {t('open_diagram_dialog.title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('open_diagram_dialog.description')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-5 rounded-2xl border border-border/70 bg-muted/20 p-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="open-diagram-search"
                                className="text-xs font-medium text-muted-foreground"
                            >
                                {t('open_diagram_dialog.search_label')}
                            </label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="open-diagram-search"
                                    value={searchTerm}
                                    onChange={(event) =>
                                        setSearchTerm(event.target.value)
                                    }
                                    className="h-11 rounded-xl border-border/70 bg-background pl-10 shadow-none"
                                    placeholder={t(
                                        'open_diagram_dialog.search_placeholder'
                                    )}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t('open_diagram_dialog.search_help')}
                            </p>
                        </div>
                    </div>
                </div>

                <DialogInternalContent className="min-h-0 flex-1 p-5 sm:px-6">
                    <div className="grid h-full gap-4 xl:grid-cols-[240px_280px_minmax(0,1fr)]">
                        <div className={libraryPaneClasses}>
                            <LibraryPaneHeader
                                icon={FolderKanban}
                                title={t('open_diagram_dialog.collections')}
                                description={t(
                                    'open_diagram_dialog.all_projects_description'
                                )}
                                badge={t(
                                    'open_diagram_dialog.collection_count',
                                    {
                                        count: totalProjectCount,
                                    }
                                )}
                                action={
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        className="rounded-xl"
                                        onClick={handleCreateCollection}
                                    >
                                        {t(
                                            'open_diagram_dialog.collection_actions.create'
                                        )}
                                    </Button>
                                }
                            />

                            <div className="mt-4 flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="flex-1 rounded-xl"
                                    disabled={!selectedCollection}
                                    onClick={() =>
                                        void handleRenameCollection()
                                    }
                                >
                                    {t(
                                        'open_diagram_dialog.collection_actions.rename'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="flex-1 rounded-xl"
                                    disabled={!selectedCollection}
                                    onClick={handleDeleteCollection}
                                >
                                    {t(
                                        'open_diagram_dialog.collection_actions.delete'
                                    )}
                                </Button>
                            </div>

                            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1">
                                <SelectableListButton
                                    title={t(
                                        'open_diagram_dialog.all_projects'
                                    )}
                                    meta={t(
                                        'open_diagram_dialog.collection_count',
                                        {
                                            count: totalProjectCount,
                                        }
                                    )}
                                    selected={
                                        selectedCollectionId ===
                                        ALL_COLLECTION_VALUE
                                    }
                                    onClick={() =>
                                        setSelectedCollectionId(
                                            ALL_COLLECTION_VALUE
                                        )
                                    }
                                />
                                <SelectableListButton
                                    title={t(
                                        'open_diagram_dialog.unassigned_collection'
                                    )}
                                    description={t(
                                        'open_diagram_dialog.unassigned_collection_description'
                                    )}
                                    meta={t(
                                        'open_diagram_dialog.collection_count',
                                        {
                                            count: unassignedProjectCount,
                                        }
                                    )}
                                    selected={
                                        selectedCollectionId ===
                                        UNASSIGNED_COLLECTION_VALUE
                                    }
                                    onClick={() =>
                                        setSelectedCollectionId(
                                            UNASSIGNED_COLLECTION_VALUE
                                        )
                                    }
                                />

                                {visibleCollections.length === 0 ? (
                                    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border/70 bg-background px-4 text-center text-sm text-muted-foreground">
                                        {normalizedSearchTerm
                                            ? t(
                                                  'open_diagram_dialog.empty_search_collections',
                                                  {
                                                      search: deferredSearchInput.trim(),
                                                  }
                                              )
                                            : t(
                                                  'open_diagram_dialog.empty_collections'
                                              )}
                                    </div>
                                ) : (
                                    visibleCollections.map((collection) => (
                                        <SelectableListButton
                                            key={collection.id}
                                            title={collection.name}
                                            description={
                                                collection.description ??
                                                undefined
                                            }
                                            meta={t(
                                                'open_diagram_dialog.collection_count',
                                                {
                                                    count:
                                                        projectCountByCollectionId.get(
                                                            collection.id
                                                        ) ??
                                                        collection.projectCount,
                                                }
                                            )}
                                            selected={
                                                selectedCollectionId ===
                                                collection.id
                                            }
                                            onClick={() =>
                                                setSelectedCollectionId(
                                                    collection.id
                                                )
                                            }
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        <div className={libraryPaneClasses}>
                            <LibraryPaneHeader
                                icon={FolderOpen}
                                title={projectSectionTitle}
                                description={projectSectionDescription}
                                badge={t('open_diagram_dialog.project_count', {
                                    count: filteredProjects.length,
                                })}
                                action={
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        className="rounded-xl"
                                        onClick={handleCreateProject}
                                    >
                                        {t(
                                            'open_diagram_dialog.project_actions.create'
                                        )}
                                    </Button>
                                }
                            />

                            <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1">
                                {filteredProjects.length === 0 ? (
                                    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border/70 bg-background px-4 text-center text-sm text-muted-foreground">
                                        {normalizedSearchTerm
                                            ? t(
                                                  'open_diagram_dialog.empty_search_projects',
                                                  {
                                                      search: deferredSearchInput.trim(),
                                                  }
                                              )
                                            : t(
                                                  'open_diagram_dialog.empty_projects'
                                              )}
                                    </div>
                                ) : (
                                    filteredProjects.map((project) => (
                                        <SelectableListButton
                                            key={project.id}
                                            title={project.name}
                                            description={
                                                project.description ??
                                                (project.collectionId
                                                    ? collectionNameById.get(
                                                          project.collectionId
                                                      )
                                                    : t(
                                                          'open_diagram_dialog.unassigned_collection'
                                                      ))
                                            }
                                            meta={t(
                                                'open_diagram_dialog.project_count',
                                                {
                                                    count: project.diagramCount,
                                                }
                                            )}
                                            selected={
                                                selectedProjectId === project.id
                                            }
                                            onClick={() =>
                                                setSelectedProjectId(project.id)
                                            }
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-col rounded-2xl border border-border/70 bg-muted/10 shadow-sm">
                            <div className="border-b border-border/70 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="truncate text-base font-semibold">
                                                {selectedProject?.name ??
                                                    t(
                                                        'open_diagram_dialog.no_project_selected'
                                                    )}
                                            </h2>
                                            {selectedProject ? (
                                                <span
                                                    className={
                                                        statusChipClasses
                                                    }
                                                >
                                                    {t(
                                                        'open_diagram_dialog.project_count',
                                                        {
                                                            count: selectedProject.diagramCount,
                                                        }
                                                    )}
                                                </span>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {selectedProject?.description ??
                                                (selectedProject
                                                    ? t(
                                                          'open_diagram_dialog.project_count',
                                                          {
                                                              count: selectedProject.diagramCount,
                                                          }
                                                      )
                                                    : t(
                                                          'open_diagram_dialog.no_project_selected'
                                                      ))}
                                        </p>
                                        {selectedProject ? (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span
                                                    className={
                                                        statusChipClasses
                                                    }
                                                >
                                                    {t(
                                                        'open_diagram_dialog.project_fields.collection'
                                                    )}
                                                    {' · '}
                                                    {selectedProject.collectionId
                                                        ? collectionNameById.get(
                                                              selectedProject.collectionId
                                                          )
                                                        : t(
                                                              'open_diagram_dialog.unassigned_collection'
                                                          )}
                                                </span>
                                                <span
                                                    className={
                                                        statusChipClasses
                                                    }
                                                >
                                                    {t(
                                                        'open_diagram_dialog.sharing.current_status'
                                                    )}
                                                    {' · '}
                                                    {formatSharingSummary(
                                                        selectedProject.sharingScope,
                                                        selectedProject.sharingAccess
                                                    )}
                                                </span>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            className="rounded-xl"
                                            disabled={
                                                !selectedProject ||
                                                selectedProject.localOnly ||
                                                selectedProject.access !==
                                                    'owner'
                                            }
                                            onClick={() =>
                                                void handleRenameProject()
                                            }
                                        >
                                            {t(
                                                'open_diagram_dialog.project_actions.rename'
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            className="rounded-xl"
                                            disabled={
                                                !selectedProject ||
                                                selectedProject.localOnly ||
                                                selectedProject.access !==
                                                    'owner'
                                            }
                                            onClick={handleOpenProjectSharing}
                                        >
                                            {t(
                                                'open_diagram_dialog.sharing.share_project'
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            className="rounded-xl"
                                            disabled={
                                                !selectedProject ||
                                                selectedProject.localOnly ||
                                                selectedProject.access !==
                                                    'owner'
                                            }
                                            onClick={handleDeleteProject}
                                        >
                                            {t(
                                                'open_diagram_dialog.project_actions.delete'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-1 flex-col p-4">
                                {selectedProject &&
                                !selectedProject.localOnly ? (
                                    <div className="mb-4 rounded-xl border border-border/70 bg-background p-3 sm:max-w-xs">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {t(
                                                'open_diagram_dialog.project_fields.collection'
                                            )}
                                        </span>
                                        <Select
                                            value={
                                                selectedProject.collectionId ??
                                                UNASSIGNED_COLLECTION_VALUE
                                            }
                                            disabled={
                                                selectedProject.access !==
                                                'owner'
                                            }
                                            onValueChange={(value) => {
                                                void handleMoveProject(value);
                                            }}
                                        >
                                            <SelectTrigger className="mt-2 rounded-xl border-border/70 shadow-none">
                                                <SelectValue
                                                    placeholder={t(
                                                        'open_diagram_dialog.project_fields.collection_placeholder'
                                                    )}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem
                                                    value={
                                                        UNASSIGNED_COLLECTION_VALUE
                                                    }
                                                >
                                                    {t(
                                                        'open_diagram_dialog.unassigned_collection'
                                                    )}
                                                </SelectItem>
                                                {collections.map(
                                                    (collection) => (
                                                        <SelectItem
                                                            key={collection.id}
                                                            value={
                                                                collection.id
                                                            }
                                                        >
                                                            {collection.name}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ) : null}

                                <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/70 bg-background">
                                    {selectedProject ? (
                                        <div className="h-full overflow-auto">
                                            <Table>
                                                <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                                                    <TableRow>
                                                        <TableHead />
                                                        <TableHead>
                                                            {t(
                                                                'open_diagram_dialog.table_columns.name'
                                                            )}
                                                        </TableHead>
                                                        <TableHead className="hidden sm:table-cell">
                                                            {t(
                                                                'open_diagram_dialog.table_columns.created_at'
                                                            )}
                                                        </TableHead>
                                                        <TableHead>
                                                            {t(
                                                                'open_diagram_dialog.table_columns.last_modified'
                                                            )}
                                                        </TableHead>
                                                        <TableHead className="text-center">
                                                            {t(
                                                                'open_diagram_dialog.table_columns.tables_count'
                                                            )}
                                                        </TableHead>
                                                        <TableHead />
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {diagrams.map((diagram) => (
                                                        <TableRow
                                                            key={diagram.id}
                                                            data-state={
                                                                selectedDiagramId ===
                                                                diagram.id
                                                                    ? 'selected'
                                                                    : undefined
                                                            }
                                                            className="cursor-pointer"
                                                            onClick={() =>
                                                                setSelectedDiagramId(
                                                                    diagram.id
                                                                )
                                                            }
                                                            onDoubleClick={() => {
                                                                openDiagram(
                                                                    diagram.id
                                                                );
                                                                closeOpenDiagramDialog();
                                                            }}
                                                        >
                                                            <TableCell>
                                                                <div className="flex justify-center">
                                                                    <DiagramIcon
                                                                        databaseType={
                                                                            diagram.databaseType as DatabaseType
                                                                        }
                                                                        databaseEdition={
                                                                            (diagram.databaseEdition ??
                                                                                undefined) as
                                                                                | DatabaseEdition
                                                                                | undefined
                                                                        }
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="font-medium">
                                                                {diagram.name}
                                                            </TableCell>
                                                            <TableCell className="hidden text-muted-foreground sm:table-cell">
                                                                {diagram.createdAt.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {diagram.updatedAt.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {
                                                                    diagram.tableCount
                                                                }
                                                            </TableCell>
                                                            <TableCell className="p-0 pr-1 text-right">
                                                                <DiagramRowActionsMenu
                                                                    onOpen={() => {
                                                                        openDiagram(
                                                                            diagram.id
                                                                        );
                                                                        closeOpenDiagramDialog();
                                                                    }}
                                                                    onShare={() =>
                                                                        handleOpenDiagramSharing(
                                                                            diagram
                                                                        )
                                                                    }
                                                                    onRename={() =>
                                                                        void handleRenameDiagram(
                                                                            diagram
                                                                        )
                                                                    }
                                                                    onDelete={() =>
                                                                        handleDeleteDiagram(
                                                                            diagram
                                                                        )
                                                                    }
                                                                    canShare={
                                                                        !diagram.localOnly &&
                                                                        diagram.access ===
                                                                            'owner'
                                                                    }
                                                                    canRename={
                                                                        !diagram.localOnly &&
                                                                        diagram.access ===
                                                                            'owner'
                                                                    }
                                                                    canDelete={
                                                                        !diagram.localOnly &&
                                                                        diagram.access ===
                                                                            'owner'
                                                                    }
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ) : null}

                                    {!selectedProject ? (
                                        <div className="flex h-full min-h-60 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                                            {t(
                                                'open_diagram_dialog.no_project_selected'
                                            )}
                                        </div>
                                    ) : null}

                                    {selectedProject &&
                                    diagrams.length === 0 ? (
                                        <div className="flex h-full min-h-60 items-center justify-center px-4 text-center text-sm text-muted-foreground">
                                            {normalizedSearchTerm
                                                ? t(
                                                      'open_diagram_dialog.empty_search_diagrams',
                                                      {
                                                          search: deferredSearchInput.trim(),
                                                      }
                                                  )
                                                : t(
                                                      'open_diagram_dialog.empty_diagrams'
                                                  )}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogInternalContent>

                <DialogFooter className="flex !justify-between gap-2 border-t border-border/70 px-5 py-4 sm:px-6">
                    {canClose ? (
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="secondary"
                                className="rounded-xl"
                            >
                                {t('open_diagram_dialog.cancel')}
                            </Button>
                        </DialogClose>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="rounded-xl"
                            onClick={() => {
                                closeOpenDiagramDialog();
                                openCreateDiagramDialog();
                            }}
                        >
                            {t('open_diagram_dialog.new_database')}
                        </Button>
                        <DialogClose asChild>
                            <Button
                                type="submit"
                                disabled={!selectedDiagram}
                                className="rounded-xl"
                                onClick={() => {
                                    if (selectedDiagram) {
                                        openDiagram(selectedDiagram.id);
                                    }
                                }}
                            >
                                {t('open_diagram_dialog.open')}
                            </Button>
                        </DialogClose>
                    </div>
                </DialogFooter>
            </DialogContent>
            <SharingSettingsDialog
                open={sharingSubject !== null}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setSharingSubject(null);
                    }
                }}
                subject={sharingSubject}
                loadSharing={sharingApi.loadSharing}
                searchUsers={sharingApi.searchUsers}
                addPerson={sharingApi.addPerson}
                updatePerson={sharingApi.updatePerson}
                removePerson={sharingApi.removePerson}
                updateGeneralAccess={sharingApi.updateGeneralAccess}
                onSaved={async () => {
                    await fetchLibrary(normalizedSearchTerm);
                    if (selectedProjectId) {
                        await fetchProjectDiagrams(
                            selectedProjectId,
                            normalizedSearchTerm
                        );
                    }
                }}
            />
        </Dialog>
    );
};
