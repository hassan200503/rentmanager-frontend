// hooks/use-lease-search.ts
import { useLeaseSearchQuery } from "../queries/use-lease-search-query";
import { LeaseSearchParams } from "../types/lease-request";
export const useLeaseSearch = (params?: LeaseSearchParams) => useLeaseSearchQuery(params);