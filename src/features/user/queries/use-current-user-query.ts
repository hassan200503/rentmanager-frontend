import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { userApi } from "../api/user-api";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";

export const currentUserKeys = {
    all: ["current-user"] as const,
};

export const useCurrentUserQuery = () => {
    const { isLoaded, isSignedIn, getToken } = useAuth();

    const query = useQuery({
        queryKey: currentUserKeys.all,
        queryFn: async () => {
            const token = await getToken({ template: BACKEND_JWT_TEMPLATE }) ?? undefined;
            return userApi.getCurrentUser(token);
        },
        enabled: isLoaded && isSignedIn,
        staleTime: 5 * 60 * 1000,
    });

    return {
        ...query,
        // query.isLoading is false while the query is disabled (Clerk not
        // loaded yet), which would otherwise let callers treat "auth not
        // resolved" as "loaded with no data." Fold Clerk's own loading
        // state in so isLoading is accurate for the whole auth+fetch chain.
        isLoading: !isLoaded || query.isLoading,
    };
};