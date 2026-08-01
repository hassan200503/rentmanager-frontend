// features/settings/api/tenant-settings-api.ts
// Landlord settings: branding (Phase 3a) + emergency contact (Phase 2b).
// The tenantId passed here MUST be the real backend tenant UUID (from
// GET /users/me) — the uuidv5(orgId) derivation used by some other API
// files produces a namespaced UUID that never matches the backend's
// TenantContext, which would 403 on the path-tenant equality check.
import { apiClient } from "@/lib/api/client";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { TenantSettingsResponse, UpdateTenantSettingsRequest } from "../types/tenant-settings-response";

type ClerkWindow = Window & {
    Clerk?: {
        session?: {
            getToken?: (options?: { template?: string }) => Promise<string | null>;
        };
    };
};

const getAuthContext = async () => {
    if (typeof window === "undefined") {
        return { token: undefined };
    }

    const token =
        (await (window as ClerkWindow).Clerk?.session?.getToken?.({
            template: BACKEND_JWT_TEMPLATE,
        })) ?? undefined;

    return { token };
};

// Path is relative — apiClient prepends appConfig.api.baseUrl (which
// already ends in /api/v1), so no base/version prefix belongs here.
const settingsUrl = (tenantId: string) =>
    `/tenants/${tenantId}/settings`;

export const tenantSettingsApi = {
    get: async (tenantId: string): Promise<TenantSettingsResponse> => {
        const { token } = await getAuthContext();
        return apiClient.get<TenantSettingsResponse>(settingsUrl(tenantId), token);
    },

    update: async (tenantId: string, payload: UpdateTenantSettingsRequest): Promise<TenantSettingsResponse> => {
        const { token } = await getAuthContext();
        return apiClient.put<TenantSettingsResponse>(settingsUrl(tenantId), payload, token);
    },
};
