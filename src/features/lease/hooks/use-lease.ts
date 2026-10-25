// hooks/use-lease.ts
import { useLeaseQuery } from "../queries/use-lease-query";
export const useLease = (id: string) => useLeaseQuery(id);