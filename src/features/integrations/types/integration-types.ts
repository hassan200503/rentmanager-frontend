/**
 * API contract types for the Integrations control plane
 * (/api/v1/admin/integrations/**).
 *
 * Mirrors the backend `IntegrationDtos` records. Secrets never leave the
 * backend: secret fields carry only a masked preview + configured flag.
 */
export type IntegrationEnvironment = "DEVELOPMENT" | "PRODUCTION";

export type IntegrationStatus =
    | "NOT_CONFIGURED"
    | "CONFIGURED"
    | "VERIFIED"
    | "ERROR";

/** Input shape a provider's Test Connection expects for its destination. */
export type IntegrationTestTargetKind = "TEXT" | "EMAIL" | "PHONE";

export interface IntegrationTestTargetView {
    kind: IntegrationTestTargetKind;
    required: boolean;
    label: string;
    message: string;
}

export interface IntegrationFieldView {
    key: string;
    label: string;
    secret: boolean;
    configured: boolean;
    /** Plain fields: actual value. Secret fields: masked preview. */
    value: string;
    placeholder: string;
}

export interface IntegrationEnvironmentView {
    environment: IntegrationEnvironment;
    active: boolean;
    status: IntegrationStatus;
    configured: boolean;
    lastVerifiedAt: string | null;
    lastVerifiedBy: string | null;
    lastError: string | null;
    updatedBy: string | null;
    updatedAt: string | null;
    fields: IntegrationFieldView[];
}

export interface IntegrationProviderView {
    providerKey: string;
    displayName: string;
    category: string;
    docsUrl: string | null;
    supportsTestConnection: boolean;
    /** Declared by the backend catalog; null when the Test is credential-only. */
    testTarget: IntegrationTestTargetView | null;
    environments: IntegrationEnvironmentView[];
}

export interface IntegrationTestResult {
    ok: boolean;
    message: string;
    error: string | null;
    status: IntegrationStatus;
}

export interface IntegrationActivateResult {
    environment: IntegrationEnvironmentView;
}

export interface IntegrationRolloutSkipView {
    providerKey: string;
    displayName: string;
    reason: string;
}

export interface IntegrationRolloutView {
    targetEnvironment: string;
    activated: string[];
    skipped: IntegrationRolloutSkipView[];
}

export interface IntegrationAuditEntry {
    environment: IntegrationEnvironment;
    action: string;
    actorUserId: string;
    metadata: Record<string, unknown> | null;
    ipAddress: string | null;
    createdAt: string;
}
