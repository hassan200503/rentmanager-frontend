import { useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyApi } from "../api/property-api";
import { propertyKeys } from "./property-keys";
import { UpdatePropertyRequest } from "../types/property-request";

type UpdatePropertyVariables = {
    id: string;
    payload: UpdatePropertyRequest;
};

export const useUpdatePropertyMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: ({ id, payload }: UpdatePropertyVariables) =>
            propertyApi.update(id, payload),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: propertyKeys.detail(vars.id) });
            qc.invalidateQueries({ queryKey: propertyKeys.all });
        },
    });
};
