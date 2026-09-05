const base = "/tenants";

export const tenantEndpoints = {
    base,
    byId: (id: string) => `${base}/${id}`,
    darajaCredentialsStatus: (id: string) => `${base}/${id}/daraja-credentials/status`,
    darajaCredentials: (id: string) => `${base}/${id}/daraja-credentials`,
    darajaCredentialsTest: (id: string) => `${base}/${id}/daraja-credentials/test`,
    suspend: (id: string) => `${base}/${id}/suspend`,
    activate: (id: string) => `${base}/${id}/activate`,
    // Deliberately NOT nested under `base` — this is POST /api/v1/onboarding/tenant,
    // a separate top-level resource, not /tenants/onboard. ASSUMPTION: appConfig.api.baseUrl
    // already ends in /api/v1 (inferred from `base` above being the bare "/tenants" — same
    // pattern userEndpoints.me presumably follows for /api/v1/users/me). Not verified against
    // app-config.ts directly — confirm if this 404s.
    onboard: "/onboarding/tenant",
};