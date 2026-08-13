import { ApiError } from "./errors";
import { ApiResponse } from "./types";
import { buildHeaders } from "./interceptor";
import { appConfig } from "@/lib/config/app-config";

const TIMEOUT_MS = 15000;

// Simple in‑memory rate limiter (per client tab) for MUTATING requests only.
// GETs are deliberately unlimited: dashboards fire many parallel reads and
// polling loops, so limiting them would produce false‑positive 429s for
// legitimately heavy users. This guard is a soft backstop for runaway loops,
// NOT a security boundary — the backend enforces real throttling.
const requestCounts: Record<string, { count: number; reset: number }> = {};

// Per HTTP method, per 1‑minute window.
const MUTATING_LIMITS: Record<string, number> = {
    POST: 30,
    PUT: 30,
    PATCH: 30,
    DELETE: 30,
};

function checkRateLimit(method: string = "GET"): void {
    const upper = method.toUpperCase();
    const limit = MUTATING_LIMITS[upper];
    if (!limit) return; // GET/HEAD/OPTIONS are not limited

    const key = `browser:${upper}`;
    const now = Date.now();
    const windowMs = 60 * 1000;

    const record = requestCounts[key];
    if (!record || now > record.reset) {
        requestCounts[key] = { count: 1, reset: now + windowMs };
        return;
    }

    if (record.count >= limit) {
        throw new ApiError({
            message: "Too many update requests. Please slow down and try again.",
            status: 429,
            code: "RATE_LIMIT_EXCEEDED",
            details: { limit, windowMs, method },
        });
    }

    record.count += 1;
}

async function request<T>(
    endpoint: string,
    options?: RequestInit & { token?: string; tenantId?: string }
): Promise<T> {
    // Pass the HTTP method (default GET) to the limiter
    const method = (options?.method ?? "GET") as string;
    checkRateLimit(method);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;

    try {
        res = await fetch(`${appConfig.api.baseUrl}${endpoint}`, {
            ...options,
            headers: (() => {
                const merged: Record<string, string> = {
                    ...buildHeaders(options?.token, options?.tenantId),
                    ...(options?.headers as Record<string, string> || {}),
                };

                // Let the browser set its own Content-Type (with boundary)
                // for multipart/form-data uploads.
                if (options?.body instanceof FormData) {
                    delete merged["Content-Type"];
                }

                return merged;
            })(),
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
        const serverMessage =
            typeof data?.message === "string" && data.message.trim() ? data.message : "";
        // 5xx bodies can contain server internals (SQL fragments, stack
        // traces, constraint names). Never surface those verbatim — map to a
        // generic copy and keep the raw payload in `details` for observability.
        // 4xx business messages are backend-authored UI copy and safe to show.
        const message =
            res.status >= 500 && res.status !== 429
                ? "The server could not process this request. Please try again later."
                : serverMessage || "Request failed";
        throw new ApiError({
            message,
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

    put: <T>(
        url: string,
        body?: unknown,
        token?: string,
        tenantId?: string,
        config?: RequestInit
    ) =>
        request<T>(url, {
            method: "PUT",
            body: body instanceof FormData ? body : JSON.stringify(body),
            token,
            tenantId,
            ...config,
        }),

    patch: <T>(
        url: string,
        body?: unknown,
        token?: string,
        tenantId?: string
    ) =>
        request<T>(url, {
            method: "PATCH",
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