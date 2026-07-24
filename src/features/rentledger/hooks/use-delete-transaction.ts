import { useDeleteTransactionMutation } from "../queries/use-delete-transaction-mutation";

export const useDeleteTransaction = () => {
    const mutation = useDeleteTransactionMutation();

    const deleteTransaction = async (transactionId: string) => {
        return mutation.mutateAsync(transactionId);
    };

    return {
        deleteTransaction,
        isLoading: mutation.isPending,
        error: mutation.error,
    };
};
