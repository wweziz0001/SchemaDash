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
import { History } from 'lucide-react';
import type { DiagramWorkflowVersionSummary } from '../api/diagram-workflow-client';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import { VersionListItem } from './version-list-item';
import { CreateVersionDialog } from './create-version-dialog';
import { RestoreVersionDialog } from './restore-version-dialog';

export const VersionsPanel: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const [open, setOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [restoreVersion, setRestoreVersion] =
        useState<DiagramWorkflowVersionSummary>();

    if (!workflow?.diagramId) {
        return null;
    }

    const canCreateVersion =
        workflow.workflow?.diagramAccess === 'edit' ||
        workflow.workflow?.diagramAccess === 'owner';

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-lg bg-background/80 shadow-sm"
                onClick={() => setOpen(true)}
            >
                <History className="size-4" />
                Versions
                {workflow.versions.length > 0 ? (
                    <Badge variant="secondary">
                        {workflow.versions.length}
                    </Badge>
                ) : null}
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="w-full p-0 sm:max-w-xl">
                    <SheetHeader className="border-b bg-muted/15 px-6 py-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                                Immutable snapshots
                            </Badge>
                            <Badge variant="outline">
                                {workflow.versions.length} version
                                {workflow.versions.length === 1 ? '' : 's'}
                            </Badge>
                        </div>
                        <SheetTitle>Versions</SheetTitle>
                        <SheetDescription>
                            Immutable diagram snapshots for historical review.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-col gap-3 border-b px-6 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                Development remains the only editable head.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Open snapshots for read-only review, compare
                                them against Development, or restore by copying
                                them back into the mutable head.
                            </p>
                        </div>
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
                            <div className="rounded-xl border border-dashed bg-muted/15 p-6">
                                <div className="text-sm font-medium">
                                    No versions yet
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Create a version before major changes so you
                                    can revisit the current Development state
                                    later without mutating stored history.
                                </p>
                                {canCreateVersion ? (
                                    <Button
                                        size="sm"
                                        className="mt-4"
                                        onClick={() => setCreateOpen(true)}
                                    >
                                        Create Version
                                    </Button>
                                ) : null}
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
                                        onRestore={
                                            canCreateVersion
                                                ? () => {
                                                      setRestoreVersion(
                                                          version
                                                      );
                                                      setOpen(false);
                                                  }
                                                : undefined
                                        }
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

            <RestoreVersionDialog
                open={!!restoreVersion}
                version={restoreVersion}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setRestoreVersion(undefined);
                    }
                }}
            />
        </>
    );
};
