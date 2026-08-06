import { usePlatformAdminInfoQuery } from "./use-admin-queries";

/**
 * Resolves the caller's platform sub-role for client-side gating of the
 * Super Admin console. The authoritative checks are the backend @PreAuthorize
 * and the proxy route guard — this merely surfaces a friendly denied state
 * and toggles owner-only actions (e.g. commission override) in the UI.
 *
 *  - isPlatformOwner: token carries OWNER (superset of ADMIN)
 *  - isPlatformAdmin: token carries OWNER or ADMIN
 *  - isLoading: still resolving; treat as not-yet-decided
 *  - isDenied: resolved and this token is NOT a platform admin (hide console)
 */
export const usePlatformRole = () => {
    const { data, isLoading, isError } = usePlatformAdminInfoQuery();

    const role = data?.platformRole;
    const isPlatformOwner = role === "OWNER";
    const isPlatformAdmin = isPlatformOwner || role === "ADMIN";
    const isDenied =
        !isLoading && (isError || !isPlatformAdmin) ? true : false;

    return { role, isPlatformOwner, isPlatformAdmin, isLoading, isDenied };
};