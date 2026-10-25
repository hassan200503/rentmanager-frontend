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
import { useRentLedgerByStatusQuery } from "@/features/rentledger/hooks/use-rent-ledger-by-status-query";
import { useRentLedgerSummaryQuery } from "@/features/rentledger/hooks/use-rent-ledger-summary";
import { RentLedgerEntryRow } from "@/features/rentledger/components/rent-ledger-entry-row";
import { RentLedgerTransactions } from "@/features/rentledger/components/rent-ledger-transactions";
import { TaxComplianceNote } from "@/features/settings/components/tax-compliance-note";
import { formatCurrency } from "@/shared/utils/money";

function RentLedgerSkeleton() {
    return (
        <div className="page-container space-y-6">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-4 w-72" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
            </div>
        </div>
    );
}

function SectionEmpty({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 py-6 justify-center text-center">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" strokeWidth={2} />
            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">{message}</p>
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
    const summary = useRentLedgerSummaryQuery();

    const isLoading = overdue.isLoading || due.isLoading || partiallyPaid.isLoading || overpaid.isLoading;
    const isError = overdue.isError || due.isError || partiallyPaid.isError || overpaid.isError;

    if (isLoading) return <RentLedgerSkeleton />;

    if (isError) {
        return (
            <div className="page-container">
                <div className="card text-center py-10 max-w-xl mx-auto">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg dark:bg-danger-bg-dark">
                        <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                    </div>
                    <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&#39;t load the rent ledger</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">Please refresh the page. If this keeps happening, contact support.</p>
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
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-800">
                    <Receipt className="h-5 w-5 text-brand dark:text-brand-300" strokeWidth={2} />
                </div>
                <div>
                    <h1 className="page-title">Rent Ledger</h1>
                    <p className="page-subtitle">Collection status and overdue balances across your portfolio.</p>
                    <TaxComplianceNote />
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={AlertTriangle}
                    label="Overdue"
                    value={overdueEntries.length}
                    hint={summary.data?.overdueTotal ? formatCurrency(summary.data.overdueTotal) + " outstanding" : undefined}
                    tone={overdueEntries.length > 0 ? "danger" : "neutral"}
                />
                <MetricCard icon={Clock} label="Due now" value={dueEntries.length} tone="neutral" />
                <MetricCard
                    icon={AlertCircle}
                    label="Needs attention"
                    value={needsAttention.length}
                    tone={needsAttention.length > 0 ? "warning" : "neutral"}
                />
                <MetricCard
                    icon={CheckCircle2}
                    label="Collected this month"
                    value={summary.data?.collectedThisMonth ? formatCurrency(summary.data.collectedThisMonth) : "—"}
                    hint={summary.data?.currency}
                    tone="success"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                <div className="xl:col-span-3 space-y-4">
                    <div className="card !p-0 animate-fade-in-up">
                        <div className="px-4 py-3 border-b border-border dark:border-border-dark">
                            <h2 className="text-sm font-semibold text-fg dark:text-fg-dark inline-flex items-center gap-1.5">
                                <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={2} />
                                Overdue
                            </h2>
                        </div>
                        {overdueEntries.length === 0 ? (
                            <div className="px-4">
                                <SectionEmpty message="Nothing overdue right now — all collections are on track." />
                            </div>
                        ) : (
                            <div className="divide-y divide-border dark:divide-border-dark">
                                {overdueEntries.map((entry) => (
                                    <RentLedgerEntryRow key={entry.id} entry={entry} onSelect={setSelectedEntryId} selected={selectedEntryId === entry.id} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card !p-0 animate-fade-in-up">
                        <div className="px-4 py-3 border-b border-border dark:border-border-dark">
                            <h2 className="text-sm font-semibold text-fg dark:text-fg-dark inline-flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                                Due
                            </h2>
                        </div>
                        {dueEntries.length === 0 ? (
                            <div className="px-4">
                                <SectionEmpty message="Nothing due right now." />
                            </div>
                        ) : (
                            <div className="divide-y divide-border dark:divide-border-dark">
                                {dueEntries.map((entry) => (
                                    <RentLedgerEntryRow key={entry.id} entry={entry} onSelect={setSelectedEntryId} selected={selectedEntryId === entry.id} />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card !p-0 animate-fade-in-up">
                        <div className="px-4 py-3 border-b border-border dark:border-border-dark">
                            <h2 className="text-sm font-semibold text-fg dark:text-fg-dark inline-flex items-center gap-1.5">
                                <AlertCircle className="h-4 w-4 text-warning-dark dark:text-warning" strokeWidth={2} />
                                Needs attention
                            </h2>
                        </div>
                        {needsAttention.length === 0 ? (
                            <div className="px-4">
                                <SectionEmpty message="Nothing pending review." />
                            </div>
                        ) : (
                            <div className="divide-y divide-border dark:divide-border-dark">
                                {needsAttention.map((entry) => (
                                    <RentLedgerEntryRow key={entry.id} entry={entry} onSelect={setSelectedEntryId} selected={selectedEntryId === entry.id} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="xl:col-span-2 xl:sticky xl:top-6 xl:self-start">
                    <div className="card !p-0 animate-fade-in-up">
                        <div className="px-4 py-3 border-b border-border dark:border-border-dark">
                            <h2 className="text-sm font-semibold text-fg dark:text-fg-dark inline-flex items-center gap-1.5">
                                <Receipt className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                                {selectedEntryId ? "Entry transactions" : "Transactions"}
                            </h2>
                        </div>
                        <div className="p-4">
                            {selectedEntryId ? (
                                <RentLedgerTransactions entryId={selectedEntryId} />
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
                                        <MousePointerClick className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                                    </div>
                                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                                        Select a ledger entry to view its transactions.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}