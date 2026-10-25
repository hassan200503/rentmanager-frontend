import { useQuery } from "@tanstack/react-query";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";
import { UnitListParams } from "../types/unit-request";
import { useOrgStore } from "@/stores/org-store";

export const useUnitsQuery = (params: UnitListParams) => {
    const isResolved = useOrgStore((s) => s.isResolved);
    const tenantId = useOrgStore((s) => s.tenantId);

    return useQuery({
        queryKey: unitKeys.list(params),
        queryFn: () => unitApi.list(params),
        enabled: !!params.propertyId && isResolved && !!tenantId,
    });
};