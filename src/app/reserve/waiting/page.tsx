// app/reserve/waiting/page.tsx
"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X, Clock, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "@/features/public-listings/api/public-endpoints";

// --- Types ---
type PaymentIntentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED";
type PageStatus = PaymentIntentStatus | "TIMEOUT" | "ERROR";

interface PaymentStatusResponse {
    paymentIntentId: string;
    status: PaymentIntentStatus;
    reservationId: string | null;
}

// --- Config ---
const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 180_000;

const formatMMSS = (ms: number) => {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export default function ReservationWaitingPage() {
    // useSearchParams requires a Suspense boundary in the App Router,
    // otherwise the production build fails on static generation.
    return (
        <Suspense fallback={<main className="min-h-screen bg-canvas" />}>
            <ReservationWaitingContent />
        </Suspense>
    );
}

function ReservationWaitingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentIntentId = searchParams.get("paymentIntentId");

    const [status, setStatus] = useState<PageStatus>(
        () => (paymentIntentId ? "PENDING" : "ERROR")
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(() =>
        paymentIntentId ? null : "Missing payment reference. Please start your reservation again."
    );
    const [elapsedMs, setElapsedMs] = useState(0);

    const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAtRef = useRef<number>(0);

    const clearTimers = useCallback(() => {
        if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
        if (tickRef.current) clearInterval(tickRef.current);
        pollTimeoutRef.current = null;
        tickRef.current = null;
    }, []);

    useEffect(() => {
        if (!paymentIntentId) return;

        const cancelledRef = { current: false };
        startedAtRef.current = Date.now();

        const stop = () => {
            cancelledRef.current = true;
            clearTimers();
        };

        // Sequential polling: each request only schedules the next one after
        // it resolves. A fixed setInterval here would fire the next request
        // on schedule even if the previous one hadn't returned yet — under
        // any latency spike that means overlapping, out-of-order requests
        // hitting the payment-status endpoint.
        const poll = async () => {
            try {
                const data = await apiClient.get<PaymentStatusResponse>(
                    publicEndpoints.reservationPaymentStatus(paymentIntentId)
                );

                if (cancelledRef.current) return;

                const { status: newStatus, reservationId } = data;
                setStatus(newStatus);

                if (newStatus === "PAID") {
                    stop();
                    router.push(`/reserve/confirmation?reservationId=${reservationId}`);
                    return;
                }

                if (newStatus === "FAILED" || newStatus === "EXPIRED") {
                    stop();
                    return;
                }

                pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
            } catch (err: unknown) {
                if (cancelledRef.current) return;
                stop();
                setStatus("ERROR");
                setErrorMessage(err instanceof Error ? err.message : "Unexpected error.");
            }
        };

        poll();

        tickRef.current = setInterval(() => {
            if (cancelledRef.current) return;
            const elapsed = Date.now() - startedAtRef.current;
            setElapsedMs(elapsed);
            if (elapsed >= TIMEOUT_MS) {
                stop();
                setStatus((prev) => (prev === "PENDING" ? "TIMEOUT" : prev));
            }
        }, 1000);

        return () => {
            stop();
        };
    }, [paymentIntentId, router, clearTimers]);

    const handleRetry = () => {
        router.back();
    };

    const progressPct = Math.min(100, (elapsedMs / TIMEOUT_MS) * 100);

    // A "Browse listings" fallback sits alongside every retry action below.
    // router.back() is the best available recovery — this page has no
    // unitId to build a precise link back to — but if someone reached this
    // URL with no useful history entry (direct link, refresh), back() can
    // strand them with no way out. This guarantees one always exists.
    const browseListingsLink = (
        <Link
            href="/listings"
            className="mt-3 block text-center text-sm font-medium text-brand hover:text-brand-700 dark:text-brand-300 transition-colors"
        >
            Browse listings
        </Link>
    );

    const renderContent = () => {
        switch (status) {
            case "PENDING":
                return (
                    <>
                        <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-primary-light border-t-primary" />
                        <h1 className="font-display text-xl font-bold text-ink">Check your phone</h1>
                        <p className="mt-2 text-sm text-ink-muted">
                            We&apos;ve sent an M-Pesa prompt to your phone. Enter your PIN to
                            complete the deposit payment and secure your unit.
                        </p>

                        <div className="mt-6 h-1.5 w-full rounded-full bg-ink/[0.08] overflow-hidden">
                            <div
                                className="h-full rounded-full bg-brand transition-all duration-1000 ease-linear"
                                style={{ width: `${progressPct}%` }}
                            />
                        </div>
                        <p className="mt-3 text-xs text-ink-muted">
                            Waiting for confirmation… ({formatMMSS(TIMEOUT_MS - elapsedMs)} remaining)
                        </p>
                    </>
                );

            case "PAID":
                // Shown only for the brief window between the status flipping
                // to PAID and router.push() completing navigation to the
                // confirmation page. Without this branch, that gap fell
                // through to the generic error state — a success payment
                // briefly showing "Something went wrong" is a bad flash.
                return (
                    <>
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-800">
                            <Check className="w-8 h-8 text-brand" strokeWidth={2.5} />
                        </div>
                        <h1 className="font-display text-xl font-bold text-ink">Payment confirmed</h1>
                        <p className="mt-2 text-sm text-ink-muted">
                            Taking you to your reservation…
                        </p>
                    </>
                );

            case "FAILED":
                return (
                    <>
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
                            <X className="w-7 h-7 text-danger" strokeWidth={2} />
                        </div>
                        <h1 className="font-display text-xl font-bold text-ink">Payment failed</h1>
                        <p className="mt-2 text-sm text-ink-muted">
                            The M-Pesa payment was not completed. This can happen if you entered
                            the wrong PIN or cancelled the prompt. No deposit was deducted.
                        </p>
                        <button onClick={handleRetry} className="btn-primary mt-6 w-full py-3 text-sm">
                            Try again
                        </button>
                        {browseListingsLink}
                    </>
                );

            case "EXPIRED":
            case "TIMEOUT":
                return (
                    <>
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brass-light">
                            <Clock className="w-7 h-7 text-warning-dark" strokeWidth={2} />
                        </div>
                        <h1 className="font-display text-xl font-bold text-ink">Prompt expired</h1>
                        <p className="mt-2 text-sm text-ink-muted">
                            We didn&apos;t receive a response in time. No deposit was deducted
                            from your M-Pesa account. You can request a new payment prompt below.
                        </p>
                        <button onClick={handleRetry} className="btn-primary mt-6 w-full py-3 text-sm">
                            Send a new prompt
                        </button>
                        {browseListingsLink}
                    </>
                );

            case "ERROR":
                return (
                    <>
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
                            <AlertTriangle className="w-7 h-7 text-danger" strokeWidth={2} />
                        </div>
                        <h1 className="font-display text-xl font-bold text-ink">Something went wrong</h1>
                        <p className="mt-2 text-sm text-ink-muted">
                            {errorMessage ?? "We couldn't check your payment status. Please try again."}
                        </p>
                        <button onClick={handleRetry} className="btn-primary mt-6 w-full py-3 text-sm">
                            Go back
                        </button>
                        {browseListingsLink}
                    </>
                );

            default: {
                // Exhaustiveness check: if PaymentIntentStatus ever gains a
                // new value, this fails to compile instead of silently
                // falling through to a wrong render — which is exactly the
                // bug the PAID case above was hitting.
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _exhaustiveCheck: never = status;
                return null;
            }
        }
    };

    return (
        <main className="min-h-screen bg-canvas py-12 px-4 flex items-center">
            <div className="mx-auto max-w-md w-full">
                <div className="card p-8 text-center" role="status" aria-live="polite">
                    {renderContent()}
                </div>
            </div>
        </main>
    );
}