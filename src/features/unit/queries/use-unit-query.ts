import { useQuery } from "@tanstack/react-query";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";

export const useUnitQuery = (id: string) => {
    return useQuery({
        queryKey: unitKeys.detail(id),
        queryFn: () => unitApi.get(id),
        enabled: !!id,
    });
};
