export const commissionKeys = {
    all: ["commission"] as const,
    default: () => [...commissionKeys.all, "default"] as const,
    landlord: (landlordOrgId: string) => [...commissionKeys.all, "landlord", landlordOrgId] as const,
    effectiveRate: (landlordOrgId: string) => [...commissionKeys.all, "effective-rate", landlordOrgId] as const,
};
