"use client";

import { useQuery } from "@tanstack/react-query";
import { publicUnitApi } from "../api/public-unit-api";
import { publicUnitKeys } from "./public-unit-keys";

export const usePropertyUnitsQuery = (
    propertyId: string
) => {
    return useQuery({
        queryKey: publicUnitKeys.propertyUnits(
            propertyId
        ),

        queryFn: () =>
            publicUnitApi.getByProperty(
                propertyId
            ),

        enabled: !!propertyId,
    });
};