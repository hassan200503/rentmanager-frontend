import { useArchivePropertyMutation } from "../queries/use-archive-property-mutation";

export const useArchiveProperty = () => {
    const mutation = useArchivePropertyMutation();

    const archiveProperty = async (id: string) => {
        return mutation.mutateAsync(id);
    };

    return {
        archiveProperty,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
};