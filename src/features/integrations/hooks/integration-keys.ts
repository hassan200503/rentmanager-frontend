export const integrationKeys = {
    all: ["integrations"] as const,
    providers: () => [...integrationKeys.all, "providers"] as const,
    provider: (providerKey: string) => [...integrationKeys.all, "provider", providerKey] as const,
    audit: (providerKey: string) => [...integrationKeys.all, "audit", providerKey] as const,
};
