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
        // A loaded user with no tenantId carries ROLE_PENDING_ONBOARDING
        // server-side (ClerkJwtAuthenticationConverter). Don't derive this
        // from `role` alone — role is also null here, but tenantId is the
        // more direct mirror of the backend's actual branch condition.
        isPendingOnboarding: !isLoading && !data?.tenantId,
    };
};