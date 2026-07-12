import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaseApi } from "../api/lease-api";
import { leaseKeys } from "../hooks/lease-keys";
import { CreateLeaseRequest } from "../types/lease-request";
import { toast } from "sonner";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export const useCreateLeaseMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        retry: false,
        mutationFn: (payload: CreateLeaseRequest) => leaseApi.create(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: leaseKeys.all });
            toast.success("Lease created successfully");
        },
        onError: (error) => {
            toast.error(getProcessErrorMessage(error, "Failed to create lease. Please try again."));
        },
    });
};