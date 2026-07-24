import { useDeletePropertyMutation } from "../queries/use-delete-property-mutation";

export const useDeleteProperty = () => {
    const mutation = useDeletePropertyMutation();

    const deleteProperty = async (id: string) => {
        return mutation.mutateAsync(id);
    };

    return {
        deleteProperty,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
};
