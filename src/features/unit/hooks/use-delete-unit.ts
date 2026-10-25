import { useDeleteUnitMutation } from "../queries/use-delete-unit-mutation";

export const useDeleteUnit = () => {
    const mutation = useDeleteUnitMutation();

    const deleteUnit = async (id: string) => {
        return mutation.mutateAsync(id);
    };

    return {
        deleteUnit,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
};
