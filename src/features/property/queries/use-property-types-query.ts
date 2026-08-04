import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { propertyApi } from "../api/property-api";
import { propertyKeys } from "./property-keys";

/**
 * Backend taxonomy metadata — the single source of truth for the
 * property type -> premises derivation used by the property form.
 * The query is never "enabled off": the form falls back to local
 * derivation while it loads. Auth context is resolved inside the
 * api layer (propertyApi.getTypes), so no token is preloaded here.
 */
export const usePropertyTypesQuery = () => {
    const { isLoaded } = useAuth();

    return useQuery({
        queryKey: propertyKeys.types,
        enabled: isLoaded,
        staleTime: 24 * 60 * 60 * 1000, // taxonomy changes only with a deploy
        queryFn: propertyApi.getTypes,
    });
};
