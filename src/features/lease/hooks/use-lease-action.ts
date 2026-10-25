// hooks/use-lease-action.ts
import { useLeaseActionMutation } from "../queries/use-lease-action-mutation";
import { LeaseActionRequest } from "../types/lease-request";

export const useLeaseAction = () => {
    const mutation = useLeaseActionMutation();
    const performAction = async (id: string, payload: LeaseActionRequest) => mutation.mutateAsync({ id, payload });
    return { performAction, isLoading: mutation.isPending, error: mutation.error };
};