// components/rent-ledger-transactions.tsx
import { useRentLedgerTransactionsQuery } from "../hooks/use-rent-ledger-transactions-query";
import { RentTransactionType } from "../types/rent-ledger-response";

interface RentLedgerTransactionsProps {
    entryId: string;
}

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount);

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("en-KE", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

// ASSUMPTION FLAGGED: charges increase the balance owed, everything else
// reduces or corrects it (RentTransactionType.java's own doc comments confirm
// this for every type except ADJUSTMENT, which can go either way -- amount is
// always stored positive per that file, so ADJUSTMENT's sign can't be inferred
// from the DTO alone.  Displaying it neutrally (ink, no +/-) rather than
// guessing a direction that might be wrong.
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
    if (type === "RENT_CHARGE") return "text-danger-dark";
    if (type === "ADJUSTMENT") return "text-ink";
    return "text-success-dark";
};

const amountSign = (type: RentTransactionType) => {
    if (type === "RENT_CHARGE") return "+";
    if (type === "ADJUSTMENT") return "";
    return "−";
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
            <div className="card-sm text-sm text-ink-muted">
                No transactions recorded yet.
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {transactions.map((tx) => (
                <div key={tx.id} className="card-sm flex items-center justify-between gap-4">
                    <div>
                        <p className="font-medium text-ink">{TYPE_LABELS[tx.type]}</p>
                        <p className="text-xs text-ink-muted">
                            {formatDateTime(tx.occurredAt)}
                            {tx.externalReference ? ` · ${tx.externalReference}` : ""}
                        </p>
                    </div>

                    <p className={`font-data font-medium ${amountColorClass(tx.type)}`}>
                        {amountSign(tx.type)}{formatCurrency(tx.amount)}
                    </p>
                </div>
            ))}
        </div>
    );
};