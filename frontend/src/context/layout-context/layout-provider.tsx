import React from 'react';
import type {
    LayoutContext,
    SidebarSection,
    VisualsTab,
    VersionsTab,
} from './layout-context';
import { layoutContext } from './layout-context';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useSearchParams } from 'react-router-dom';

const getWorkflowSidebarSection = (
    searchParams: URLSearchParams
): SidebarSection => {
    const workflow = searchParams.get('workflow');
    const hasVersionWorkflow =
        (workflow === 'version' && !!searchParams.get('versionId')) ||
        (workflow === 'compare' && !!searchParams.get('compareVersionId'));

    return hasVersionWorkflow ? 'versions' : 'tables';
};

export const LayoutProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { isMd: isDesktop } = useBreakpoint('md');
    const [searchParams] = useSearchParams();
    const [openedTableInSidebar, setOpenedTableInSidebar] = React.useState<
        string | undefined
    >();
    const [openedRefInSidebar, setOpenedRefInSidebar] = React.useState<
        string | undefined
    >();
    const [openedAreaInSidebar, setOpenedAreaInSidebar] = React.useState<
        string | undefined
    >();
    const [openedNoteInSidebar, setOpenedNoteInSidebar] = React.useState<
        string | undefined
    >();
    const [openedCustomTypeInSidebar, setOpenedCustomTypeInSidebar] =
        React.useState<string | undefined>();
    const [selectedSidebarSection, setSelectedSidebarSection] =
        React.useState<SidebarSection>(() =>
            getWorkflowSidebarSection(searchParams)
        );
    const [selectedVisualsTab, setSelectedVisualsTab] =
        React.useState<VisualsTab>('areas');
    const [selectedVersionsTab, setSelectedVersionsTab] =
        React.useState<VersionsTab>('version');
    const [isSidePanelShowed, setIsSidePanelShowed] =
        React.useState<boolean>(isDesktop);

    const closeAllTablesInSidebar: LayoutContext['closeAllTablesInSidebar'] =
        () => setOpenedTableInSidebar('');

    const closeAllRelationshipsInSidebar: LayoutContext['closeAllRelationshipsInSidebar'] =
        () => setOpenedRefInSidebar('');

    const closeAllDependenciesInSidebar: LayoutContext['closeAllDependenciesInSidebar'] =
        () => setOpenedRefInSidebar('');

    const closeAllRefsInSidebar: LayoutContext['closeAllRefsInSidebar'] = () =>
        setOpenedRefInSidebar('');

    const closeAllAreasInSidebar: LayoutContext['closeAllAreasInSidebar'] =
        () => setOpenedAreaInSidebar('');

    const closeAllNotesInSidebar: LayoutContext['closeAllNotesInSidebar'] =
        () => setOpenedNoteInSidebar('');

    const closeAllCustomTypesInSidebar: LayoutContext['closeAllCustomTypesInSidebar'] =
        () => setOpenedCustomTypeInSidebar('');

    const hideSidePanel: LayoutContext['hideSidePanel'] = () =>
        setIsSidePanelShowed(false);

    const showSidePanel: LayoutContext['showSidePanel'] = () =>
        setIsSidePanelShowed(true);

    const toggleSidePanel: LayoutContext['toggleSidePanel'] = () => {
        setIsSidePanelShowed((prevIsSidePanelShowed) => !prevIsSidePanelShowed);
    };

    React.useEffect(() => {
        if (getWorkflowSidebarSection(searchParams) !== 'versions') {
            return;
        }

        setSelectedSidebarSection('versions');
        setSelectedVersionsTab('version');
    }, [searchParams]);

    const openTableFromSidebar: LayoutContext['openTableFromSidebar'] = (
        tableId
    ) => {
        showSidePanel();
        setSelectedSidebarSection('tables');
        setOpenedTableInSidebar(tableId);
    };

    const openRelationshipFromSidebar: LayoutContext['openRelationshipFromSidebar'] =
        (relationshipId) => {
            showSidePanel();
            setSelectedSidebarSection('refs');
            setOpenedRefInSidebar(relationshipId);
        };

    const openDependencyFromSidebar: LayoutContext['openDependencyFromSidebar'] =
        (dependencyId) => {
            showSidePanel();
            setSelectedSidebarSection('refs');
            setOpenedRefInSidebar(dependencyId);
        };

    const openRefFromSidebar: LayoutContext['openRefFromSidebar'] = (refId) => {
        showSidePanel();
        setSelectedSidebarSection('refs');
        setOpenedRefInSidebar(refId);
    };

    const openAreaFromSidebar: LayoutContext['openAreaFromSidebar'] = (
        areaId
    ) => {
        showSidePanel();
        setSelectedSidebarSection('visuals');
        setSelectedVisualsTab('areas');
        setOpenedAreaInSidebar(areaId);
    };

    const openNoteFromSidebar: LayoutContext['openNoteFromSidebar'] = (
        noteId
    ) => {
        showSidePanel();
        setSelectedSidebarSection('visuals');
        setSelectedVisualsTab('notes');
        setOpenedNoteInSidebar(noteId);
    };

    const openCustomTypeFromSidebar: LayoutContext['openCustomTypeFromSidebar'] =
        (customTypeId) => {
            showSidePanel();
            setSelectedSidebarSection('customTypes');
            setOpenedTableInSidebar(customTypeId);
        };

    return (
        <layoutContext.Provider
            value={{
                openedTableInSidebar,
                selectedSidebarSection,
                openTableFromSidebar,
                selectSidebarSection: setSelectedSidebarSection,
                openRelationshipFromSidebar,
                closeAllTablesInSidebar,
                closeAllRelationshipsInSidebar,
                isSidePanelShowed,
                hideSidePanel,
                showSidePanel,
                toggleSidePanel,
                openDependencyFromSidebar,
                closeAllDependenciesInSidebar,
                openedRefInSidebar,
                openRefFromSidebar,
                closeAllRefsInSidebar,
                openedAreaInSidebar,
                openAreaFromSidebar,
                closeAllAreasInSidebar,
                openedNoteInSidebar,
                openNoteFromSidebar,
                closeAllNotesInSidebar,
                openedCustomTypeInSidebar,
                openCustomTypeFromSidebar,
                closeAllCustomTypesInSidebar,
                selectedVisualsTab,
                selectVisualsTab: setSelectedVisualsTab,
                selectedVersionsTab,
                selectVersionsTab: setSelectedVersionsTab,
            }}
        >
            {children}
        </layoutContext.Provider>
    );
};
