const base = "/commission-policies";

export const commissionEndpoints = {
    default: () => base + "/default",
    landlord: (landlordOrgId: string) => `${base}/landlords/${landlordOrgId}`,
    effectiveRate: (landlordOrgId: string) => `${base}/effective-rate/${landlordOrgId}`,
};
