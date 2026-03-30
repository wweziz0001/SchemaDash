import React, { useMemo } from 'react';
import { Badge } from '@/components/badge/badge';
import { DatabaseZap } from 'lucide-react';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';

const formatTimestamp = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));

export const LiveStatusChip: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();

    const status = useMemo(() => {
        if (!workflow?.diagramId) {
            return null;
        }

        const connectionName =
            workflow.workflow?.connectionName ?? 'connection';
        const connectionBadge = !workflow.workflow?.connectionId
            ? {
                  variant: 'outline' as const,
                  label: 'Disconnected',
                  title: 'No live database is bound to this diagram yet.',
              }
            : workflow.workflow.connectionStatus === 'failed'
              ? {
                    variant: 'destructive' as const,
                    label: `${connectionName} failed`,
                    title:
                        workflow.workflow.lastSyncError ??
                        'The last live connection attempt failed.',
                }
              : workflow.workflow.connectionStatus === 'ok' ||
                  workflow.workflow.liveSnapshotId
                ? {
                      variant: 'secondary' as const,
                      label: `${connectionName} linked`,
                      title: `Bound to ${connectionName}.`,
                  }
                : {
                      variant: 'outline' as const,
                      label: `${connectionName} bound`,
                      title: `Bound to ${connectionName} but not synced yet.`,
                  };

        const syncBadge =
            workflow.workflow?.syncStatus === 'error'
                ? {
                      variant: 'destructive' as const,
                      label: 'Failed',
                      title:
                          workflow.workflow.lastSyncError ??
                          'The last live sync failed.',
                  }
                : workflow.workflow?.syncStatus === 'syncing'
                  ? {
                        variant: 'secondary' as const,
                        label: 'Syncing',
                        title: 'Refreshing the live snapshot now.',
                    }
                  : workflow.workflow?.lastSyncedAt
                    ? {
                          variant: 'outline' as const,
                          label: `Synced ${formatTimestamp(
                              workflow.workflow.lastSyncedAt
                          )}`,
                          title: workflow.workflow.lastSyncedAt,
                      }
                    : {
                          variant: 'outline' as const,
                          label: workflow.workflow?.connectionId
                              ? 'Never synced'
                              : 'Live unavailable',
                          title: workflow.workflow?.connectionId
                              ? 'Bind and sync to create the first live snapshot.'
                              : 'No live database snapshot is available yet.',
                      };

        const modeBadge =
            workflow.activeMode === 'version'
                ? {
                      variant: 'secondary' as const,
                      label: 'Snapshot read-only',
                      title: 'Historical version views are immutable and read-only.',
                  }
                : workflow.activeMode === 'compare'
                  ? {
                        variant: 'secondary' as const,
                        label: 'Compare read-only',
                        title: 'Compare mode is a read-only review of Live Database versus Development.',
                    }
                  : workflow.activeMode === 'live'
                    ? {
                          variant: 'secondary' as const,
                          label: 'Live read-only',
                          title: 'Live Database mode is read-only.',
                      }
                    : {
                          variant: 'outline' as const,
                          label: 'Development editable',
                          title: 'Development mode remains editable.',
                      };

        return {
            connectionBadge,
            syncBadge,
            modeBadge,
        };
    }, [workflow]);

    if (!status) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-muted/20 px-2 py-1 shadow-sm">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <DatabaseZap className="size-3" />
                Live
            </span>
            <Badge
                variant={status.connectionBadge.variant}
                title={status.connectionBadge.title}
            >
                {status.connectionBadge.label}
            </Badge>
            <Badge
                variant={status.syncBadge.variant}
                title={status.syncBadge.title}
            >
                {status.syncBadge.label}
            </Badge>
            <Badge
                variant={status.modeBadge.variant}
                title={status.modeBadge.title}
            >
                {status.modeBadge.label}
            </Badge>
        </div>
    );
};
