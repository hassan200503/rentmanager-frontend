import { useUpdateUnitMutation } from "../queries/use-update-unit-mutation";
import { UpdateUnitRequest } from "../types/unit-request";

export const useUpdateUnit = () => {
    const mutation = useUpdateUnitMutation();

    const updateUnit = async (id: string, payload: UpdateUnitRequest) => {
        return mutation.mutateAsync({ id, payload });
    };

    return {
        updateUnit,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
};
