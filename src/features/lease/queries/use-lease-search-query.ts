import { useQuery } from "@tanstack/react-query";
import { leaseApi } from "../api/lease-api";
import { leaseKeys } from "../hooks/lease-keys";
import { LeaseSearchParams } from "../types/lease-request";

export const useLeaseSearchQuery = (params?: LeaseSearchParams) => {
    return useQuery({
        queryKey: leaseKeys.search(params),
        queryFn: () => leaseApi.search(params),
    });
};