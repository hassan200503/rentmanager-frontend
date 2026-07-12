import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaseApi } from "../api/lease-api";
import { leaseKeys } from "../hooks/lease-keys";
import { LeaseActionRequest } from "../types/lease-request";
import { toast } from "sonner";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

type LeaseActionVariables = { id: string; payload: LeaseActionRequest };

export const useLeaseActionMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        retry: false,
        mutationFn: ({ id, payload }: LeaseActionVariables) => leaseApi.action(id, payload),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: leaseKeys.detail(vars.id) });
            qc.invalidateQueries({ queryKey: leaseKeys.all });
            toast.success("Lease action completed successfully");
        },
        onError: (error) => {
            toast.error(getProcessErrorMessage(error, "Failed to perform lease action. Please try again."));
        },
    });
};