import React, { useMemo, useState } from 'react';
import { Button } from '@/components/button/button';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/alert-dialog/alert-dialog';
import { useToast } from '@/components/toast/use-toast';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import {
    diagramWorkflowClient,
    type DiagramWorkflowVersionSummary,
} from '@/lib/api/diagram-workflow-client';
import { getVersionDisplayLabel } from '@/lib/diagram-workflow/version-labels';
import { Trash2 } from 'lucide-react';

export interface DeleteVersionDialogProps {
    open: boolean;
    version?: DiagramWorkflowVersionSummary;
    onOpenChange: (open: boolean) => void;
}

export const DeleteVersionDialog: React.FC<DeleteVersionDialogProps> = ({
    open,
    version,
    onOpenChange,
}) => {
    const workflow = useOptionalDiagramWorkflow();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    const versionLabel = useMemo(
        () => (version ? getVersionDisplayLabel(version) : 'this version'),
        [version]
    );

    const handleDelete = async () => {
        if (!workflow?.diagramId || !version) {
            return;
        }

        setSubmitting(true);
        try {
            const response = await diagramWorkflowClient.deleteVersion(
                workflow.diagramId,
                version.id
            );

            workflow.setVersions(response.result.versions);
            workflow.setActiveMode('development');
            onOpenChange(false);
            toast({
                title: 'Version deleted',
                description: `${versionLabel} was removed from the saved versions list.`,
            });
            void workflow.refreshWorkflow();
        } catch (error) {
            toast({
                title: 'Delete failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'The selected version could not be deleted.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete This Version</AlertDialogTitle>
                    <AlertDialogDescription className="leading-6">
                        Permanently remove{' '}
                        <span className="font-medium text-foreground">
                            {versionLabel}
                        </span>{' '}
                        from the saved versions history. Development will stay
                        intact, but this snapshot will no longer be available
                        for review, compare, or restore.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
                    This action cannot be undone.
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={submitting}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={submitting || !version}
                    >
                        <Trash2 className="mr-2 size-4" />
                        Delete Version
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
