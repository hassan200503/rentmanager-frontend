import { userEndpoints } from "./user-endpoints";
import {
    InviteUserRequest,
    InviteUserResponse,
    UserResponse,
    SessionAccess,
    UserListParams,
    UserPageResponse,
} from "../types/user";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";

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
        const { token: resolvedToken, tenantId } = await getAuthContext();
        return apiClient.get<UserResponse>(userEndpoints.me, resolvedToken ?? token, tenantId);
    },

    getSessionAccess: async (): Promise<SessionAccess> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<SessionAccess>(userEndpoints.access, token, tenantId);
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

    remove: async (userId: string): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.delete<void>(userEndpoints.member(userId), token, tenantId);
    },
};