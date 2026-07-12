// src/app/dashboard/leases/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, SlidersHorizontal, AlertTriangle, ChevronRight } from "lucide-react";
import { useLeaseSearch } from "@/features/lease/hooks/use-lease-search";
import { LeaseStatusBadge } from "@/features/lease/components/lease-status-badge";
import { LeaseStatus } from "@/features/lease/types/lease-response";

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount);

const formatDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });

// Kept in sync with LeaseStatusDTO.java (backend). Last aligned: 10-value enum
// (DRAFT, PENDING_APPROVAL, AWAITING_DEPOSIT, PENDING_ACTIVATION, ACTIVE,
// RENEWED, EXPIRED, CANCELLED, TERMINATED, SUSPENDED) after the Section 3.1
// enum-drift fix. If LeaseStatusDTO changes again, update this list too —
// there is no compile-time link between the two.
const STATUS_FILTER_OPTIONS: { label: string; value: LeaseStatus | "" }[] = [
    { label: "All statuses", value: "" },
    { label: "Draft", value: "DRAFT" },
    { label: "Pending Approval", value: "PENDING_APPROVAL" },
    { label: "Awaiting Deposit", value: "AWAITING_DEPOSIT" },
    { label: "Pending Activation", value: "PENDING_ACTIVATION" },
    { label: "Active", value: "ACTIVE" },
    { label: "Renewed", value: "RENEWED" },
    { label: "Expired", value: "EXPIRED" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Terminated", value: "TERMINATED" },
    { label: "Suspended", value: "SUSPENDED" },
];

export default function LeasesPage() {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState<LeaseStatus | "">("");

    const { data, isLoading, isError } = useLeaseSearch({
        status: statusFilter || undefined,
        page: 0,
        size: 20,
    });

    const leases = data?.content ?? [];

    return (
        <div className="page-container space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in-up">
                <div className="flex items-start gap-3">
                    <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                        <FileText className="h-5 w-5 text-primary-dark" strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="page-title mb-1">Leases</h1>
                        <p className="page-subtitle mb-0">Manage lease agreements across your portfolio</p>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/dashboard/leases/create")}
                    className="btn-primary inline-flex items-center gap-1.5"
                >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                    New lease
                </button>
            </div>

            {/* Filters */}
            <div className="card-sm animate-fade-in-up">
                <div className="flex items-center gap-1.5 mb-3 text-xs font-medium text-ink-muted">
                    <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2} />
                    Filters
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as LeaseStatus | "")}
                    className="form-input max-w-xs"
                >
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {/* Results */}
            <div className="card animate-fade-in-up">
                {isLoading ? (
                    <div className="space-y-2">
                        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
                    </div>
                ) : isError ? (
                    <div className="text-center py-12">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10">
                            <AlertTriangle className="h-5 w-5 text-danger" strokeWidth={2} />
                        </div>
                        <p className="text-sm font-medium text-danger-dark mb-1">Couldn&#39;t load leases</p>
                        <p className="text-xs text-ink-muted">Please refresh the page. If this keeps happening, contact support.</p>
                    </div>
                ) : leases.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05]">
                            <FileText className="h-5 w-5 text-ink-muted" strokeWidth={2} />
                        </div>
                        <p className="text-sm font-medium text-ink mb-1">No leases found</p>
                        <p className="text-xs text-ink-muted mb-4">
                            {statusFilter
                                ? "Try a different status filter, or create a new lease."
                                : "Create your first lease to start tracking terms and rent."}
                        </p>
                        <button
                            onClick={() => router.push("/dashboard/leases/create")}
                            className="btn-primary inline-flex items-center gap-1.5 w-fit mx-auto"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            New lease
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-2">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="text-left text-ink-muted border-b border-ink/10">
                                <th className="py-2 px-2 font-medium">Lease #</th>
                                <th className="py-2 px-2 font-medium">Term</th>
                                <th className="py-2 px-2 font-medium">Rent</th>
                                <th className="py-2 px-2 font-medium">Status</th>
                                <th className="py-2 px-2 font-medium w-8" />
                            </tr>
                            </thead>
                            <tbody>
                            {leases.map((lease) => (
                                <tr
                                    key={lease.id}
                                    onClick={() => router.push(`/dashboard/leases/${lease.id}`)}
                                    className="border-b border-ink/[0.06] last:border-0 hover:bg-ink/[0.02] transition-colors cursor-pointer group"
                                >
                                    <td className="py-3 px-2 font-medium text-ink">{lease.leaseNumber}</td>
                                    <td className="py-3 px-2 text-ink-muted">
                                        {formatDate(lease.startDate)} – {formatDate(lease.endDate)}
                                    </td>
                                    <td className="py-3 px-2 font-data text-ink-muted">{formatCurrency(lease.rentAmount)}</td>
                                    <td className="py-3 px-2"><LeaseStatusBadge status={lease.status} /></td>
                                    <td className="py-3 px-2">
                                        <ChevronRight
                                            className="h-3.5 w-3.5 text-ink-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                            strokeWidth={2}
                                        />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}