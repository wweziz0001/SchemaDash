import type { Diagram } from '@/lib/domain/diagram';

export type SharingScope = 'private' | 'authenticated' | 'link';
export type SharingAccess = 'view' | 'edit';
export type ResourceAccess = 'view' | 'edit' | 'owner';

export interface PersistedUserSummary {
    id: string;
    email: string | null;
    displayName: string;
    authProvider: 'placeholder' | 'local' | 'oidc';
    status: 'provisioned' | 'active' | 'disabled';
    role: 'member' | 'admin';
    ownershipScope: 'personal' | 'workspace';
    createdAt: string;
    updatedAt: string;
}

export interface PersistedProjectSummary {
    id: string;
    name: string;
    description: string | null;
    collectionId: string | null;
    ownerUserId: string | null;
    visibility: 'private' | 'workspace' | 'public';
    status: 'active' | 'archived' | 'deleted';
    sharingScope: SharingScope;
    sharingAccess: SharingAccess;
    access: ResourceAccess;
    createdAt: string;
    updatedAt: string;
    diagramCount: number;
}

export interface PersistedCollectionSummary {
    id: string;
    name: string;
    description: string | null;
    ownerUserId: string | null;
    createdAt: string;
    updatedAt: string;
    projectCount: number;
    diagramCount: number;
}

export type DiagramDto = Omit<Diagram, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};

export interface PersistedDiagramSummary {
    id: string;
    projectId: string;
    ownerUserId: string | null;
    name: string;
    description: string | null;
    databaseType: string;
    databaseEdition: string | null;
    visibility: 'private' | 'workspace' | 'public';
    status: 'draft' | 'active' | 'archived';
    sharingScope: SharingScope;
    sharingAccess: SharingAccess;
    access: ResourceAccess;
    tableCount: number;
    collaboration?: PersistedDiagramCollaborationState;
    createdAt: string;
    updatedAt: string;
}

export interface PersistedDiagramRecord {
    id: string;
    projectId: string;
    ownerUserId: string | null;
    name: string;
    description: string | null;
    databaseType: string;
    databaseEdition: string | null;
    visibility: 'private' | 'workspace' | 'public';
    status: 'draft' | 'active' | 'archived';
    sharingScope: SharingScope;
    sharingAccess: SharingAccess;
    access: ResourceAccess;
    collaboration: PersistedDiagramCollaborationState;
    createdAt: string;
    updatedAt: string;
    diagram: DiagramDto;
}

export interface PersistedDiagramDocumentState {
    version: number;
    updatedAt: string;
    lastSavedSessionId: string | null;
    lastSavedByUserId: string | null;
}

export interface PersistedDiagramRealtimeCapability {
    strategy: 'optimistic-http' | 'event-stream' | 'websocket-ready';
    liveSyncEnabled: boolean;
    eventsEndpoint: string | null;
    websocketEndpoint: string | null;
    websocketProtocol: string | null;
    sessionEndpoint: string;
}

export interface PersistedDiagramCollaborationState {
    document: PersistedDiagramDocumentState;
    realtime: PersistedDiagramRealtimeCapability;
    activeSessionCount: number;
    presence: PersistedDiagramPresenceState;
}

export interface PersistedDiagramParticipantCursor {
    x: number;
    y: number;
    updatedAt: string;
}

export interface PersistedDiagramPresenceParticipant {
    sessionId: string;
    userId: string | null;
    displayName: string;
    email: string | null;
    initials: string;
    color: string;
    mode: 'view' | 'edit';
    joinedAt: string;
    lastSeenAt: string;
    cursor: PersistedDiagramParticipantCursor | null;
}

export interface PersistedDiagramPresenceState {
    participants: PersistedDiagramPresenceParticipant[];
}

export interface PersistedDiagramSessionTransport {
    syncEndpoint: string;
    heartbeatEndpoint: string;
    eventsEndpoint: string | null;
    websocketEndpoint: string | null;
    websocketProtocol: string | null;
}

export interface PersistedDiagramEditSession {
    id: string;
    diagramId: string;
    ownerUserId: string | null;
    mode: 'view' | 'edit';
    status: 'active' | 'idle' | 'stale' | 'closed';
    clientId: string | null;
    userAgent: string | null;
    baseVersion: number;
    lastSeenDocumentVersion: number;
    createdAt: string;
    updatedAt: string;
    lastHeartbeatAt: string;
    closedAt: string | null;
    transport: PersistedDiagramSessionTransport;
}

export interface PersistedDiagramSessionResponse {
    session: PersistedDiagramEditSession;
    collaboration: PersistedDiagramCollaborationState;
}

export interface PersistedDiagramCollaborationEvent {
    type: 'snapshot' | 'session' | 'document' | 'presence';
    diagramId: string;
    sessionId: string | null;
    emittedAt: string;
    collaboration: PersistedDiagramCollaborationState;
}

export interface PersistedSharingSettings {
    owner: PersistedUserSummary | null;
    people: PersistedSharingParticipant[];
    generalAccess: PersistedGeneralAccessSettings;
}

export interface PersistedSharingParticipant {
    user: PersistedUserSummary;
    access: SharingAccess;
    createdAt: string;
    updatedAt: string;
}

export interface PersistedGeneralAccessSettings {
    scope: SharingScope;
    access: SharingAccess;
    sharePath: string | null;
    shareUpdatedAt: string | null;
    expiresAt: string | null;
    isExpired: boolean;
}

export interface SharedProjectResponse {
    project: PersistedProjectSummary;
    items: PersistedDiagramSummary[];
}

export interface PersistedProjectInput {
    name: string;
    description?: string | null;
    collectionId?: string | null;
    visibility?: 'private' | 'workspace' | 'public';
    status?: 'active' | 'archived' | 'deleted';
}

export interface PersistedCollectionInput {
    name: string;
    description?: string | null;
}

export interface PersistedDiagramUpdateInput {
    projectId?: string;
    ownerUserId?: string;
    name?: string;
    description?: string | null;
    visibility?: 'private' | 'workspace' | 'public';
    status?: 'draft' | 'active' | 'archived';
    sessionId?: string;
    baseVersion?: number;
}

export interface PersistedSharingUpdateInput {
    scope: SharingScope;
    access: SharingAccess;
    expiresAt?: string | null;
    rotateLinkToken?: boolean;
}

export interface PersistedSharingUserInput {
    userId: string;
    access: SharingAccess;
}

export interface PersistedCreateDiagramSessionInput {
    mode?: 'view' | 'edit';
    clientId?: string;
    userAgent?: string;
}

export interface PersistedUpdateDiagramSessionInput {
    status?: 'active' | 'idle' | 'stale' | 'closed';
    lastSeenDocumentVersion?: number;
    close?: boolean;
}

export interface PersistedUpdateDiagramSessionPresenceInput {
    cursor?: {
        x: number;
        y: number;
    } | null;
}

export interface BootstrapResponse {
    user: PersistedUserSummary;
    defaultProject: PersistedProjectSummary;
}
