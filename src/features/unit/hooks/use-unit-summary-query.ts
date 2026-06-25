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