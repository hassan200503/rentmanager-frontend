import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { renterApi } from "../api/renter-api";
import type { AddRenterRequest } from "../types/renter";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export const renterKeys = {
    all: ["renters"] as const,
    list: (page: number, size: number) => ["renters", "list", page, size] as const,
};

/** One landlord's renters. Used by the Renters page and the lease picker. */
export const useRentersQuery = (page = 0, size = 100) =>
    useQuery({
        queryKey: renterKeys.list(page, size),
        queryFn: () => renterApi.list(page, size),
        staleTime: 60 * 1000,
    });

export const useAddRenterMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: AddRenterRequest) => renterApi.add(payload),
        onSuccess: (renter) => {
            // The list feeds the lease form's picker too, so both refresh.
            void qc.invalidateQueries({ queryKey: renterKeys.all });
            toast.success(`${renter.fullName} saved`);
        },
        onError: (error) => {
            toast.error(getProcessErrorMessage(error, "Couldn't save this renter. Please try again."));
        },
    });
};
