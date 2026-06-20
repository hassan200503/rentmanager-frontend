"use client";

import { create } from "zustand";

/**
 * SaaS-grade Loading State Store
 * - Centralized loading + error tracking
 * - Supports multi-tenant SaaS observability
 * - Extensible for analytics dashboards
 */
interface LoadingState {
    isLoading: boolean;
    error?: string;
    traceId?: string;
    setLoading: (loading: boolean) => void;
    setError: (error?: string, traceId?: string) => void;
    reset: () => void;
}

export const useLoadingStat = create<LoadingState>((set) => ({
    isLoading: false,
    error: undefined,
    traceId: undefined,

    setLoading: (loading: boolean) => set({ isLoading: loading }),

    setError: (error?: string, traceId?: string) =>
        set({ error, traceId, isLoading: false }),

    reset: () => set({ isLoading: false, error: undefined, traceId: undefined }),
}));
