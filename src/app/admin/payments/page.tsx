// app/admin/payments/page.tsx
//
// The rent payment queue behind the admin overview's alert panel.
//
// That panel has always shown "N failed payments" and "N payments pending"
// and linked both to /admin/payments — a route that did not exist. An admin
// who saw a problem and clicked it, at the moment they most needed to act,
// got a 404. The counters were real; the destination was not.
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Search,
    XCircle,
} from "lucide-react";
import { adminApi } from "@/features/admin/api/admin-api";
import type {
    PaymentRequestItem,
    RentPaymentRequestStatus,
} from "@/features/admin/types/admin-types";
import { formatCurrency } from "@/features/admin/components/admin-ui";

const STATUS_TABS: Array<{ label: string; value: RentPaymentRequestStatus | "ALL" }> = [
    { label: "All", value: "ALL" },
    { label: "Failed", value: "FAILED" },
    { label: "Pending", value: "PENDING" },
    { label: "Paid", value: "PAID" },
];

const STATUS_META: Record<
    RentPaymentRequestStatus,
    { icon: typeof CheckCircle2; className: string; label: string }
> = {
    PAID: { icon: CheckCircle2, className: "badge-emerald", label: "Paid" },
    PENDING: { icon: Clock, className: "badge-warning", label: "Pending" },
    FAILED: { icon: XCircle, className: "badge-danger", label: "Failed" },
};

function StatusBadge({ status }: { status: RentPaymentRequestStatus }) {
    const meta = STATUS_META[status];
    const Icon = meta.icon;
    return (
        <span className={`badge ${meta.className} inline-flex items-center gap-1 !text-[11px]`}>
            <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
            {meta.label}
        </span>
    );
}

function formatWhen(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? "—"
        : d.toLocaleString("en-KE", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
          });
}

export default function AdminPaymentsPage() {
    // Defaults to FAILED: the alert panel links here precisely when payments
    // have failed, so landing on the full list would bury what was clicked.
    const [status, setStatus] = useState<RentPaymentRequestStatus | "ALL">("FAILED");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);

    const query = useQuery({
        queryKey: ["admin", "payment-requests", status, page],
        queryFn: () =>
            adminApi.getPaymentRequests({
                status: status === "ALL" ? undefined : status,
                page,
                size: 25,
            }),
        staleTime: 30_000,
    });

    const rows: PaymentRequestItem[] = useMemo(() => {
        const content = query.data?.content ?? [];
        const term = search.trim().toLowerCase();
        if (!term) return content;
        // Client-side only, over the current page. The backend filters by
        // status and landlord; this is a convenience for scanning one page,
        // and the empty state says so rather than implying a full search.
        return content.filter(
            (r) =>
                r.phoneNumber?.toLowerCase().includes(term) ||
                r.mpesaReceiptNumber?.toLowerCase().includes(term) ||
                r.mpesaCheckoutRequestId?.toLowerCase().includes(term) ||
                r.id.toLowerCase().includes(term)
        );
    }, [query.data, search]);

    const totalPages = query.data?.totalPages ?? 0;

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg dark:text-fg-muted-dark dark:hover:text-fg-dark"
                >
                    <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
                    Overview
                </Link>
                <h1 className="mt-2 text-xl font-semibold text-fg dark:text-fg-dark">
                    Rent payments
                </h1>
                <p className="mt-1 text-sm text-fg-muted dark:text-fg-muted-dark">
                    Every M-Pesa rent payment request across the platform.
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => {
                                setStatus(tab.value);
                                setPage(0);
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                status === tab.value
                                    ? "bg-brand text-white"
                                    : "border border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <Search
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle dark:text-fg-subtle-dark"
                        strokeWidth={2}
                        aria-hidden="true"
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter this page by phone or receipt…"
                        aria-label="Filter the current page"
                        className="w-full sm:w-72 rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 pl-9 text-sm text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark focus:outline-none focus:ring-2 focus:ring-brand/30"
                    />
                </div>
            </div>

            <div className="card-elevated overflow-hidden !p-0">
                {query.isLoading && (
                    <div className="space-y-2 p-4" aria-busy="true">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="skeleton h-11 w-full rounded-lg" />
                        ))}
                    </div>
                )}

                {query.isError && (
                    <div className="flex items-start gap-3 p-6">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2} />
                        <div>
                            <p className="text-sm font-medium text-fg dark:text-fg-dark">
                                Could not load payments
                            </p>
                            <button
                                type="button"
                                onClick={() => void query.refetch()}
                                className="btn-secondary mt-3 !text-xs !py-1.5 !px-3"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                )}

                {query.isSuccess && rows.length === 0 && (
                    <div className="p-10 text-center">
                        <p className="text-sm font-medium text-fg dark:text-fg-dark">
                            {search
                                ? "Nothing on this page matches that"
                                : status === "FAILED"
                                  ? "No failed payments"
                                  : "No payments here"}
                        </p>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-fg-muted dark:text-fg-muted-dark">
                            {search
                                ? "The filter only searches the page you are on — try a different status tab or clear it."
                                : status === "FAILED"
                                  ? "Every rent payment attempt has settled or is still in flight."
                                  : "Nothing matches this status yet."}
                        </p>
                    </div>
                )}

                {query.isSuccess && rows.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[52rem] text-sm">
                            <thead>
                                <tr className="border-b border-border dark:border-border-dark text-left">
                                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">When</th>
                                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">Amount</th>
                                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">Status</th>
                                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">Phone</th>
                                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">Receipt</th>
                                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">Why it failed</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border dark:divide-border-dark">
                                {rows.map((r) => (
                                    <tr key={r.id} className="hover:bg-border-subtle/40 dark:hover:bg-border-subtle-dark/30">
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-fg-muted dark:text-fg-muted-dark">
                                            {formatWhen(r.createdAt)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 font-mono-nums font-medium text-fg dark:text-fg-dark">
                                            {formatCurrency(r.amount)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={r.status} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 font-mono-nums text-xs text-fg-muted dark:text-fg-muted-dark">
                                            {r.phoneNumber ?? "—"}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 font-mono-nums text-xs text-fg-muted dark:text-fg-muted-dark">
                                            {r.mpesaReceiptNumber ?? "—"}
                                        </td>
                                        <td className="max-w-xs px-4 py-3 text-xs text-fg-muted dark:text-fg-muted-dark">
                                            {r.failureReason ?? "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                        Page {page + 1} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                            className="btn-secondary !text-xs !py-1.5 !px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page + 1 >= totalPages}
                            className="btn-secondary !text-xs !py-1.5 !px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
