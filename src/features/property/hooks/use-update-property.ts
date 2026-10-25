import { useUpdatePropertyMutation } from "../queries/use-update-property-mutation";
import { UpdatePropertyRequest } from "../types/property-request";

export const useUpdateProperty = () => {
    const mutation = useUpdatePropertyMutation();

    const updateProperty = async (id: string, payload: UpdatePropertyRequest) => {
        return mutation.mutateAsync({ id, payload });
    };

    return {
        updateProperty,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
};