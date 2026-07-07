import { v5 as uuidv5 } from "uuid";
import { userEndpoints } from "./user-endpoints";
import {
    InviteUserRequest,
    InviteUserResponse,
    UserResponse,
    UserListParams,
    UserPageResponse,
} from "../types/user";
import { apiClient } from "@/lib/api/client";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";
import { getTenantIdFromSession } from "@/shared/tenant/get-tenant-id";
import { useOrgStore } from "@/stores/org-store";

type ClerkWindow = Window & {
    Clerk?: {
        session?: {
            getToken?: (options?: { template?: string }) => Promise<string | null>;
        };
    };
};

const TENANT_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

const getTenantId = (): string | undefined => {
    const rawTenantId =
        useOrgStore.getState().tenantId ?? getTenantIdFromSession() ?? undefined;

    return rawTenantId ? uuidv5(rawTenantId, TENANT_NAMESPACE) : undefined;
};

const getAuthContext = async () => {
    if (typeof window === "undefined") {
        return {};
    }

    const tenantId = getTenantId();

    const token =
        (await (window as ClerkWindow).Clerk?.session?.getToken?.({
            template: BACKEND_JWT_TEMPLATE,
        })) ?? undefined;

    return { token, tenantId };
};

const buildPageQuery = (params?: UserListParams) => {
    const query = new URLSearchParams();
    query.set("page", String(params?.page ?? 0));
    query.set("size", String(params?.size ?? 20));
    return query.toString();
};

export const userApi = {
    invite: async (payload: InviteUserRequest): Promise<InviteUserResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<InviteUserResponse>(
            userEndpoints.invite,
            payload,
            token,
            tenantId
        );
    },

    getCurrentUser: async (token?: string): Promise<UserResponse> => {
        const tenantId = getTenantId();
        return apiClient.get<UserResponse>(userEndpoints.me, token, tenantId);
    },

    list: async (params?: UserListParams): Promise<UserPageResponse> => {
        const { token, tenantId } = await getAuthContext();
        const query = buildPageQuery(params);
        return apiClient.get<UserPageResponse>(
            `${userEndpoints.list}?${query}`,
            token,
            tenantId
        );
    },
};