import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import { adminKeys } from "./admin-keys";

/**
 * Global platform identity — shared by every surface that renders brand
 * chrome (console sidebar, landlord/tenant shells, landing, favicon).
 *
 * The endpoint is unauthenticated (public branding), so this hook is safe
 * to mount outside auth contexts. The query is immutable in practice —
 * mutations under the same key (logo upload/removal) invalidate it and
 * every consumer re-renders with the updated mark.
 *
 * Fails silently to `undefined` so callers always fall back to the built-in
 * brand mark before the backend ships (or while it is unreachable).
 */
export const usePlatformBrandingQuery = () => {
    return useQuery({
        queryKey: adminKeys.branding(),
        queryFn: () => adminApi.getPublicBranding(),
        staleTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
};