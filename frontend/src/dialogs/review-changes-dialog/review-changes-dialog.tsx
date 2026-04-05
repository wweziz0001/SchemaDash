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
type ReviewRowTone = 'default' | 'added' | 'removed' | 'placeholder';

interface ReviewBrowserItem {
    id: string;
    kind: ReviewItemKind;
    label: string;
    searchText: string;
    status: ReviewItemStatus;
    tableResult?: CompareTableResult;
    relationshipResult?: CompareRelationshipResult;
}

interface ReviewAlignedCodeLine {
    id: string;
    baseline: {
        text: string;
        tone: ReviewRowTone;
        marker: string;
    };
    target: {
        text: string;
        tone: ReviewRowTone;
        marker: string;
    };
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
    missing,
}: {
    status: ReviewItemStatus;
    surface: ReviewSurface;
    selected: boolean;
    missing?: boolean;
}) => {
    const baseClassName =
        'flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors';

    if (missing) {
        return cn(
            baseClassName,
            'border-slate-300 bg-slate-50/70 text-slate-400 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-500'
        );
    }

    if (status === 'added' && surface === 'target') {
        return cn(
            baseClassName,
            'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100',
            selected &&
                'border-emerald-500 ring-1 ring-emerald-500 dark:border-emerald-500'
        );
    }

    if (status === 'removed' && surface === 'baseline') {
        return cn(
            baseClassName,
            'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-100',
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

const splitCodeLines = (code: string) =>
    code.length > 0 ? code.replace(/\r\n/g, '\n').split('\n') : [];

const buildAlignedCodeLines = ({
    baselineCode,
    targetCode,
}: {
    baselineCode: string;
    targetCode: string;
}): ReviewAlignedCodeLine[] => {
    const baselineLines = splitCodeLines(baselineCode);
    const targetLines = splitCodeLines(targetCode);

    if (baselineLines.length === 0 && targetLines.length === 0) {
        return [];
    }

    const lcsMatrix = Array.from({ length: baselineLines.length + 1 }, () =>
        Array.from<number>({ length: targetLines.length + 1 }).fill(0)
    );

    for (
        let baselineIndex = baselineLines.length - 1;
        baselineIndex >= 0;
        baselineIndex -= 1
    ) {
        for (
            let targetIndex = targetLines.length - 1;
            targetIndex >= 0;
            targetIndex -= 1
        ) {
            lcsMatrix[baselineIndex][targetIndex] =
                baselineLines[baselineIndex] === targetLines[targetIndex]
                    ? lcsMatrix[baselineIndex + 1][targetIndex + 1] + 1
                    : Math.max(
                          lcsMatrix[baselineIndex + 1][targetIndex],
                          lcsMatrix[baselineIndex][targetIndex + 1]
                      );
        }
    }

    const rows: ReviewAlignedCodeLine[] = [];
    let baselineIndex = 0;
    let targetIndex = 0;
    let rowIndex = 0;

    while (
        baselineIndex < baselineLines.length &&
        targetIndex < targetLines.length
    ) {
        if (baselineLines[baselineIndex] === targetLines[targetIndex]) {
            rows.push({
                id: `context:${rowIndex}`,
                baseline: {
                    text: baselineLines[baselineIndex],
                    tone: 'default',
                    marker: ' ',
                },
                target: {
                    text: targetLines[targetIndex],
                    tone: 'default',
                    marker: ' ',
                },
            });
            baselineIndex += 1;
            targetIndex += 1;
        } else if (
            lcsMatrix[baselineIndex + 1][targetIndex] >=
            lcsMatrix[baselineIndex][targetIndex + 1]
        ) {
            rows.push({
                id: `removed:${rowIndex}`,
                baseline: {
                    text: baselineLines[baselineIndex],
                    tone: 'removed',
                    marker: '-',
                },
                target: {
                    text: '',
                    tone: 'placeholder',
                    marker: '',
                },
            });
            baselineIndex += 1;
        } else {
            rows.push({
                id: `added:${rowIndex}`,
                baseline: {
                    text: '',
                    tone: 'placeholder',
                    marker: '',
                },
                target: {
                    text: targetLines[targetIndex],
                    tone: 'added',
                    marker: '+',
                },
            });
            targetIndex += 1;
        }

        rowIndex += 1;
    }

    while (baselineIndex < baselineLines.length) {
        rows.push({
            id: `removed:${rowIndex}`,
            baseline: {
                text: baselineLines[baselineIndex],
                tone: 'removed',
                marker: '-',
            },
            target: {
                text: '',
                tone: 'placeholder',
                marker: '',
            },
        });
        baselineIndex += 1;
        rowIndex += 1;
    }

    while (targetIndex < targetLines.length) {
        rows.push({
            id: `added:${rowIndex}`,
            baseline: {
                text: '',
                tone: 'placeholder',
                marker: '',
            },
            target: {
                text: targetLines[targetIndex],
                tone: 'added',
                marker: '+',
            },
        });
        targetIndex += 1;
        rowIndex += 1;
    }

    return rows;
};

const getCodeLineToneClassName = ({
    tone,
    surface,
}: {
    tone: ReviewRowTone;
    surface: ReviewSurface;
}) => {
    if (tone === 'added') {
        return 'bg-emerald-100/80 text-emerald-950 dark:bg-emerald-950/35 dark:text-emerald-100';
    }

    if (tone === 'removed') {
        return 'bg-rose-100/85 text-rose-950 dark:bg-rose-950/35 dark:text-rose-100';
    }

    if (tone === 'placeholder') {
        return surface === 'baseline'
            ? 'bg-[repeating-linear-gradient(135deg,rgba(16,185,129,0.12)_0px,rgba(16,185,129,0.12)_2px,transparent_2px,transparent_8px)] text-transparent'
            : 'bg-[repeating-linear-gradient(135deg,rgba(244,63,94,0.14)_0px,rgba(244,63,94,0.14)_2px,transparent_2px,transparent_8px)] text-transparent';
    }

    return 'bg-background text-foreground';
};

const ReviewCodePane: React.FC<{
    lines: ReviewAlignedCodeLine[];
    emptyLabel: string;
    surface: ReviewSurface;
}> = ({ lines, emptyLabel, surface }) => {
    if (lines.length === 0) {
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
                <div className="min-h-[220px] min-w-max font-mono text-[13px] leading-6">
                    {lines.map((line) => {
                        const cell =
                            surface === 'baseline'
                                ? line.baseline
                                : line.target;

                        return (
                            <div
                                key={`${surface}:${line.id}`}
                                data-testid={`review-code-line-${surface}-${cell.tone}`}
                                className={cn(
                                    'grid min-h-6 grid-cols-[24px_minmax(0,1fr)] border-b border-border/40',
                                    getCodeLineToneClassName({
                                        tone: cell.tone,
                                        surface,
                                    })
                                )}
                            >
                                <div className="select-none px-2 text-center text-[12px] text-muted-foreground">
                                    {cell.marker}
                                </div>
                                <pre className="overflow-hidden whitespace-pre px-2">
                                    {cell.text || ' '}
                                </pre>
                            </div>
                        );
                    })}
                </div>
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

    const isMissingForSurface = (item: ReviewBrowserItem) =>
        surface === 'baseline'
            ? item.status === 'added'
            : item.status === 'removed';

    const renderGroup = ({
        title,
        icon: Icon,
        groupItems,
    }: {
        title: string;
        icon: React.ComponentType<{ className?: string }>;
        groupItems: ReviewBrowserItem[];
    }) => {
        const scopedItems = groupItems;

        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 text-sm font-medium text-foreground">
                    <ChevronDown className="size-4" />
                    <Icon className="size-4 text-muted-foreground" />
                    <span>{title}</span>
                </div>
                <div className="space-y-1">
                    {scopedItems.map((item) => {
                        const missing = isMissingForSurface(item);

                        return (
                            <button
                                key={`${surface}:${item.id}`}
                                type="button"
                                data-testid={
                                    missing
                                        ? `review-row-placeholder-${surface}-${item.id}`
                                        : `review-row-${surface}-${item.id}`
                                }
                                aria-label={
                                    missing
                                        ? `No ${surface} ${item.kind} for ${item.label}`
                                        : item.label
                                }
                                className={getRowToneClassName({
                                    status: item.status,
                                    surface,
                                    selected: item.id === selectedItemId,
                                    missing,
                                })}
                                onClick={() => onSelect(item.id)}
                            >
                                {missing ? (
                                    <span className="h-4 w-full rounded bg-transparent" />
                                ) : (
                                    <>
                                        <span className="w-3 shrink-0 text-center font-semibold">
                                            {item.status === 'added'
                                                ? '+'
                                                : item.status === 'removed'
                                                  ? '-'
                                                  : ''}
                                        </span>
                                        {item.kind === 'table' ? (
                                            <Table2 className="size-4 text-muted-foreground" />
                                        ) : (
                                            <GitFork className="size-4 text-muted-foreground" />
                                        )}
                                        <span className="truncate">
                                            {item.label}
                                        </span>
                                    </>
                                )}
                            </button>
                        );
                    })}
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
                    {items.length === 0 ? (
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

    const previewLines = React.useMemo(
        () =>
            buildAlignedCodeLines({
                baselineCode: preview.baselineCode,
                targetCode: preview.targetCode,
            }),
        [preview.baselineCode, preview.targetCode]
    );

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
                                                            lines={previewLines}
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
                                                            lines={previewLines}
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
                                                            lines={previewLines}
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
                                                            lines={previewLines}
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
