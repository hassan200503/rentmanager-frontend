export const depositKeys = {
    all: ["deposit"] as const,
    byLease: (leaseId: string) => [...depositKeys.all, "lease", leaseId] as const,
    byId: (id: string) => [...depositKeys.all, "detail", id] as const,
};
