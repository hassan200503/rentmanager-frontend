// Mirrors com.rentmanager.modules.tenant.application.dto.response.TenantResponse
// NOTE: `status` is a raw string off the backend enum - exact enum values
// (e.g. "ACTIVE" / "SUSPENDED") not confirmed yet. Treated defensively
// wherever it's read (case-insensitive, unknown values don't assume active).
export interface TenantResponse {
    tenantId: string;
    name: string;
    email: string;
    phoneNumber: string;
    address: string;
    status: string;
}

// Mirrors com.rentmanager.modules.tenant.application.dto.request.SuspendTenantRequest
export interface SuspendTenantRequest {
    reason: string;
}


export enum TenantType {
    TRIAL = "TRIAL",
    STANDARD = "STANDARD",
    PREMIUM = "PREMIUM",
    ENTERPRISE = "ENTERPRISE",
}

// Mirrors OnboardingTenantRequest per the onboarding flow spec (§2).
// Do NOT add clerkOrgId, tenantCode, or slug fields — server-derived/generated.
export interface OnboardingTenantRequest {
    name: string;
    email: string;
    phoneNumber: string;
    address?: string;
    tenantType: TenantType;
}

export interface OnboardingTenantResponse {
    tenantId: string;
    name: string;
    slug: string;
    status: string;
}

/** Mirrors OnboardingController.OnboardingProgressResponse */
export interface OnboardingProgressResponse {
    onboardingCompleted: boolean;
    tenantStatus: string;
    hasProperties: boolean;
    paymentConfigured: boolean;
}