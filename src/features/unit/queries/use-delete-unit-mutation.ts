import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { unitApi } from "../api/unit-api";
import { unitKeys } from "./unit-keys";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export const useDeleteUnitMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: unitApi.remove,
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: unitKeys.detail(id) });
            qc.invalidateQueries({ queryKey: unitKeys.lists() });
            qc.invalidateQueries({ queryKey: ["unit-summary"] });
            qc.invalidateQueries({ queryKey: ["public-units"] });
            qc.invalidateQueries({ queryKey: ["activities"] });
            toast.success("Unit permanently deleted");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to delete unit. Please try again.")
            );
        },
    });
};
