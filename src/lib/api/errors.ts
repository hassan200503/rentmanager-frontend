import { AxiosError } from "axios";

/**
 * lib/api/errors.ts
 *
 * Normalizes backend error responses into a consistent shape so feature
 * modules and UI components don't need to know about Axios or backend specifics.
 *
 * Also provides a canonical ApiError class for client-side throwing.
 */

export interface BackendErrorBody {
    message?: string;
    error?: string;
    status?: number;
    path?: string;
    timestamp?: string;
}

/**
 * Canonical error used across frontend API layer.
 * This is what apiClient throws.
 */
export class ApiError extends Error {
    public readonly status: number;
    public readonly code?: string;
    public readonly details?: unknown;

    // ✅ FIX: declare class properties properly
    public readonly traceId?: string;
    public readonly isRetryable?: boolean;

    constructor(params: {
        message: string;
        status: number;
        code?: string;
        details?: unknown;
        traceId?: string;
        isRetryable?: boolean;
    }) {
        super(params.message);

        this.name = "ApiError";
        this.status = params.status;
        this.code = params.code;
        this.details = params.details;

        // ✅ assign safely
        this.traceId = params.traceId;
        this.isRetryable = params.isRetryable;

        Object.setPrototypeOf(this, ApiError.prototype);
    }

    static fromBackend(
        body: BackendErrorBody | undefined,
        fallbackMessage = "Request failed",
        status: number | null = null,
        raw?: unknown
    ) {
        return new ApiError({
            message: body?.message ?? body?.error ?? fallbackMessage,
            status: status ?? 0,
            code: typeof body?.error === "string" ? body.error : undefined,
            details: raw,
        });
    }

    static network(message = "Network error") {
        return new ApiError({
            message,
            status: 0,
            code: "NETWORK_ERROR",
        });
    }
}

export interface NormalizedApiError {
    message: string;
    status: number | null;
    isAuthError: boolean;
    isTenantError: boolean;
    isNetworkError: boolean;
    raw: unknown;
}

/**
 * Legacy-safe normalizer (used by UI layers, interceptors, etc.)
 */
export function normalizeApiError(error: unknown): NormalizedApiError {
    if (error instanceof AxiosError) {
        const status = error.response?.status ?? null;
        const body = error.response?.data as BackendErrorBody | undefined;

        return {
            message:
                body?.message ??
                body?.error ??
                error.message ??
                "An unexpected error occurred.",
            status,
            isAuthError: status === 401,
            isTenantError: status === 403,
            isNetworkError: !error.response,
            raw: error,
        };
    }

    if (error instanceof ApiError) {
        return {
            message: error.message,
            status: error.status,
            isAuthError: error.status === 401,
            isTenantError: error.status === 403,
            isNetworkError: error.status === 0,
            raw: error,
        };
    }

    if (error instanceof Error) {
        return {
            message: error.message,
            status: null,
            isAuthError: false,
            isTenantError: false,
            isNetworkError: false,
            raw: error,
        };
    }

    return {
        message: "An unknown error occurred.",
        status: null,
        isAuthError: false,
        isTenantError: false,
        isNetworkError: false,
        raw: error,
    };
}