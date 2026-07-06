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