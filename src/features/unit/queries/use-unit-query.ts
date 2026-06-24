import { useQuery } from "@tanstack/react-query";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";
import { useOrgStore } from "@/stores/org-store";

export const useUnitQuery = (id: string) => {
    const isResolved = useOrgStore((s) => s.isResolved);
    const tenantId = useOrgStore((s) => s.tenantId);

    return useQuery({
        queryKey: unitKeys.detail(id),
        queryFn: () => unitApi.get(id),
        enabled: !!id && isResolved && !!tenantId,
    });
};