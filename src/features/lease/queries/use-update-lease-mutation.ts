import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaseApi } from "../api/lease-api";
import { leaseKeys } from "../hooks/lease-keys";
import { UpdateLeaseRequest } from "../types/lease-request";
import { toast } from "sonner";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

type UpdateLeaseVariables = { id: string; payload: UpdateLeaseRequest };

export const useUpdateLeaseMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        retry: false,
        mutationFn: ({ id, payload }: UpdateLeaseVariables) => leaseApi.update(id, payload),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: leaseKeys.detail(vars.id) });
            qc.invalidateQueries({ queryKey: leaseKeys.all });
            toast.success("Lease updated successfully");
        },
        onError: (error) => {
            toast.error(getProcessErrorMessage(error, "Failed to update lease. Please try again."));
        },
    });
};