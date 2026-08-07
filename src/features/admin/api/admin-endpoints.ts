const base = "/admin";

export const adminEndpoints = {
    info: () => base + "/info",
    defaultCommission: () => base + "/commission/default",
    overview: () => base + "/overview",
    settings: () => base + "/settings",
    landlords: (params?: string) => base + "/landlords" + (params ? `?${params}` : ""),
    landlord: (landlordId: string) => `${base}/landlords/${landlordId}`,
    landlordStatus: (landlordId: string) => `${base}/landlords/${landlordId}/status`,
    landlordCommission: (landlordId: string) => `${base}/landlords/${landlordId}/commission`,
    properties: (params?: string) => base + "/properties" + (params ? `?${params}` : ""),
    property: (propertyId: string) => `${base}/properties/${propertyId}`,
    renters: (params?: string) => base + "/renters" + (params ? `?${params}` : ""),
    disbursements: (params?: string) => base + "/disbursements" + (params ? `?${params}` : ""),
    disbursementRetry: (disbursementId: string) => `${base}/disbursements/${disbursementId}/retry`,
};