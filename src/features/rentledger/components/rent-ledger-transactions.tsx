import { useRentLedgerTransactionsQuery } from "../hooks/use-rent-ledger-transactions-query";
import { RentTransactionType } from "../types/rent-ledger-response";
import { formatCurrencyPrecise } from "@/shared/utils/money";

interface RentLedgerTransactionsProps {
    entryId: string;
}

const formatCurrency = formatCurrencyPrecise;

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
    REVERSAL: "Reversal",
};

// A REVERSAL voids an earlier transaction and moves the balance the exact
// opposite way to whatever it reversed — reversing a PAYMENT increases what
// is owed, reversing a REFUND decreases it. The response carries no
// reversesTransactionId, so the direction genuinely cannot be derived from
// this row. It is therefore rendered neutral, like ADJUSTMENT, rather than
// guessing a colour and a sign that would be wrong half the time.
const amountColorClass = (type: RentTransactionType) => {
    if (type === "RENT_CHARGE") return "text-danger-dark dark:text-danger";
    if (type === "ADJUSTMENT" || type === "REVERSAL") return "text-fg dark:text-fg-dark";
    return "text-success-dark dark:text-success";
};

const amountSign = (type: RentTransactionType) => {
    if (type === "RENT_CHARGE") return "+";
    if (type === "ADJUSTMENT" || type === "REVERSAL") return "";
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