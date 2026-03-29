import React, { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import { Button } from '@/components/button/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { Input } from '@/components/input/input';
import { Label } from '@/components/label/label';
import { Textarea } from '@/components/textarea/textarea';
import { useToast } from '@/components/toast/use-toast';
import { serializeDiagram } from '@/features/persistence/api/persistence-client';
import { diagramToCanonicalSchema } from '@/features/schema-sync/lib/canonical-adapters';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import { diagramWorkflowClient } from '../api/diagram-workflow-client';

export interface CreateVersionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void | Promise<void>;
}

export const CreateVersionDialog: React.FC<CreateVersionDialogProps> = ({
    open,
    onOpenChange,
    onCreated,
}) => {
    const workflow = useOptionalDiagramWorkflow();
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setName('');
            setDescription('');
        }
    }, [open]);

    const canCreateVersion = useMemo(
        () =>
            !!workflow?.diagramId &&
            !!workflow.developmentDiagram &&
            (workflow.workflow?.diagramAccess === 'edit' ||
                workflow.workflow?.diagramAccess === 'owner'),
        [
            workflow?.developmentDiagram,
            workflow?.diagramId,
            workflow?.workflow?.diagramAccess,
        ]
    );

    const handleCreateVersion = async () => {
        if (
            !workflow?.diagramId ||
            !workflow.developmentDiagram ||
            !canCreateVersion
        ) {
            return;
        }

        setSubmitting(true);
        try {
            await diagramWorkflowClient.createVersion(workflow.diagramId, {
                name: name.trim() || null,
                description: description.trim() || null,
                origin: 'manual',
                canonicalSchema: diagramToCanonicalSchema(
                    workflow.developmentDiagram
                ),
                diagramDocument: serializeDiagram(workflow.developmentDiagram),
            });
            await workflow.refreshWorkflow();
            await onCreated?.();
            onOpenChange(false);
            toast({
                title: 'Version created',
                description:
                    name.trim() || 'A new immutable version was captured.',
            });
        } catch (error) {
            toast({
                title: 'Failed to create version',
                description:
                    error instanceof Error
                        ? error.message
                        : 'SchemaDash could not capture this version.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showClose className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Create Version</DialogTitle>
                    <DialogDescription>
                        Capture the current Development diagram as an immutable
                        snapshot. Leaving the name blank will use the next
                        generated version label.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {!canCreateVersion ? (
                        <Alert>
                            <AlertTitle>
                                Version creation unavailable
                            </AlertTitle>
                            <AlertDescription>
                                Load an editable Development diagram before
                                creating a version.
                            </AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="space-y-2">
                        <Label htmlFor="version-name">Name</Label>
                        <Input
                            id="version-name"
                            placeholder="Optional custom name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            disabled={submitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="version-description">Note</Label>
                        <Textarea
                            id="version-description"
                            placeholder="Optional description for future review"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            rows={4}
                            disabled={submitting}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => void handleCreateVersion()}
                        disabled={!canCreateVersion || submitting}
                    >
                        {submitting ? 'Creating...' : 'Create Version'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
