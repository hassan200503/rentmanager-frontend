import { activityEndpoints } from "./activity-endpoints";
import { Activity } from "../types/activity";
import { ApiError } from "@/lib/api/errors";
import { buildHeaders } from "@/lib/api/interceptor";
import { appConfig } from "@/lib/config/app-config";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";

type ClerkWindow = Window & {
    Clerk?: {
        session?: {
            getToken?: (options?: { template?: string }) => Promise<string | null>;
        };
    };
};

// Bounds how long getRecent will wait on the backend before failing. Without
// this, a backend that never responds leaves React Query's
// initialQuery.isLoading stuck true forever, which is indistinguishable in
// the UI from "still loading" — the dashboard just spins with no way to
// surface an error. 10s is generous for a "recent activity" list read; tune
// against real p99s if this ever false-positives.
const RECENT_REQUEST_TIMEOUT_MS = 10000;

/**
 * tenantId is passed in by the caller (useActivityFeed, sourced from
 * useCurrentUser) and used as-is — it's already the real backend tenant
 * UUID, confirmed by inserting a row directly under that UUID and seeing it
 * render. No uuidv5 namespace hashing here: an earlier version of this file
 * hashed it (mirroring property-api's Clerk-org-id path), which produced a
 * different, non-matching UUID and silently returned an empty activity
 * list. Backend logs also independently confirmed this UUID is what
 * server-side code already uses for tenant-scoped storage paths, so this
 * request's x-tenant-id header is likely redundant with whatever the
 * backend derives from the JWT itself — but it's cheap to send and kept for
 * parity with the rest of the app's request shape.
 */
const getAuthContext = async (tenantId?: string) => {
    if (typeof window === "undefined") {
        return {};
    }

    // getToken() talking to Clerk is an external network call outside our
    // control. If it rejects (expired session, template misconfigured,
    // Clerk-side hiccup) uncaught, that rejection propagates out of
    // getAuthContext and getRecent never reaches fetch() — React Query sees
    // a promise that never resolves into either data or a caught error in
    // some SDK failure modes, which reads as a permanently stuck spinner.
    // Falling back to no token here is safe: the backend request still goes
    // out, and an absent/invalid token becomes a clean 401 that getRecent
    // already turns into a proper ApiError.
    let token: string | undefined;
    try {
        token =
            (await (window as ClerkWindow).Clerk?.session?.getToken?.({
                template: BACKEND_JWT_TEMPLATE,
            })) ?? undefined;
    } catch {
        token = undefined;
    }

    return { token, tenantId };
};

/**
 * ActivityLogController#recent returns a bare List<ActivityLog> — confirmed
 * against the controller source (no ApiResponse<T> wrapper, no ResponseEntity
 * wrapping, just the list returned directly). That's NOT the { success, data }
 * envelope apiClient.request() expects — it checks `data?.success` before
 * unwrapping `data.data`, so routing this through apiClient.get() would throw
 * "Request failed" / BUSINESS_ERROR on every successful 200.
 *
 * So this talks to fetch() directly instead of going through apiClient, but
 * reuses the exact same header-building, base URL, and error-shape
 * conventions apiClient uses, so it stays as close to in-convention as the
 * backend's actual response shape allows.
 */
export interface ActivityPage {
    content: Activity[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface ActivityFilters {
    entityType?: string;
    eventType?: string;
}

const getRecent = async (limit: number, tenantId?: string): Promise<Activity[]> => {
    const { token, tenantId: resolvedTenantId } = await getAuthContext(tenantId);
    const query = new URLSearchParams({ limit: String(limit) }).toString();
    const url = `${appConfig.api.baseUrl}${activityEndpoints.base}?${query}`;

    let res: Response;
    try {
        res = await fetch(url, {
            headers: buildHeaders(token, resolvedTenantId),
            signal: AbortSignal.timeout(RECENT_REQUEST_TIMEOUT_MS),
        });
    } catch (err) {
        // AbortSignal.timeout() rejects with a DOMException("TimeoutError")
        // rather than resolving a Response, so it has to be caught here and
        // re-thrown as an ApiError — otherwise it surfaces to React Query as
        // an unrecognized error type instead of a normal, handleable one.
        if (err instanceof DOMException && err.name === "TimeoutError") {
            throw new ApiError({
                message: "Request timed out",
                status: 0,
                code: "REQUEST_TIMEOUT",
            });
        }
        throw err;
    }

    if (res.status === 401) {
        throw new ApiError({ message: "Unauthorized", status: 401, code: "AUTH_401" });
    }

    if (res.status === 403) {
        throw new ApiError({ message: "Forbidden", status: 403, code: "AUTH_403" });
    }

    if (!res.ok) {
        throw new ApiError({ message: "Request failed", status: res.status, code: "BUSINESS_ERROR" });
    }

    const data = await res.json();

    // Defensive fallback only — the confirmed shape is a bare array (see
    // comment above). If the backend ever grows a { content: [...] }
    // envelope this keeps callers from breaking, but the array branch below
    // is the real, current path.
    const activities = Array.isArray(data)
        ? (data as Activity[])
        : ((data?.content as Activity[] | undefined) ?? []);

    return activities;
};

const getAll = async (
    page: number,
    size: number,
    filters?: ActivityFilters,
    tenantId?: string
): Promise<ActivityPage> => {
    const { token, tenantId: resolvedTenantId } = await getAuthContext(tenantId);
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (filters?.entityType) query.set("entityType", filters.entityType);
    if (filters?.eventType) query.set("eventType", filters.eventType);
    const url = `${appConfig.api.baseUrl}${activityEndpoints.paginated}?${query.toString()}`;

    const res = await fetch(url, { headers: buildHeaders(token, resolvedTenantId) });
    if (!res.ok) {
        throw new ApiError({ message: "Request failed", status: res.status, code: "BUSINESS_ERROR" });
    }
    return res.json() as Promise<ActivityPage>;
};

/**
 * Browser EventSource can't send an Authorization header, and this app
 * authenticates with Clerk Bearer tokens (see property-api.ts), not cookies.
 * So per the integration spec §7.1, this is a fetch + ReadableStream reader
 * with manual SSE parsing rather than a plain EventSource.
 *
 * Single connection attempt: opens the stream, calls onOpen once it's
 * confirmed live, calls onActivity for each parsed "activity" event, and
 * resolves when the stream ends (server closes it, network drop, or the
 * AbortSignal fires). Reconnection/backoff is the caller's responsibility
 * (see use-activity-feed.ts) — this function does not retry on its own.
 *
 * Deliberately NOT given a request timeout like getRecent — this connection
 * is meant to stay open indefinitely, so "still connected after 10s" is the
 * success case, not a hang. Its lifetime is bounded by the caller's
 * AbortSignal instead.
 */
const connectToStream = async (
    onActivity: (activity: Activity) => void,
    signal: AbortSignal,
    onOpen?: () => void,
    tenantId?: string
): Promise<void> => {
    const { token, tenantId: resolvedTenantId } = await getAuthContext(tenantId);

    const res = await fetch(`${appConfig.api.baseUrl}${activityEndpoints.stream}`, {
        headers: { ...buildHeaders(token, resolvedTenantId), Accept: "text/event-stream" },
        signal,
    });

    if (!res.ok || !res.body) {
        throw new ApiError({
            message: "Failed to open activity stream",
            status: res.status,
            code: "STREAM_CONNECT_ERROR",
        });
    }

    onOpen?.();

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE messages are separated by a blank line.
            let boundary = buffer.indexOf("\n\n");
            while (boundary !== -1) {
                const rawMessage = buffer.slice(0, boundary);
                buffer = buffer.slice(boundary + 2);

                let eventName = "message";
                const dataLines: string[] = [];

                for (const line of rawMessage.split("\n")) {
                    if (line.startsWith("event:")) {
                        eventName = line.slice("event:".length).trim();
                    } else if (line.startsWith("data:")) {
                        dataLines.push(line.slice("data:".length).trim());
                    }
                }

                // Only the "activity" named event carries feed data (spec
                // §4) — ignore anything else (default "message", comments,
                // keep-alive pings, etc).
                if (eventName === "activity" && dataLines.length > 0) {
                    try {
                        onActivity(JSON.parse(dataLines.join("\n")) as Activity);
                    } catch {
                        // A malformed single message shouldn't kill the whole
                        // stream — skip it and keep reading.
                    }
                }

                boundary = buffer.indexOf("\n\n");
            }
        }
    } finally {
        reader.releaseLock();
    }
};

export const activityApi = {
    getRecent,
    getAll,
    connectToStream,
};