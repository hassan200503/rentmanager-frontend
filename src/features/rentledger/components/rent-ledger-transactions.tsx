import { useRentLedgerTransactionsQuery } from "../hooks/use-rent-ledger-transactions-query";
import { RentTransactionType } from "../types/rent-ledger-response";

interface RentLedgerTransactionsProps {
    entryId: string;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount);

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-KE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const TYPE_LABELS: Record<RentTransactionType, string> = {
    RENT_CHARGE: "Rent Charge",
    PAYMENT: "Payment",
    WAIVER: "Waiver",
    REFUND: "Refund",
    CREDIT_APPLIED: "Credit Applied",
    ADJUSTMENT: "Adjustment",
    DEPOSIT: "Deposit",
};

const amountColorClass = (type: RentTransactionType) => {
    if (type === "RENT_CHARGE") return "text-danger-dark dark:text-danger";
    if (type === "ADJUSTMENT") return "text-fg dark:text-fg-dark";
    return "text-success-dark dark:text-success";
};

const amountSign = (type: RentTransactionType) => {
    if (type === "RENT_CHARGE") return "+";
    if (type === "ADJUSTMENT") return "";
    return "\u2212";
};

export const RentLedgerTransactions = ({ entryId }: RentLedgerTransactionsProps) => {
    const { data: transactions, isLoading, isError } = useRentLedgerTransactionsQuery(entryId);

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[0, 1].map((i) => (
                    <div key={i} className="skeleton h-14 w-full" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="card-sm text-sm text-danger">
                Failed to load transactions for this entry.
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="card-sm text-sm text-fg-muted dark:text-fg-muted-dark">
                No transactions recorded yet.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {transactions.map((tx) => (
                <div key={tx.id} className="card-sm flex items-center justify-between gap-4">
                    <div>
                        <p className="font-medium text-fg dark:text-fg-dark">{TYPE_LABELS[tx.type]}</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            {formatDateTime(tx.occurredAt)}
                            {tx.externalReference ? ` \u00b7 ${tx.externalReference}` : ""}
                        </p>
                    </div>

                    <p className={`font-mono-nums font-medium ${amountColorClass(tx.type)}`}>
                        {amountSign(tx.type)}{formatCurrency(tx.amount)}
                    </p>
                </div>
            ))}
        </div>
    );
};