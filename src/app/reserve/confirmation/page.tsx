// app/reserve/confirmation/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Copy, AlertTriangle, Loader2, ShieldCheck, Shield, RefreshCw, Send, Smartphone } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "@/features/public-listings/api/public-endpoints";

type ReservationStatus = "PENDING_PAYMENT" | "DEPOSIT_PAID" | "FULFILLING" | "COMPLETED" | "FULFILLMENT_FAILED" | "CANCELLED";

interface ReservationDetail {
    reservationId: string;
    fullName: string;
    phone: string;
    email: string;
    depositAmount: number;
    status: ReservationStatus;
    mpesaReceiptNumber: string | null;
    moveInDate: string;
    unitNumber: string | null;
    propertyName: string | null;
}

function depositLabel(status: ReservationStatus): { title: string; description: string; icon: "held" | "released" | "refunded" | "unknown" } {
    switch (status) {
        case "DEPOSIT_PAID":
        case "FULFILLING":
            return {
                title: "Deposit held",
                description: "Your deposit is safely held in escrow. It will be released to the landlord after you move in.",
                icon: "held",
            };
        case "COMPLETED":
            return {
                title: "Deposit released",
                description: "Your deposit has been released to the landlord. Welcome to your new home!",
                icon: "released",
            };
        case "CANCELLED":
        case "FULFILLMENT_FAILED":
            return {
                title: "Deposit refunded",
                description: "Your deposit has been refunded to your M-Pesa account. If you haven't received it, contact support.",
                icon: "refunded",
            };
        default:
            return {
                title: "Deposit received",
                description: "Your payment was successful. Your deposit is being processed.",
                icon: "unknown",
            };
    }
}

export default function ReservationConfirmedPage() {
    return (
        <Suspense fallback={<main className="min-h-screen bg-canvas" />}>
            <ReservationConfirmedContent />
        </Suspense>
    );
}

function ReservationConfirmedContent() {
    const searchParams = useSearchParams();
    const reservationId = searchParams.get("reservationId");
    const [copied, setCopied] = useState(false);
    const [detail, setDetail] = useState<ReservationDetail | null>(null);
    const [loading, setLoading] = useState(!!reservationId);
    const [error, setError] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const [resent, setResent] = useState(false);
    const [resendError, setResendError] = useState<string | null>(null);

    useEffect(() => {
        if (!reservationId) return;

        let cancelled = false;

        apiClient.get<ReservationDetail>(publicEndpoints.reservationDetail(reservationId))
            .then((data) => {
                if (!cancelled) {
                    setDetail(data);
                    setLoading(false);
                }
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setError(err.message ?? "Failed to load reservation details");
                    setLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, [reservationId]);

    const handleCopy = async () => {
        if (!reservationId) return;
        try {
            await navigator.clipboard.writeText(reservationId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fails silently
        }
    };

    const handleResend = async () => {
        if (!reservationId || !detail?.phone) return;
        setResending(true);
        setResendError(null);
        try {
            await apiClient.post<{ sent: boolean }>(
                publicEndpoints.resendSignInLink(reservationId),
                { reservationId, phone: detail.phone }
            );
            setResent(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to resend link";
            setResendError(message);
        } finally {
            setResending(false);
        }
    };

    if (!reservationId) {
        return (
            <main className="min-h-screen bg-canvas py-12 px-4 flex items-center">
                <div className="mx-auto max-w-md w-full">
                    <div className="card p-8 text-center">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ink/[0.05]">
                            <AlertTriangle className="w-7 h-7 text-ink-muted" strokeWidth={1.75} />
                        </div>
                        <h1 className="font-display text-xl font-bold text-ink">
                            We couldn&apos;t find that reservation
                        </h1>
                        <p className="mt-2 text-sm text-ink-muted">
                            This link is missing its reservation reference. If you just paid a
                            deposit, check the SMS we sent you — it has everything you need.
                        </p>
                        <Link
                            href="/listings"
                            className="btn-primary inline-block mt-6 px-6 py-3 text-sm"
                        >
                            Browse listings
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-canvas py-12 px-4 flex items-center">
                <div className="mx-auto max-w-md w-full">
                    <div className="card p-8 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand mb-4" strokeWidth={2} />
                        <p className="text-sm text-ink-muted">Loading reservation details…</p>
                    </div>
                </div>
            </main>
        );
    }

    if (error || !detail) {
        return (
            <main className="min-h-screen bg-canvas py-12 px-4 flex items-center">
                <div className="mx-auto max-w-md w-full">
                    <div className="card p-8 text-center">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
                            <AlertTriangle className="w-7 h-7 text-danger" strokeWidth={2} />
                        </div>
                        <h1 className="font-display text-xl font-bold text-ink">Something went wrong</h1>
                        <p className="mt-2 text-sm text-ink-muted">
                            {error ?? "We couldn't load your reservation details. Please try again."}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn-primary mt-6 w-full py-3 text-sm"
                        >
                            <RefreshCw className="h-4 w-4 mr-2 inline" strokeWidth={2} />
                            Retry
                        </button>
                        <Link
                            href="/listings"
                            className="mt-3 block text-center text-sm font-medium text-brand hover:text-brand-700 dark:text-brand-300 transition-colors"
                        >
                            Browse listings
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const deposit = depositLabel(detail.status);
    const iconMap = {
        held: <ShieldCheck className="w-8 h-8 text-brand" strokeWidth={2.5} />,
        released: <ShieldCheck className="w-8 h-8 text-success" strokeWidth={2.5} />,
        refunded: <Shield className="w-8 h-8 text-brass-dark" strokeWidth={2.5} />,
        unknown: <Check className="w-8 h-8 text-brand" strokeWidth={2.5} />,
    };

    const bgMap = {
        held: "bg-brand-50 dark:bg-brand-800",
        released: "bg-success/10",
        refunded: "bg-brass-light",
        unknown: "bg-brand-50 dark:bg-brand-800",
    };

    return (
        <main className="min-h-screen bg-canvas py-12 px-4 flex items-center">
            <div className="mx-auto max-w-md w-full">
                <div className="card p-8 text-center" role="status">
                    <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${bgMap[deposit.icon]}`}>
                        {iconMap[deposit.icon]}
                    </div>

                    <h1 className="font-display text-xl font-bold text-ink">{deposit.title}</h1>
                    <p className="mt-2 text-sm text-ink-muted">{deposit.description}</p>

                    {detail.mpesaReceiptNumber && (
                        <div className="mt-4 rounded-lg bg-ink/[0.04] px-4 py-2.5">
                            <p className="text-[11px] uppercase tracking-wide text-ink-muted">M-Pesa receipt</p>
                            <p className="font-data text-sm text-ink">{detail.mpesaReceiptNumber}</p>
                        </div>
                    )}

                    {detail.fullName && (
                        <div className="mt-3 text-left">
                            <p className="text-xs text-ink-muted">Reserved by</p>
                            <p className="text-sm font-medium text-ink">{detail.fullName}</p>
                        </div>
                    )}

                    <div className="mt-6 flex items-center justify-between gap-3 rounded-lg bg-ink/[0.04] px-4 py-2.5">
                        <div className="text-left overflow-hidden">
                            <p className="text-[11px] uppercase tracking-wide text-ink-muted">
                                Reservation reference
                            </p>
                            <p className="font-data text-sm text-ink truncate">{reservationId}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-700 dark:text-brand-300 transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy
                                </>
                            )}
                        </button>
                    </div>

                    {/* --- Next steps for first-login --- */}
                    {(detail.status === "DEPOSIT_PAID" || detail.status === "FULFILLING" || detail.status === "COMPLETED") && (
                        <div className="mt-6 text-left rounded-lg bg-ink/[0.04] px-4 py-3">
                            <p className="text-[11px] uppercase tracking-wide text-ink-muted mb-2 flex items-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5" />
                                Next step
                            </p>
                            <p className="text-sm text-ink">
                                We&apos;ll send a sign-in link to <strong>{detail.phone}</strong>.
                                Click the link to access your tenant portal, where you can view
                                your lease, check payments, and download receipts.
                            </p>
                        </div>
                    )}

                    {/* --- Resend link --- */}
                    <div className="mt-4 rounded-lg border border-border px-4 py-3">
                        <p className="text-xs text-ink-muted mb-2">
                            Didn&apos;t receive the SMS?
                        </p>
                        {resent ? (
                            <p className="text-xs font-medium text-success flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" />
                                Sign-in link resent! Check your phone.
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:text-brand-700 dark:text-brand-300 transition-colors disabled:opacity-50"
                            >
                                {resending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Send className="w-3.5 h-3.5" />
                                )}
                                {resending ? "Sending…" : "Resend sign-in link"}
                            </button>
                        )}
                        {resendError && (
                            <p className="mt-1 text-xs text-danger">{resendError}</p>
                        )}
                    </div>

                    <Link
                        href="/listings"
                        className="mt-6 inline-block text-sm font-medium text-brand hover:text-brand-700 dark:text-brand-300 transition-colors"
                    >
                        Browse more listings
                    </Link>
                </div>
            </div>
        </main>
    );
}