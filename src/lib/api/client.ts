import { ApiError } from "./errors";
import { ApiResponse } from "./types";
import { buildHeaders } from "./interceptor";
import { appConfig } from "@/lib/config/app-config";

const TIMEOUT_MS = 15000;

// Simple in‑memory rate limiter (per client IP)
// In production replace with Redis or a dedicated service
const requestCounts: Record<string, { count: number; reset: number }> = {};

function getClientKey(): string {
    // In a real environment use request IP or user ID
    return typeof window !== "undefined" ? "browser" : "server";
}

function checkRateLimit(): void {
    const key = getClientKey();
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const limit = 60; // 60 requests per minute

    if (!requestCounts[key]) {
        requestCounts[key] = { count: 1, reset: now + windowMs };
        return;
    }

    const record = requestCounts[key];

    if (now > record.reset) {
        record.count = 1;
        record.reset = now + windowMs;
        return;
    }

    if (record.count >= limit) {
        throw new ApiError({
            message: "Rate limit exceeded",
            status: 429,
            code: "RATE_LIMIT_EXCEEDED",
            details: { limit, windowMs },
        });
    }

    record.count += 1;
}

async function request<T>(
    endpoint: string,
    options?: RequestInit & { token?: string; tenantId?: string }
): Promise<T> {
    checkRateLimit();

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

    post: <T>(
        url: string,
        body?: unknown,
        token?: string,
        tenantId?: string,
        config?: RequestInit
    ) =>
        request<T>(url, {
            method: "POST",
            body: body instanceof FormData ? body : JSON.stringify(body),
            token,
            tenantId,
            ...config,
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