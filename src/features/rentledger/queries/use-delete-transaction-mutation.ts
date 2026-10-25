import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rentLedgerApi } from "../api/rent-ledger-api";
import { rentLedgerKeys } from "../hooks/rent-ledger-keys";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

export const useDeleteTransactionMutation = () => {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: rentLedgerApi.remove,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: rentLedgerKeys.allTransactions });
            qc.invalidateQueries({ queryKey: rentLedgerKeys.all });
            toast.success("Transaction permanently deleted");
        },
        onError: (error) => {
            toast.error(
                getProcessErrorMessage(error, "Failed to delete transaction. Please try again.")
            );
        },
    });
};
