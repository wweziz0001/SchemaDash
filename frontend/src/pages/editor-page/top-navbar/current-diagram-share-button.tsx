import React, { useEffect, useState } from 'react';
import { Button } from '@/components/button/button';
import { SharingSettingsDialog } from '@/dialogs/open-diagram-dialog/sharing-settings-dialog';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useStorage } from '@/hooks/use-storage';
import { useSharingDialogApi } from '@/features/persistence/hooks/use-sharing-dialog-api';
import type { SavedDiagram } from '@/context/storage-context/storage-context';
import { Share2 } from 'lucide-react';

export const CurrentDiagramShareButton: React.FC = () => {
    const { currentDiagram } = useSchemaDash();
    const { getSavedDiagram } = useStorage();
    const sharingApi = useSharingDialogApi();
    const [open, setOpen] = useState(false);
    const [savedDiagram, setSavedDiagram] = useState<
        SavedDiagram | undefined
    >();

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (!currentDiagram?.id) {
                setSavedDiagram(undefined);
                return;
            }

            try {
                const nextSavedDiagram = await getSavedDiagram(
                    currentDiagram.id
                );
                if (!cancelled) {
                    setSavedDiagram(nextSavedDiagram);
                }
            } catch {
                if (!cancelled) {
                    setSavedDiagram(undefined);
                }
            }
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [currentDiagram?.id, getSavedDiagram]);

    const canShare = Boolean(
        savedDiagram &&
        !savedDiagram.localOnly &&
        savedDiagram.access === 'owner'
    );

    return (
        <>
            <div className="p-1">
                <Button
                    type="button"
                    size="sm"
                    onClick={() => setOpen(true)}
                    disabled={!canShare}
                    className="flex flex-col items-center justify-center gap-2 border-0 px-3 py-8 shadow-none"
                >
                    <Share2 className="size-4" />
                    <span>Share</span>
                </Button>
            </div>
            <SharingSettingsDialog
                open={open}
                onOpenChange={setOpen}
                subject={
                    savedDiagram && !savedDiagram.localOnly
                        ? {
                              type: 'diagram',
                              id: savedDiagram.id,
                              name: savedDiagram.name,
                          }
                        : null
                }
                loadSharing={sharingApi.loadSharing}
                searchUsers={sharingApi.searchUsers}
                addPerson={sharingApi.addPerson}
                updatePerson={sharingApi.updatePerson}
                removePerson={sharingApi.removePerson}
                updateGeneralAccess={sharingApi.updateGeneralAccess}
            />
        </>
    );
};
