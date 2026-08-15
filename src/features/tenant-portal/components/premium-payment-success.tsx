// components/premium-payment-success.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertCircle,
    ArrowRight,
    BadgeCheck,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    Home,
    Loader2,
    Mail,
    Receipt,
    RefreshCw,
    Sparkles,
    Wallet,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime } from "./premium-tenant-dashboard";
import { tenantPortalApi, type TenantPaymentReceiptResponse } from "../api/tenant-portal-api";
import { downloadReceiptPdf } from "@/features/rentledger/components/download-receipt";

// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
// CONFETTI ANIMATION
// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

interface Confetti {
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: string;
    driftX: number;
    duration: number;
}

const ConfettiRain = () => {
    const [confetti, setConfetti] = useState<Confetti[]>([]);

    useEffect(() => {
        const colors = ["#059669", "#10B981", "#34D399", "#6EE7B7", "#A7F3D0"];
        const pieces: Confetti[] = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: -10,
            rotation: Math.random() * 360,
            scale: 0.5 + Math.random() * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            driftX: (Math.random() - 0.5) * 20,
            duration: 2 + Math.random() * 2,
        }));

        const showTimer = setTimeout(() => setConfetti(pieces), 0);
        const hideTimer = setTimeout(() => setConfetti([]), 3000);
        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    if (confetti.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {confetti.map((piece) => (
                <motion.div
                    key={piece.id}
                    initial={{ x: `${piece.x}vw`, y: "-10vh", rotate: 0, scale: piece.scale }}
                    animate={{
                        x: `${piece.x + piece.driftX}vw`,
                        y: "110vh",
                        rotate: piece.rotation + 720,
                    }}
                    transition={{
                        duration: piece.duration,
                        ease: "linear",
                    }}
                    className="absolute w-2 h-2 rounded-sm"
                    style={{ backgroundColor: piece.color }}
                />
            ))}
        </div>
    );
};

// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
// SUCCESS CHECKMARK ANIMATION
// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

const AnimatedCheckmark = () => {
    return (
        <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                duration: 0.6,
            }}
            className="relative w-24 h-24 mx-auto mb-6"
        >
            <div className="absolute inset-0 bg-success/10 rounded-full" />
            <div className="absolute inset-2 bg-success/20 rounded-full" />
            <div className="absolute inset-4 bg-success rounded-full flex items-center justify-center">
                <motion.div
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
                </motion.div>
            </div>
        </motion.div>
    );
};

// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
// MAIN COMPONENT
// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

const STATUS_POLL_INTERVAL_MS = 3000;
const STATUS_POLL_ATTEMPTS = 25;

type LoadState = "loading" | "pending" | "paid" | "failed" | "notfound";

export const PremiumPaymentSuccess = () => {
    const searchParams = useSearchParams();
    const requestId = searchParams.get("requestId");

    const [loadState, setLoadState] = useState<LoadState>(requestId ? "loading" : "pending");
    const [message, setMessage] = useState("Confirming your paymentâ€¦");
    const [pollKey, setPollKey] = useState(0);
    const [payment, setPayment] = useState<{
        transactionId: string;
        amount: number;
        mpesaRef: string;
        timestamp: string;
    } | null>(null);
    const [receipt, setReceipt] = useState<TenantPaymentReceiptResponse | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const attemptsRef = useRef(0);

    // Poll the payment status until confirmed (or failed / out of attempts),
    // then fetch the official receipt once the payment is PAID. Re-runs when
    // `pollKey` changes ("Check again").
    useEffect(() => {
        if (!requestId) return;

        let cancelled = false;
        attemptsRef.current = 0;

        const poll = async () => {
            while (!cancelled && attemptsRef.current < STATUS_POLL_ATTEMPTS) {
                attemptsRef.current += 1;

                let status: Awaited<ReturnType<typeof tenantPortalApi.getPaymentRequestStatus>> | null = null;
                try {
                    status = await tenantPortalApi.getPaymentRequestStatus(requestId);
                } catch {
                    // transient failure â€” keep polling
                }
                if (cancelled) return;

                if (status?.status === "PAID") {
                    setPayment({
                        transactionId: status.transactionId ?? requestId,
                        amount: status.amount,
                        mpesaRef: status.mpesaReceiptNumber ?? "â€”",
                        timestamp: new Date().toISOString(),
                    });
                    if (status.transactionId) {
                        try {
                            const r = await tenantPortalApi.getPaymentReceipt(status.transactionId);
                            if (cancelled) return;
                            setReceipt(r);
                            setPayment({
                                transactionId: r.transactionId,
                                amount: r.amount,
                                mpesaRef: r.mpesaTransactionId ?? status.mpesaReceiptNumber ?? "â€”",
                                timestamp: r.paymentDate,
                            });
                        } catch {
                            // receipt fetch is best-effort; payment is still confirmed
                        }
                    }
                    setLoadState("paid");
                    return;
                }

                if (status?.status === "FAILED") {
                    setLoadState("failed");
                    setMessage("Your payment was not completed. Please try again from the dashboard.");
                    return;
                }

                setMessage(
                    attemptsRef.current > 5
                        ? "Still waiting for M-Pesa confirmation. Check your phone for the prompt."
                        : "Confirming your paymentâ€¦",
                );
                await new Promise((resolve) => setTimeout(resolve, STATUS_POLL_INTERVAL_MS));
            }

            if (!cancelled) {
                setLoadState("pending");
                setMessage("We could not confirm the payment yet. It may still be processing â€” check your M-Pesa messages.");
            }
        };

        poll();

        return () => {
            cancelled = true;
        };
    }, [requestId, pollKey]);

    // No requestId â†’ show a graceful "couldn't confirm" state without state churn.
    const shownState: LoadState = requestId ? loadState : "pending";
    const shownMessage = requestId
        ? message
        : "No payment reference was provided. Check your M-Pesa messages for the confirmation.";

    const handleDownloadReceipt = async () => {
        setIsDownloading(true);
        try {
            if (receipt) {
                await downloadReceiptPdf(receipt);
            } else if (payment?.transactionId) {
                const r = await tenantPortalApi.getPaymentReceipt(payment.transactionId);
                await downloadReceiptPdf(r);
            } else {
                setEmailSent(true);
            }
        } catch {
            setEmailSent(true);
        } finally {
            setIsDownloading(false);
        }
    };

    const amount = receipt?.amount ?? payment?.amount;
    const method = "M-Pesa";

    return (
        <>
            {shownState === "paid" && <ConfettiRain />}

            <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-2xl"
                >
                    <div className="bg-surface dark:bg-surface-dark border border-border/60 dark:border-border-dark/60 rounded-2xl p-8 md:p-12 shadow-elevated text-center">
                        <AnimatePresence mode="wait">
                            {shownState === "loading" && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="py-12"
                                >
                                    <div className="relative w-20 h-20 mx-auto mb-6">
                                        <div className="absolute inset-0 rounded-full bg-brand-500/10 animate-ping" />
                                        <div className="absolute inset-2.5 rounded-full bg-brand-600 flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-white animate-spin" strokeWidth={2.5} />
                                        </div>
                                    </div>
                                    <h1 className="text-2xl font-bold text-ink dark:text-ink-dark mb-2">
                                        Confirming payment
                                    </h1>
                                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark">{shownMessage}</p>
                                </motion.div>
                            )}

                            {shownState === "pending" && (
                                <motion.div
                                    key="pending"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="py-12"
                                >
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warning/10 flex items-center justify-center">
                                        <Clock className="w-9 h-9 text-warning" strokeWidth={1.75} />
                                    </div>
                                    <h1 className="text-2xl font-bold text-ink dark:text-ink-dark mb-2">
                                        Payment still processing
                                    </h1>
                                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark max-w-md mx-auto mb-8">
                                        {shownMessage}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <button
                                            onClick={() => {
                                                if (requestId) {
                                                    setPollKey((k) => k + 1);
                                                }
                                            }}
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Check again
                                        </button>
                                        <Link
                                            href="/portal/payments"
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ink/5 hover:bg-ink/8 dark:bg-ink/10 dark:hover:bg-ink/15 text-ink dark:text-ink-dark font-semibold rounded-lg transition-colors"
                                        >
                                            <Receipt className="w-4 h-4" />
                                            View payment history
                                        </Link>
                                    </div>
                                </motion.div>
                            )}

                            {shownState === "failed" && (
                                <motion.div
                                    key="failed"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="py-12"
                                >
                                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-danger/10 flex items-center justify-center">
                                        <AlertCircle className="w-9 h-9 text-danger" strokeWidth={1.75} />
                                    </div>
                                    <h1 className="text-2xl font-bold text-ink dark:text-ink-dark mb-2">
                                        Payment not completed
                                    </h1>
                                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark max-w-md mx-auto mb-8">
                                        {shownMessage} No money was deducted from your M-Pesa account.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                        <Link
                                            href="/portal"
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors"
                                        >
                                            <Home className="w-4 h-4" />
                                            Back to Dashboard
                                        </Link>
                                        <Link
                                            href="/portal/payments"
                                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ink/5 hover:bg-ink/8 dark:bg-ink/10 dark:hover:bg-ink/15 text-ink dark:text-ink-dark font-semibold rounded-lg transition-colors"
                                        >
                                            <Zap className="w-4 h-4" />
                                            Try paying again
                                        </Link>
                                    </div>
                                </motion.div>
                            )}

                            {shownState === "paid" && (
                                <motion.div
                                    key="paid"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <AnimatedCheckmark />

                                    <motion.h1
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.5 }}
                                        className="text-3xl md:text-4xl font-bold text-ink dark:text-ink-dark mb-3"
                                    >
                                        Payment Successful!
                                    </motion.h1>

                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                        className="text-lg text-ink-muted dark:text-ink-muted-dark mb-8"
                                    >
                                        Your rent payment has been processed successfully
                                    </motion.p>

                                    {/* Payment Amount */}
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.6, duration: 0.5 }}
                                        className="inline-block bg-success/10 border border-success/20 rounded-2xl px-8 py-4 mb-8"
                                    >
                                        <p className="text-sm text-success font-medium uppercase tracking-wider mb-1">Amount Paid</p>
                                        <p className="text-4xl font-bold text-success tabular-nums">{formatCurrency(amount ?? 0)}</p>
                                    </motion.div>

                                    {/* Transaction Details */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.7, duration: 0.5 }}
                                        className="bg-ink/5 dark:bg-ink/10 rounded-xl p-6 mb-8 text-left"
                                    >
                                        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark uppercase tracking-wider mb-4">
                                            Transaction Details
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm text-ink-muted dark:text-ink-muted-dark flex items-center gap-2">
                                                    <Receipt className="w-4 h-4 shrink-0" />
                                                    Receipt No.
                                                </span>
                                                <span className="text-sm font-mono font-medium text-ink dark:text-ink-dark truncate">
                                                    {receipt?.receiptNumber ?? payment?.transactionId ?? "â€”"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm text-ink-muted dark:text-ink-muted-dark flex items-center gap-2">
                                                    <BadgeCheck className="w-4 h-4 shrink-0" />
                                                    M-Pesa Ref
                                                </span>
                                                <span className="text-sm font-mono font-medium text-ink dark:text-ink-dark truncate">
                                                    {payment?.mpesaRef ?? "â€”"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm text-ink-muted dark:text-ink-muted-dark flex items-center gap-2">
                                                    <Clock className="w-4 h-4 shrink-0" />
                                                    Date & Time
                                                </span>
                                                <span className="text-sm font-medium text-ink dark:text-ink-dark">
                                                    {formatDateTime(payment?.timestamp ?? null)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm text-ink-muted dark:text-ink-muted-dark flex items-center gap-2">
                                                    <Zap className="w-4 h-4 shrink-0" />
                                                    Payment Method
                                                </span>
                                                <span className="text-sm font-medium text-ink dark:text-ink-dark">{method}</span>
                                            </div>
                                            {receipt && (
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-sm text-ink-muted dark:text-ink-muted-dark flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 shrink-0" />
                                                        Billing Period
                                                    </span>
                                                    <span className="text-sm font-medium text-ink dark:text-ink-dark">
                                                        {formatDateShort(receipt.billingPeriodStart)} â€“ {formatDateShort(receipt.billingPeriodEnd)}
                                                    </span>
                                                </div>
                                            )}
                                            {receipt && receipt.balanceAfterPayment !== undefined && (
                                                <div className="flex items-center justify-between gap-4 border-t border-ink/10 dark:border-ink/20 pt-3">
                                                    <span className="text-sm text-ink-muted dark:text-ink-muted-dark flex items-center gap-2">
                                                        <Wallet className="w-4 h-4 shrink-0" />
                                                        Balance After Payment
                                                    </span>
                                                    <span className="text-sm font-semibold text-ink dark:text-ink-dark tabular-nums">
                                                        {formatCurrency(receipt.balanceAfterPayment)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Action Buttons */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8, duration: 0.5 }}
                                        className="flex flex-col sm:flex-row gap-3 mb-6"
                                    >
                                        <button
                                            onClick={handleDownloadReceipt}
                                            disabled={isDownloading}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 disabled:bg-ink/10 text-white font-semibold rounded-lg shadow-button hover:shadow-elevated hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:cursor-not-allowed"
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Preparingâ€¦
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-5 h-5" />
                                                    Download Receipt
                                                </>
                                            )}
                                        </button>

                                        <Link
                                            href="/portal"
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-ink/5 hover:bg-ink/8 dark:bg-ink/10 dark:hover:bg-ink/15 text-ink dark:text-ink-dark font-semibold rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                                        >
                                            <Home className="w-5 h-5" />
                                            Back to Dashboard
                                        </Link>
                                    </motion.div>

                                    {/* Email Confirmation */}
                                    {emailSent && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            className="flex items-center justify-center gap-2 text-sm text-success mb-6"
                                        >
                                            <Mail className="w-4 h-4" />
                                            <span>A copy of your receipt has been prepared for download</span>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Auto-Pay Upsell */}
                    {shownState === "paid" && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.5 }}
                            className="mt-6 bg-gradient-to-br from-brand-50 to-brand-100/50 dark:from-brand-950/20 dark:to-brand-900/10 border border-brand-200/60 dark:border-brand-800/40 rounded-xl p-6"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-brand-600 rounded-lg text-white">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-ink dark:text-ink-dark mb-2">
                                        Want hassle-free payments?
                                    </h3>
                                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark mb-4">
                                        Set up auto-pay and never miss a due date. Your rent will be automatically paid from your M-Pesa
                                        account each month.
                                    </p>
                                    <Link
                                        href="/portal/lease?setup=autopay"
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 group"
                                    >
                                        Enable Auto-Pay
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Next Steps */}
                    {shownState === "paid" && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2, duration: 0.5 }}
                            className="mt-6 text-center"
                        >
                            <p className="text-sm text-ink-muted dark:text-ink-muted-dark mb-4">What would you like to do next?</p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Link
                                    href="/portal/payments"
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink dark:text-ink-dark hover:bg-ink/5 dark:hover:bg-ink/10 rounded-lg transition-colors"
                                >
                                    <Receipt className="w-4 h-4" />
                                    View Payment History
                                </Link>
                                <Link
                                    href="/portal/lease"
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink dark:text-ink-dark hover:bg-ink/5 dark:hover:bg-ink/10 rounded-lg transition-colors"
                                >
                                    <Calendar className="w-4 h-4" />
                                    Check Lease Details
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </>
    );
};

// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
// SMALL LOCAL HELPERS
// â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

const formatDateShort = (iso: string | null | undefined) => {
    if (!iso) return "â€”";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "â€”";
    return date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
};
