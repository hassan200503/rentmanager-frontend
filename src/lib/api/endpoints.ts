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

/*
 * REMOVED: buildTenantScoped and the endpoints.tenantScoped block.
 *
 * They produced `/tenants/{tenantId}/properties` and were commented
 * "ensures strict multi-tenant isolation" — which is the opposite of what a
 * tenant id in a URL path does. The backend resolves the tenant from the
 * verified JWT and treats a path id as, at most, a value to compare against
 * it; the frontend's `X-Tenant-Id` header is ignored outright. A caller who
 * could choose their own tenant id in a path would be choosing their own
 * authority.
 *
 * Nothing imported them. They are gone rather than deprecated so that the
 * pattern cannot be revived by autocomplete — a builder that still exists is
 * a builder somebody will eventually call.
 */

export const endpoints = {
    properties: build("/properties"),
    units: build("/units"),
    tenants: build("/tenants"),
    leases: build("/leases"),
    payments: build("/payments"),
    maintenance: build("/maintenance"),

}
