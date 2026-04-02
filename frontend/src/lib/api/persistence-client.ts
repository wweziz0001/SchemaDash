import { requestJson } from '@/lib/api/request';
import type {
    ChartDbBackupArchive,
    ExportBackupRequest,
    ImportBackupResult,
} from '@/lib/project-backup/project-backup-format';
import type {
    BootstrapResponse,
    DiagramDto,
    PersistedCollectionInput,
    PersistedCollectionSummary,
    PersistedCreateDiagramSessionInput,
    PersistedDiagramCollaborationState,
    PersistedDiagramRecord,
    PersistedDiagramSessionResponse,
    PersistedDiagramSummary,
    PersistedDiagramUpdateInput,
    PersistedProjectInput,
    PersistedProjectSummary,
    PersistedSharingSettings,
    PersistedSharingUpdateInput,
    PersistedSharingUserInput,
    PersistedUpdateDiagramSessionInput,
    PersistedUpdateDiagramSessionPresenceInput,
    PersistedUserSummary,
    SharedProjectResponse,
} from '@/lib/persistence/persistence-types';

export const persistenceClient = {
    exportBackup: async (payload: ExportBackupRequest) =>
        requestJson<ChartDbBackupArchive>('/api/backups/export', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    importBackup: async (payload: ChartDbBackupArchive) =>
        requestJson<{ import: ImportBackupResult }>('/api/backups/import', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    bootstrap: async () => requestJson<BootstrapResponse>('/api/app/bootstrap'),
    listCollections: async () =>
        requestJson<{ items: PersistedCollectionSummary[] }>(
            '/api/collections'
        ),
    createCollection: async (payload: PersistedCollectionInput) =>
        requestJson<{ collection: PersistedCollectionSummary }>(
            '/api/collections',
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
    updateCollection: async (
        collectionId: string,
        payload: Partial<PersistedCollectionInput>
    ) =>
        requestJson<{ collection: PersistedCollectionSummary }>(
            `/api/collections/${collectionId}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }
        ),
    deleteCollection: async (collectionId: string) =>
        requestJson<{ ok: boolean }>(`/api/collections/${collectionId}`, {
            method: 'DELETE',
        }),
    listProjects: async (options?: {
        search?: string;
        collectionId?: string;
        unassigned?: boolean;
    }) => {
        const params = new URLSearchParams();
        if (options?.search) {
            params.set('search', options.search);
        }
        if (options?.collectionId) {
            params.set('collectionId', options.collectionId);
        }
        if (options?.unassigned) {
            params.set('unassigned', 'true');
        }

        return requestJson<{ items: PersistedProjectSummary[] }>(
            `/api/projects${params.size > 0 ? `?${params.toString()}` : ''}`
        );
    },
    createProject: async (payload: PersistedProjectInput) =>
        requestJson<{ project: PersistedProjectSummary }>('/api/projects', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    updateProject: async (
        projectId: string,
        payload: Partial<PersistedProjectInput>
    ) =>
        requestJson<{ project: PersistedProjectSummary }>(
            `/api/projects/${projectId}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }
        ),
    deleteProject: async (projectId: string) =>
        requestJson<{ ok: boolean }>(`/api/projects/${projectId}`, {
            method: 'DELETE',
        }),
    searchShareableUsers: async (query: string) => {
        const params = new URLSearchParams();
        const normalizedQuery = query.trim();
        if (normalizedQuery) {
            params.set('query', normalizedQuery);
        }

        return requestJson<{ items: PersistedUserSummary[] }>(
            `/api/sharing/users${params.size > 0 ? `?${params.toString()}` : ''}`
        );
    },
    getProjectSharing: async (projectId: string) =>
        requestJson<{ sharing: PersistedSharingSettings }>(
            `/api/projects/${projectId}/sharing`
        ),
    updateProjectSharing: async (
        projectId: string,
        payload: PersistedSharingUpdateInput
    ) =>
        requestJson<{ sharing: PersistedSharingSettings }>(
            `/api/projects/${projectId}/sharing`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }
        ),
    addProjectSharingUser: async (
        projectId: string,
        payload: PersistedSharingUserInput
    ) =>
        requestJson<{ sharing: PersistedSharingSettings }>(
            `/api/projects/${projectId}/sharing/people`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
    updateProjectSharingUser: async (
        projectId: string,
        userId: string,
        payload: Pick<PersistedSharingUserInput, 'access'>
    ) =>
        requestJson<{ sharing: PersistedSharingSettings }>(
            `/api/projects/${projectId}/sharing/people/${userId}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }
        ),
    removeProjectSharingUser: async (projectId: string, userId: string) =>
        requestJson<{ sharing: PersistedSharingSettings }>(
            `/api/projects/${projectId}/sharing/people/${userId}`,
            {
                method: 'DELETE',
            }
        ),
    listProjectDiagrams: async (
        projectId: string,
        options?: { view?: 'summary' | 'full'; search?: string }
    ) => {
        const params = new URLSearchParams();
        if (options?.view) {
            params.set('view', options.view);
        }
        if (options?.search) {
            params.set('search', options.search);
        }

        return requestJson<{
            items: Array<PersistedDiagramSummary | PersistedDiagramRecord>;
        }>(
            `/api/projects/${projectId}/diagrams${
                params.size > 0 ? `?${params.toString()}` : ''
            }`
        );
    },
    getDiagram: async (diagramId: string) =>
        requestJson<PersistedDiagramRecord>(`/api/diagrams/${diagramId}`),
    updateDiagram: async (
        diagramId: string,
        payload: PersistedDiagramUpdateInput
    ) =>
        requestJson<{ diagram: PersistedDiagramRecord }>(
            `/api/diagrams/${diagramId}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }
        ),
    upsertDiagram: async (
        diagramId: string,
        payload: {
            projectId: string;
            ownerUserId?: string;
            visibility?: 'private' | 'workspace' | 'public';
            status?: 'draft' | 'active' | 'archived';
            description?: string;
            sessionId?: string;
            baseVersion?: number;
            diagram: DiagramDto;
        }
    ) =>
        requestJson<{ diagram: PersistedDiagramRecord }>(
            `/api/diagrams/${diagramId}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
            }
        ),
    createDiagramSession: async (
        diagramId: string,
        payload: PersistedCreateDiagramSessionInput
    ) =>
        requestJson<PersistedDiagramSessionResponse>(
            `/api/diagrams/${diagramId}/sessions`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
    getDiagramSession: async (diagramId: string, sessionId: string) =>
        requestJson<PersistedDiagramSessionResponse>(
            `/api/diagrams/${diagramId}/sessions/${sessionId}`
        ),
    updateDiagramSession: async (
        diagramId: string,
        sessionId: string,
        payload: PersistedUpdateDiagramSessionInput
    ) =>
        requestJson<PersistedDiagramSessionResponse>(
            `/api/diagrams/${diagramId}/sessions/${sessionId}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }
        ),
    updateDiagramSessionPresence: async (
        diagramId: string,
        sessionId: string,
        payload: PersistedUpdateDiagramSessionPresenceInput
    ) =>
        requestJson<{
            collaboration: PersistedDiagramCollaborationState;
        }>(`/api/diagrams/${diagramId}/sessions/${sessionId}/presence`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),
    deleteDiagram: async (diagramId: string) =>
        requestJson<{ ok: boolean }>(`/api/diagrams/${diagramId}`, {
            method: 'DELETE',
        }),
    getDiagramSharing: async (diagramId: string) =>
        requestJson<{ sharing: PersistedSharingSettings }>(
            `/api/diagrams/${diagramId}/sharing`
        ),
    updateDiagramSharing: async (
        diagramId: string,
        payload: PersistedSharingUpdateInput
    ) =>
        requestJson<{ sharing: PersistedSharingSettings }>(
            `/api/diagrams/${diagramId}/sharing`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }
        ),
    addDiagramSharingUser: async (
        diagramId: string,
        payload: PersistedSharingUserInput
    ) =>
        requestJson<{ sharing: PersistedSharingSettings }>(
            `/api/diagrams/${diagramId}/sharing/people`,
            {
                method: 'POST',
                body: JSON.stringify(payload),
            }
        ),
    updateDiagramSharingUser: async (
        diagramId: string,
        userId: string,
        payload: Pick<PersistedSharingUserInput, 'access'>
    ) =>
        requestJson<{ sharing: PersistedSharingSettings }>(
            `/api/diagrams/${diagramId}/sharing/people/${userId}`,
            {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }
        ),
    removeDiagramSharingUser: async (diagramId: string, userId: string) =>
        requestJson<{ sharing: PersistedSharingSettings }>(
            `/api/diagrams/${diagramId}/sharing/people/${userId}`,
            {
                method: 'DELETE',
            }
        ),
    getSharedProject: async (projectId: string, shareToken: string) =>
        requestJson<SharedProjectResponse>(
            `/api/shared/projects/${projectId}/${shareToken}`
        ),
    getSharedProjectDiagram: async (
        projectId: string,
        shareToken: string,
        diagramId: string
    ) =>
        requestJson<PersistedDiagramRecord>(
            `/api/shared/projects/${projectId}/${shareToken}/diagrams/${diagramId}`
        ),
    getSharedDiagram: async (diagramId: string, shareToken: string) =>
        requestJson<PersistedDiagramRecord>(
            `/api/shared/diagrams/${diagramId}/${shareToken}`
        ),
};
