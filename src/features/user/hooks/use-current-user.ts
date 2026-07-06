import { useCurrentUserQuery } from "../queries/use-current-user-query";
import { UserRole } from "../types/user";

export const useCurrentUser = () => {
    const { data, isLoading, error } = useCurrentUserQuery();

    return {
        user: data,
        isLoading,
        error,
        role: data?.role,
        isOwner: data?.role === UserRole.OWNER,
        isManager: data?.role === UserRole.MANAGER,
        isStaff: data?.role === UserRole.STAFF,
    };
};