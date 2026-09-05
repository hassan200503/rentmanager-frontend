const base = "/admin";

export const adminEndpoints = {
    info: () => base + "/info",
    defaultCommission: () => base + "/commission/default",
    overview: () => base + "/overview",
    settings: () => base + "/settings",
    settingsLogo: () => base + "/settings/logo",
    publicBranding: () => "/public/platform/branding",
    landlords: (params?: string) => base + "/landlords" + (params ? `?${params}` : ""),
    landlord: (landlordId: string) => `${base}/landlords/${landlordId}`,
    landlordStatus: (landlordId: string) => `${base}/landlords/${landlordId}/status`,
    landlordCommission: (landlordId: string) => `${base}/landlords/${landlordId}/commission`,
    properties: (params?: string) => base + "/properties" + (params ? `?${params}` : ""),
    property: (propertyId: string) => `${base}/properties/${propertyId}`,
    renters: (params?: string) => base + "/renters" + (params ? `?${params}` : ""),
    disbursements: (params?: string) => base + "/disbursements" + (params ? `?${params}` : ""),
    disbursementRetry: (disbursementId: string) => `${base}/disbursements/${disbursementId}/retry`,
    paymentRequests: (params?: string) => base + "/payment-requests" + (params ? `?${params}` : ""),
    reviews: (params?: string) => base + "/reviews" + (params ? `?${params}` : ""),
    reviewStats: () => base + "/reviews/stats",
    reviewDecision: (type: string, reviewId: string, action: "approve" | "hide") =>
        `${base}/reviews/${type}/${reviewId}/${action}`,
};