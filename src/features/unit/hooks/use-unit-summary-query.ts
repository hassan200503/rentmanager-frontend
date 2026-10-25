import { useQuery } from "@tanstack/react-query";
import { unitApi } from "../api/unit-api";
import { useOrgStore } from "@/stores/org-store";

export const useUnitSummaryQuery = () => {
    const isResolved = useOrgStore((s) => s.isResolved);
    const tenantId = useOrgStore((s) => s.tenantId);

    return useQuery({
        queryKey: ["unit-summary", tenantId],
        queryFn: () => unitApi.getSummary(),
        enabled: isResolved && !!tenantId,
    });
};

/**
 * Occupied/total units for every property this landlord owns.
 *
 * One grouped query server-side, so the dashboard can show "39/40 occupied"
 * per property instead of a category — the gap that previously led
 * PropertyRanking to derive a percentage from the property name.
 */
export const usePropertyOccupancyQuery = () => {
    const isResolved = useOrgStore((s) => s.isResolved);
    const tenantId = useOrgStore((s) => s.tenantId);

    return useQuery({
        queryKey: ["property-occupancy", tenantId],
        queryFn: () => unitApi.getOccupancyByProperty(),
        enabled: isResolved && !!tenantId,
        staleTime: 60_000,
    });
};
