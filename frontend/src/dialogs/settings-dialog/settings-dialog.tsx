import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { MonitorCog, Palette, SlidersHorizontal } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import { DashboardSettingOptionCard } from '@/components/dashboard-page/dashboard-setting-option-card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import { Input } from '@/components/input/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { SummaryList } from '@/components/summary-list/summary-list';
import { Button } from '@/components/button/button';
import { useAuth } from '@/hooks/use-auth';
import { useConfig } from '@/hooks/use-config';
import { useLocalConfig } from '@/hooks/use-local-config';
import { cn } from '@/lib/utils';
import { matchesSearch, normalizeSearchTerm } from '@/lib/utils/search';

type SettingsSectionId =
    | 'settings-appearance'
    | 'settings-canvas'
    | 'settings-defaults';

const settingsSections: Array<{
    id: SettingsSectionId;
    label: string;
    description: string;
}> = [
    {
        id: 'settings-appearance',
        label: 'Appearance',
        description: 'Theme preference for the current session.',
    },
    {
        id: 'settings-canvas',
        label: 'Canvas',
        description: 'Diagram display and canvas toggles.',
    },
    {
        id: 'settings-defaults',
        label: 'Defaults',
        description: 'Saved workspace and deployment defaults.',
    },
];

const SectionButton = ({
    active,
    description,
    label,
    onClick,
}: {
    active: boolean;
    description: string;
    label: string;
    onClick: () => void;
}) => (
    <button
        type="button"
        className={cn(
            'rounded-md border px-3 py-2 text-left transition-colors',
            active ? 'border-foreground/20 bg-accent' : 'hover:bg-accent/50'
        )}
        onClick={onClick}
    >
        <div className="truncate text-sm font-medium">{label}</div>
        <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {description}
        </div>
    </button>
);

const NavButton = ({ active, label }: { active: boolean; label: string }) => (
    <div
        className={cn(
            'flex items-center gap-3 rounded-md border px-3 py-2 text-left',
            active ? 'border-foreground/20 bg-accent' : 'border-border/70'
        )}
    >
        <MonitorCog className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">{label}</span>
    </div>
);

export interface SettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
    open,
    onOpenChange,
}) => {
    const auth = useAuth();
    const configContext = useConfig();
    const localConfig = useLocalConfig();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSection, setSelectedSection] = useState<SettingsSectionId>(
        'settings-appearance'
    );
    const deferredSearch = useDeferredValue(searchTerm);

    const normalizedSearch = useMemo(
        () => normalizeSearchTerm(deferredSearch, { lowerCase: true }),
        [deferredSearch]
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        setSearchTerm('');
        setSelectedSection('settings-appearance');
    }, [open]);

    const filteredSections = useMemo(() => {
        if (!normalizedSearch) {
            return settingsSections;
        }

        return settingsSections.filter((section) =>
            matchesSearch(
                [section.label, section.description],
                normalizedSearch
            )
        );
    }, [normalizedSearch]);

    useEffect(() => {
        setSelectedSection((currentSection) => {
            if (
                filteredSections.some(
                    (section) => section.id === currentSection
                )
            ) {
                return currentSection;
            }

            return filteredSections[0]?.id ?? 'settings-appearance';
        });
    }, [filteredSections]);

    const sectionMeta = settingsSections.find(
        (section) => section.id === selectedSection
    );

    const renderDetail = () => {
        if (!localConfig) {
            return (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    Settings are unavailable in this session.
                </div>
            );
        }

        if (selectedSection === 'settings-canvas') {
            return (
                <Card className="shadow-none">
                    <CardHeader>
                        <CardTitle>Canvas preferences</CardTitle>
                        <CardDescription>
                            Toggle the default diagram presentation options for
                            the current browser session.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <DashboardSettingOptionCard
                            checked={localConfig.showCardinality}
                            description="Keep relationship cardinality markers visible in diagrams."
                            onCheckedChange={localConfig.setShowCardinality}
                            title="Show cardinality"
                        />
                        <DashboardSettingOptionCard
                            checked={localConfig.showFieldAttributes}
                            description="Display PK, nullability, and field metadata on the canvas."
                            onCheckedChange={localConfig.setShowFieldAttributes}
                            title="Show field attributes"
                        />
                        <DashboardSettingOptionCard
                            checked={localConfig.showMiniMapOnCanvas}
                            description="Keep the minimap visible by default."
                            onCheckedChange={localConfig.setShowMiniMapOnCanvas}
                            title="Show minimap"
                        />
                        <DashboardSettingOptionCard
                            checked={localConfig.showDBViews}
                            description="Include database views when the source supports them."
                            onCheckedChange={localConfig.setShowDBViews}
                            title="Show database views"
                        />
                    </CardContent>
                </Card>
            );
        }

        if (selectedSection === 'settings-defaults') {
            return (
                <Card className="shadow-none">
                    <CardHeader>
                        <CardTitle>Defaults</CardTitle>
                        <CardDescription>
                            Persistent workspace configuration and current
                            deployment readiness.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SummaryList
                            items={[
                                {
                                    label: 'Authentication mode',
                                    value: auth.enabled
                                        ? (auth.mode ?? 'enabled')
                                        : 'disabled',
                                },
                                {
                                    label: 'Server reachability',
                                    value: auth.serverReachable
                                        ? 'Online'
                                        : 'Offline',
                                },
                                {
                                    label: 'Default diagram id',
                                    value:
                                        configContext?.config
                                            ?.defaultDiagramId ?? 'Not set',
                                },
                            ]}
                        />
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card className="shadow-none">
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                        Choose how SchemaDash should follow the current system
                        theme.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Theme</div>
                        <Select
                            onValueChange={(value) =>
                                localConfig.setTheme(
                                    value as 'light' | 'dark' | 'system'
                                )
                            }
                            value={localConfig.theme}
                        >
                            <SelectTrigger className="max-w-sm">
                                <SelectValue placeholder="Choose theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="system">System</SelectItem>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="flex h-[38rem] max-h-screen flex-col overflow-y-auto md:min-w-[94vw] xl:min-w-[76vw]"
                showClose
            >
                <DialogHeader>
                    <DialogTitle>Workspace settings</DialogTitle>
                    <DialogDescription>
                        Open the SchemaDash settings workspace without leaving
                        the current editor.
                    </DialogDescription>
                </DialogHeader>

                <DialogInternalContent className="pr-2">
                    <div className="flex h-full flex-col gap-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="settings-dialog-search"
                                className="text-xs font-medium text-muted-foreground"
                            >
                                Search
                            </label>
                            <Input
                                id="settings-dialog-search"
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Filter settings"
                            />
                            <p className="text-xs text-muted-foreground">
                                Filter the available settings sections without
                                leaving the modal.
                            </p>
                        </div>

                        <div className="grid h-full gap-4 md:grid-cols-[220px_240px_minmax(0,1fr)]">
                            <div className="flex min-h-0 flex-col gap-3 rounded-lg border p-3">
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Workspace
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Settings tools in one modal.
                                    </p>
                                </div>

                                <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto">
                                    <NavButton active label="Settings" />
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-col gap-3 rounded-lg border p-3">
                                <div>
                                    <h2 className="text-sm font-semibold">
                                        Sections
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Choose the settings section to open in
                                        the detail panel.
                                    </p>
                                </div>

                                <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-auto">
                                    {filteredSections.length > 0 ? (
                                        filteredSections.map((section) => (
                                            <SectionButton
                                                key={section.id}
                                                active={
                                                    selectedSection ===
                                                    section.id
                                                }
                                                description={
                                                    section.description
                                                }
                                                label={section.label}
                                                onClick={() =>
                                                    setSelectedSection(
                                                        section.id
                                                    )
                                                }
                                            />
                                        ))
                                    ) : (
                                        <div className="px-1 pt-2 text-sm text-muted-foreground">
                                            No settings match this search.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex min-h-0 flex-col rounded-lg border p-3">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className="truncate text-sm font-semibold">
                                            {sectionMeta?.label ?? 'Settings'}
                                        </h2>
                                        {sectionMeta?.description ? (
                                            <p className="text-sm text-muted-foreground">
                                                {sectionMeta.description}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {selectedSection ===
                                        'settings-appearance' ? (
                                            <Palette className="size-4" />
                                        ) : selectedSection ===
                                          'settings-canvas' ? (
                                            <SlidersHorizontal className="size-4" />
                                        ) : (
                                            <MonitorCog className="size-4" />
                                        )}
                                        <span>Settings</span>
                                    </div>
                                </div>

                                <div className="min-h-0 flex-1 overflow-auto">
                                    {renderDetail()}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogInternalContent>

                <DialogFooter className="flex !justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                        Settings are applied using the native SchemaDash
                        configuration hooks.
                    </div>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Close
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
