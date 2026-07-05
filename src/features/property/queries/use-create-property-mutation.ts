import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { propertyApi } from "../api/property-api";
import { propertyKeys } from "./property-keys";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export const useCreatePropertyMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: propertyApi.create,
        onSuccess: (property) => {
            qc.invalidateQueries({ queryKey: propertyKeys.all });
            toast.success(`${property.name} created as a draft`);
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to create property. Please try again.")
            );
        },
    });
};
