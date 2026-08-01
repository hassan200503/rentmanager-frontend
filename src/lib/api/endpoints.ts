/**
 * Centralized endpoint builder
 * Prevents hardcoded drift across modules
 * Supports tenant-aware paths
 *
 * IMPORTANT: all paths here are RELATIVE. `apiClient` prepends
 * `appConfig.api.baseUrl` (which already ends in /api/v1, e.g.
 * http://localhost:8080/api/v1) before fetching, so baking the absolute
 * URL — or a second /api/v1 prefix — into these strings would produce a
 * doubled origin like http://localhost:8080/api/v1http://localhost:8080/api/v1/...
 * Keep this consistent with the per-feature endpoint files
 * (e.g. src/features/lease/api/lease-endpoints.ts).
 */
const build = (path: string) => path;

/**
 * Tenant-aware builder
 * Ensures strict multi-tenant isolation
 */
const buildTenantScoped = (tenantId: string, path: string) =>
    `/tenants/${tenantId}${path}`;

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
