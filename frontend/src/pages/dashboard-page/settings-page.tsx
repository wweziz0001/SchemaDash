import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Badge } from '@/components/badge/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/card/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { DashboardPageHeader } from '@/components/dashboard-page/dashboard-page-header';
import { DashboardSettingOptionCard } from '@/components/dashboard-page/dashboard-setting-option-card';
import { useLocalConfig } from '@/hooks/use-local-config';
import { useConfig } from '@/hooks/use-config';
import { useAuth } from '@/hooks/use-auth';

export const SettingsPage: React.FC = () => {
    const {
        setShowCardinality,
        setShowDBViews,
        setShowFieldAttributes,
        setShowMiniMapOnCanvas,
        setTheme,
        showCardinality,
        showDBViews,
        showFieldAttributes,
        showMiniMapOnCanvas,
        theme,
    } = useLocalConfig();
    const { config } = useConfig();
    const { enabled, mode, serverReachable } = useAuth();

    return (
        <div className="space-y-6">
            <Helmet>
                <title>SchemaDash - Settings</title>
            </Helmet>

            <DashboardPageHeader
                contentClassName="gap-3"
                title="Settings"
                description="Configure the saved workspace defaults and the local UI preferences that shape how SchemaDash behaves after you log in."
                badge={
                    <Badge
                        variant="outline"
                        className="w-fit border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                    >
                        Workspace settings
                    </Badge>
                }
            />

            <section className="grid gap-4 xl:grid-cols-[1.25fr,1fr]">
                <Card className="border-stone-200/80 bg-white/80 shadow-sm dark:border-stone-800/80 dark:bg-stone-900/80">
                    <CardHeader>
                        <CardTitle>Appearance and canvas preferences</CardTitle>
                        <CardDescription>
                            These settings are stored locally in the browser and
                            affect the current SchemaDash user experience.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <div className="text-sm font-medium">Theme</div>
                            <Select
                                onValueChange={(value) =>
                                    setTheme(
                                        value as 'light' | 'dark' | 'system'
                                    )
                                }
                                value={theme}
                            >
                                <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-950/70">
                                    <SelectValue placeholder="Choose theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="system">
                                        System
                                    </SelectItem>
                                    <SelectItem value="light">Light</SelectItem>
                                    <SelectItem value="dark">Dark</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <DashboardSettingOptionCard
                                checked={showCardinality}
                                description="Keep relationship cardinality markers visible in diagrams."
                                onCheckedChange={setShowCardinality}
                                title="Show cardinality"
                            />
                            <DashboardSettingOptionCard
                                checked={showFieldAttributes}
                                description="Display nullability, PK, and other field metadata in the canvas."
                                onCheckedChange={setShowFieldAttributes}
                                title="Show field attributes"
                            />
                            <DashboardSettingOptionCard
                                checked={showMiniMapOnCanvas}
                                description="Keep the canvas minimap enabled by default."
                                onCheckedChange={setShowMiniMapOnCanvas}
                                title="Show minimap"
                            />
                            <DashboardSettingOptionCard
                                checked={showDBViews}
                                description="Include database views when the current source supports them."
                                onCheckedChange={setShowDBViews}
                                title="Show database views"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-stone-200/80 bg-white/80 shadow-sm dark:border-stone-800/80 dark:bg-stone-900/80">
                    <CardHeader>
                        <CardTitle>Deployment and saved config</CardTitle>
                        <CardDescription>
                            Current values resolved from the authenticated
                            session and persistent SchemaDash config store.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-stone-600 dark:text-stone-300">
                        <div className="flex items-center justify-between rounded-2xl bg-stone-100 px-4 py-3 dark:bg-stone-800/80">
                            <span>Authentication mode</span>
                            <span className="font-semibold uppercase text-stone-950 dark:text-stone-50">
                                {enabled ? mode : 'disabled'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-stone-100 px-4 py-3 dark:bg-stone-800/80">
                            <span>Server reachability</span>
                            <span className="font-semibold text-stone-950 dark:text-stone-50">
                                {serverReachable ? 'Online' : 'Offline'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-stone-100 px-4 py-3 dark:bg-stone-800/80">
                            <span>Default diagram id</span>
                            <span className="max-w-[220px] truncate font-semibold text-stone-950 dark:text-stone-50">
                                {config?.defaultDiagramId || 'Not set'}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
};
