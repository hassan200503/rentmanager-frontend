import { useCreatePropertyMutation } from "../queries/use-create-property-mutation";
import { CreatePropertyRequest } from "../types/property-request";

export const useCreateProperty = () => {
    const mutation = useCreatePropertyMutation();

    const createProperty = async (payload: CreatePropertyRequest) => {
        return mutation.mutateAsync(payload);
    };

    return {
        createProperty,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
};