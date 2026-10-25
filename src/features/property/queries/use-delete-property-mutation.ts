import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { propertyApi } from "../api/property-api";
import { propertyKeys } from "./property-keys";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export const useDeletePropertyMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: propertyApi.remove,
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: propertyKeys.detail(id) });
            qc.invalidateQueries({ queryKey: propertyKeys.all });
            qc.invalidateQueries({ queryKey: ["public-properties"] });
            qc.invalidateQueries({ queryKey: ["public-units"] });
            qc.invalidateQueries({ queryKey: ["activities"] });
            toast.success("Property permanently deleted");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to delete property. Please try again.")
            );
        },
    });
};
