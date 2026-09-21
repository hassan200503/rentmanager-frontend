"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/shared/utils/money";
import {
    useSubscriptionStatusQuery,
    subscriptionKeys,
} from "@/features/subscription/queries/use-subscription-queries";

const dateFmt = new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
});

// How long to poll before giving up and showing a "still processing" message
const MAX_POLL_MS = 60_000;

function ConfirmationContent() {
    const router = useRouter();
    const params = useSearchParams();
    const qc = useQueryClient();
    const startedAt = useRef(Date.now());

    // Decorative params supplied by the billing page — used only for display
    const planDisplay = params.get("plan") ?? "Premium";
    const amountRaw = params.get("amount");
    const amount = amountRaw ? Number(amountRaw) : 0;

    // Authoritative state comes from the server — not the URL
    const { data: status, isLoading, isError } = useSubscriptionStatusQuery();

    const isPremium = status?.billingMode === "PREMIUM_MONTHLY";
    const elapsed = Date.now() - startedAt.current;
    const timedOut = elapsed > MAX_POLL_MS;

    // Poll until confirmed or timed out
    useEffect(() => {
        if (isPremium || timedOut) return;

        const id = setInterval(() => {
            qc.invalidateQueries({ queryKey: subscriptionKeys.status });
        }, 4_000);

        return () => clearInterval(id);
    }, [isPremium, timedOut, qc]);

    if (isLoading) {
        return (
            <div className="page-container max-w-xl">
                <div className="card animate-fade-in-up text-center py-12">
                    <Loader2 className="mx-auto h-10 w-10 text-brand animate-spin" strokeWidth={1.5} />
                    <p className="mt-4 text-sm font-medium text-fg dark:text-fg-dark">Confirming payment…</p>
                    <p className="mt-1 text-xs text-fg-muted dark:text-fg-muted-dark">
                        This usually takes a few seconds.
                    </p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="page-container max-w-xl">
                <div className="card animate-fade-in-up text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
                        <AlertTriangle className="h-6 w-6 text-danger" strokeWidth={2} />
                    </div>
                    <p className="mt-4 text-sm font-medium text-fg dark:text-fg-dark">
                        Couldn&apos;t load subscription status
                    </p>
                    <p className="mt-1 text-xs text-fg-muted dark:text-fg-muted-dark mb-4">
                        Your payment may still have gone through. Check your billing page.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/billing")}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                        Back to billing
                    </button>
                </div>
            </div>
        );
    }

    if (!isPremium && !timedOut) {
        // Subscription not yet confirmed — show processing state while polling
        return (
            <div className="page-container max-w-xl">
                <div className="card animate-fade-in-up text-center py-12">
                    <Loader2 className="mx-auto h-10 w-10 text-brand animate-spin" strokeWidth={1.5} />
                    <p className="mt-4 text-sm font-medium text-fg dark:text-fg-dark">
                        Waiting for M-Pesa confirmation…
                    </p>
                    <p className="mt-1 text-xs text-fg-muted dark:text-fg-muted-dark">
                        Complete the M-Pesa prompt on your phone, then wait here.
                    </p>
                </div>
            </div>
        );
    }

    if (!isPremium && timedOut) {
        // Timed out — payment may be delayed or the webhook may not have fired yet
        return (
            <div className="page-container max-w-xl">
                <div className="card animate-fade-in-up text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                        <AlertTriangle className="h-6 w-6 text-warning-dark dark:text-warning" strokeWidth={2} />
                    </div>
                    <p className="mt-4 text-sm font-medium text-fg dark:text-fg-dark">
                        Payment still being processed
                    </p>
                    <p className="mt-2 text-xs text-fg-muted dark:text-fg-muted-dark max-w-xs mx-auto leading-relaxed">
                        We haven&apos;t received confirmation yet. If you approved the M-Pesa prompt, your
                        plan will activate shortly. Check your billing page in a moment.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard/billing")}
                        className="btn-outline mt-5 inline-flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                        Back to billing
                    </button>
                </div>
            </div>
        );
    }

    // Confirmed premium
    return (
        <div className="page-container max-w-xl space-y-6">
            <div className="card animate-fade-in-up text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                    <CheckCircle2
                        className="h-9 w-9 text-emerald-600 dark:text-emerald-400"
                        strokeWidth={2}
                    />
                </div>

                <h1 className="page-title mt-4">Payment confirmed</h1>
                <p className="page-subtitle">
                    You&apos;re now on the{" "}
                    <span className="font-semibold text-fg dark:text-fg-dark">
                        {status?.planName ?? planDisplay}
                    </span>{" "}
                    plan — no commission on rent payments.
                </p>

                <dl className="mx-auto mt-6 max-w-sm divide-y divide-border dark:divide-border-dark rounded-xl border border-border dark:border-border-dark px-4 text-left">
                    <div className="flex items-center justify-between gap-4 py-2">
                        <dt className="text-sm text-fg-muted dark:text-fg-muted-dark">Plan</dt>
                        <dd className="text-sm font-medium text-fg dark:text-fg-dark">
                            {status?.planName ?? planDisplay}
                        </dd>
                    </div>
                    {amount > 0 && (
                        <div className="flex items-center justify-between gap-4 py-2">
                            <dt className="text-sm text-fg-muted dark:text-fg-muted-dark">Amount paid</dt>
                            <dd className="text-sm font-medium text-fg dark:text-fg-dark">
                                {formatCurrency(amount)}
                            </dd>
                        </div>
                    )}
                    {status?.planStartDate && (
                        <div className="flex items-center justify-between gap-4 py-2">
                            <dt className="text-sm text-fg-muted dark:text-fg-muted-dark">Active from</dt>
                            <dd className="text-sm font-medium text-fg dark:text-fg-dark">
                                {dateFmt.format(new Date(status.planStartDate))}
                            </dd>
                        </div>
                    )}
                    {status?.planEndDate && (
                        <div className="flex items-center justify-between gap-4 py-2">
                            <dt className="text-sm text-fg-muted dark:text-fg-muted-dark">Renews</dt>
                            <dd className="text-sm font-medium text-fg dark:text-fg-dark">
                                {dateFmt.format(new Date(status.planEndDate))}
                            </dd>
                        </div>
                    )}
                </dl>

                <button
                    type="button"
                    onClick={() => router.push("/dashboard/billing")}
                    className="btn-primary mt-6 inline-flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                    Back to billing
                </button>

                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                    <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                    Zero commission on rent — your plan auto-renews monthly.
                </p>
            </div>
        </div>
    );
}

export default function PaymentConfirmationPage() {
    return (
        <Suspense
            fallback={
                <div className="page-container max-w-xl">
                    <div className="card skeleton h-72" />
                </div>
            }
        >
            <ConfirmationContent />
        </Suspense>
    );
}
