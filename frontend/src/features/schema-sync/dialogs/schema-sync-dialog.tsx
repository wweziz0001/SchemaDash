import React, { useEffect, useMemo, useState } from 'react';
import {
    CheckCircle2,
    Copy,
    Database,
    GitBranch,
    LockKeyhole,
    PlayCircle,
    RefreshCw,
    ServerCog,
    ShieldCheck,
    Sparkles,
    TriangleAlert,
    Workflow,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/tabs/tabs';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Textarea } from '@/components/textarea/textarea';
import { Badge } from '@/components/badge/badge';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { useSchemaSync } from '../hooks/use-schema-sync';
import type { ConnectionUpsert } from '@schemadash/schema-sync-core';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useToast } from '@/components/toast/use-toast';
import { cn } from '@/lib/utils';

const initialConnectionDraft: ConnectionUpsert = {
    name: '',
    engine: 'postgresql',
    defaultSchemas: ['public'],
    secret: {
        host: 'localhost',
        port: 5432,
        database: '',
        username: '',
        password: '',
        sslMode: 'prefer',
    },
};

const changeKindLabel = (value: string) =>
    value
        .split('_')
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
        .join(' ');

const relativeTime = (value?: string | null) => {
    if (!value) {
        return 'Not imported yet';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
};

const levelBadgeClassName = (level: string) =>
    ({
        blocked: 'border-destructive/25 bg-destructive/10 text-destructive',
        destructive:
            'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        warning:
            'border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300',
        safe: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    })[level] ?? 'border-border bg-secondary text-secondary-foreground';

export const SchemaSyncDialog: React.FC = () => {
    const {
        open,
        setOpen,
        connections,
        selectedConnectionId,
        setSelectedConnectionId,
        previewPlan,
        applyResult,
        lastConnectionTest,
        saveConnection,
        deleteConnection,
        testConnectionDraft,
        importLiveSchema,
        refreshFromDatabase,
        previewChanges,
        applyChanges,
    } = useSchemaSync();
    const { currentDiagram } = useSchemaDash();
    const { toast } = useToast();
    const [draft, setDraft] = useState<ConnectionUpsert>(
        initialConnectionDraft
    );
    const [editingConnectionId, setEditingConnectionId] = useState<string>();
    const [importSchemas, setImportSchemas] = useState('public');
    const [importMode, setImportMode] = useState<'replace' | 'new'>('replace');
    const [confirmationText, setConfirmationText] = useState('');
    const [busyAction, setBusyAction] = useState<string>();

    const selectedConnection = useMemo(
        () =>
            connections.find(
                (connection) => connection.id === selectedConnectionId
            ),
        [connections, selectedConnectionId]
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        if (selectedConnection) {
            setDraft({
                name: selectedConnection.name,
                engine: 'postgresql',
                defaultSchemas: selectedConnection.defaultSchemas,
                secret: {
                    host: selectedConnection.host,
                    port: selectedConnection.port,
                    database: selectedConnection.database,
                    username: selectedConnection.username,
                    password: '',
                    sslMode: 'prefer',
                },
            });
            setEditingConnectionId(selectedConnection.id);
            setImportSchemas(
                (
                    currentDiagram.schemaSync?.importedSchemas ??
                    selectedConnection.defaultSchemas
                ).join(', ')
            );
        } else {
            setDraft(initialConnectionDraft);
            setEditingConnectionId(undefined);
            setImportSchemas(
                currentDiagram.schemaSync?.importedSchemas?.join(', ') ??
                    'public'
            );
        }
    }, [currentDiagram.schemaSync?.importedSchemas, open, selectedConnection]);

    const schemaList = useMemo(
        () =>
            importSchemas
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean),
        [importSchemas]
    );

    const destructiveWarnings =
        previewPlan?.warnings.filter(
            (warning) => warning.level === 'destructive'
        ) ?? [];
    const displayedImportedSchemas =
        currentDiagram.schemaSync?.importedSchemas ??
        (schemaList.length > 0 ? schemaList : ['public']);

    const workflowSnippet = useMemo(() => {
        const source = selectedConnection ?? null;
        const host =
            source?.host || draft.secret.host || '${{ secrets.DB_HOST }}';
        const port = source?.port || draft.secret.port || 5432;
        const database =
            source?.database ||
            draft.secret.database ||
            '${{ secrets.DB_DATABASE }}';
        const username =
            source?.username ||
            draft.secret.username ||
            '${{ secrets.DB_USERNAME }}';
        const schemaNames =
            schemaList.length > 0 ? schemaList.join(',') : 'public';

        return `name: Sync diagram
on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: chartdb/chartdb-action@main
        with:
          db-type: postgresql
          db-host: ${host}
          db-port: ${port}
          db-database: ${database}
          db-username: ${username}
          db-password: \${{ secrets.DB_PASSWORD }}
          chartdb-api-token: \${{ secrets.CHARTDB_API_TOKEN }}
          chartdb-diagram-id: \${{ secrets.CHARTDB_DIAGRAM_ID }}
          schemas: ${schemaNames}
          network: bridge`;
    }, [
        draft.secret.database,
        draft.secret.host,
        draft.secret.port,
        draft.secret.username,
        schemaList,
        selectedConnection,
    ]);

    const copyText = async (value: string, label: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast({
                title: `${label} copied`,
                description: 'You can paste it directly into your workflow.',
            });
        } catch {
            toast({
                title: `Copy failed`,
                description: `Unable to copy the ${label.toLowerCase()}.`,
                variant: 'destructive',
            });
        }
    };

    const run = async (key: string, fn: () => Promise<void>) => {
        setBusyAction(key);
        try {
            await fn();
        } catch (error) {
            toast({
                title: 'Schema sync action failed',
                description:
                    error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setBusyAction(undefined);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                showClose
                blurBackground
                className="flex h-[88vh] w-[min(1120px,96vw)] max-w-none flex-col overflow-hidden p-0"
            >
                <DialogHeader className="border-b border-border/70 bg-card/70 px-6 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <DialogTitle>Schema sync</DialogTitle>
                                <Badge variant="outline">PostgreSQL</Badge>
                            </div>
                            <DialogDescription className="max-w-3xl">
                                Import a live schema to create a baseline
                                snapshot, preview the migration plan, and apply
                                reviewed SQL with clearer risk signals. For
                                GitHub automation, the workflow handoff below
                                mirrors the `chartdb-action` inputs without
                                forcing the app to own your CI secrets.
                            </DialogDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                                {connections.length} saved connection
                                {connections.length === 1 ? '' : 's'}
                            </Badge>
                            <Badge variant="outline">
                                Baseline:{' '}
                                {currentDiagram.schemaSync?.baselineSnapshotId
                                    ? 'Ready'
                                    : 'Missing'}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex min-h-0 flex-1 flex-col px-6 py-5">
                    <Tabs
                        defaultValue="connections"
                        className="flex min-h-0 flex-1 flex-col"
                    >
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="connections">
                                Connections
                            </TabsTrigger>
                            <TabsTrigger value="import">
                                Baseline import
                            </TabsTrigger>
                            <TabsTrigger value="preview">
                                Preview and apply
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="connections"
                            className="min-h-0 flex-1"
                        >
                            <div className="grid h-full gap-4 lg:grid-cols-[280px_1fr]">
                                <div className="flex min-h-0 flex-col rounded-[28px] border border-border/80 bg-card/75">
                                    <div className="flex items-center justify-between border-b border-border/70 p-4">
                                        <div>
                                            <div className="text-sm font-semibold">
                                                Saved connections
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Reuse a database target across
                                                imports and previews.
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedConnectionId(
                                                    undefined
                                                );
                                                setEditingConnectionId(
                                                    undefined
                                                );
                                                setDraft(
                                                    initialConnectionDraft
                                                );
                                            }}
                                        >
                                            New
                                        </Button>
                                    </div>
                                    <ScrollArea className="min-h-0 flex-1 p-2">
                                        <div className="flex flex-col gap-2">
                                            {connections.length > 0 ? (
                                                connections.map(
                                                    (connection) => (
                                                        <button
                                                            key={connection.id}
                                                            type="button"
                                                            className={cn(
                                                                'rounded-2xl border px-4 py-3 text-left transition-all',
                                                                selectedConnectionId ===
                                                                    connection.id
                                                                    ? 'border-primary/25 bg-primary/10 shadow-sm'
                                                                    : 'border-transparent bg-background/50 hover:border-border hover:bg-accent/60'
                                                            )}
                                                            onClick={() =>
                                                                setSelectedConnectionId(
                                                                    connection.id
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="font-medium">
                                                                    {
                                                                        connection.name
                                                                    }
                                                                </div>
                                                                <Badge variant="outline">
                                                                    {
                                                                        connection.engine
                                                                    }
                                                                </Badge>
                                                            </div>
                                                            <div className="mt-1 text-xs text-muted-foreground">
                                                                {
                                                                    connection.host
                                                                }
                                                                :
                                                                {
                                                                    connection.port
                                                                }{' '}
                                                                /{' '}
                                                                {
                                                                    connection.database
                                                                }
                                                            </div>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {connection.defaultSchemas.map(
                                                                    (
                                                                        schema
                                                                    ) => (
                                                                        <Badge
                                                                            key={`${connection.id}-${schema}`}
                                                                            variant="secondary"
                                                                        >
                                                                            {
                                                                                schema
                                                                            }
                                                                        </Badge>
                                                                    )
                                                                )}
                                                            </div>
                                                        </button>
                                                    )
                                                )
                                            ) : (
                                                <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                                                    Save a connection to reuse
                                                    host, port, database, and
                                                    schema defaults.
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>

                                <div className="grid min-h-0 gap-4">
                                    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
                                        <div className="rounded-[28px] border border-border/80 bg-card/75 p-5">
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <div className="text-base font-semibold">
                                                        Connection details
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        This matches the
                                                        database fields that
                                                        power local imports and
                                                        the GitHub Action
                                                        handoff.
                                                    </div>
                                                </div>
                                                <Badge variant="secondary">
                                                    Required for preview
                                                </Badge>
                                            </div>

                                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                                <div className="grid gap-2 md:col-span-2">
                                                    <label className="text-sm font-medium">
                                                        Connection name
                                                    </label>
                                                    <Input
                                                        value={draft.name}
                                                        placeholder="Production analytics"
                                                        onChange={(event) =>
                                                            setDraft(
                                                                (current) => ({
                                                                    ...current,
                                                                    name: event
                                                                        .target
                                                                        .value,
                                                                })
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">
                                                        Host
                                                    </label>
                                                    <Input
                                                        value={
                                                            draft.secret.host
                                                        }
                                                        placeholder="db.example.internal"
                                                        onChange={(event) =>
                                                            setDraft(
                                                                (current) => ({
                                                                    ...current,
                                                                    secret: {
                                                                        ...current.secret,
                                                                        host: event
                                                                            .target
                                                                            .value,
                                                                    },
                                                                })
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">
                                                        Port
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={
                                                            draft.secret.port
                                                        }
                                                        onChange={(event) =>
                                                            setDraft(
                                                                (current) => ({
                                                                    ...current,
                                                                    secret: {
                                                                        ...current.secret,
                                                                        port:
                                                                            Number.parseInt(
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                                10
                                                                            ) ||
                                                                            5432,
                                                                    },
                                                                })
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">
                                                        Database
                                                    </label>
                                                    <Input
                                                        value={
                                                            draft.secret
                                                                .database
                                                        }
                                                        placeholder="app"
                                                        onChange={(event) =>
                                                            setDraft(
                                                                (current) => ({
                                                                    ...current,
                                                                    secret: {
                                                                        ...current.secret,
                                                                        database:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                })
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">
                                                        Username
                                                    </label>
                                                    <Input
                                                        value={
                                                            draft.secret
                                                                .username
                                                        }
                                                        placeholder="readonly_sync"
                                                        onChange={(event) =>
                                                            setDraft(
                                                                (current) => ({
                                                                    ...current,
                                                                    secret: {
                                                                        ...current.secret,
                                                                        username:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                })
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">
                                                        Default schemas
                                                    </label>
                                                    <Input
                                                        value={draft.defaultSchemas.join(
                                                            ', '
                                                        )}
                                                        placeholder="public, auth"
                                                        onChange={(event) =>
                                                            setDraft(
                                                                (current) => ({
                                                                    ...current,
                                                                    defaultSchemas:
                                                                        event.target.value
                                                                            .split(
                                                                                ','
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    value
                                                                                ) =>
                                                                                    value.trim()
                                                                            )
                                                                            .filter(
                                                                                Boolean
                                                                            ),
                                                                })
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <label className="text-sm font-medium">
                                                        SSL mode
                                                    </label>
                                                    <Select
                                                        value={
                                                            draft.secret.sslMode
                                                        }
                                                        onValueChange={(
                                                            value
                                                        ) =>
                                                            setDraft(
                                                                (current) => ({
                                                                    ...current,
                                                                    secret: {
                                                                        ...current.secret,
                                                                        sslMode:
                                                                            value as ConnectionUpsert['secret']['sslMode'],
                                                                    },
                                                                })
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="disable">
                                                                Disable
                                                            </SelectItem>
                                                            <SelectItem value="prefer">
                                                                Prefer
                                                            </SelectItem>
                                                            <SelectItem value="require">
                                                                Require
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-2 md:col-span-2">
                                                    <label className="text-sm font-medium">
                                                        Password{' '}
                                                        {editingConnectionId
                                                            ? '(enter again to update securely)'
                                                            : ''}
                                                    </label>
                                                    <Input
                                                        type="password"
                                                        value={
                                                            draft.secret
                                                                .password
                                                        }
                                                        placeholder="Stored in your backend, never embedded in the workflow snippet."
                                                        onChange={(event) =>
                                                            setDraft(
                                                                (current) => ({
                                                                    ...current,
                                                                    secret: {
                                                                        ...current.secret,
                                                                        password:
                                                                            event
                                                                                .target
                                                                                .value,
                                                                    },
                                                                })
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>

                                            {lastConnectionTest ? (
                                                <div
                                                    className={cn(
                                                        'mt-5 rounded-2xl border p-4 text-sm',
                                                        lastConnectionTest.ok
                                                            ? 'border-emerald-500/20 bg-emerald-500/5'
                                                            : 'border-destructive/20 bg-destructive/5'
                                                    )}
                                                >
                                                    <div className="flex items-center gap-2 font-medium">
                                                        {lastConnectionTest.ok ? (
                                                            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                                                        ) : (
                                                            <TriangleAlert className="size-4 text-destructive" />
                                                        )}
                                                        {lastConnectionTest.ok
                                                            ? 'Connection verified'
                                                            : 'Connection test failed'}
                                                    </div>
                                                    {lastConnectionTest.version ? (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Server version:{' '}
                                                            {
                                                                lastConnectionTest.version
                                                            }
                                                        </div>
                                                    ) : null}
                                                    {lastConnectionTest
                                                        .availableSchemas
                                                        .length > 0 ? (
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {lastConnectionTest.availableSchemas.map(
                                                                (schema) => (
                                                                    <Badge
                                                                        key={
                                                                            schema
                                                                        }
                                                                        variant="secondary"
                                                                    >
                                                                        {schema}
                                                                    </Badge>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : null}
                                                    {lastConnectionTest.error ? (
                                                        <div className="mt-3 text-xs text-destructive">
                                                            {
                                                                lastConnectionTest.error
                                                            }
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}

                                            <div className="mt-5 flex flex-wrap gap-2">
                                                <Button
                                                    onClick={() =>
                                                        run(
                                                            'test-connection',
                                                            async () => {
                                                                await testConnectionDraft(
                                                                    draft,
                                                                    editingConnectionId
                                                                );
                                                            }
                                                        )
                                                    }
                                                    disabled={
                                                        busyAction ===
                                                        'test-connection'
                                                    }
                                                >
                                                    <ServerCog className="size-4" />
                                                    Test connection
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() =>
                                                        run(
                                                            'save-connection',
                                                            async () => {
                                                                await saveConnection(
                                                                    draft,
                                                                    editingConnectionId
                                                                );
                                                            }
                                                        )
                                                    }
                                                    disabled={
                                                        busyAction ===
                                                        'save-connection'
                                                    }
                                                >
                                                    <ShieldCheck className="size-4" />
                                                    {editingConnectionId
                                                        ? 'Update connection'
                                                        : 'Save connection'}
                                                </Button>
                                                {editingConnectionId ? (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() =>
                                                            run(
                                                                'delete-connection',
                                                                async () => {
                                                                    await deleteConnection(
                                                                        editingConnectionId
                                                                    );
                                                                }
                                                            )
                                                        }
                                                        disabled={
                                                            busyAction ===
                                                            'delete-connection'
                                                        }
                                                    >
                                                        Delete
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="rounded-[28px] border border-border/80 bg-card/75 p-5">
                                            <div className="flex items-center gap-2 text-base font-semibold">
                                                <Workflow className="size-4 text-primary" />
                                                GitHub Action handoff
                                            </div>
                                            <div className="mt-2 text-sm leading-6 text-muted-foreground">
                                                `chartdb-action` expects
                                                database connection inputs,
                                                `chartdb-api-token`, and
                                                `chartdb-diagram-id`. Keep the
                                                token and password in GitHub
                                                Secrets; this app only helps you
                                                prepare the connection shape and
                                                baseline workflow.
                                            </div>
                                            <div className="mt-4 space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                                                {[
                                                    'db-type',
                                                    'db-host',
                                                    'db-port',
                                                    'db-database',
                                                    'db-username',
                                                    'db-password',
                                                    'chartdb-api-token',
                                                    'chartdb-diagram-id',
                                                    'schemas',
                                                    'network',
                                                ].map((item) => (
                                                    <div
                                                        key={item}
                                                        className="flex items-center justify-between gap-3 text-sm"
                                                    >
                                                        <span className="font-medium text-foreground">
                                                            {item}
                                                        </span>
                                                        <span className="text-right text-muted-foreground">
                                                            {item === 'schemas'
                                                                ? schemaList.join(
                                                                      ', '
                                                                  ) || 'public'
                                                                : item ===
                                                                    'db-type'
                                                                  ? 'postgresql'
                                                                  : item ===
                                                                      'db-host'
                                                                    ? draft
                                                                          .secret
                                                                          .host ||
                                                                      'Set from connection'
                                                                    : item ===
                                                                        'db-port'
                                                                      ? String(
                                                                            draft
                                                                                .secret
                                                                                .port ||
                                                                                5432
                                                                        )
                                                                      : item ===
                                                                          'db-database'
                                                                        ? draft
                                                                              .secret
                                                                              .database ||
                                                                          'Set from connection'
                                                                        : item ===
                                                                            'db-username'
                                                                          ? draft
                                                                                .secret
                                                                                .username ||
                                                                            'Set from connection'
                                                                          : item ===
                                                                              'network'
                                                                            ? 'bridge'
                                                                            : 'GitHub secret'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="import" className="min-h-0 flex-1">
                            <div className="grid h-full gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                                <div className="grid gap-4">
                                    <div className="rounded-[28px] border border-border/80 bg-card/75 p-5">
                                        <div className="flex items-center gap-2 text-base font-semibold">
                                            <Database className="size-4 text-primary" />
                                            Baseline snapshot workflow
                                        </div>
                                        <div className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Importing the live schema creates
                                            the baseline snapshot used for diff
                                            previews. From there, the editor is
                                            treated as the target state and the
                                            apply step executes generated SQL.
                                        </div>

                                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">
                                                    Connection
                                                </label>
                                                <Select
                                                    value={
                                                        selectedConnectionId ??
                                                        ''
                                                    }
                                                    onValueChange={(value) =>
                                                        setSelectedConnectionId(
                                                            value || undefined
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a connection" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {connections.map(
                                                            (connection) => (
                                                                <SelectItem
                                                                    key={
                                                                        connection.id
                                                                    }
                                                                    value={
                                                                        connection.id
                                                                    }
                                                                >
                                                                    {
                                                                        connection.name
                                                                    }
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <label className="text-sm font-medium">
                                                    Schemas to import
                                                </label>
                                                <Input
                                                    value={importSchemas}
                                                    onChange={(event) =>
                                                        setImportSchemas(
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="public, auth"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            <label className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm">
                                                <div className="flex items-center gap-2 font-medium text-foreground">
                                                    <input
                                                        type="radio"
                                                        checked={
                                                            importMode ===
                                                            'replace'
                                                        }
                                                        onChange={() =>
                                                            setImportMode(
                                                                'replace'
                                                            )
                                                        }
                                                    />
                                                    Replace current diagram
                                                </div>
                                                <div className="mt-2 pl-6 text-muted-foreground">
                                                    Best when you want the
                                                    editor to reflect the live
                                                    database immediately.
                                                </div>
                                            </label>
                                            <label className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm">
                                                <div className="flex items-center gap-2 font-medium text-foreground">
                                                    <input
                                                        type="radio"
                                                        checked={
                                                            importMode === 'new'
                                                        }
                                                        onChange={() =>
                                                            setImportMode('new')
                                                        }
                                                    />
                                                    Create a new diagram
                                                </div>
                                                <div className="mt-2 pl-6 text-muted-foreground">
                                                    Safer when you want a fresh
                                                    working copy without
                                                    disturbing the current
                                                    canvas.
                                                </div>
                                            </label>
                                        </div>

                                        <div className="mt-5 flex flex-wrap gap-2">
                                            <Button
                                                onClick={() =>
                                                    run(
                                                        'import-live',
                                                        async () => {
                                                            if (
                                                                !selectedConnectionId
                                                            ) {
                                                                throw new Error(
                                                                    'Select a connection first.'
                                                                );
                                                            }
                                                            await importLiveSchema(
                                                                {
                                                                    connectionId:
                                                                        selectedConnectionId,
                                                                    schemas:
                                                                        schemaList.length >
                                                                        0
                                                                            ? schemaList
                                                                            : [
                                                                                  'public',
                                                                              ],
                                                                    mode: importMode,
                                                                }
                                                            );
                                                        }
                                                    )
                                                }
                                                disabled={
                                                    !selectedConnectionId ||
                                                    busyAction === 'import-live'
                                                }
                                            >
                                                <Sparkles className="size-4" />
                                                Import baseline
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() =>
                                                    run(
                                                        'refresh-db',
                                                        async () => {
                                                            await refreshFromDatabase();
                                                        }
                                                    )
                                                }
                                                disabled={
                                                    busyAction === 'refresh-db'
                                                }
                                            >
                                                <RefreshCw className="size-4" />
                                                Refresh from database
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4">
                                    <div className="rounded-[28px] border border-border/80 bg-card/75 p-5">
                                        <div className="flex items-center gap-2 text-base font-semibold">
                                            <GitBranch className="size-4 text-primary" />
                                            Current sync status
                                        </div>
                                        <div className="mt-4 grid gap-3">
                                            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                                    Connected source
                                                </div>
                                                <div className="mt-2 text-sm font-medium">
                                                    {selectedConnection?.name ??
                                                        'No connection selected'}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                                    Baseline snapshot
                                                </div>
                                                <div className="mt-2 break-all text-sm font-medium">
                                                    {currentDiagram.schemaSync
                                                        ?.baselineSnapshotId ??
                                                        'Not created yet'}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                                    Imported schemas
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {displayedImportedSchemas.map(
                                                        (schema) => (
                                                            <Badge
                                                                key={schema}
                                                                variant="secondary"
                                                            >
                                                                {schema}
                                                            </Badge>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                                    Last import
                                                </div>
                                                <div className="mt-2 text-sm font-medium">
                                                    {relativeTime(
                                                        currentDiagram
                                                            .schemaSync
                                                            ?.lastImportedAt
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[28px] border border-border/80 bg-card/75 p-5">
                                        <div className="flex items-center gap-2 text-base font-semibold">
                                            <LockKeyhole className="size-4 text-primary" />
                                            GitHub workflow snippet
                                        </div>
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            Adapt this for CI once your baseline
                                            looks right locally.
                                        </div>
                                        <Textarea
                                            readOnly
                                            value={workflowSnippet}
                                            className="mt-4 min-h-[250px] font-mono text-xs"
                                        />
                                        <div className="mt-3 flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    void copyText(
                                                        workflowSnippet,
                                                        'Workflow snippet'
                                                    )
                                                }
                                            >
                                                <Copy className="size-4" />
                                                Copy YAML
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="min-h-0 flex-1">
                            <div className="grid h-full gap-4 lg:grid-cols-[320px_1fr]">
                                <div className="flex min-h-0 flex-col gap-4">
                                    <div className="rounded-[28px] border border-border/80 bg-card/75 p-5">
                                        <div className="flex items-center gap-2 text-base font-semibold">
                                            <PlayCircle className="size-4 text-primary" />
                                            Preview and deploy
                                        </div>
                                        <div className="mt-2 text-sm text-muted-foreground">
                                            Preview generates a persisted change
                                            plan from the baseline snapshot and
                                            the current diagram state. Apply
                                            then runs the generated SQL.
                                        </div>

                                        <div className="mt-4 grid gap-3">
                                            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                                    Baseline snapshot
                                                </div>
                                                <div className="mt-2 break-all text-sm font-medium">
                                                    {currentDiagram.schemaSync
                                                        ?.baselineSnapshotId ??
                                                        'Import a baseline first'}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                                                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                                    Preview status
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <Badge
                                                        className={cn(
                                                            previewPlan
                                                                ? levelBadgeClassName(
                                                                      previewPlan.blocked
                                                                          ? 'blocked'
                                                                          : previewPlan.requiresConfirmation
                                                                            ? 'destructive'
                                                                            : 'safe'
                                                                  )
                                                                : 'border-border bg-secondary text-secondary-foreground'
                                                        )}
                                                        variant="outline"
                                                    >
                                                        {previewPlan
                                                            ? previewPlan.blocked
                                                                ? 'Blocked'
                                                                : previewPlan.requiresConfirmation
                                                                  ? 'Needs confirmation'
                                                                  : 'Ready to apply'
                                                            : 'No preview yet'}
                                                    </Badge>
                                                    {applyResult ? (
                                                        <Badge variant="secondary">
                                                            Apply status:{' '}
                                                            {applyResult.status}
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex flex-col gap-2">
                                            <Button
                                                onClick={() =>
                                                    run('preview', async () => {
                                                        await previewChanges();
                                                    })
                                                }
                                                disabled={
                                                    busyAction === 'preview'
                                                }
                                            >
                                                <Sparkles className="size-4" />
                                                Preview changes
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() =>
                                                    run('apply', async () => {
                                                        await applyChanges(
                                                            confirmationText
                                                        );
                                                    })
                                                }
                                                disabled={
                                                    !previewPlan ||
                                                    previewPlan.blocked ||
                                                    busyAction === 'apply'
                                                }
                                            >
                                                <ShieldCheck className="size-4" />
                                                Apply SQL
                                            </Button>
                                        </div>

                                        {previewPlan?.blocked ? (
                                            <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
                                                <div className="flex items-center gap-2 font-medium text-destructive">
                                                    <TriangleAlert className="size-4" />
                                                    Apply blocked
                                                </div>
                                                <div className="mt-2 text-muted-foreground">
                                                    Resolve the blocked warnings
                                                    before applying this plan.
                                                </div>
                                            </div>
                                        ) : null}

                                        {destructiveWarnings.length > 0 ? (
                                            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
                                                <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
                                                    <TriangleAlert className="size-4" />
                                                    Destructive confirmation
                                                </div>
                                                <div className="mt-2 text-muted-foreground">
                                                    Type{' '}
                                                    <code>
                                                        APPLY DESTRUCTIVE
                                                        CHANGES
                                                    </code>{' '}
                                                    to approve drops.
                                                </div>
                                                <Input
                                                    className="mt-3"
                                                    value={confirmationText}
                                                    onChange={(event) =>
                                                        setConfirmationText(
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="min-h-0 rounded-[28px] border border-border/80 bg-card/75 p-5">
                                    <Tabs
                                        defaultValue="summary"
                                        className="flex h-full flex-col"
                                    >
                                        <TabsList className="grid w-full grid-cols-4">
                                            <TabsTrigger value="summary">
                                                Summary
                                            </TabsTrigger>
                                            <TabsTrigger value="diff">
                                                Changes
                                            </TabsTrigger>
                                            <TabsTrigger value="sql">
                                                SQL
                                            </TabsTrigger>
                                            <TabsTrigger value="warnings">
                                                Warnings
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent
                                            value="summary"
                                            className="min-h-0 flex-1"
                                        >
                                            {previewPlan ? (
                                                <div className="grid gap-4 lg:grid-cols-2">
                                                    {[
                                                        {
                                                            label: 'Total',
                                                            value: previewPlan
                                                                .summary
                                                                .totalChanges,
                                                        },
                                                        {
                                                            label: 'Safe',
                                                            value: previewPlan
                                                                .summary
                                                                .safeChanges,
                                                        },
                                                        {
                                                            label: 'Warnings',
                                                            value: previewPlan
                                                                .summary
                                                                .warningChanges,
                                                        },
                                                        {
                                                            label: 'Destructive',
                                                            value: previewPlan
                                                                .summary
                                                                .destructiveChanges,
                                                        },
                                                    ].map((item) => (
                                                        <div
                                                            key={item.label}
                                                            className="rounded-2xl border border-border/70 bg-background/70 p-4"
                                                        >
                                                            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                                                {item.label}
                                                            </div>
                                                            <div className="mt-2 text-3xl font-semibold tracking-tight">
                                                                {item.value}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="rounded-2xl border border-border/70 bg-background/70 p-4 lg:col-span-2">
                                                        <div className="text-sm font-semibold">
                                                            Plan details
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            <Badge
                                                                className={cn(
                                                                    levelBadgeClassName(
                                                                        previewPlan.blocked
                                                                            ? 'blocked'
                                                                            : previewPlan.requiresConfirmation
                                                                              ? 'destructive'
                                                                              : 'safe'
                                                                    )
                                                                )}
                                                                variant="outline"
                                                            >
                                                                {previewPlan.blocked
                                                                    ? 'Blocked'
                                                                    : previewPlan.requiresConfirmation
                                                                      ? 'Needs confirmation'
                                                                      : 'Ready to apply'}
                                                            </Badge>
                                                            <Badge variant="secondary">
                                                                SQL statements:{' '}
                                                                {
                                                                    previewPlan
                                                                        .sqlStatements
                                                                        .length
                                                                }
                                                            </Badge>
                                                            <Badge variant="secondary">
                                                                Warning items:{' '}
                                                                {
                                                                    previewPlan
                                                                        .warnings
                                                                        .length
                                                                }
                                                            </Badge>
                                                        </div>
                                                        {applyResult ? (
                                                            <div className="mt-4 rounded-2xl border border-border/70 bg-card/80 p-4">
                                                                <div className="text-sm font-semibold">
                                                                    Apply result
                                                                </div>
                                                                <div className="mt-2 text-sm text-muted-foreground">
                                                                    Status:{' '}
                                                                    {
                                                                        applyResult.status
                                                                    }
                                                                </div>
                                                                <div className="mt-1 text-sm text-muted-foreground">
                                                                    Executed
                                                                    statements:{' '}
                                                                    {
                                                                        applyResult
                                                                            .executedStatements
                                                                            .length
                                                                    }
                                                                </div>
                                                                {applyResult.error ? (
                                                                    <div className="mt-2 text-sm text-destructive">
                                                                        {
                                                                            applyResult.error
                                                                        }
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                                                    Run preview to compute the
                                                    migration plan, generated
                                                    SQL, and risk warnings.
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent
                                            value="diff"
                                            className="min-h-0 flex-1"
                                        >
                                            <ScrollArea className="h-[52vh] pr-1">
                                                <div className="flex flex-col gap-3 pr-4">
                                                    {previewPlan?.changes
                                                        .length ? (
                                                        previewPlan.changes.map(
                                                            (change) => (
                                                                <div
                                                                    key={
                                                                        change.id
                                                                    }
                                                                    className="rounded-2xl border border-border/70 bg-background/70 p-4"
                                                                >
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <Badge variant="outline">
                                                                            {changeKindLabel(
                                                                                change.kind
                                                                            )}
                                                                        </Badge>
                                                                        {'tableName' in
                                                                        change ? (
                                                                            <span className="text-sm font-medium">
                                                                                {
                                                                                    change.tableName
                                                                                }
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                    <pre className="mt-3 whitespace-pre-wrap text-xs leading-6 text-muted-foreground">
                                                                        {JSON.stringify(
                                                                            change,
                                                                            null,
                                                                            2
                                                                        )}
                                                                    </pre>
                                                                </div>
                                                            )
                                                        )
                                                    ) : (
                                                        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                                                            No preview available
                                                            yet.
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </TabsContent>

                                        <TabsContent
                                            value="sql"
                                            className="min-h-0 flex-1"
                                        >
                                            <Textarea
                                                readOnly
                                                className="min-h-[52vh] font-mono text-xs"
                                                value={
                                                    previewPlan?.sqlStatements.join(
                                                        '\n\n'
                                                    ) ?? ''
                                                }
                                                placeholder="Generated migration SQL will appear here after preview."
                                            />
                                        </TabsContent>

                                        <TabsContent
                                            value="warnings"
                                            className="min-h-0 flex-1"
                                        >
                                            <ScrollArea className="h-[52vh] pr-1">
                                                <div className="flex flex-col gap-3 pr-4">
                                                    {previewPlan?.warnings
                                                        .length ? (
                                                        previewPlan.warnings.map(
                                                            (
                                                                warning,
                                                                index
                                                            ) => (
                                                                <div
                                                                    key={`${warning.code}-${index}`}
                                                                    className="rounded-2xl border border-border/70 bg-background/70 p-4"
                                                                >
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={cn(
                                                                                levelBadgeClassName(
                                                                                    warning.level
                                                                                )
                                                                            )}
                                                                        >
                                                                            {
                                                                                warning.level
                                                                            }
                                                                        </Badge>
                                                                        <div className="text-sm font-semibold">
                                                                            {
                                                                                warning.title
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                    <div className="mt-2 text-sm leading-6 text-muted-foreground">
                                                                        {
                                                                            warning.message
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )
                                                        )
                                                    ) : (
                                                        <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                                                            No warnings
                                                            generated yet.
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};
