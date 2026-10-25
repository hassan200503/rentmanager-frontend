import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tenantApi } from "../api/tenant-api";
import { tenantKeys } from "./tenant-keys";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export const useActivateTenantMutation = (tenantId: string) => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: () => tenantApi.activate(tenantId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: tenantKeys.detail(tenantId) });
            qc.invalidateQueries({ queryKey: tenantKeys.all });
            toast.success("Tenant activated");
        },
        onError: (error) => {
            toast.error(getProcessErrorMessage(error, "Failed to activate tenant. Please try again."));
        },
    });
};