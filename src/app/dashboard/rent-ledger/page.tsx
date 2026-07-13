// app/dashboard/rent-ledger/page.tsx
"use client";

import { useState } from "react";
import {
    Receipt,
    AlertTriangle,
    Clock,
    AlertCircle,
    CheckCircle2,
    MousePointerClick,
} from "lucide-react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import MetricCard, { MetricCardSkeleton } from "@/shared/components/dashboard/MetricCard";
import {useRentLedgerByStatusQuery} from "@/features/rentledger/hooks/use-rent-ledger-by-status-query";
import {RentLedgerEntryRow} from "@/features/rentledger/components/rent-ledger-entry-row";
import {RentLedgerTransactions} from "@/features/rentledger/components/rent-ledger-transactions";

function RentLedgerSkeleton() {
    return (
        <div className="page-container">
            <div className="skeleton h-8 w-48 mb-1" />
            <div className="skeleton h-4 w-72 mb-6" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
            </div>
        </div>
    );
}

// Small, positively-framed empty state for the status lists below -- an
// empty "Overdue" or "Due" list is good news, so it gets a checkmark and
// affirming copy rather than the generic "nothing found" treatment used
// for actual empty-results states elsewhere in the app.
function SectionEmpty({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 py-6 justify-center text-center">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" strokeWidth={2} />
            <p className="text-sm text-ink-muted">{message}</p>
        </div>
    );
}

export default function RentLedgerOverviewPage() {
    const { user, isLoading: isUserLoading } = useCurrentUser();

    if (isUserLoading) return <RentLedgerSkeleton />;
    if (!user?.tenantId) return <RentLedgerSkeleton />;

    return <RentLedgerOverviewContent />;
}

function RentLedgerOverviewContent() {
    const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

    const overdue = useRentLedgerByStatusQuery("OVERDUE");
    const due = useRentLedgerByStatusQuery("DUE");
    const partiallyPaid = useRentLedgerByStatusQuery("PARTIALLY_PAID");
    const overpaid = useRentLedgerByStatusQuery("OVERPAID");

    const isLoading = overdue.isLoading || due.isLoading || partiallyPaid.isLoading || overpaid.isLoading;
    const isError = overdue.isError || due.isError || partiallyPaid.isError || overpaid.isError;

    if (isLoading) return <RentLedgerSkeleton />;

    if (isError) {
        return (
            <div className="page-container">
                <div className="card border-danger/20 bg-danger/[0.03] text-center py-10">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                        <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-danger-dark mb-1">Couldn&#39;t load the rent ledger</p>
                    <p className="text-xs text-ink-muted mb-4">Please refresh the page. If this keeps happening, contact support.</p>
                    <button onClick={() => window.location.reload()} className="btn-outline mx-auto">
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    const overdueEntries = overdue.data ?? [];
    const dueEntries = due.data ?? [];
    const partiallyPaidEntries = partiallyPaid.data ?? [];
    const overpaidEntries = overpaid.data ?? [];
    const needsAttention = [...partiallyPaidEntries, ...overpaidEntries];

    return (
        <div className="page-container space-y-6">
            <div className="flex items-start gap-3 animate-fade-in-up">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                    <Receipt className="h-5 w-5 text-primary-dark" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="page-title">Rent Ledger</h1>
                    <p className="page-subtitle">Collection status and overdue balances across your portfolio.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard icon={AlertTriangle} label="Overdue" value={overdueEntries.length} tone="danger" />
                <MetricCard icon={Clock} label="Due" value={dueEntries.length} />
                <MetricCard icon={AlertCircle} label="Partially paid" value={partiallyPaidEntries.length} tone="warning" />
                <MetricCard icon={AlertCircle} label="Overpaid" value={overpaidEntries.length} tone="warning" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="space-y-4">
                    <div className="card animate-fade-in-up">
                        <h2 className="section-header inline-flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={2} />
                            Overdue
                        </h2>
                        {overdueEntries.length === 0 ? (
                            <SectionEmpty message="Nothing overdue right now." />
                        ) : (
                            <div className="space-y-2">
                                {overdueEntries.map((entry) => (
                                    <RentLedgerEntryRow key={entry.id} entry={entry} onSelect={setSelectedEntryId} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card animate-fade-in-up">
                        <h2 className="section-header inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                            Due
                        </h2>
                        {dueEntries.length === 0 ? (
                            <SectionEmpty message="Nothing due right now." />
                        ) : (
                            <div className="space-y-2">
                                {dueEntries.map((entry) => (
                                    <RentLedgerEntryRow key={entry.id} entry={entry} onSelect={setSelectedEntryId} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card animate-fade-in-up">
                        <h2 className="section-header inline-flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-warning-dark" strokeWidth={2} />
                            Needs attention
                        </h2>
                        {needsAttention.length === 0 ? (
                            <SectionEmpty message="Nothing pending review." />
                        ) : (
                            <div className="space-y-2">
                                {needsAttention.map((entry) => (
                                    <RentLedgerEntryRow key={entry.id} entry={entry} onSelect={setSelectedEntryId} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Sticky on large screens so the transactions panel stays in
                    view while scrolling the (often longer) status lists on
                    the left -- pure layout, doesn't affect selectedEntryId
                    or which entry is shown. */}
                <section className="lg:sticky lg:top-6 lg:self-start">
                    <h2 className="section-header inline-flex items-center gap-1.5">
                        <Receipt className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                        Transactions
                    </h2>
                    {selectedEntryId ? (
                        <RentLedgerTransactions entryId={selectedEntryId} />
                    ) : (
                        <div className="card-sm flex flex-col items-center justify-center gap-2 py-10 text-center">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.05]">
                                <MousePointerClick className="h-4 w-4 text-ink-muted" strokeWidth={2} />
                            </div>
                            <p className="text-sm text-ink-muted">
                                Select a ledger entry to view its transactions.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}