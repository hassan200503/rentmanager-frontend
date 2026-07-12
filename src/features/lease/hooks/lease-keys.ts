// hooks/lease-keys.ts
import { LeaseSearchParams } from "../types/lease-request";

export const leaseKeys = {
    all: ["leases"] as const,
    detail: (id: string) => ["leases", "detail", id],
    search: (params?: LeaseSearchParams) => ["leases", "search", params],
};