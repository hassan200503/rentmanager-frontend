import { useQuery } from "@tanstack/react-query";
import { userApi } from "../api/user-api";
import { UserListParams } from "../types/user";

export const userKeys = {
    all: ["users"] as const,
    list: (params?: UserListParams) => ["users", "list", params] as const,
};

export const useUsersQuery = (params?: UserListParams) => {
    return useQuery({
        queryKey: userKeys.list(params),
        queryFn: () => userApi.list(params),
    });
};