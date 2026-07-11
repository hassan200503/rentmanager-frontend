// app/dashboard/rent-ledger/page.tsx
"use client";

import { useState } from "react";
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
                <div className="card border-danger/20 bg-danger/[0.03] text-center">
                    <p className="text-sm font-medium text-danger-dark mb-1">Couldn&#39;t load the rent ledger</p>
                    <p className="text-xs text-ink-muted">Please refresh the page. If this keeps happening, contact support.</p>
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
            <div>
                <h1 className="page-title">Rent Ledger</h1>
                <p className="page-subtitle">Collection status and overdue balances across your portfolio.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Overdue" value={overdueEntries.length} tone="danger" />
                <MetricCard label="Due" value={dueEntries.length} />
                <MetricCard label="Partially paid" value={partiallyPaidEntries.length} tone="warning" />
                <MetricCard label="Overpaid" value={overpaidEntries.length} tone="warning" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="space-y-4">
                    <div className="card animate-fade-in-up">
                        <h2 className="section-header">Overdue</h2>
                        {overdueEntries.length === 0 ? (
                            <p className="text-sm text-ink-muted">Nothing overdue right now.</p>
                        ) : (
                            <div className="space-y-2">
                                {overdueEntries.map((entry) => (
                                    <RentLedgerEntryRow key={entry.id} entry={entry} onSelect={setSelectedEntryId} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card animate-fade-in-up">
                        <h2 className="section-header">Needs attention</h2>
                        {needsAttention.length === 0 ? (
                            <p className="text-sm text-ink-muted">Nothing pending review.</p>
                        ) : (
                            <div className="space-y-2">
                                {needsAttention.map((entry) => (
                                    <RentLedgerEntryRow key={entry.id} entry={entry} onSelect={setSelectedEntryId} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section>
                    <h2 className="section-header">Transactions</h2>
                    {selectedEntryId ? (
                        <RentLedgerTransactions entryId={selectedEntryId} />
                    ) : (
                        <div className="card-sm text-sm text-ink-muted">
                            Select a ledger entry to view its transactions.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}