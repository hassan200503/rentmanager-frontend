// hooks/use-update-lease.ts
import { useUpdateLeaseMutation } from "../queries/use-update-lease-mutation";
import { UpdateLeaseRequest } from "../types/lease-request";

export const useUpdateLease = () => {
    const mutation = useUpdateLeaseMutation();
    const updateLease = async (id: string, payload: UpdateLeaseRequest) => mutation.mutateAsync({ id, payload });
    return { updateLease, isLoading: mutation.isPending, error: mutation.error };
};