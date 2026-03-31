import React, { useMemo } from 'react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/sidebar/sidebar';
import {
    Group,
    FileType,
    Plus,
    History,
    FolderOpen,
    CodeXml,
} from 'lucide-react';
import { Table, Workflow } from 'lucide-react';
import { useLayout } from '@/hooks/use-layout';
import { useTranslation } from 'react-i18next';
import { CurrentDiagramShareButton } from '../top-navbar/current-diagram-share-button';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import SchemaDashLogo from '@/assets/logo-light.png';
import SchemaDashDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { useSchemaDash } from '@/hooks/use-schemadash';
import { supportsCustomTypes } from '@/lib/domain/database-capabilities';
import { useDialog } from '@/hooks/use-dialog';
import { Separator } from '@/components/separator/separator';
import { SidebarAccountTriggerButton } from './sidebar-account-trigger-button';

export interface SidebarItem {
    title: string;
    icon: React.FC;
    onClick: () => void;
    active: boolean;
    badge?: string;
}

export interface EditorSidebarProps {}

const editorSidebarButtonClassName =
    'justify-center space-y-0.5 !px-0 hover:bg-gray-200 data-[active=true]:bg-gray-100 data-[active=true]:text-teal-600 data-[active=true]:hover:bg-teal-100 dark:hover:bg-gray-800 dark:data-[active=true]:bg-gray-900 dark:data-[active=true]:text-teal-400 dark:data-[active=true]:hover:bg-teal-950';

export const EditorSidebar: React.FC<EditorSidebarProps> = () => {
    const {
        selectSidebarSection,
        selectedSidebarSection,
        showSidePanel,
        selectVisualsTab,
        selectVersionsTab,
    } = useLayout();
    const { t } = useTranslation();
    const { isMd: isDesktop } = useBreakpoint('md');
    const { effectiveTheme } = useTheme();
    const { databaseType, customTypes } = useSchemaDash();
    const { openCreateDiagramDialog, openOpenDiagramDialog } = useDialog();
    const canShowCustomTypes =
        supportsCustomTypes(databaseType) || customTypes.length > 0;

    const diagramItems: SidebarItem[] = useMemo(
        () => [
            {
                title: t('editor_sidebar.new_diagram'),
                icon: Plus,
                onClick: () => {
                    openCreateDiagramDialog();
                },
                active: false,
            },
            {
                title: t('editor_sidebar.browse'),
                icon: FolderOpen,
                onClick: () => {
                    openOpenDiagramDialog();
                },
                active: false,
            },
        ],
        [t, openCreateDiagramDialog, openOpenDiagramDialog]
    );

    const baseItems: SidebarItem[] = useMemo(
        () => [
            {
                title: t('editor_sidebar.tables'),
                icon: Table,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('tables');
                },
                active: selectedSidebarSection === 'tables',
            },
            {
                title: 'DBML',
                icon: CodeXml,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('dbml');
                },
                active: selectedSidebarSection === 'dbml',
            },
            {
                title: t('editor_sidebar.refs'),
                icon: Workflow,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('refs');
                },
                active: selectedSidebarSection === 'refs',
            },
            ...(canShowCustomTypes
                ? [
                      {
                          title: t('editor_sidebar.custom_types'),
                          icon: FileType,
                          onClick: () => {
                              showSidePanel();
                              selectSidebarSection('customTypes');
                          },
                          active: selectedSidebarSection === 'customTypes',
                      },
                  ]
                : []),
            {
                title: t('editor_sidebar.visuals'),
                icon: Group,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('visuals');
                    selectVisualsTab('areas');
                },
                active: selectedSidebarSection === 'visuals',
            },
            {
                title: t('editor_sidebar.versions'),
                icon: History,
                onClick: () => {
                    showSidePanel();
                    selectSidebarSection('versions');
                    selectVersionsTab('version');
                },
                active: selectedSidebarSection === 'versions',
            },
        ],
        [
            selectSidebarSection,
            selectedSidebarSection,
            t,
            showSidePanel,
            canShowCustomTypes,
            selectVisualsTab,
            selectVersionsTab,
        ]
    );

    return (
        <Sidebar
            side="left"
            collapsible="icon-extended"
            variant="sidebar"
            className="relative h-full"
        >
            {!isDesktop ? (
                <SidebarHeader>
                    <a
                        href="https://schemadash.io"
                        className="cursor-pointer"
                        rel="noreferrer"
                    >
                        <img
                            src={
                                effectiveTheme === 'light'
                                    ? SchemaDashLogo
                                    : SchemaDashDarkLogo
                            }
                            alt="SchemaDash"
                            className="h-4 max-w-fit"
                        />
                    </a>
                </SidebarHeader>
            ) : null}
            <SidebarContent>
                <SidebarGroup>
                    {/* <SidebarGroupLabel /> */}
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {diagramItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        className={editorSidebarButtonClassName}
                                        isActive={item.active}
                                        asChild
                                    >
                                        <button onClick={item.onClick}>
                                            <item.icon />
                                            <span>
                                                {item.title
                                                    .split(' ')
                                                    .map((word, index) => (
                                                        <div key={index}>
                                                            {word}
                                                        </div>
                                                    ))}
                                            </span>
                                        </button>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                        <Separator className="my-2" />
                        <SidebarMenu>
                            {baseItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        className={editorSidebarButtonClassName}
                                        isActive={item.active}
                                        asChild
                                    >
                                        <button onClick={item.onClick}>
                                            <item.icon />
                                            <span>
                                                {item.title
                                                    .split(' ')
                                                    .map((word, index) => (
                                                        <div key={index}>
                                                            {word}
                                                        </div>
                                                    ))}
                                            </span>
                                        </button>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <CurrentDiagramShareButton />
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarAccountTriggerButton
                        className={editorSidebarButtonClassName}
                    />
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
};
