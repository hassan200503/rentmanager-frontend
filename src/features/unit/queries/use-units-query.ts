import { useQuery } from "@tanstack/react-query";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";
import { UnitListParams } from "../types/unit-request";

export const useUnitsQuery = (params: UnitListParams) => {
    return useQuery({
        queryKey: unitKeys.list(params),
        queryFn: () => unitApi.list(params),
        enabled: !!params.propertyId,
    });
};
