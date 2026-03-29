import React, { useState } from 'react';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/sheet/sheet';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import { VersionListItem } from './version-list-item';
import { CreateVersionDialog } from './create-version-dialog';

export const VersionsPanel: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const [open, setOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    if (!workflow?.diagramId) {
        return null;
    }

    const canCreateVersion =
        workflow.workflow?.diagramAccess === 'edit' ||
        workflow.workflow?.diagramAccess === 'owner';

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
                Versions
                {workflow.versions.length > 0 ? (
                    <Badge variant="secondary" className="ml-2">
                        {workflow.versions.length}
                    </Badge>
                ) : null}
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="w-full p-0 sm:max-w-xl">
                    <SheetHeader className="border-b px-6 py-5">
                        <SheetTitle>Versions</SheetTitle>
                        <SheetDescription>
                            Immutable diagram snapshots for historical review.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <p className="text-sm text-muted-foreground">
                            Development remains the only editable head.
                        </p>
                        {canCreateVersion ? (
                            <Button
                                size="sm"
                                onClick={() => setCreateOpen(true)}
                            >
                                Create Version
                            </Button>
                        ) : null}
                    </div>

                    <ScrollArea className="h-[calc(100vh-11rem)] px-6 py-4">
                        {workflow.versions.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                Create a version before major changes so you can
                                revisit the current Development state later.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {workflow.versions.map((version) => (
                                    <VersionListItem
                                        key={version.id}
                                        version={version}
                                        active={
                                            workflow.activeMode === 'version' &&
                                            workflow.selectedVersion?.id ===
                                                version.id
                                        }
                                        compareBaseline={
                                            workflow.compareSourceKind ===
                                                'version' &&
                                            workflow.compareVersion?.id ===
                                                version.id
                                        }
                                        onOpen={() => {
                                            workflow.openVersion(version.id);
                                            setOpen(false);
                                        }}
                                        onCompare={() => {
                                            workflow.compareVersionToDevelopment(
                                                version.id
                                            );
                                            setOpen(false);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            <CreateVersionDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={async () => {
                    await workflow.refreshWorkflow();
                }}
            />
        </>
    );
};
