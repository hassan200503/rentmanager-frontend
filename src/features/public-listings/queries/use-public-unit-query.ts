"use client";

import { useQuery } from "@tanstack/react-query";
import { publicUnitApi } from "../api/public-unit-api";
import { publicUnitKeys } from "./public-unit-keys";

export const usePublicUnitQuery = (
    id: string
) => {
    return useQuery({
        queryKey: publicUnitKeys.detail(id),
        queryFn: () => publicUnitApi.get(id),
        enabled: !!id,
    });
};