import { create } from "zustand";

/**
 * org-store.ts
 *
 * Single source of truth for the currently active tenant/organization.
 * The store is populated by AuthProvider once Clerk resolves the session.
 */

interface OrgState {
    /** Clerk organization ID. Null until resolved. */
    tenantId: string | null;
    /** Display name of the active org. */
    tenantName: string | null;
    /** True once Clerk has finished loading auth + org state. */
    isResolved: boolean;
    /** True if the signed‑in user has no active organization (needs onboarding). */
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

    clearTenant: () => set({ tenantId: null, tenantName: null }),

    setResolved: (resolved) => set({ isResolved: resolved }),

    setNeedsOrgSelection: (needsOrgSelection) =>
        set({ needsOrgSelection, tenantId: null, tenantName: null }),

    reset: () => set(initialState),
}));

/**
 * Convenience selector for the common "do we have a usable tenant yet" check.
 */
export const useHasResolvedTenant = () =>
    useOrgStore((s) => s.isResolved && !!s.tenantId);
