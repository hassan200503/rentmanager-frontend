import { ApiError } from "./errors";
import { ApiResponse } from "./types";
import { buildHeaders } from "./interceptor";
import { appConfig } from "@/lib/config/app-config";

const TIMEOUT_MS = 15000;

/**
 * SaaS-grade fetch with timeout + safe parsing
 * Aligns with Spring Boot JWT + multi-tenant SaaS backend
 */
async function request<T>(
    endpoint: string,
    options?: RequestInit & { token?: string; tenantId?: string }
): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;

    try {
        res = await fetch(`${appConfig.api.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                ...buildHeaders(options?.token, options?.tenantId),
                ...(options?.headers || {}),
            },
            signal: controller.signal,
        });
    } catch (err: unknown) {
        clearTimeout(timeout);
        const isAbortError = err instanceof Error && err.name === "AbortError";

        throw new ApiError({
            message: isAbortError ? "Request timeout" : "Network error",
            status: 0,
            code: isAbortError ? "TIMEOUT_ERROR" : "NETWORK_ERROR",
            details: err,
        });
    }

    clearTimeout(timeout);

    let data: ApiResponse<T> | null = null;

    try {
        data = await res.json();
    } catch {
        throw new ApiError({
            message: "Invalid server response",
            status: res.status,
            code: "UNKNOWN_ERROR",
        });
    }

    /**
     * AUTH LAYER (Spring Security alignment)
     */
    if (res.status === 401) {
        throw new ApiError({
            message: "Unauthorized",
            status: 401,
            code: "AUTH_401",
            details: data,
        });
    }

    if (res.status === 403) {
        throw new ApiError({
            message: "Forbidden",
            status: 403,
            code: "AUTH_403",
            details: data,
        });
    }

    /**
     * BUSINESS LAYER (ApiResponse contract)
     */
    if (!res.ok || !data?.success) {
        throw new ApiError({
            message: data?.message || "Request failed",
            status: res.status,
            code: (data?.errorCode as string) ?? "BUSINESS_ERROR",
            details: data,
        });
    }

    return data.data as T;
}

export const apiClient = {
    get: <T>(url: string, token?: string, tenantId?: string) =>
        request<T>(url, { token, tenantId }),

    post: <T>(url: string, body?: unknown, token?: string, tenantId?: string) =>
        request<T>(url, {
            method: "POST",
            body: JSON.stringify(body),
            token,
            tenantId,
        }),

    put: <T>(url: string, body?: unknown, token?: string, tenantId?: string) =>
        request<T>(url, {
            method: "PUT",
            body: JSON.stringify(body),
            token,
            tenantId,
        }),

    delete: <T>(url: string, token?: string, tenantId?: string) =>
        request<T>(url, {
            method: "DELETE",
            token,
            tenantId,
        }),
};
