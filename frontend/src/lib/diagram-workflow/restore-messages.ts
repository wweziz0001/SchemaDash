import type {
    DiagramWorkflowVersionRestoreResult,
    DiagramWorkflowVersionSummary,
} from '@/lib/api/diagram-workflow-client';
import { getVersionDisplayLabel } from './version-labels';

export const getRestoreVersionHeading = (
    version: Pick<DiagramWorkflowVersionSummary, 'name' | 'versionLabel'>
) => getVersionDisplayLabel(version);

export const getRestoreSuccessDescription = (
    result: DiagramWorkflowVersionRestoreResult
) =>
    `Development now reflects ${getRestoreVersionHeading(result.restoredVersion)} at document version ${result.development.documentVersion}. Safety snapshot ${getRestoreVersionHeading(result.safetySnapshotVersion)} was created first.`;

export const getRestoreFailureMessage = (error: unknown) =>
    error instanceof Error
        ? error.message
        : 'SchemaDash could not restore this version into Development.';

export const getRestoreWarningLines = (
    version: Pick<DiagramWorkflowVersionSummary, 'name' | 'versionLabel'>
) => [
    `${getRestoreVersionHeading(version)} will be copied into Development as the new editable head.`,
    'The stored version remains immutable and can still be opened later.',
    'Your current Development content will be replaced once the revert finishes.',
    'SchemaDash creates an automatic safety snapshot before changing Development.',
];
