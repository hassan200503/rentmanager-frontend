import { ApiError } from "@/lib/api/errors";
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
 *  - isDenied: backend returned 403 — this token genuinely lacks platform access
 *  - isLoadError: all other error conditions (network, 401, 5xx) — transient, retryable
 *  - refetch: trigger a fresh attempt after a load error
 */
export const usePlatformRole = () => {
    const { data, isLoading, isError, error, refetch } = usePlatformAdminInfoQuery();

    const role = data?.platformRole;
    const isPlatformOwner = role === "OWNER";
    const isPlatformAdmin = isPlatformOwner || role === "ADMIN";

    // A 403 means the backend explicitly refused this token — it is not a
    // platform admin. Any other error (401 while Clerk hydrates, network blip,
    // 5xx) is a transient load failure, not a permission decision.
    const isDefinitelyDenied =
        isError && error instanceof ApiError && error.status === 403;
    const isLoadError = isError && !isDefinitelyDenied;
    const isDenied = !isLoading && isDefinitelyDenied;

    return { role, isPlatformOwner, isPlatformAdmin, isLoading, isDenied, isLoadError, refetch };
};