"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// --- Types ---
type PaymentIntentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

interface PaymentStatusResponse {
    paymentIntentId: string;
    status: PaymentIntentStatus;
    reservationId: string | null;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errorCode: string | null;
    timestamp: number;
}

// --- Config ---
const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 180_000; // increased from 90s to 3 minutes to allow more time for STK approval / testing delays

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

    // Polling
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
                const res = await fetch(
                    `/api/v1/public/reservations/payment-status?id=${paymentIntentId}`
                );
                if (!res.ok) {
                    throw new Error("Unable to check payment status.");
                }
                const json: ApiResponse<PaymentStatusResponse> = await res.json();
                if (cancelledRef.current) return;

                if (!json.success || !json.data) {
                    throw new Error(json.message || "Unable to check payment status.");
                }

                const { status: newStatus, reservationId } = json.data;
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
                // PENDING -> keep polling
            } catch (err: unknown) {
                if (cancelledRef.current) return;
                stop();
                setStatus("ERROR");
                setErrorMessage(err instanceof Error ? err.message : "Unexpected error.");
            }
        };

        // fire immediately, then on an interval
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
                    <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
                    <h1 className="text-xl font-bold text-gray-900">Check your phone</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        We&apos;ve sent an M-Pesa prompt to your phone. Enter your PIN to complete
                        the deposit payment and secure your unit.
                    </p>
                    <p className="mt-6 text-xs text-gray-400">
                        Waiting for confirmation… ({secondsLeft}s remaining)
                    </p>
                </>
            );
        }

        if (status === "FAILED") {
            return (
                <>
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                        <span className="text-2xl text-red-500">✕</span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Payment failed</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        The M-Pesa payment was not completed. This can happen if you entered the
                        wrong PIN or cancelled the prompt. No deposit was deducted.
                    </p>
                    <button
                        onClick={handleRetry}
                        className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white
                            hover:bg-emerald-700 active:bg-emerald-800 transition focus:outline-none
                            focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
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
                    <h1 className="text-xl font-bold text-gray-900">Prompt expired</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        We didn&apos;t receive a response in time. No deposit was deducted from
                        your M-Pesa account. You can request a new payment prompt below.
                    </p>
                    <button
                        onClick={handleRetry}
                        className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white
                            hover:bg-emerald-700 active:bg-emerald-800 transition focus:outline-none
                            focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                        Send a new prompt
                    </button>
                </>
            );
        }

        // ERROR
        return (
            <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                    <span className="text-2xl text-red-500">!</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
                <p className="mt-2 text-sm text-gray-500">
                    {errorMessage ?? "We couldn't check your payment status. Please try again."}
                </p>
                <button
                    onClick={handleRetry}
                    className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white
                        hover:bg-emerald-700 active:bg-emerald-800 transition focus:outline-none
                        focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                    Go back
                </button>
            </>
        );
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 flex items-center">
            <div className="mx-auto max-w-md w-full">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    {renderContent()}
                </div>
            </div>
        </main>
    );
}