import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { propertyApi } from "../api/property-api";
import { propertyKeys } from "./property-keys";
import { PropertyFilterState } from "../hooks/use-property-filters";
import { BACKEND_JWT_TEMPLATE } from "@/lib/auth/token";

export const usePropertiesQuery = (params?: PropertyFilterState) => {
    const { getToken, isLoaded } = useAuth();

    return useQuery({
        queryKey: propertyKeys.list(params),
        enabled: isLoaded,
        queryFn: async () => {
            const token = await getToken({ template: BACKEND_JWT_TEMPLATE });
            return propertyApi.list(params, token ?? undefined);
        },
    });
};