import { appConfig } from "@/lib/config/app-config";

/**
 * SaaS-grade request headers builder
 * Aligns with Spring Boot JWT + multi-tenant backend
 * Adds observability + tenant isolation for SaaS scaling
 */
export function buildHeaders(token?: string, tenantId?: string) {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",

        /**
         * Observability headers (safe for SaaS scaling)
         */
        "X-App-Name": appConfig.appName,
        "X-App-Env": appConfig.environment,
        "X-App-Version": appConfig.version ?? "1.0.0",
    };

    /**
     * Authentication (Spring Security)
     */
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    /**
     * Multi-tenant isolation
     */
    if (tenantId) {
        headers["X-Tenant-Id"] = tenantId;
    }

    return headers;
}
