import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { propertyApi } from "../api/property-api";
import { propertyKeys } from "./property-keys";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export const useActivatePropertyMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: propertyApi.activate,
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: propertyKeys.detail(id) });
            qc.invalidateQueries({ queryKey: propertyKeys.all });
            qc.invalidateQueries({ queryKey: ["public-properties"] });
            toast.success("Property activated and eligible for public listings");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to activate property. Please try again.")
            );
        },
    });
};
