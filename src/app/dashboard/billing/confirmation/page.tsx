"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

const ksh = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "long",
    year: "numeric",
});

function ConfirmationContent() {
    const router = useRouter();
    const params = useSearchParams();

    const plan = params.get("plan") ?? "Premium";
    const amountRaw = params.get("amount");
    const amount = amountRaw ? Number(amountRaw) : 0;

    return (
        <div className="page-container max-w-xl space-y-6">
            <div className="card animate-fade-in-up text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                    <CheckCircle2
                        className="h-9 w-9 text-emerald-600 dark:text-emerald-400"
                        strokeWidth={2}
                    />
                </div>

                <h1 className="page-title mt-4">Payment successful</h1>
                <p className="page-subtitle">
                    You&apos;re now on the {plan} plan — welcome to premium.
                </p>

                <dl className="mx-auto mt-6 max-w-sm divide-y divide-border dark:divide-border-dark rounded-xl border border-border dark:border-border-dark px-4 text-left">
                    <div className="flex items-center justify-between gap-4 py-2">
                        <dt className="text-sm text-fg-muted dark:text-fg-muted-dark">Plan</dt>
                        <dd className="text-sm font-medium text-fg dark:text-fg-dark">{plan}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2">
                        <dt className="text-sm text-fg-muted dark:text-fg-muted-dark">Amount paid</dt>
                        <dd className="text-sm font-medium text-fg dark:text-fg-dark">
                            {ksh.format(amount)}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2">
                        <dt className="text-sm text-fg-muted dark:text-fg-muted-dark">Date</dt>
                        <dd className="text-sm font-medium text-fg dark:text-fg-dark">
                            {dateFmt.format(new Date())}
                        </dd>
                    </div>
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
                    Zero commission on rent payments — your plan renews automatically each month.
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
