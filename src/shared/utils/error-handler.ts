import { ApiError } from "@/lib/api/errors";

/**
 * SaaS-grade error handler
 * - Normalizes errors from ApiError, fetch, or unknown sources
 * - Provides safe messages for UI
 * - Preserves observability metadata (traceId, timestamp)
 */
export function handleApiError(err: unknown): {
    message: string;
    code?: string;
    status?: number;
    traceId?: string;
    isRetryable?: boolean;
} {
    if (err instanceof ApiError) {
        return {
            message: err.message,
            code: err.code,
            status: err.status,
            traceId: err.traceId,
            isRetryable: err.isRetryable,
        };
    }

    if (err instanceof Error) {
        return {
            message: err.message || "Unexpected error occurred",
            code: "UNKNOWN_ERROR",
        };
    }

    return {
        message: "An unknown error occurred",
        code: "UNKNOWN_ERROR",
    };
}

/**
 * Maps error codes to user-friendly messages
 * SaaS rule: never expose raw backend codes directly to end-users
 */
export function getErrorMessage(code?: string): string {
    switch (code) {
        case "AUTH_401":
            return "You are not authorized. Please log in again.";
        case "AUTH_403":
            return "Access denied. You don’t have permission.";
        case "VALIDATION_ERROR":
            return "Some fields are invalid. Please check your input.";
        case "BUSINESS_ERROR":
            return "The request could not be processed. Please try again.";
        case "NETWORK_ERROR":
            return "Network issue. Please check your connection.";
        case "TIMEOUT_ERROR":
            return "The request timed out. Please try again.";
        case "RESOURCE_NOT_FOUND":
            return "The requested resource was not found.";
        case "TENANT_MISMATCH":
            return "Tenant mismatch detected. Please switch accounts.";
        default:
            return "Something went wrong. Please try again later.";
    }
}
