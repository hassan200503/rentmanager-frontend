import { useQuery } from "@tanstack/react-query";
import { leaseApi } from "../api/lease-api";
import { leaseKeys } from "./lease-keys";

/**
 * Portfolio-wide tenant stats for the Tenants page's stat cards —
 * deliberately independent of the table's pagination and filters, so
 * "3 active tenants" means the same thing no matter which page a landlord
 * is looking at.
 */
export const useLeaseStatsQuery = () =>
    useQuery({
        queryKey: leaseKeys.stats,
        queryFn: leaseApi.getStats,
        staleTime: 30 * 1000,
    });
