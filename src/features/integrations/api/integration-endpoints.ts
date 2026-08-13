const base = "/admin/integrations";

export const integrationEndpoints = {
    list: () => base,
    provider: (providerKey: string) => `${base}/${providerKey}`,
    audit: (providerKey: string, limit = 50) =>
        `${base}/${providerKey}/audit?limit=${limit}`,
    credentials: (providerKey: string, environment: string) =>
        `${base}/${providerKey}/${environment}`,
    activate: (providerKey: string, environment: string) =>
        `${base}/${providerKey}/${environment}/activate`,
    test: (providerKey: string, environment: string) =>
        `${base}/${providerKey}/${environment}/test`,
};
