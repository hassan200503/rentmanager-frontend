const base = "/tenants";

export const tenantEndpoints = {
    base,
    byId: (id: string) => `${base}/${id}`,
    darajaCredentialsStatus: (id: string) => `${base}/${id}/daraja-credentials/status`,
    darajaCredentials: (id: string) => `${base}/${id}/daraja-credentials`,
    suspend: (id: string) => `${base}/${id}/suspend`,
    activate: (id: string) => `${base}/${id}/activate`,
};