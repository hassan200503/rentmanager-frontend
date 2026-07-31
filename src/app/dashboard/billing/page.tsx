"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
    CreditCard,
    Smartphone,
    CheckCircle2,
    AlertTriangle,
    Info,
    RefreshCw,
    ShieldCheck,
    CalendarClock,
    ArrowRight,
    Loader2,
    XCircle,
} from "lucide-react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import {
    useSubscriptionStatusQuery,
    useSubscriptionPlansQuery,
    useSwitchToPremiumMutation,
    useCancelPremiumMutation,
    useSetupRatibaMutation,
    useSubscriptionPaymentRequestQuery,
    subscriptionKeys,
} from "@/features/subscription/queries/use-subscription-queries";
import type {
    BillingMode,
    StandingOrderStatus,
    SubscriptionPlan,
    SubscriptionStatus,
    SubscriptionStatusResponse,
} from "@/features/subscription/types/subscription-types";

const ksh = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

function formatMoney(amount: number | null | undefined): string {
    if (amount == null) return "—";
    return ksh.format(amount);
}

function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return "—";
    return dateFmt.format(parsed);
}

function normalizeMpesaPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("0")) return `254${digits.slice(1)}`;
    if (digits.startsWith("7")) return `254${digits}`;
    if (digits.startsWith("254")) return digits;
    return digits;
}

const isValidMpesaPhone = (raw: string) => /^254\d{9}$/.test(normalizeMpesaPhone(raw));

// ----------------------------------------------------------------
// Status chips
// ----------------------------------------------------------------

const SUBSCRIPTION_STATUS_META: Record<
    SubscriptionStatus,
    { label: string; className: string }
> = {
    ACTIVE: {
        label: "Active",
        className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    GRACE_PERIOD: {
        label: "Grace period",
        className: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    LAPSED: {
        label: "Lapsed",
        className: "bg-danger/10 text-danger dark:bg-danger/20 dark:text-red-300",
    },
    CANCELLED: {
        label: "Cancelled",
        className: "bg-border-subtle text-fg-muted dark:bg-border-subtle-dark dark:text-fg-muted-dark",
    },
    PAST_DUE: {
        label: "Past due",
        className: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    TRIAL: {
        label: "Trial",
        className: "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
    },
};

const STANDING_ORDER_STATUS_META: Record<
    StandingOrderStatus,
    { label: string; className: string }
> = {
    PENDING_AUTHORIZATION: {
        label: "Awaiting your approval",
        className: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    ACTIVE: {
        label: "Active",
        className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    FAILED: {
        label: "Setup failed",
        className: "bg-danger/10 text-danger dark:bg-danger/20 dark:text-red-300",
    },
    CANCELLED: {
        label: "Cancelled",
        className: "bg-border-subtle text-fg-muted dark:bg-border-subtle-dark dark:text-fg-muted-dark",
    },
};

function StatusChip({ status }: { status: SubscriptionStatus | null }) {
    if (!status) return null;
    const meta = SUBSCRIPTION_STATUS_META[status];
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {meta.label}
        </span>
    );
}

function StandingOrderChip({ status }: { status: StandingOrderStatus | null }) {
    if (!status) return null;
    const meta = STANDING_ORDER_STATUS_META[status];
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
        >
            {meta.label}
        </span>
    );
}

// ----------------------------------------------------------------
// Small layout helpers
// ----------------------------------------------------------------

function SectionCard({
    icon: Icon,
    label,
    children,
}: {
    icon: typeof CreditCard;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                {label}
            </h2>
            {children}
        </div>
    );
}

function KeyValueRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-sm text-fg-muted dark:text-fg-muted-dark">{label}</dt>
            <dd className="text-sm font-medium text-fg dark:text-fg-dark">{value}</dd>
        </div>
    );
}

// ----------------------------------------------------------------
// Ratiba (standing-order) card
// ----------------------------------------------------------------

function RatibaCard({
    billingMode,
    paybillNumber,
    accountReference,
    amount,
    ratibaEnabled,
    standingOrderStatus,
}: {
    billingMode: BillingMode;
    paybillNumber: string | null;
    accountReference: string | null;
    amount: number | null;
    ratibaEnabled: boolean;
    standingOrderStatus: StandingOrderStatus | null;
}) {
    const setupRatiba = useSetupRatibaMutation();
    const [setupResult, setSetupResult] = useState<string | null>(null);

    if (billingMode !== "PREMIUM_MONTHLY") return null;

    const pendingApproval = standingOrderStatus === "PENDING_AUTHORIZATION";
    const orderActive = standingOrderStatus === "ACTIVE";
    const canSetup = ratibaEnabled && !pendingApproval && !orderActive;

    const handleSetup = () => {
        setSetupResult(null);
        setupRatiba.mutate(undefined, {
            onSuccess: () => {
                setSetupResult(
                    "We&apos;ve sent the automatic-payments request to your phone. Approve the M-Pesa prompt to finish setup."
                );
            },
        });
    };

    return (
        <SectionCard icon={Smartphone} label="Automatic payments (M-Pesa Ratiba)">
            <div className="space-y-4">
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    Your premium fee is collected automatically every month through
                    M-Pesa Paybill — no manual payments needed.
                </p>

                <dl className="divide-y divide-border dark:divide-border-dark rounded-xl border border-border dark:border-border-dark px-4">
                    <KeyValueRow label="Paybill number" value={paybillNumber ?? "—"} />
                    <KeyValueRow label="Account reference" value={accountReference ?? "—"} />
                    <KeyValueRow label="Monthly fee" value={formatMoney(amount)} />
                    <KeyValueRow
                        label="Standing order"
                        value={<StandingOrderChip status={standingOrderStatus} />}
                    />
                </dl>

                {pendingApproval && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            Approve the M-Pesa prompt we just sent to your phone to
                            activate monthly automatic payments.
                        </p>
                    </div>
                )}

                {setupResult && (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                        <p className="text-sm text-emerald-800 dark:text-emerald-200">{setupResult}</p>
                    </div>
                )}

                {canSetup && (
                    <button
                        type="button"
                        onClick={handleSetup}
                        disabled={setupRatiba.isPending}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <Smartphone className="h-4 w-4" strokeWidth={2} />
                        {setupRatiba.isPending ? "Sending request…" : "Set up automatic payments"}
                    </button>
                )}

                {orderActive && (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                        <p className="text-sm text-emerald-800 dark:text-emerald-200">
                            Automatic payments are active. Your premium period renews
                            automatically every month.
                        </p>
                    </div>
                )}

                {!ratibaEnabled && (
                    <div className="flex items-start gap-3 rounded-xl border border-border dark:border-border-dark bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-4 py-3">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                            One-tap automatic payments are coming soon. Until then,
                            use the manual M-Pesa route below or pay each month.
                        </p>
                    </div>
                )}

                <div className="rounded-xl border border-border dark:border-border-dark bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-fg-subtle dark:text-fg-subtle-dark">
                        Manual setup (fallback)
                    </p>
                    <p className="mt-1.5 text-sm text-fg-muted dark:text-fg-muted-dark">
                        Dial <span className="font-mono font-medium">*334#</span> or open the
                        M-Pesa app, choose <span className="font-medium">My Subscriptions</span>,
                        and set up a recurring payment of{" "}
                        <span className="font-medium">{formatMoney(amount)}</span> to Paybill{" "}
                        <span className="font-mono font-medium">{paybillNumber ?? "—"}</span>{" "}
                        with account reference{" "}
                        <span className="font-mono font-medium">{accountReference ?? "—"}</span>.
                    </p>
                </div>
            </div>
        </SectionCard>
    );
}

// ----------------------------------------------------------------
// Switch-to-premium card (commission billing)
// ----------------------------------------------------------------

function SwitchCard({ currentStatus }: { currentStatus: SubscriptionStatusResponse }) {
    const plans = useSubscriptionPlansQuery();
    const switchToPremium = useSwitchToPremiumMutation();
    const [selectedCode, setSelectedCode] = useState<string | null>(null);
    const [phone, setPhone] = useState("");
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);
    const [pendingPhone, setPendingPhone] = useState("");
    const [pendingAmount, setPendingAmount] = useState(0);

    const paymentPoll = useSubscriptionPaymentRequestQuery(paymentRequestId);
    const paymentRequest = paymentPoll.data;
    const paymentStatus = paymentRequest?.status ?? null;

    const queryClient = useQueryClient();
    const router = useRouter();
    const navigatedToConfirmation = useRef(false);

    const availablePlans = useMemo(
        () =>
            (plans.data ?? []).filter(
                (plan): plan is SubscriptionPlan & { monthlyPrice: number } =>
                    plan.active &&
                    plan.selfService &&
                    plan.monthlyPrice != null &&
                    plan.monthlyPrice > 0
            ),
        [plans.data]
    );

    useEffect(() => {
        if (paymentStatus === "PAID" && !navigatedToConfirmation.current) {
            navigatedToConfirmation.current = true;
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.status });
            const plan = availablePlans.find((p) => p.code === selectedCode);
            router.push(
                `/dashboard/billing/confirmation?plan=${encodeURIComponent(
                    plan?.name ?? "Premium"
                )}&amount=${pendingAmount || paymentRequest?.amount || 0}`
            );
        }
    }, [
        paymentStatus,
        queryClient,
        router,
        availablePlans,
        selectedCode,
        pendingAmount,
        paymentRequest?.amount,
    ]);

    if (currentStatus.billingMode !== "COMMISSION") return null;

    const selectedPlan = availablePlans.find((plan) => plan.code === selectedCode) ?? null;
    const phoneValid = isValidMpesaPhone(phone);

    const resetPaymentFlow = () => {
        setPaymentRequestId(null);
        setPendingPhone("");
        setPendingAmount(0);
    };

    const handleSubmit = () => {
        if (!selectedPlan) return;
        if (!phoneValid) {
            setPhoneError("Enter a valid M-Pesa number (e.g. 254712345678 or 0712345678).");
            return;
        }
        setPhoneError(null);
        switchToPremium.mutate(
            {
                planCode: selectedPlan.code,
                mpesaPhone: normalizeMpesaPhone(phone),
            },
            {
                onSuccess: (request) => {
                    setPaymentRequestId(request.id);
                    setPendingPhone(request.mpesaPhone);
                    setPendingAmount(request.amount);
                },
            }
        );
    };

    return (
        <SectionCard icon={CreditCard} label="Go premium">
            <div className="space-y-5">
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    Pay a flat monthly fee instead of per-payment commission. Rent
                    payments to your tenants settle at 100% — zero commission.
                </p>

                {paymentRequestId != null ? (
                    paymentStatus === "PAID" ? (
                        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                            <div className="text-sm text-emerald-900 dark:text-emerald-100">
                                <p className="font-semibold">Payment received — you&apos;re now on premium.</p>
                                <p className="mt-1 text-emerald-800/80 dark:text-emerald-200/80">
                                    Your plan has been activated. This page will update shortly.
                                </p>
                            </div>
                        </div>
                    ) : paymentStatus === "FAILED" || paymentStatus === "EXPIRED" ? (
                        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
                            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2} />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-danger">
                                    {paymentStatus === "FAILED"
                                        ? "Payment failed."
                                        : "Payment request expired."}
                                </p>
                                <p className="mt-1 text-sm text-fg-muted dark:text-fg-muted-dark">
                                    {paymentRequest?.failureReason ? `${paymentRequest.failureReason}. ` : ""}
                                    Your plan hasn&apos;t changed — no money was deducted.
                                </p>
                                <button
                                    type="button"
                                    onClick={resetPaymentFlow}
                                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-danger"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                                    Try again
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/30 px-4 py-3">
                            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-brand dark:text-brand-400" strokeWidth={2} />
                            <div className="flex-1 text-sm text-brand-900 dark:text-brand-100">
                                <p className="font-semibold">
                                    M-Pesa prompt sent to {pendingPhone || paymentRequest?.mpesaPhone || "your phone"}.
                                </p>
                                <p className="mt-1 text-brand-800/80 dark:text-brand-200/80">
                                    Enter your PIN to pay {formatMoney(pendingAmount || paymentRequest?.amount || 0)}.
                                    Waiting for payment confirmation…
                                </p>
                                {paymentPoll.isError && (
                                    <button
                                        type="button"
                                        onClick={() => paymentPoll.refetch()}
                                        className="mt-2 text-xs font-semibold text-brand dark:text-brand-300 underline underline-offset-2"
                                    >
                                        Payment status check failed — retry
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                ) : (
                    <>
                        {plans.isLoading ? (
                            <div className="space-y-2">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="skeleton h-16 rounded-xl" />
                                ))}
                            </div>
                        ) : plans.isError ? (
                            <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={2} />
                                <div className="flex-1">
                                    <p className="text-sm text-danger">
                                        Couldn&apos;t load available plans.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => plans.refetch()}
                                        className="mt-1 text-xs font-semibold text-danger underline underline-offset-2"
                                    >
                                        Try again
                                    </button>
                                </div>
                            </div>
                        ) : availablePlans.length === 0 ? (
                            <div className="flex items-start gap-3 rounded-xl border border-border dark:border-border-dark bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-4 py-3">
                                <Info className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                                    No self-service plans are available yet — contact
                                    support for pricing.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2" role="radiogroup" aria-label="Choose a plan">
                                {availablePlans.map((plan) => {
                                    const active = plan.code === selectedCode;
                                    return (
                                        <label
                                            key={plan.id ?? plan.code}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                                                active
                                                    ? "border-brand bg-brand-50 dark:bg-brand-800/40 dark:border-brand-600"
                                                    : "border-border dark:border-border-dark hover:border-brand-200 dark:hover:border-brand-600"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="plan"
                                                className="accent-brand"
                                                checked={active}
                                                onChange={() => setSelectedCode(plan.code)}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                                                    {plan.name}
                                                </p>
                                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                                    {plan.description || `${plan.maxUnits ?? "Unlimited"} units`}
                                                </p>
                                            </div>
                                            <p className="text-sm font-semibold text-brand dark:text-brand-300">
                                                {formatMoney(plan.monthlyPrice)}
                                                <span className="text-xs font-medium text-fg-muted dark:text-fg-muted-dark">
                                                    {" "}/ month
                                                </span>
                                            </p>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        <div>
                            <label htmlFor="mpesa-phone" className="form-label">
                                M-Pesa phone number
                            </label>
                            <input
                                id="mpesa-phone"
                                type="tel"
                                inputMode="tel"
                                placeholder="e.g. 0712345678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="form-input"
                            />
                            {phoneError && (
                                <p className="mt-1 text-xs text-danger">{phoneError}</p>
                            )}
                            {!phoneError && phone && !phoneValid && (
                                <p className="mt-1 text-xs text-danger">
                                    Enter a valid M-Pesa number (e.g. 0712345678).
                                </p>
                            )}
                            <p className="mt-1 text-xs text-fg-muted dark:text-fg-muted-dark">
                                You&apos;ll receive an M-Pesa prompt on this number to approve the first payment.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={
                                !selectedPlan || !phoneValid || switchToPremium.isPending
                            }
                            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                        >
                            <ArrowRight className="h-4 w-4" strokeWidth={2} />
                            {switchToPremium.isPending
                                ? "Sending M-Pesa prompt…"
                                : selectedPlan
                                  ? `Pay ${formatMoney(selectedPlan.monthlyPrice)} & switch`
                                  : "Choose a plan"}
                        </button>

                        {switchToPremium.isError && (
                            <p className="text-sm text-danger">
                                {String(
                                    (switchToPremium.error as Error)?.message ?? ""
                                ).includes("already pending")
                                    ? "A previous payment is still being confirmed. Complete the M-Pesa prompt on your phone, or wait a moment and try again."
                                    : (switchToPremium.error as Error).message}
                            </p>
                        )}
                    </>
                )}
            </div>
        </SectionCard>
    );
}

// ----------------------------------------------------------------
// Main page
// ----------------------------------------------------------------

export default function BillingPage() {
    const { isOwner } = useCurrentUser();
    const status = useSubscriptionStatusQuery();
    const cancelPremium = useCancelPremiumMutation();
    const [confirmCancel, setConfirmCancel] = useState(false);

    const data = status.data;

    if (status.isLoading) {
        return (
            <div className="page-container max-w-3xl space-y-6">
                <div className="skeleton h-8 w-40" />
                <div className="skeleton h-4 w-72" />
                <div className="space-y-4 mt-6">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="card skeleton h-40" />
                    ))}
                </div>
            </div>
        );
    }

    if (status.isError || !data) {
        const denied =
            (status.error as Error | undefined)?.message?.includes("403") ||
            (status.error as Error | undefined)?.message?.includes("Forbidden");
        return (
            <div className="page-container max-w-3xl space-y-6">
                <div className="animate-fade-in-up">
                    <h1 className="page-title">Billing</h1>
                    <p className="page-subtitle">Manage your plan and payments.</p>
                </div>
                <div className="card animate-fade-in-up">
                    <div className="flex items-start gap-3 px-4 py-4">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                        <div>
                            <p className="text-sm font-medium text-fg dark:text-fg-dark">
                                {denied
                                    ? "Only the account owner can manage billing."
                                    : "We couldn't load your subscription status."}
                            </p>
                            {!denied && (
                                <button
                                    type="button"
                                    onClick={() => status.refetch()}
                                    className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-brand dark:text-brand-300"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                                    Try again
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const isPremium = data.billingMode === "PREMIUM_MONTHLY";
    const isGrace = data.subscriptionStatus === "GRACE_PERIOD";
    const isLapsed = data.subscriptionStatus === "LAPSED";
    const canManage = isOwner !== false;

    return (
        <div className="page-container max-w-3xl space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="page-title">Billing</h1>
                <p className="page-subtitle">Your plan, automatic payments, and subscription status.</p>
            </div>

            {isGrace && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 animate-fade-in-up">
                    <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold">Your premium period ended on {formatDate(data.planEndDate)}.</p>
                        <p className="mt-1">
                            Premium benefits continue until {formatDate(data.planGraceEndsAt)}.
                            Pay now to renew — otherwise you&apos;ll automatically return to
                            commission billing, with no lockout.
                        </p>
                    </div>
                </div>
            )}

            {isLapsed && (
                <div className="flex items-start gap-3 rounded-xl border border-border dark:border-border-dark bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-4 py-3 animate-fade-in-up">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                        Your premium subscription lapsed and you&apos;re back on commission
                        billing — you can switch back to premium any time.
                    </p>
                </div>
            )}

            {!canManage && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 animate-fade-in-up">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        Only the account owner can change the billing plan. Ask the
                        owner of this workspace to manage the subscription.
                    </p>
                </div>
            )}

            {/* ── Current plan ─────────────────────────────────── */}
            <SectionCard icon={CreditCard} label="Current plan">
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-lg font-semibold text-fg dark:text-fg-dark">
                                {isPremium ? (data.planName ?? "Premium monthly") : "Commission billing"}
                            </p>
                            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                                {isPremium
                                    ? `Flat ${formatMoney(data.planMonthlyPrice)}/month — zero commission on rent payments`
                                    : "Pay per rent payment — no monthly commitment"}
                            </p>
                        </div>
                        <StatusChip status={data.subscriptionStatus} />
                    </div>

                    {isPremium && (
                        <dl className="divide-y divide-border dark:divide-border-dark rounded-xl border border-border dark:border-border-dark px-4">
                            <KeyValueRow label="Period" value={`${formatDate(data.planStartDate)} → ${formatDate(data.planEndDate)}`} />
                            {isGrace && (
                                <KeyValueRow label="Grace ends" value={formatDate(data.planGraceEndsAt)} />
                            )}
                            <KeyValueRow
                                label="Auto-renew"
                                value={data.planAutoRenew ? "On" : "Off"}
                            />
                            <KeyValueRow label="Plan code" value={data.planCode ?? "—"} />
                        </dl>
                    )}
                </div>
            </SectionCard>

            {/* ── Ratiba automatic payments ────────────────────── */}
            {canManage && (
                <RatibaCard
                    billingMode={data.billingMode}
                    paybillNumber={data.paybillNumber}
                    accountReference={data.accountReference}
                    amount={data.planMonthlyPrice}
                    ratibaEnabled={data.ratibaEnabled}
                    standingOrderStatus={data.standingOrderStatus}
                />
            )}

            {/* ── Switch to premium ────────────────────────────── */}
            {canManage && (
                <SwitchCard currentStatus={data} />
            )}

            {/* ── Cancel premium ───────────────────────────────── */}
            {canManage && isPremium && (
                <div className="card animate-fade-in-up border-danger/20 dark:border-danger/20">
                    <h2 className="section-header inline-flex items-center gap-2 text-danger">
                        <AlertTriangle className="h-4 w-4" strokeWidth={2} />
                        Cancel premium
                    </h2>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-4">
                        Premium benefits continue until the end of your paid period —
                        auto-renewal stops and you return to commission billing then.
                    </p>
                    {!confirmCancel ? (
                        <button
                            type="button"
                            onClick={() => setConfirmCancel(true)}
                            className="btn-danger"
                        >
                            Cancel premium subscription
                        </button>
                    ) : (
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    cancelPremium.mutate(undefined, {
                                        onSuccess: () => setConfirmCancel(false),
                                    })
                                }
                                disabled={cancelPremium.isPending}
                                className="btn-danger"
                            >
                                {cancelPremium.isPending ? "Cancelling…" : "Yes, cancel premium"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmCancel(false)}
                                className="btn-secondary"
                            >
                                Keep premium
                            </button>
                        </div>
                    )}
                    {cancelPremium.isError && (
                        <p className="mt-2 text-sm text-danger">
                            {(cancelPremium.error as Error).message}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
