// features/reviews/api/review-api.ts
// Landlord-facing review endpoints (GET /reviews, GET /reviews/summary).
// Paths are relative — apiClient prepends appConfig.api.baseUrl (which
// already ends in /api/v1), so no version prefix belongs here.
import { v5 as uuidv5 } from "uuid";
import { apiClient } from "@/lib/api/client";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";
import { useOrgStore } from "@/stores/org-store";
import { LandlordReviewResponse, ReviewSummaryResponse } from "../types/review-response";

type ClerkWindow = Window & {
    Clerk?: {
        session?: {
            getToken?: (options?: { template?: string }) => Promise<string | null>;
        };
    };
};

const TENANT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const REVIEWS_BASE = "/reviews";

const getAuthContext = async () => {
    if (typeof window === "undefined") {
        return {};
    }

    const rawTenantId = useOrgStore.getState().tenantId ?? getTenantIdFromSession() ?? undefined;

    const tenantId = rawTenantId
        ? uuidv5(rawTenantId, TENANT_NAMESPACE)
        : undefined;

    const token =
        (await (window as ClerkWindow).Clerk?.session?.getToken?.({
            template: BACKEND_JWT_TEMPLATE,
        })) ?? undefined;

    return { token, tenantId };
};

export const reviewApi = {
    list: async (): Promise<LandlordReviewResponse[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<LandlordReviewResponse[]>(REVIEWS_BASE, token, tenantId);
    },

    summary: async (): Promise<ReviewSummaryResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<ReviewSummaryResponse>(`${REVIEWS_BASE}/summary`, token, tenantId);
    },
};
