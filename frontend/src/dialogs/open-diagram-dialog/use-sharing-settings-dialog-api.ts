import { useCallback } from 'react';
import { useStorage } from '@/hooks/use-storage';
import type {
    PersistedSharingSettings,
    PersistedUserSummary,
    SharingAccess,
    SharingScope,
} from '@/lib/persistence/persistence-types';

export interface SharingDialogSubject {
    type: 'project' | 'diagram';
    id: string;
    name: string;
}

export type SharingDialogSubjectRef = Pick<SharingDialogSubject, 'type' | 'id'>;

export interface SharingSettingsDialogApi {
    loadSharing: (
        subject: SharingDialogSubjectRef
    ) => Promise<PersistedSharingSettings>;
    searchUsers: (query: string) => Promise<PersistedUserSummary[]>;
    addPerson: (
        subject: SharingDialogSubjectRef,
        params: {
            userId: string;
            access: SharingAccess;
        }
    ) => Promise<PersistedSharingSettings>;
    updatePerson: (
        subject: SharingDialogSubjectRef,
        userId: string,
        params: {
            access: SharingAccess;
        }
    ) => Promise<PersistedSharingSettings>;
    removePerson: (
        subject: SharingDialogSubjectRef,
        userId: string
    ) => Promise<PersistedSharingSettings>;
    updateGeneralAccess: (
        subject: SharingDialogSubjectRef,
        params: {
            scope: SharingScope;
            access: SharingAccess;
            expiresAt?: string | null;
            rotateLinkToken?: boolean;
        }
    ) => Promise<PersistedSharingSettings>;
}

export const useSharingSettingsDialogApi = (): SharingSettingsDialogApi => {
    const storage = useStorage();

    const loadSharing = useCallback(
        async (subject: SharingDialogSubjectRef) =>
            subject.type === 'project'
                ? await storage.getProjectSharing(subject.id)
                : await storage.getDiagramSharing(subject.id),
        [storage]
    );

    const searchUsers = useCallback(
        async (query: string): Promise<PersistedUserSummary[]> =>
            await storage.searchShareableUsers(query),
        [storage]
    );

    const addPerson = useCallback(
        async (
            subject: SharingDialogSubjectRef,
            params: {
                userId: string;
                access: SharingAccess;
            }
        ): Promise<PersistedSharingSettings> =>
            subject.type === 'project'
                ? await storage.addProjectSharingUser(subject.id, params)
                : await storage.addDiagramSharingUser(subject.id, params),
        [storage]
    );

    const updatePerson = useCallback(
        async (
            subject: SharingDialogSubjectRef,
            userId: string,
            params: {
                access: SharingAccess;
            }
        ): Promise<PersistedSharingSettings> =>
            subject.type === 'project'
                ? await storage.updateProjectSharingUser(
                      subject.id,
                      userId,
                      params
                  )
                : await storage.updateDiagramSharingUser(
                      subject.id,
                      userId,
                      params
                  ),
        [storage]
    );

    const removePerson = useCallback(
        async (
            subject: SharingDialogSubjectRef,
            userId: string
        ): Promise<PersistedSharingSettings> =>
            subject.type === 'project'
                ? await storage.removeProjectSharingUser(subject.id, userId)
                : await storage.removeDiagramSharingUser(subject.id, userId),
        [storage]
    );

    const updateGeneralAccess = useCallback(
        async (
            subject: SharingDialogSubjectRef,
            params: {
                scope: SharingScope;
                access: SharingAccess;
                expiresAt?: string | null;
                rotateLinkToken?: boolean;
            }
        ): Promise<PersistedSharingSettings> =>
            subject.type === 'project'
                ? await storage.updateProjectSharing(subject.id, params)
                : await storage.updateDiagramSharing(subject.id, params),
        [storage]
    );

    return {
        loadSharing,
        searchUsers,
        addPerson,
        updatePerson,
        removePerson,
        updateGeneralAccess,
    };
};
