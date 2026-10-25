export const taxKeys = {
    all: ["tax"] as const,
    summary: () => [...taxKeys.all, "summary"] as const,
    invoices: (page?: number) => [...taxKeys.all, "invoices", page ?? 0] as const,
    filings: (page?: number) => [...taxKeys.all, "filings", page ?? 0] as const,
    registrations: () => [...taxKeys.all, "registrations"] as const,
    propertyRegistration: (propertyId: string) =>
        [...taxKeys.all, "registration", propertyId] as const,
};
