import { useCreateUnitMutation } from "../queries/use-create-unit-mutation";
import { CreateUnitRequest } from "../types/unit-request";

export const useCreateUnit = () => {
    const mutation = useCreateUnitMutation();

    const createUnit = async (payload: CreateUnitRequest) => {
        return mutation.mutateAsync(payload);
    };

    return {
        createUnit,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
};
