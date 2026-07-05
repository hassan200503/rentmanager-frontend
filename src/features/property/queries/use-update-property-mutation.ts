import { useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyApi } from "../api/property-api";
import { propertyKeys } from "./property-keys";
import { UpdatePropertyRequest } from "../types/property-request";
import { toast } from "sonner";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

type UpdatePropertyVariables = {
    id: string;
    payload: UpdatePropertyRequest;
};

export const useUpdatePropertyMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        retry: false,
        mutationFn: ({ id, payload }: UpdatePropertyVariables) =>
            propertyApi.update(id, payload),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: propertyKeys.detail(vars.id) });
            qc.invalidateQueries({ queryKey: propertyKeys.all });
            toast.success("Property updated successfully");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to update property. Please try again.")
            );
        },
    });
};
