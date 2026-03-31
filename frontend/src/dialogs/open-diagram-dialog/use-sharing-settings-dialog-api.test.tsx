import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStorage } from '@/hooks/use-storage';
import { useSharingSettingsDialogApi } from './use-sharing-settings-dialog-api';

vi.mock('@/hooks/use-storage', () => ({
    useStorage: vi.fn(),
}));

const mockedUseStorage = vi.mocked(useStorage);

describe('useSharingSettingsDialogApi', () => {
    const storage = {
        getProjectSharing: vi.fn(),
        getDiagramSharing: vi.fn(),
        searchShareableUsers: vi.fn(),
        addProjectSharingUser: vi.fn(),
        addDiagramSharingUser: vi.fn(),
        updateProjectSharingUser: vi.fn(),
        updateDiagramSharingUser: vi.fn(),
        removeProjectSharingUser: vi.fn(),
        removeDiagramSharingUser: vi.fn(),
        updateProjectSharing: vi.fn(),
        updateDiagramSharing: vi.fn(),
    };

    beforeEach(() => {
        Object.values(storage).forEach((mockFn) => mockFn.mockReset());
        mockedUseStorage.mockReturnValue(storage as never);
    });

    it('routes project operations through the project storage methods', async () => {
        storage.getProjectSharing.mockResolvedValue({ scope: 'project' });
        storage.addProjectSharingUser.mockResolvedValue({ ok: true });
        storage.updateProjectSharing.mockResolvedValue({ ok: true });

        const { result } = renderHook(() => useSharingSettingsDialogApi());
        const subject = {
            type: 'project' as const,
            id: 'project-1',
        };

        await result.current.loadSharing(subject);
        await result.current.addPerson(subject, {
            userId: 'user-1',
            access: 'edit',
        });
        await result.current.updateGeneralAccess(subject, {
            scope: 'link',
            access: 'view',
            rotateLinkToken: true,
        });

        expect(storage.getProjectSharing).toHaveBeenCalledWith('project-1');
        expect(storage.addProjectSharingUser).toHaveBeenCalledWith(
            'project-1',
            {
                userId: 'user-1',
                access: 'edit',
            }
        );
        expect(storage.updateProjectSharing).toHaveBeenCalledWith('project-1', {
            scope: 'link',
            access: 'view',
            rotateLinkToken: true,
        });
        expect(storage.getDiagramSharing).not.toHaveBeenCalled();
    });

    it('routes diagram operations and search through the storage boundary', async () => {
        storage.searchShareableUsers.mockResolvedValue([{ id: 'user-2' }]);
        storage.updateDiagramSharingUser.mockResolvedValue({ ok: true });
        storage.removeDiagramSharingUser.mockResolvedValue({ ok: true });

        const { result } = renderHook(() => useSharingSettingsDialogApi());
        const subject = {
            type: 'diagram' as const,
            id: 'diagram-1',
        };

        const users = await result.current.searchUsers('alice');
        await result.current.updatePerson(subject, 'user-2', {
            access: 'view',
        });
        await result.current.removePerson(subject, 'user-2');

        expect(users).toEqual([{ id: 'user-2' }]);
        expect(storage.searchShareableUsers).toHaveBeenCalledWith('alice');
        expect(storage.updateDiagramSharingUser).toHaveBeenCalledWith(
            'diagram-1',
            'user-2',
            {
                access: 'view',
            }
        );
        expect(storage.removeDiagramSharingUser).toHaveBeenCalledWith(
            'diagram-1',
            'user-2'
        );
        expect(storage.updateProjectSharingUser).not.toHaveBeenCalled();
    });
});
