import { appConfig } from "@/lib/config/app-config";

/**
 * SaaS-grade API versioning
 * Must match Spring Boot base path
 */
const API_VERSION = "/api/v1";

/**
 * Centralized endpoint builder
 * Prevents hardcoded drift across modules
 * Supports tenant-aware paths
 */
const build = (path: string) =>
    `${appConfig.api.baseUrl}${API_VERSION}${path}`;

/**
 * Tenant-aware builder
 * Ensures strict multi-tenant isolation
 */
const buildTenantScoped = (tenantId: string, path: string) =>
    `${appConfig.api.baseUrl}${API_VERSION}/tenants/${tenantId}${path}`;

export const endpoints = {
    properties: build("/properties"),
    units: build("/units"),
    tenants: build("/tenants"),
    leases: build("/leases"),
    payments: build("/payments"),
    maintenance: build("/maintenance"),

    /**
     * Tenant-scoped endpoints (multi-tenant SaaS isolation)
     */
    tenantScoped: {
        properties: (tenantId: string) => buildTenantScoped(tenantId, "/properties"),
        units: (tenantId: string) => buildTenantScoped(tenantId, "/units"),
        leases: (tenantId: string) => buildTenantScoped(tenantId, "/leases"),
        payments: (tenantId: string) => buildTenantScoped(tenantId, "/payments"),
        maintenance: (tenantId: string) =>
            buildTenantScoped(tenantId, "/maintenance"),
    }
}
