// hooks/use-create-lease.ts
import { useCreateLeaseMutation } from "../queries/use-create-lease-mutation";
import { CreateLeaseRequest } from "../types/lease-request";

export const useCreateLease = () => {
    const mutation = useCreateLeaseMutation();
    const createLease = async (payload: CreateLeaseRequest) => mutation.mutateAsync(payload);
    return { createLease, isLoading: mutation.isPending, error: mutation.error };
};