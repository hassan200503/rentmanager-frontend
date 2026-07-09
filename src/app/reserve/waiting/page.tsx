// app/reserve/waiting/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "@/features/public-listings/api/public-endpoints";

// --- Types ---
type PaymentIntentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

interface PaymentStatusResponse {
    paymentIntentId: string;
    status: PaymentIntentStatus;
    reservationId: string | null;
}

// --- Config ---
const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 180_000;

// --- Component ---
export default function ReservationWaitingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const paymentIntentId = searchParams.get("paymentIntentId");

    const [status, setStatus] = useState<PaymentIntentStatus | "TIMEOUT" | "ERROR">(
        () => (paymentIntentId ? "PENDING" : "ERROR")
    );
    const [errorMessage, setErrorMessage] = useState<string | null>(() =>
        paymentIntentId ? null : "Missing payment reference. Please start your reservation again."
    );
    const [elapsedMs, setElapsedMs] = useState(0);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startedAtRef = useRef<number>(0);

    const clearTimers = useCallback(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (tickRef.current) clearInterval(tickRef.current);
        pollRef.current = null;
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
            } catch (err: unknown) {
                if (cancelledRef.current) return;
                stop();
                setStatus("ERROR");
                setErrorMessage(err instanceof Error ? err.message : "Unexpected error.");
            }
        };

        poll();
        pollRef.current = setInterval(poll, POLL_INTERVAL_MS);

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

    const secondsLeft = Math.max(0, Math.ceil((TIMEOUT_MS - elapsedMs) / 1000));

    // --- Render states ---
    const renderContent = () => {
        if (status === "PENDING") {
            return (
                <>
                    {/* Spinner colors left as decorative brand accent — not part of the
                        pill/btn semantic system, and "waiting" isn't a success state anyway. */}
                    <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                    <h1 className="text-xl font-bold text-ink">Check your phone</h1>
                    <p className="mt-2 text-sm text-ink-muted">
                        We&apos;ve sent an M-Pesa prompt to your phone. Enter your PIN to complete
                        the deposit payment and secure your unit.
                    </p>
                    <p className="mt-6 text-xs text-ink-muted">
                        Waiting for confirmation… ({secondsLeft}s remaining)
                    </p>
                </>
            );
        }

        if (status === "FAILED") {
            return (
                <>
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                        <span className="text-2xl text-danger">✕</span>
                    </div>
                    <h1 className="text-xl font-bold text-ink">Payment failed</h1>
                    <p className="mt-2 text-sm text-ink-muted">
                        The M-Pesa payment was not completed. This can happen if you entered the
                        wrong PIN or cancelled the prompt. No deposit was deducted.
                    </p>
                    <button onClick={handleRetry} className="btn-primary mt-6 w-full py-3 text-sm">
                        Try again
                    </button>
                </>
            );
        }

        if (status === "EXPIRED" || status === "TIMEOUT") {
            return (
                <>
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                        <span className="text-2xl text-amber-500">⏱</span>
                    </div>
                    <h1 className="text-xl font-bold text-ink">Prompt expired</h1>
                    <p className="mt-2 text-sm text-ink-muted">
                        We didn&apos;t receive a response in time. No deposit was deducted from
                        your M-Pesa account. You can request a new payment prompt below.
                    </p>
                    <button onClick={handleRetry} className="btn-primary mt-6 w-full py-3 text-sm">
                        Send a new prompt
                    </button>
                </>
            );
        }

        // ERROR
        return (
            <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                    <span className="text-2xl text-danger">!</span>
                </div>
                <h1 className="text-xl font-bold text-ink">Something went wrong</h1>
                <p className="mt-2 text-sm text-ink-muted">
                    {errorMessage ?? "We couldn't check your payment status. Please try again."}
                </p>
                <button onClick={handleRetry} className="btn-primary mt-6 w-full py-3 text-sm">
                    Go back
                </button>
            </>
        );
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 flex items-center">
            <div className="mx-auto max-w-md w-full">
                <div className="card p-8 text-center">
                    {renderContent()}
                </div>
            </div>
        </main>
    );
}