import React from 'react';
import { Badge } from '@/components/badge/badge';
import { Button } from '@/components/button/button';
import { useLayout } from '@/hooks/use-layout';
import { History } from 'lucide-react';
import { useOptionalDiagramWorkflow } from '../context/diagram-workflow-context';

export const VersionsPanel: React.FC = () => {
    const workflow = useOptionalDiagramWorkflow();
    const {
        selectSidebarSection,
        selectedSidebarSection,
        selectVersionsTab,
        showSidePanel,
    } = useLayout();

    if (!workflow?.diagramId) {
        return null;
    }

    return (
        <Button
            variant={
                selectedSidebarSection === 'versions' ? 'secondary' : 'outline'
            }
            size="sm"
            className="gap-2 rounded-lg bg-background/80 shadow-sm"
            onClick={() => {
                showSidePanel();
                selectSidebarSection('versions');
                selectVersionsTab('version');
            }}
        >
            <History className="size-4" />
            Versions
            {workflow.versions.length > 0 ? (
                <Badge variant="secondary">{workflow.versions.length}</Badge>
            ) : null}
        </Button>
    );
};
