import { useQuery } from "@tanstack/react-query";
import { leaseApi } from "../api/lease-api";
import { leaseKeys } from "../hooks/lease-keys";

export const useLeaseQuery = (id: string) => {
    return useQuery({
        queryKey: leaseKeys.detail(id),
        queryFn: () => leaseApi.get(id),
        enabled: !!id,
    });
};