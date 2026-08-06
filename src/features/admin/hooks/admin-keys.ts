export const adminKeys = {
    all: ["admin"] as const,
    info: () => [...adminKeys.all, "info"] as const,
    overview: () => [...adminKeys.all, "overview"] as const,
    defaultCommission: () => [...adminKeys.all, "default-commission"] as const,
    landlords: (params?: object) =>
        [...adminKeys.all, "landlords", params ?? {}] as const,
    landlord: (landlordId: string) => [...adminKeys.all, "landlord", landlordId] as const,
    landlordCommission: (landlordId: string) => [...adminKeys.all, "commission", landlordId] as const,
    disbursements: (params?: object) =>
        [...adminKeys.all, "disbursements", params ?? {}] as const,
    properties: (params?: object) =>
        [...adminKeys.all, "properties", params ?? {}] as const,
    property: (propertyId: string) => [...adminKeys.all, "property", propertyId] as const,
    renters: (params?: object) =>
        [...adminKeys.all, "renters", params ?? {}] as const,
};