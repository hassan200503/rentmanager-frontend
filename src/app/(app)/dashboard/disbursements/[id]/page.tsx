"use client";

import { useParams, useRouter } from "next/navigation";
import {
    Send,
    RefreshCw,
    AlertTriangle,
    ChevronLeft,
    CheckCircle2,
    Clock,
    XCircle,
    ExternalLink,
    CalendarDays,
    Phone,
    User,
    FileText,
    Hash,
    Banknote,
} from "lucide-react";
import { useDisbursementQuery } from "@/features/disbursement/hooks/use-disbursement-queries";
import type { DisbursementStatus } from "@/features/disbursement/types/disbursement-types";
import { formatCurrency } from "@/shared/utils/money";

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" });
};

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
};

const statusMeta: Record<DisbursementStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
    INITIATED: { label: "Initiated", icon: Clock, color: "text-info-dark", bg: "bg-info/10" },
    PENDING: { label: "Pending", icon: Clock, color: "text-warning-dark", bg: "bg-warning/10" },
    SUCCESS: { label: "Completed", icon: CheckCircle2, color: "text-success-dark", bg: "bg-success/10" },
    FAILED: { label: "Failed", icon: XCircle, color: "text-danger-dark", bg: "bg-danger/10" },
};

function DetailRow({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border/50 dark:border-border-dark/50 last:border-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-border-subtle dark:bg-border-subtle-dark">
                <Icon className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">{label}</p>
                <p className="text-sm font-medium text-fg dark:text-fg-dark break-all">{value}</p>
            </div>
        </div>
    );
}

export default function DisbursementDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { data: d, isLoading, isError, error, refetch } = useDisbursementQuery(id);

    return (
        <div className="page-container space-y-6 pb-12">
            {/* Back button */}
            <button
                onClick={() => router.push("/dashboard/disbursements")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors"
            >
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
                Back to Disbursements
            </button>

            {/* Loading */}
            {isLoading && (
                <div className="space-y-4">
                    <div className="skeleton h-8 w-64 rounded-xl" />
                    <div className="skeleton h-4 w-96" />
                    <div className="skeleton h-64 w-full rounded-2xl mt-6" />
                </div>
            )}

            {/* Error */}
            {isError && (
                <div className="max-w-md mx-auto mt-12 bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-sm p-10 text-center animate-fade-in-up">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-danger/20 to-danger/10 shadow-sm ring-1 ring-danger/20">
                        <AlertTriangle className="h-8 w-8 text-danger" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg font-semibold text-fg dark:text-fg-dark mb-1">Couldn&apos;t load disbursement</p>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-6 max-w-xs mx-auto">{error?.message || "Something went wrong."}</p>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-brand to-brand-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <RefreshCw className="w-4 h-4" strokeWidth={2} />
                        Try again
                    </button>
                </div>
            )}

            {/* Detail content */}
            {!isLoading && !isError && d && (
                <div className="animate-fade-in-up space-y-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-600 shadow-lg shadow-brand/20 ring-1 ring-white/20">
                                <Send className="h-7 w-7 text-white" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-fg dark:text-fg-dark tracking-tight font-display">
                                    Disbursement Details
                                </h1>
                                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                                    {formatDate(d.createdAt)} at {formatTime(d.createdAt)}
                                </p>
                            </div>
                        </div>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border ${statusMeta[d.status].bg} ${statusMeta[d.status].color}`}>
                            {(() => {
                                const Icon = statusMeta[d.status].icon;
                                return <Icon className="h-4 w-4" strokeWidth={2} />;
                            })()}
                            {statusMeta[d.status].label}
                        </div>
                    </div>

                    {/* Detail card */}
                    <div className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-border dark:border-border-dark">
                            <h2 className="text-sm font-semibold text-fg dark:text-fg-dark">Disbursement Information</h2>
                        </div>
                        <div className="px-6 py-2">
                            <DetailRow icon={Hash} label="Disbursement ID" value={d.id} />
                            <DetailRow icon={FileText} label="Lease ID" value={d.leaseId} />
                            {d.ledgerEntryId && (
                                <DetailRow icon={FileText} label="Ledger Entry ID" value={d.ledgerEntryId} />
                            )}
                            <DetailRow icon={Banknote} label="Amount" value={formatCurrency(d.amount)} />
                            <DetailRow icon={User} label="Recipient Name" value={d.recipientName} />
                            <DetailRow icon={Phone} label="Recipient Phone" value={d.recipientPhone} />
                            <DetailRow icon={CalendarDays} label="Created At" value={`${formatDate(d.createdAt)} at ${formatTime(d.createdAt)}`} />
                            {d.mpesaTransactionId && (
                                <DetailRow icon={ExternalLink} label="M-Pesa Transaction ID" value={d.mpesaTransactionId} />
                            )}
                            {d.failureReason && (
                                <DetailRow icon={AlertTriangle} label="Failure Reason" value={d.failureReason} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
