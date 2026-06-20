import { useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyApi } from "../api/property-api";
import { propertyKeys } from "./property-keys";

export const useArchivePropertyMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: propertyApi.archive,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: propertyKeys.all });
        },
    });
};