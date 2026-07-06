import { useQuery } from "@tanstack/react-query";
import { userApi } from "../api/user-api";

export const currentUserKeys = {
    all: ["current-user"] as const,
};

export const useCurrentUserQuery = () => {
    return useQuery({
        queryKey: currentUserKeys.all,
        queryFn: userApi.getCurrentUser,
        staleTime: 5 * 60 * 1000,
    });
};