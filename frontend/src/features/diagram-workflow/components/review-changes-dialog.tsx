import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import { Badge } from '@/components/badge/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { Separator } from '@/components/separator/separator';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';
import { buildReviewGrouping } from '../lib/review-grouping';

const badgeVariantByStatus = {
    added: 'default',
    removed: 'destructive',
    changed: 'secondary',
    unchanged: 'outline',
} as const;

const statusChipClassName = {
    added: 'bg-emerald-600 text-white hover:bg-emerald-600',
    removed: 'bg-destructive text-destructive-foreground',
    changed: 'bg-amber-500 text-black hover:bg-amber-500',
    unchanged: '',
} as const;

export interface ReviewChangesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ReviewChangesDialog: React.FC<ReviewChangesDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const workflow = useOptionalDiagramWorkflow();
    const reviewGrouping =
        workflow?.workflow?.liveSnapshot &&
        workflow.developmentDiagram &&
        workflow.workflow.liveSnapshotId &&
        workflow.workflow.connectionId
            ? buildReviewGrouping({
                  baselineSchema:
                      workflow.workflow.liveSnapshot.canonicalSchema,
                  developmentDiagram: workflow.developmentDiagram,
              })
            : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex h-[85vh] w-[min(1180px,96vw)] max-w-none flex-col"
                showClose
            >
                <DialogHeader>
                    <DialogTitle>Review Changes</DialogTitle>
                    <DialogDescription>
                        Inspect structured deltas between the last synced Live
                        Database snapshot and the current Development schema.
                    </DialogDescription>
                </DialogHeader>

                {!reviewGrouping ? (
                    <Alert>
                        <AlertTitle>Review is not available yet</AlertTitle>
                        <AlertDescription>
                            Sync a live snapshot and keep a development diagram
                            loaded to inspect a structured review of the compare
                            baseline.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <ScrollArea className="min-h-0 flex-1 pr-4">
                        <div className="flex flex-col gap-6 pb-6">
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-lg border p-4">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Tables
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold">
                                        {
                                            reviewGrouping.compareResult.summary
                                                .tables.total
                                        }
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge variant="outline">
                                            +
                                            {
                                                reviewGrouping.compareResult
                                                    .summary.tables.added
                                            }
                                        </Badge>
                                        <Badge variant="outline">
                                            ~
                                            {
                                                reviewGrouping.compareResult
                                                    .summary.tables.changed
                                            }
                                        </Badge>
                                        <Badge variant="outline">
                                            -
                                            {
                                                reviewGrouping.compareResult
                                                    .summary.tables.removed
                                            }
                                        </Badge>
                                    </div>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Fields
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold">
                                        {
                                            reviewGrouping.compareResult.summary
                                                .fields.total
                                        }
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge variant="outline">
                                            +
                                            {
                                                reviewGrouping.compareResult
                                                    .summary.fields.added
                                            }
                                        </Badge>
                                        <Badge variant="outline">
                                            ~
                                            {
                                                reviewGrouping.compareResult
                                                    .summary.fields.changed
                                            }
                                        </Badge>
                                        <Badge variant="outline">
                                            -
                                            {
                                                reviewGrouping.compareResult
                                                    .summary.fields.removed
                                            }
                                        </Badge>
                                    </div>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Relationships
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold">
                                        {
                                            reviewGrouping.compareResult.summary
                                                .relationships.total
                                        }
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge variant="outline">
                                            +
                                            {
                                                reviewGrouping.compareResult
                                                    .summary.relationships.added
                                            }
                                        </Badge>
                                        <Badge variant="outline">
                                            ~
                                            {
                                                reviewGrouping.compareResult
                                                    .summary.relationships
                                                    .changed
                                            }
                                        </Badge>
                                        <Badge variant="outline">
                                            -
                                            {
                                                reviewGrouping.compareResult
                                                    .summary.relationships
                                                    .removed
                                            }
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {reviewGrouping.sections.map((section) => (
                                <section
                                    key={section.key}
                                    className="rounded-lg border"
                                >
                                    <div className="flex flex-col gap-2 border-b p-4 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <h3 className="text-base font-semibold">
                                                {section.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {section.description}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">
                                            {section.totalCount} changes
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col gap-4 p-4">
                                        {section.buckets.length === 0 ? (
                                            <div className="text-sm text-muted-foreground">
                                                No changes in this category.
                                            </div>
                                        ) : (
                                            section.buckets.map((bucket) => (
                                                <div
                                                    key={`${section.key}:${bucket.status}`}
                                                    className="space-y-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Badge
                                                            variant={
                                                                badgeVariantByStatus[
                                                                    bucket
                                                                        .status
                                                                ]
                                                            }
                                                            className={
                                                                statusChipClassName[
                                                                    bucket
                                                                        .status
                                                                ]
                                                            }
                                                        >
                                                            {bucket.label}
                                                        </Badge>
                                                        <span className="text-sm text-muted-foreground">
                                                            {bucket.count} item
                                                            {bucket.count === 1
                                                                ? ''
                                                                : 's'}
                                                        </span>
                                                    </div>
                                                    <div className="grid gap-3">
                                                        {bucket.items.map(
                                                            (item) => (
                                                                <div
                                                                    key={
                                                                        item.id
                                                                    }
                                                                    className="rounded-md border bg-muted/20 p-3"
                                                                >
                                                                    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                                                                        <div className="font-medium">
                                                                            {
                                                                                item.label
                                                                            }
                                                                        </div>
                                                                        {item.context ? (
                                                                            <div className="text-xs text-muted-foreground">
                                                                                {
                                                                                    item.context
                                                                                }
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                    {item
                                                                        .details
                                                                        .length >
                                                                    0 ? (
                                                                        <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                                                                            {item.details.map(
                                                                                (
                                                                                    detail
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            detail
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            detail
                                                                                        }
                                                                                    </div>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="mt-2 text-sm text-muted-foreground">
                                                                            No
                                                                            additional
                                                                            property
                                                                            details.
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </section>
                            ))}

                            {reviewGrouping.supplementalSections.length > 0 ? (
                                <>
                                    <Separator />
                                    <section className="space-y-4">
                                        <div>
                                            <h3 className="text-base font-semibold">
                                                Supplemental Migration Signals
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Index, constraint, and custom
                                                type changes derived from the
                                                canonical change plan. This
                                                remains read-only here; use the
                                                Migration workflow to validate
                                                and apply.
                                            </p>
                                        </div>
                                        <div className="grid gap-4 lg:grid-cols-3">
                                            {reviewGrouping.supplementalSections.map(
                                                (section) => (
                                                    <div
                                                        key={section.key}
                                                        className="rounded-lg border p-4"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="font-medium">
                                                                {section.title}
                                                            </div>
                                                            <Badge variant="outline">
                                                                {
                                                                    section.totalCount
                                                                }
                                                            </Badge>
                                                        </div>
                                                        <p className="mt-2 text-sm text-muted-foreground">
                                                            {
                                                                section.description
                                                            }
                                                        </p>
                                                        <div className="mt-4 flex flex-col gap-3">
                                                            {section.buckets.map(
                                                                (bucket) => (
                                                                    <div
                                                                        key={`${section.key}:${bucket.status}`}
                                                                        className="space-y-2"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <Badge
                                                                                variant="outline"
                                                                                className={
                                                                                    statusChipClassName[
                                                                                        bucket
                                                                                            .status
                                                                                    ]
                                                                                }
                                                                            >
                                                                                {
                                                                                    bucket.label
                                                                                }
                                                                            </Badge>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {
                                                                                    bucket.count
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                        {bucket.items.map(
                                                                            (
                                                                                item
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        item.id
                                                                                    }
                                                                                    className="text-sm"
                                                                                >
                                                                                    <div className="font-medium">
                                                                                        {
                                                                                            item.label
                                                                                        }
                                                                                    </div>
                                                                                    {item.context ? (
                                                                                        <div className="text-xs text-muted-foreground">
                                                                                            {
                                                                                                item.context
                                                                                            }
                                                                                        </div>
                                                                                    ) : null}
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </section>
                                </>
                            ) : null}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
};
