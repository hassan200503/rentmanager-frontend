import { ApiError } from "@/lib/api/errors";
import { usePlatformAdminInfoQuery } from "./use-admin-queries";

/**
 * Resolves the caller's platform sub-role for client-side gating of the
 * Super Admin console. The authoritative checks are the backend @PreAuthorize
 * and the proxy route guard — this merely surfaces a friendly denied state
 * and toggles owner-only actions (e.g. landlord suspension) in the UI.
 *
 *  - isPlatformOwner: token carries OWNER (superset of ADMIN)
 *  - isPlatformAdmin: token carries OWNER or ADMIN
 *  - isResolving: no decision yet — show a spinner, never a denial
 *  - isDenied: backend returned 403 — this token genuinely lacks platform access
 *  - isLoadError: all other error conditions (network, 401, 5xx) — transient, retryable
 *  - refetch: trigger a fresh attempt after a load error
 *
 * <h2>Why `isResolving` exists and `isLoading` is not enough</h2>
 * A platform owner browsing to /admin/integrations was shown "Access denied"
 * once, then the correct page on reload. The pages ask
 * `isDenied || !isPlatformAdmin`, and `isPlatformAdmin` is derived from data
 * that may simply not have arrived yet — so *any* state with no data and no
 * error rendered as a denial.
 *
 * React Query has such a state: `isLoading` is `isPending && isFetching`, so a
 * query that is pending but not actively fetching — paused because the browser
 * believes it is offline, for instance — reports `isLoading: false`,
 * `isError: false` and `data: undefined` all at once. `isResolving` closes
 * that hole by treating "no answer yet" as undecided rather than as "no".
 *
 * The distinction matters more here than the code suggests. Telling the owner
 * of the platform that they lack access, in red, with no way forward, is the
 * same dead end that was reported on the landlord side — and someone who sees
 * it has no reason to suspect it is a lie.
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
    const isDenied = isDefinitelyDenied;

    // No verdict has come back: still fetching, or pending-but-not-fetching.
    // Callers must render this as "checking", never as a refusal.
    const isResolving = !isError && data === undefined;

    return {
        role,
        isPlatformOwner,
        isPlatformAdmin,
        isLoading,
        isResolving,
        isDenied,
        isLoadError,
        refetch,
    };
};
