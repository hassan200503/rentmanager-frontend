import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tenantApi } from "../api/tenant-api";
import { tenantKeys } from "./tenant-keys";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";
import { SuspendTenantRequest } from "../types/tenant-types";

export const useSuspendTenantMutation = (tenantId: string) => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: (payload: SuspendTenantRequest) => tenantApi.suspend(tenantId, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: tenantKeys.detail(tenantId) });
            qc.invalidateQueries({ queryKey: tenantKeys.all });
            toast.success("Tenant suspended");
        },
        onError: (error) => {
            toast.error(getProcessErrorMessage(error, "Failed to suspend tenant. Please try again."));
        },
    });
};