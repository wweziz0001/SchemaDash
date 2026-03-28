import React from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { TablesSection } from './tables-section/tables-section';
import { useLayout } from '@/hooks/use-layout';
import type { SidebarSection } from '@/context/layout-context/layout-context';
import { useTranslation } from 'react-i18next';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { CustomTypesSection } from './custom-types-section/custom-types-section';
import { supportsCustomTypes } from '@/lib/domain/database-capabilities';
import { DBMLSection } from './dbml-section/dbml-section';
import { RefsSection } from './refs-section/refs-section';
import { VisualsSection } from './visuals-section/visuals-section';

export interface SidePanelProps {}

export const SidePanel: React.FC<SidePanelProps> = () => {
    const { t } = useTranslation();
    const { databaseType, customTypes } = useSchemaDash();
    const { selectSidebarSection, selectedSidebarSection } = useLayout();
    const { isMd: isDesktop } = useBreakpoint('md');
    const canShowCustomTypes =
        supportsCustomTypes(databaseType) || customTypes.length > 0;

    return (
        <aside className="flex h-full flex-col overflow-hidden border-r border-border/70 bg-card/55 backdrop-blur-sm">
            {!isDesktop ? (
                <div className="flex justify-center border-b border-border/70 px-3 py-2">
                    <Select
                        value={selectedSidebarSection}
                        onValueChange={(value) =>
                            selectSidebarSection(value as SidebarSection)
                        }
                    >
                        <SelectTrigger className="border-none bg-transparent font-semibold shadow-none hover:bg-secondary focus:ring-0">
                            <SelectValue />
                            <div className="flex flex-1 justify-end px-2 text-xs font-normal text-muted-foreground">
                                {t('side_panel.view_all_options')}
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="tables">
                                    {t('side_panel.tables_section.tables')}
                                </SelectItem>
                                <SelectItem value="refs">
                                    {t('side_panel.refs_section.refs')}
                                </SelectItem>
                                <SelectItem value="areas">
                                    {t('side_panel.areas_section.areas')}
                                </SelectItem>
                                <SelectItem value="visuals">
                                    {t('side_panel.visuals_section.visuals')}
                                </SelectItem>
                                {canShowCustomTypes ? (
                                    <SelectItem value="customTypes">
                                        {t(
                                            'side_panel.custom_types_section.custom_types'
                                        )}
                                    </SelectItem>
                                ) : null}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            ) : null}
            {selectedSidebarSection === 'tables' ? (
                <TablesSection />
            ) : selectedSidebarSection === 'dbml' ? (
                <DBMLSection />
            ) : selectedSidebarSection === 'refs' ? (
                <RefsSection />
            ) : selectedSidebarSection === 'visuals' ? (
                <VisualsSection />
            ) : (
                <CustomTypesSection />
            )}
        </aside>
    );
};
