"use client";

import { useQuery } from "@tanstack/react-query";
import { publicPropertyApi } from "../api/public-property-api";
import { publicPropertyKeys } from "./public-property-keys";

export const usePublicPropertyQuery = (
    id: string
) => {
    return useQuery({
        queryKey: publicPropertyKeys.detail(id),
        queryFn: () => publicPropertyApi.get(id),
        enabled: !!id,
    });
};