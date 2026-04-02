import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import { Button } from '@/components/button/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/dialog/dialog';
import { Input } from '@/components/input/input';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/resizable/resizable';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/tabs/tabs';
import { useOptionalDiagramWorkflow } from '@/context/diagram-workflow-context/diagram-workflow-context';
import { exportBaseSQL } from '@/lib/data/sql-export/export-sql-script';
import { buildReviewGrouping } from '@/lib/diagram-workflow/review-grouping';
import type { DBTable } from '@/lib/domain/db-table';
import type { Diagram } from '@/lib/domain/diagram';
import { canonicalSchemaToDiagram } from '@/lib/schema-sync/canonical-adapters';
import { cn } from '@/lib/utils';
import type {
    CompareRelationshipResult,
    CompareTableResult,
} from '@schemadash/schema-sync-core/compare-types';
import { ChevronDown, GitFork, Search, Table2, Undo2 } from 'lucide-react';

type ReviewCompareResult = ReturnType<
    typeof buildReviewGrouping
>['compareResult'];
type ReviewFormat = 'sql' | 'dbml';
type ReviewItemKind = 'table' | 'relationship';
type ReviewItemStatus = 'added' | 'removed' | 'changed';
type ReviewSurface = 'baseline' | 'target';

interface ReviewBrowserItem {
    id: string;
    kind: ReviewItemKind;
    label: string;
    searchText: string;
    status: ReviewItemStatus;
    tableResult?: CompareTableResult;
    relationshipResult?: CompareRelationshipResult;
}

export interface ReviewChangesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const qualifyTableName = (
    schemaName: string | null | undefined,
    tableName: string | null | undefined
) => `${schemaName ?? 'public'}.${tableName ?? 'unknown'}`.toLowerCase();

const quoteIdentifier = (value: string) => `"${value.replace(/"/g, '""')}"`;

const formatQualifiedName = (
    schemaName: string | null | undefined,
    tableName: string | null | undefined
) =>
    `${quoteIdentifier(schemaName ?? 'public')}.${quoteIdentifier(tableName ?? 'unknown')}`;

const buildTableMatchKeys = (table: DBTable) =>
    [table.syncMetadata?.sourceId, qualifyTableName(table.schema, table.name)]
        .filter(Boolean)
        .map((value) => value.toLowerCase());

const findDiagramTableByMatchKey = (
    diagram: Diagram,
    matchKey: string | null | undefined
) => {
    if (!matchKey) {
        return undefined;
    }

    const normalizedKey = matchKey.toLowerCase();
    return (diagram.tables ?? []).find((table) =>
        buildTableMatchKeys(table).includes(normalizedKey)
    );
};

const buildDiagramSnippet = ({
    baseDiagram,
    tables,
}: {
    baseDiagram: Diagram;
    tables: DBTable[];
}) => ({
    ...baseDiagram,
    tables,
    relationships: [],
    dependencies: [],
    areas: [],
    notes: [],
});

const buildTableSqlSnippet = ({
    diagram,
    table,
}: {
    diagram: Diagram;
    table?: DBTable;
}) => {
    if (!table) {
        return '';
    }

    try {
        return exportBaseSQL({
            diagram: buildDiagramSnippet({
                baseDiagram: diagram,
                tables: [table],
            }),
            targetDatabaseType: diagram.databaseType,
        }).trim();
    } catch {
        return '';
    }
};

const buildTableDbmlSnippet = ({
    tableResult,
    surface,
}: {
    tableResult: CompareTableResult;
    surface: ReviewSurface;
}) => {
    const snapshot =
        surface === 'baseline' ? tableResult.baseline : tableResult.target;

    if (!snapshot) {
        return '';
    }

    const primaryKeyColumnIds = new Set(snapshot.primaryKey?.columnIds ?? []);
    const lines = snapshot.columns.map((column) => {
        const fieldAttributes = [
            primaryKeyColumnIds.has(column.id) ? 'pk' : null,
            column.nullable ? null : 'not null',
            column.isUnique ? 'unique' : null,
            column.isIdentity ? 'increment' : null,
        ].filter(Boolean);

        const fieldType = column.dataTypeDisplay ?? column.dataType;

        return `  ${quoteIdentifier(column.name)} ${fieldType}${fieldAttributes.length > 0 ? ` [${fieldAttributes.join(', ')}]` : ''}`;
    });

    return [
        `Table ${quoteIdentifier(snapshot.schemaName)}.${quoteIdentifier(snapshot.name)} {`,
        ...lines,
        `}`,
    ].join('\n');
};

const resolveFieldNames = ({
    table,
    columnIds,
}: {
    table?: DBTable;
    columnIds: string[];
}) =>
    columnIds.map((columnId) => {
        const normalizedColumnId = columnId.toLowerCase();
        const match = table?.fields.find((field) =>
            [field.id, field.syncMetadata?.sourceId, field.name]
                .filter(Boolean)
                .some((value) => value.toLowerCase() === normalizedColumnId)
        );

        return match?.name ?? columnId;
    });

const buildRelationshipSqlSnippet = ({
    relationship,
    surface,
    compareResult,
    baselineDiagram,
    developmentDiagram,
}: {
    relationship: CompareRelationshipResult;
    surface: ReviewSurface;
    compareResult: ReviewCompareResult;
    baselineDiagram: Diagram;
    developmentDiagram: Diagram;
}) => {
    const snapshot =
        surface === 'baseline' ? relationship.baseline : relationship.target;
    const tableMatchKey =
        surface === 'baseline'
            ? relationship.baselineTableMatchKey
            : relationship.targetTableMatchKey;

    if (!snapshot || !tableMatchKey) {
        return '';
    }

    const tableResult = compareResult.tables.find(
        (table) => table.matchKey === tableMatchKey
    );
    const tableSnapshot =
        surface === 'baseline' ? tableResult?.baseline : tableResult?.target;
    const sourceDiagram =
        surface === 'baseline' ? baselineDiagram : developmentDiagram;
    const sourceTable = findDiagramTableByMatchKey(
        sourceDiagram,
        tableMatchKey
    );
    const localColumnNames = resolveFieldNames({
        table: sourceTable,
        columnIds: snapshot.columnIds,
    }).map(quoteIdentifier);
    const referencedColumns =
        snapshot.referencedColumnNames.map(quoteIdentifier);

    return [
        `ALTER TABLE ${formatQualifiedName(tableSnapshot?.schemaName, tableSnapshot?.name)} ADD CONSTRAINT ${quoteIdentifier(snapshot.name)} FOREIGN KEY (${localColumnNames.join(', ')}) REFERENCES ${formatQualifiedName(snapshot.referencedSchemaName, snapshot.referencedTableName)} (${referencedColumns.join(', ')})${snapshot.onDelete ? ` ON DELETE ${snapshot.onDelete}` : ''}${snapshot.onUpdate ? ` ON UPDATE ${snapshot.onUpdate}` : ''};`,
    ].join('\n');
};

const buildRelationshipDbmlSnippet = ({
    relationship,
    surface,
    compareResult,
    baselineDiagram,
    developmentDiagram,
}: {
    relationship: CompareRelationshipResult;
    surface: ReviewSurface;
    compareResult: ReviewCompareResult;
    baselineDiagram: Diagram;
    developmentDiagram: Diagram;
}) => {
    const snapshot =
        surface === 'baseline' ? relationship.baseline : relationship.target;
    const tableMatchKey =
        surface === 'baseline'
            ? relationship.baselineTableMatchKey
            : relationship.targetTableMatchKey;

    if (!snapshot || !tableMatchKey) {
        return '';
    }

    const tableResult = compareResult.tables.find(
        (table) => table.matchKey === tableMatchKey
    );
    const tableSnapshot =
        surface === 'baseline' ? tableResult?.baseline : tableResult?.target;
    const sourceDiagram =
        surface === 'baseline' ? baselineDiagram : developmentDiagram;
    const sourceTable = findDiagramTableByMatchKey(
        sourceDiagram,
        tableMatchKey
    );
    const localColumns = resolveFieldNames({
        table: sourceTable,
        columnIds: snapshot.columnIds,
    });

    const lines = localColumns.map((columnName, index) => {
        const referencedColumn =
            snapshot.referencedColumnNames[index] ??
            snapshot.referencedColumnNames[0] ??
            'id';

        return `  ${quoteIdentifier(
            tableSnapshot?.schemaName ?? 'public'
        )}.${quoteIdentifier(tableSnapshot?.name ?? 'unknown')}.${quoteIdentifier(columnName)} > ${quoteIdentifier(snapshot.referencedSchemaName)}.${quoteIdentifier(snapshot.referencedTableName)}.${quoteIdentifier(referencedColumn)}`;
    });

    const modifiers = [
        snapshot.onDelete ? `delete: ${snapshot.onDelete.toLowerCase()}` : null,
        snapshot.onUpdate ? `update: ${snapshot.onUpdate.toLowerCase()}` : null,
    ].filter(Boolean);

    return [
        `Ref ${quoteIdentifier(snapshot.name)} {`,
        ...lines,
        modifiers.length > 0 ? `  Note: ${modifiers.join(', ')}` : null,
        `}`,
    ]
        .filter(Boolean)
        .join('\n');
};

const getRowToneClassName = ({
    status,
    surface,
    selected,
}: {
    status: ReviewItemStatus;
    surface: ReviewSurface;
    selected: boolean;
}) => {
    const baseClassName =
        'flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors';

    if (status === 'added' && surface === 'target') {
        return cn(
            baseClassName,
            'border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100',
            selected &&
                'border-emerald-500 ring-1 ring-emerald-500 dark:border-emerald-500'
        );
    }

    if (status === 'removed' && surface === 'baseline') {
        return cn(
            baseClassName,
            'border-rose-100 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100',
            selected &&
                'border-rose-500 ring-1 ring-rose-500 dark:border-rose-500'
        );
    }

    return cn(
        baseClassName,
        'border-sky-100 bg-sky-50 text-slate-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-slate-100',
        selected && 'border-blue-500 ring-1 ring-blue-500 dark:border-blue-400'
    );
};

const ReviewCodePane: React.FC<{
    code: string;
    emptyLabel: string;
    surface: ReviewSurface;
}> = ({ code, emptyLabel, surface }) => {
    if (!code.trim()) {
        return (
            <div className="h-full overflow-hidden rounded-lg border bg-background">
                <div
                    className={cn(
                        'h-full min-h-[220px] w-full',
                        surface === 'baseline'
                            ? 'bg-[repeating-linear-gradient(135deg,theme(colors.rose.100)_0px,theme(colors.rose.100)_2px,transparent_2px,transparent_8px)] dark:bg-[repeating-linear-gradient(135deg,rgba(244,63,94,0.2)_0px,rgba(244,63,94,0.2)_2px,transparent_2px,transparent_8px)]'
                            : 'bg-[repeating-linear-gradient(135deg,theme(colors.emerald.100)_0px,theme(colors.emerald.100)_2px,transparent_2px,transparent_8px)] dark:bg-[repeating-linear-gradient(135deg,rgba(16,185,129,0.2)_0px,rgba(16,185,129,0.2)_2px,transparent_2px,transparent_8px)]'
                    )}
                >
                    <div className="p-6 font-mono text-xs text-muted-foreground">
                        {emptyLabel}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-hidden rounded-lg border bg-background">
            <ScrollArea className="h-full">
                <pre
                    className={cn(
                        'min-h-[220px] whitespace-pre-wrap p-6 font-mono text-[13px] leading-6',
                        surface === 'baseline'
                            ? 'bg-rose-50/80 dark:bg-rose-950/20'
                            : 'bg-emerald-50/80 dark:bg-emerald-950/20'
                    )}
                >
                    {code}
                </pre>
            </ScrollArea>
        </div>
    );
};

const ReviewColumnList: React.FC<{
    heading: string;
    items: ReviewBrowserItem[];
    surface: ReviewSurface;
    selectedItemId: string | null;
    onSelect: (itemId: string) => void;
    emptyState: string;
    showActions?: boolean;
}> = ({
    heading,
    items,
    surface,
    selectedItemId,
    onSelect,
    emptyState,
    showActions = false,
}) => {
    const tableItems = items.filter((item) => item.kind === 'table');
    const relationshipItems = items.filter(
        (item) => item.kind === 'relationship'
    );

    const visibleItems = (groupItems: ReviewBrowserItem[]) =>
        groupItems.filter((item) =>
            surface === 'baseline'
                ? item.status !== 'added'
                : item.status !== 'removed'
        );

    const renderGroup = ({
        title,
        icon: Icon,
        groupItems,
    }: {
        title: string;
        icon: React.ComponentType<{ className?: string }>;
        groupItems: ReviewBrowserItem[];
    }) => {
        const scopedItems = visibleItems(groupItems);

        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 text-sm font-medium text-foreground">
                    <ChevronDown className="size-4" />
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{title}</span>
                </div>
                <div className="space-y-1">
                    {scopedItems.map((item) => (
                        <button
                            key={`${surface}:${item.id}`}
                            type="button"
                            className={getRowToneClassName({
                                status: item.status,
                                surface,
                                selected: item.id === selectedItemId,
                            })}
                            onClick={() => onSelect(item.id)}
                        >
                            {item.kind === 'table' ? (
                                <Table2 className="size-4 text-muted-foreground" />
                            ) : (
                                <GitFork className="size-4 text-muted-foreground" />
                            )}
                            <span className="truncate">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between border-b bg-muted/20 px-3 py-2 text-sm font-semibold text-muted-foreground">
                <span>{heading}</span>
                {showActions ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        className="h-7 gap-1.5 px-2 text-xs text-foreground"
                        title="Revert actions are not wired into this review surface yet."
                    >
                        <Undo2 className="size-3.5" />
                        Revert All
                    </Button>
                ) : null}
            </div>

            <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-6 p-3">
                    {renderGroup({
                        title: 'Tables',
                        icon: Table2,
                        groupItems: tableItems,
                    })}
                    {renderGroup({
                        title: 'Relationships',
                        icon: GitFork,
                        groupItems: relationshipItems,
                    })}
                    {visibleItems(items).length === 0 ? (
                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                            {emptyState}
                        </div>
                    ) : null}
                </div>
            </ScrollArea>
        </div>
    );
};

export const ReviewChangesDialog: React.FC<ReviewChangesDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const workflow = useOptionalDiagramWorkflow();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedItemId, setSelectedItemId] = React.useState<string | null>(
        null
    );
    const [format, setFormat] = React.useState<ReviewFormat>('sql');

    const developmentDiagram = workflow?.developmentDiagram;
    const baselineSchema = workflow?.workflow?.liveSnapshot?.canonicalSchema;

    const reviewGrouping = React.useMemo(
        () =>
            baselineSchema && developmentDiagram
                ? buildReviewGrouping({
                      baselineSchema,
                      developmentDiagram,
                  })
                : null,
        [baselineSchema, developmentDiagram]
    );

    const compareResult =
        workflow?.compareRenderModel?.compareResult ??
        reviewGrouping?.compareResult;

    const baselineDiagram = React.useMemo(
        () =>
            baselineSchema && developmentDiagram
                ? canonicalSchemaToDiagram({
                      canonicalSchema: baselineSchema,
                      diagramId: `${developmentDiagram.id}-baseline`,
                      diagramName: 'Database',
                      schemaSync: developmentDiagram.schemaSync,
                  })
                : null,
        [baselineSchema, developmentDiagram]
    );

    const browserItems = React.useMemo<ReviewBrowserItem[]>(() => {
        if (!compareResult) {
            return [];
        }

        const tableResults = compareResult.tables ?? [];
        const relationshipResults = compareResult.relationships ?? [];

        const tableItems = tableResults
            .filter((table) => table.status !== 'unchanged')
            .map((table) => ({
                id: `table:${table.matchKey}`,
                kind: 'table' as const,
                label: qualifyTableName(
                    table.target?.schemaName ?? table.baseline?.schemaName,
                    table.target?.name ?? table.baseline?.name
                ).replace(/^public\./, ''),
                searchText: [
                    table.target?.name,
                    table.baseline?.name,
                    table.target?.schemaName,
                    table.baseline?.schemaName,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase(),
                status: table.status,
                tableResult: table,
            }));

        const relationshipItems = relationshipResults
            .filter((relationship) => relationship.status !== 'unchanged')
            .map((relationship) => ({
                id: `relationship:${relationship.matchKey}`,
                kind: 'relationship' as const,
                label:
                    relationship.target?.name ??
                    relationship.baseline?.name ??
                    relationship.matchKey,
                searchText: [
                    relationship.target?.name,
                    relationship.baseline?.name,
                    relationship.target?.referencedTableName,
                    relationship.baseline?.referencedTableName,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase(),
                status: relationship.status,
                relationshipResult: relationship,
            }));

        return [...tableItems, ...relationshipItems];
    }, [compareResult]);

    const filteredItems = React.useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        if (!normalizedQuery) {
            return browserItems;
        }

        return browserItems.filter(
            (item) =>
                item.label.toLowerCase().includes(normalizedQuery) ||
                item.searchText.includes(normalizedQuery)
        );
    }, [browserItems, searchQuery]);

    React.useEffect(() => {
        if (!open) {
            return;
        }

        if (filteredItems.length === 0) {
            setSelectedItemId(null);
            return;
        }

        if (
            !selectedItemId ||
            !filteredItems.some((item) => item.id === selectedItemId)
        ) {
            setSelectedItemId(filteredItems[0].id);
        }
    }, [filteredItems, open, selectedItemId]);

    const selectedItem = React.useMemo(
        () =>
            filteredItems.find((item) => item.id === selectedItemId) ??
            filteredItems[0] ??
            null,
        [filteredItems, selectedItemId]
    );

    const preview = React.useMemo(() => {
        if (
            !selectedItem ||
            !compareResult ||
            !baselineDiagram ||
            !developmentDiagram
        ) {
            return {
                baselineCode: '',
                targetCode: '',
            };
        }

        if (selectedItem.kind === 'table' && selectedItem.tableResult) {
            const baselineTable = findDiagramTableByMatchKey(
                baselineDiagram,
                selectedItem.tableResult.matchKey
            );
            const developmentTable = findDiagramTableByMatchKey(
                developmentDiagram,
                selectedItem.tableResult.matchKey
            );

            return {
                baselineCode:
                    format === 'sql'
                        ? buildTableSqlSnippet({
                              diagram: baselineDiagram,
                              table: baselineTable,
                          })
                        : buildTableDbmlSnippet({
                              tableResult: selectedItem.tableResult,
                              surface: 'baseline',
                          }),
                targetCode:
                    format === 'sql'
                        ? buildTableSqlSnippet({
                              diagram: developmentDiagram,
                              table: developmentTable,
                          })
                        : buildTableDbmlSnippet({
                              tableResult: selectedItem.tableResult,
                              surface: 'target',
                          }),
            };
        }

        if (
            selectedItem.kind === 'relationship' &&
            selectedItem.relationshipResult
        ) {
            return {
                baselineCode:
                    format === 'sql'
                        ? buildRelationshipSqlSnippet({
                              relationship: selectedItem.relationshipResult,
                              surface: 'baseline',
                              compareResult,
                              baselineDiagram,
                              developmentDiagram,
                          })
                        : buildRelationshipDbmlSnippet({
                              relationship: selectedItem.relationshipResult,
                              surface: 'baseline',
                              compareResult,
                              baselineDiagram,
                              developmentDiagram,
                          }),
                targetCode:
                    format === 'sql'
                        ? buildRelationshipSqlSnippet({
                              relationship: selectedItem.relationshipResult,
                              surface: 'target',
                              compareResult,
                              baselineDiagram,
                              developmentDiagram,
                          })
                        : buildRelationshipDbmlSnippet({
                              relationship: selectedItem.relationshipResult,
                              surface: 'target',
                              compareResult,
                              baselineDiagram,
                              developmentDiagram,
                          }),
            };
        }

        return {
            baselineCode: '',
            targetCode: '',
        };
    }, [
        baselineDiagram,
        compareResult,
        developmentDiagram,
        format,
        selectedItem,
    ]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex h-[88vh] w-[min(1730px,96vw)] max-w-none flex-col overflow-hidden p-0"
                showClose
            >
                <div className="border-b px-6 py-5">
                    <DialogTitle className="text-[30px] font-semibold tracking-tight">
                        Review Proposed Changes
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Review the live Database baseline against the current
                        Development schema in a dual-pane compare browser.
                    </DialogDescription>
                </div>

                {!compareResult || !baselineDiagram || !developmentDiagram ? (
                    <div className="p-6">
                        <Alert>
                            <AlertTitle>Review is not available yet</AlertTitle>
                            <AlertDescription>
                                Sync a live snapshot and keep a development
                                diagram loaded to inspect a structured review of
                                the compare baseline.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 pt-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Search tables and relationships..."
                                className="h-11 pl-10"
                            />
                        </div>

                        <div className="min-h-0 flex-1">
                            <ResizablePanelGroup
                                direction="vertical"
                                className="min-h-0 gap-3"
                            >
                                <ResizablePanel defaultSize={48} minSize={30}>
                                    <div className="h-full overflow-hidden rounded-xl border bg-card">
                                        <ResizablePanelGroup
                                            direction="horizontal"
                                            className="min-h-0"
                                        >
                                            <ResizablePanel defaultSize={50}>
                                                <ReviewColumnList
                                                    heading="Database"
                                                    items={filteredItems}
                                                    surface="baseline"
                                                    selectedItemId={
                                                        selectedItem?.id ?? null
                                                    }
                                                    onSelect={setSelectedItemId}
                                                    emptyState="No matching Database changes."
                                                />
                                            </ResizablePanel>
                                            <ResizableHandle withHandle />
                                            <ResizablePanel defaultSize={50}>
                                                <ReviewColumnList
                                                    heading="Development"
                                                    items={filteredItems}
                                                    surface="target"
                                                    selectedItemId={
                                                        selectedItem?.id ?? null
                                                    }
                                                    onSelect={setSelectedItemId}
                                                    emptyState="No matching Development changes."
                                                    showActions
                                                />
                                            </ResizablePanel>
                                        </ResizablePanelGroup>
                                    </div>
                                </ResizablePanel>

                                <ResizableHandle withHandle />

                                <ResizablePanel defaultSize={52} minSize={26}>
                                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card">
                                        <Tabs
                                            value={format}
                                            onValueChange={(value) =>
                                                setFormat(value as ReviewFormat)
                                            }
                                            className="flex min-h-0 flex-1 flex-col"
                                        >
                                            <div className="border-b px-4 pt-3">
                                                <TabsList className="h-9 rounded-b-none rounded-t-lg border border-b-0 bg-background p-0">
                                                    <TabsTrigger
                                                        value="sql"
                                                        className="rounded-b-none rounded-t-md border-b-2 border-transparent px-4 data-[state=active]:border-border data-[state=active]:shadow-none"
                                                    >
                                                        SQL
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value="dbml"
                                                        className="rounded-b-none rounded-t-md border-b-2 border-transparent px-4 data-[state=active]:border-border data-[state=active]:shadow-none"
                                                    >
                                                        DBML
                                                    </TabsTrigger>
                                                </TabsList>
                                            </div>

                                            <TabsContent
                                                value="sql"
                                                className="mt-0 min-h-0 flex-1 p-0"
                                            >
                                                <ResizablePanelGroup
                                                    direction="horizontal"
                                                    className="min-h-0"
                                                >
                                                    <ResizablePanel
                                                        defaultSize={50}
                                                    >
                                                        <ReviewCodePane
                                                            code={
                                                                preview.baselineCode
                                                            }
                                                            emptyLabel="No baseline SQL for this selected change."
                                                            surface="baseline"
                                                        />
                                                    </ResizablePanel>
                                                    <ResizableHandle
                                                        withHandle
                                                    />
                                                    <ResizablePanel
                                                        defaultSize={50}
                                                    >
                                                        <ReviewCodePane
                                                            code={
                                                                preview.targetCode
                                                            }
                                                            emptyLabel="No development SQL for this selected change."
                                                            surface="target"
                                                        />
                                                    </ResizablePanel>
                                                </ResizablePanelGroup>
                                            </TabsContent>

                                            <TabsContent
                                                value="dbml"
                                                className="mt-0 min-h-0 flex-1 p-0"
                                            >
                                                <ResizablePanelGroup
                                                    direction="horizontal"
                                                    className="min-h-0"
                                                >
                                                    <ResizablePanel
                                                        defaultSize={50}
                                                    >
                                                        <ReviewCodePane
                                                            code={
                                                                preview.baselineCode
                                                            }
                                                            emptyLabel="No baseline DBML for this selected change."
                                                            surface="baseline"
                                                        />
                                                    </ResizablePanel>
                                                    <ResizableHandle
                                                        withHandle
                                                    />
                                                    <ResizablePanel
                                                        defaultSize={50}
                                                    >
                                                        <ReviewCodePane
                                                            code={
                                                                preview.targetCode
                                                            }
                                                            emptyLabel="No development DBML for this selected change."
                                                            surface="target"
                                                        />
                                                    </ResizablePanel>
                                                </ResizablePanelGroup>
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </ResizablePanel>
                            </ResizablePanelGroup>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
