import { create } from "zustand";

/**
 * org-store.ts
 *
 * Single source of truth for "which tenant/org is currently active."
 * tenantId === Clerk orgId (see architecture decision log).
 *
 * This store is populated by AuthProvider once Clerk has resolved the
 * session and active organization. No component should read tenant
 * context from anywhere else (not from Clerk hooks directly, not from
 * props) — always read from here, so there is exactly one place that
 * defines "current tenant."
 */

interface OrgState {
    /** Clerk organization ID. Null until Clerk has loaded AND resolved an active org. */
    tenantId: string | null;
    /** Display name of the active org, for UI use (headers, switchers, etc). */
    tenantName: string | null;
    /** True once Clerk has finished loading auth + org state, regardless of outcome. */
    isResolved: boolean;
    /** True if the signed-in user has no active organization (needs onboarding). */
    needsOrgSelection: boolean;

    setTenant: (tenantId: string, tenantName: string | null) => void;
    clearTenant: () => void;
    setResolved: (resolved: boolean) => void;
    setNeedsOrgSelection: (needsOrgSelection: boolean) => void;
    reset: () => void;
}

const initialState = {
    tenantId: null,
    tenantName: null,
    isResolved: false,
    needsOrgSelection: false,
};

export const useOrgStore = create<OrgState>((set) => ({
    ...initialState,

    setTenant: (tenantId, tenantName) =>
        set({ tenantId, tenantName, needsOrgSelection: false }),

    clearTenant: () =>
        set({ tenantId: null, tenantName: null }),

    setResolved: (resolved) => set({ isResolved: resolved }),

    setNeedsOrgSelection: (needsOrgSelection) =>
        set({ needsOrgSelection, tenantId: null, tenantName: null }),

    reset: () => set(initialState),
}));

/**
 * Convenience selector for the common "do we have a usable tenant yet" check.
 * Use this to gate tenant-scoped queries:
 *   enabled: useHasResolvedTenant()
 */
export const useHasResolvedTenant = () =>
    useOrgStore((s) => s.isResolved && !!s.tenantId);