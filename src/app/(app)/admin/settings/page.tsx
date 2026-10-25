"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
    Settings,
    Loader2,
    AlertTriangle,
    Lock,
    Save,
    Clock,
    Send,
    Wallet,
    Headset,
    Palette,
    CheckCircle2,
} from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import {
    PageHeader,
    formatDateTime,
} from "@/features/admin/components/admin-ui";
import { useAdminSettingsQuery } from "@/features/admin/hooks/use-admin-queries";
import { useUpdatePlatformSettingsMutation } from "@/features/admin/hooks/use-admin-mutations";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";
import { BrandingCard } from "@/features/admin/components/branding-card";
import type {
    PlatformSettingsResponse,
    UpdatePlatformSettingsRequest,
} from "@/features/admin/types/admin-types";

type SettingsTab = "branding" | "billing" | "disbursements" | "revenue" | "support";

const TABS: { id: SettingsTab; label: string; icon: ReactNode }[] = [
    { id: "branding", label: "Branding & appearance", icon: <Palette className="h-4 w-4" strokeWidth={2} /> },
    { id: "billing", label: "Billing", icon: <Clock className="h-4 w-4" strokeWidth={2} /> },
    { id: "disbursements", label: "Disbursements", icon: <Send className="h-4 w-4" strokeWidth={2} /> },
    { id: "revenue", label: "Revenue", icon: <Wallet className="h-4 w-4" strokeWidth={2} /> },
    { id: "support", label: "Support", icon: <Headset className="h-4 w-4" strokeWidth={2} /> },
];

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-fg-muted dark:text-fg-muted-dark mb-1">{label}</label>
            {children}
            {hint && <p className="mt-1 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">{hint}</p>}
        </div>
    );
}

const inputCls =
    "w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60";

function toForm(initial: PlatformSettingsResponse): UpdatePlatformSettingsRequest {
    return {
        trialDurationDays: initial.billing.trialDurationDays,
        premiumGraceDays: initial.billing.premiumGraceDays,
        subscriptionPaymentExpiryMinutes: initial.billing.subscriptionPaymentExpiryMinutes,
        disbursementMaxRetryAttempts: initial.disbursement.maxRetryAttempts,
        revenueBusinessShortcode: initial.revenue.businessShortcode ?? "",
        revenuePaybill: initial.revenue.paybill ?? "",
        revenueTill: initial.revenue.till ?? "",
        revenueB2CShortcode: initial.revenue.b2cShortcode ?? "",
        revenueMpesaPhone: initial.revenue.mpesaPhone ?? "",
        supportEmail: initial.platform.supportEmail ?? "",
        supportPhone: initial.platform.supportPhone ?? "",
    };
}

function SectionCard({
    icon,
    title,
    hint,
    children,
}: {
    icon: ReactNode;
    title: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
                {icon}
                <h3 className="text-sm font-semibold text-fg dark:text-fg-dark">{title}</h3>
                {hint && <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">{hint}</span>}
            </div>
            {children}
        </div>
    );
}

interface FormPanelProps {
    form: UpdatePlatformSettingsRequest;
    set: (patch: Partial<UpdatePlatformSettingsRequest>) => void;
    disabled: boolean;
}

function BillingPanel({ form, set, disabled }: FormPanelProps) {
    return (
        <SectionCard
            icon={<Clock className="h-4 w-4 text-brand-600 dark:text-brand-400" strokeWidth={2} />}
            title="Billing & subscription"
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                    label="New-landlord trial duration (days)"
                    hint="How long a newly onboarded landlord gets to try RentManager for free. Applied at account creation — does not retroactively extend existing trials. Min 7, max 90."
                >
                    <input
                        type="number"
                        min={7}
                        max={90}
                        disabled={disabled}
                        value={form.trialDurationDays}
                        onChange={(e) => set({ trialDurationDays: Number(e.target.value) })}
                        className={inputCls}
                    />
                </Field>
                <Field
                    label="Premium grace period (days)"
                    hint="Days a landlord keeps full access after their paid period ends before the subscription lapses."
                >
                    <input
                        type="number"
                        min={1}
                        max={60}
                        disabled={disabled}
                        value={form.premiumGraceDays}
                        onChange={(e) => set({ premiumGraceDays: Number(e.target.value) })}
                        className={inputCls}
                    />
                </Field>
                <Field
                    label="Subscription payment expiry (minutes)"
                    hint="How long a pending Pay-Now M-Pesa request stays valid before it is expired and, for renewals, the grace window opens."
                >
                    <input
                        type="number"
                        min={5}
                        max={1440}
                        disabled={disabled}
                        value={form.subscriptionPaymentExpiryMinutes}
                        onChange={(e) => set({ subscriptionPaymentExpiryMinutes: Number(e.target.value) })}
                        className={inputCls}
                    />
                </Field>
            </div>
        </SectionCard>
    );
}

function DisbursementsPanel({ form, set, disabled }: FormPanelProps) {
    return (
        <SectionCard
            icon={<Send className="h-4 w-4 text-blue-500 dark:text-blue-400" strokeWidth={2} />}
            title="Disbursement retries"
        >
            <Field
                label="Maximum retry attempts"
                hint="How many times a failed payout is auto-retried before it is flagged for manual attention."
            >
                <input
                    type="number"
                    min={0}
                    max={10}
                    disabled={disabled}
                    value={form.disbursementMaxRetryAttempts}
                    onChange={(e) => set({ disbursementMaxRetryAttempts: Number(e.target.value) })}
                    className={inputCls + " sm:max-w-xs"}
                />
            </Field>
        </SectionCard>
    );
}

function RevenuePanel({ form, set, disabled }: FormPanelProps) {
    return (
        <SectionCard
            icon={<Wallet className="h-4 w-4 text-emerald-500 dark:text-emerald-400" strokeWidth={2} />}
            title="Platform revenue collection"
            hint="M-Pesa shortcodes used to collect subscription payments from landlords."
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Business shortcode" hint="STK push shortcode (e.g. 174379).">
                    <input
                        type="text"
                        maxLength={20}
                        disabled={disabled}
                        value={form.revenueBusinessShortcode ?? ""}
                        onChange={(e) => set({ revenueBusinessShortcode: e.target.value })}
                        className={inputCls}
                    />
                </Field>
                <Field label="Paybill number">
                    <input
                        type="text"
                        maxLength={20}
                        disabled={disabled}
                        value={form.revenuePaybill ?? ""}
                        onChange={(e) => set({ revenuePaybill: e.target.value })}
                        className={inputCls}
                    />
                </Field>
                <Field label="Till number">
                    <input
                        type="text"
                        maxLength={20}
                        disabled={disabled}
                        value={form.revenueTill ?? ""}
                        onChange={(e) => set({ revenueTill: e.target.value })}
                        className={inputCls}
                    />
                </Field>
                <Field label="B2C shortcode" hint="Used when disbursing payouts to landlords.">
                    <input
                        type="text"
                        maxLength={20}
                        disabled={disabled}
                        value={form.revenueB2CShortcode ?? ""}
                        onChange={(e) => set({ revenueB2CShortcode: e.target.value })}
                        className={inputCls}
                    />
                </Field>
                <Field label="M-Pesa phone (revenue account)" hint="e.g. +254712345678">
                    <input
                        type="tel"
                        disabled={disabled}
                        value={form.revenueMpesaPhone ?? ""}
                        onChange={(e) => set({ revenueMpesaPhone: e.target.value })}
                        className={inputCls}
                    />
                </Field>
            </div>
        </SectionCard>
    );
}

function SupportPanel({ form, set, disabled }: FormPanelProps) {
    return (
        <SectionCard
            icon={<Headset className="h-4 w-4 text-violet-500 dark:text-violet-400" strokeWidth={2} />}
            title="Support contact"
            hint="Shown on the platform housing-keeping pages."
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Support email">
                    <input
                        type="email"
                        maxLength={150}
                        disabled={disabled}
                        value={form.supportEmail ?? ""}
                        onChange={(e) => set({ supportEmail: e.target.value })}
                        className={inputCls}
                    />
                </Field>
                <Field label="Support phone">
                    <input
                        type="tel"
                        disabled={disabled}
                        value={form.supportPhone ?? ""}
                        onChange={(e) => set({ supportPhone: e.target.value })}
                        className={inputCls}
                    />
                </Field>
            </div>
        </SectionCard>
    );
}

function SettingsForm({ initial }: { initial: PlatformSettingsResponse }) {
    const { isPlatformOwner } = usePlatformRole();
    const updateSettings = useUpdatePlatformSettingsMutation();
    const [tab, setTab] = useState<SettingsTab>("branding");
    const [form, setForm] = useState<UpdatePlatformSettingsRequest>(() => toForm(initial));
    const [saved, setSaved] = useState(false);

    const envBadge = initial.platform.sandbox
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "bg-success/10 text-success-dark dark:text-success border-success/30";

    const set = (patch: Partial<UpdatePlatformSettingsRequest>) =>
        setForm((f) => ({ ...f, ...patch }));

    const onSave = () => {
        updateSettings.mutate(form, {
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            },
        });
    };

    const panelProps: FormPanelProps = { form, set, disabled: !isPlatformOwner };

    return (
        <div className="space-y-6">
            {/* Environment banner */}
            <div className="card p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${initial.platform.sandbox ? "from-amber-500 to-amber-600" : "from-emerald-500 to-emerald-600"} flex items-center justify-center`}>
                        <Settings className="h-5 w-5 text-white" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            Environment: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${envBadge}`}>{initial.platform.environment}</span>
                        </p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            {initial.platform.sandbox
                                ? "M-Pesa calls are routed to the Safaricom sandbox — no real money moves."
                                : "M-Pesa calls are routed to the live Safaricom production gateways."}
                        </p>
                    </div>
                </div>
                <div className="text-right text-xs text-fg-muted dark:text-fg-muted-dark">
                    <p className="flex items-center justify-end gap-1.5">
                        <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                        Last updated {formatDateTime(initial.platform.updatedAt)}
                    </p>
                    {initial.platform.updatedBy && <p>by {initial.platform.updatedBy}</p>}
                </div>
            </div>

            {!isPlatformOwner && (
                <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-4 py-3 text-xs text-info-dark dark:text-info">
                    <Lock className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                    <p>
                        You have read access to platform settings. Only the platform owner can modify
                        branding, subscription grace periods, disbursement retries or revenue collection details.
                    </p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-border dark:border-border-dark bg-white dark:bg-surface-dark p-1.5">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                            tab === t.id
                                ? "bg-brand/10 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-brand/20"
                                : "text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark"
                        }`}
                        aria-selected={tab === t.id}
                        role="tab"
                    >
                        {t.icon}
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Panels */}
            {tab === "branding" && <BrandingCard disabled={!isPlatformOwner} />}
            {tab === "billing" && <BillingPanel {...panelProps} />}
            {tab === "disbursements" && <DisbursementsPanel {...panelProps} />}
            {tab === "revenue" && <RevenuePanel {...panelProps} />}
            {tab === "support" && <SupportPanel {...panelProps} />}

            {/* Sticky save bar (form tabs only) */}
            {isPlatformOwner && tab !== "branding" && (
                <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-border dark:border-border-dark bg-white/90 px-5 py-3.5 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-surface-dark/90">
                    <button
                        onClick={onSave}
                        disabled={updateSettings.isPending}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-60 transition-colors"
                    >
                        {updateSettings.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                        ) : (
                            <Save className="h-4 w-4" strokeWidth={2} />
                        )}
                        Save & apply platform-wide
                    </button>
                    {saved && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-dark dark:text-success">
                            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                            Saved — schedulers pick these up on the next pass.
                        </span>
                    )}
                    {updateSettings.isError && (
                        <span className="text-sm text-danger">
                            Save failed. Please retry, or check that all values are within range.
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

function SettingsContent() {
    const { data, isPending, isError } = useAdminSettingsQuery();

    if (isPending) {
        return (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-fg-muted dark:text-fg-muted-dark">
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                Loading platform settings…
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="card max-w-lg mx-auto text-center py-10 mt-10">
                <AlertTriangle className="h-8 w-8 text-warning mx-auto mb-3" strokeWidth={2} />
                <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Couldn&#39;t load platform settings</p>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                    The admin settings endpoint is unreachable. Check the backend service and try again.
                </p>
            </div>
        );
    }

    return <SettingsForm key={data.platform.updatedAt ?? "settings"} initial={data} />;
}

export default function AdminSettingsPage() {
    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                <div className="max-w-4xl mx-auto p-6 space-y-6">
                    <PageHeader
                        title="Platform settings"
                        subtitle="Owner-configurable platform policy — branding, grace, expiry, retries, revenue collection and support"
                        icon={Settings}
                        iconTone="from-rose-500 to-rose-600"
                    />
                    <SettingsContent />
                </div>
            </div>
        </AdminErrorBoundary>
    );
}
