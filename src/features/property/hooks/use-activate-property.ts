import { useActivatePropertyMutation } from "../queries/use-activate-property-mutation";

export const useActivateProperty = () => {
    const mutation = useActivatePropertyMutation();

    const activateProperty = async (id: string) => {
        return mutation.mutateAsync(id);
    };

    return {
        activateProperty,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
};
