import type { DiagramWorkflowVersionSummary } from '../api/diagram-workflow-client';
import { getVersionDisplayLabel } from './version-labels';

export const RESTORE_TO_DEVELOPMENT_CONFIRMATION_TEXT = 'RESTORE DEVELOPMENT';

export const getRestoreVersionHeading = (
    version: Pick<DiagramWorkflowVersionSummary, 'name' | 'versionLabel'>
) => getVersionDisplayLabel(version);

export const getRestoreConfirmationHint = () =>
    `Type ${RESTORE_TO_DEVELOPMENT_CONFIRMATION_TEXT} to continue.`;

export const getRestoreWarningLines = (
    version: Pick<DiagramWorkflowVersionSummary, 'name' | 'versionLabel'>
) => [
    `${getRestoreVersionHeading(version)} will be copied into Development.`,
    'The stored version will remain immutable and unchanged.',
    'Your current Development content will be replaced.',
    'SchemaDash will create an automatic safety snapshot first before replacing Development.',
];
