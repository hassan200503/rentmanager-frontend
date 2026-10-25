import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { propertyApi } from "../api/property-api";
import { propertyKeys } from "./property-keys";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export const useArchivePropertyMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: propertyApi.archive,
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: propertyKeys.detail(id) });
            qc.invalidateQueries({ queryKey: propertyKeys.all });
            qc.invalidateQueries({ queryKey: ["public-properties"] });
            qc.invalidateQueries({ queryKey: ["public-units"] });
            qc.invalidateQueries({ queryKey: ['activities'] });
            toast.success("Property deactivated and removed from public listings");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to deactivate property. Please try again.")
            );
        },
    });
};
