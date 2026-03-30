import React from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/tabs/tabs';
import { VersionTab } from './version-tab/version-tab';
import { ChangelogTab } from './changelog-tab/changelog-tab';
import { useTranslation } from 'react-i18next';
import { useLayout } from '@/hooks/use-layout';
import type { VersionsTab } from '@/context/layout-context/layout-context';
import { Separator } from '@/components/separator/separator';
import { FileText, History } from 'lucide-react';

export interface VersionsSectionProps {}

export const VersionsSection: React.FC<VersionsSectionProps> = () => {
    const { t } = useTranslation();
    const { selectedVersionsTab, selectVersionsTab } = useLayout();

    return (
        <section
            className="flex flex-1 flex-col overflow-hidden"
            data-vaul-no-drag
        >
            <Tabs
                value={selectedVersionsTab}
                onValueChange={(value) =>
                    selectVersionsTab(value as VersionsTab)
                }
                className="flex flex-1 flex-col overflow-hidden"
            >
                <div className="px-2 pt-2">
                    <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border bg-background p-1">
                        <TabsTrigger
                            value="version"
                            className="gap-1.5 rounded-lg px-3 py-1 text-sm font-medium transition-all data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-foreground dark:data-[state=active]:bg-sky-500"
                        >
                            <History className="size-3.5" />
                            {t('side_panel.versions_section.tabs.version')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="changelog"
                            className="gap-1.5 rounded-lg px-3 py-1 text-sm font-medium transition-all data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-foreground dark:data-[state=active]:bg-sky-500"
                        >
                            <FileText className="size-3.5" />
                            {t('side_panel.versions_section.tabs.changelog')}
                        </TabsTrigger>
                    </TabsList>
                    <Separator orientation="horizontal" className="my-2" />
                </div>

                <TabsContent
                    value="version"
                    className="mt-0 flex flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                    <VersionTab />
                </TabsContent>

                <TabsContent
                    value="changelog"
                    className="mt-0 flex flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
                >
                    <ChangelogTab />
                </TabsContent>
            </Tabs>
        </section>
    );
};
