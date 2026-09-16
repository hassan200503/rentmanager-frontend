"use client";

import { useState, useEffect } from "react";
import {
    CreditCard,
    CheckCircle2,
    Info,
    Plus,
    Pencil,
    Power,
    X,
    Loader2,
    AlertTriangle,
    Gift,
    Lock,
} from "lucide-react";
import { AdminErrorBoundary } from "@/features/admin/components/AdminErrorBoundary";
import { PageHeader, formatCurrency } from "@/features/admin/components/admin-ui";
import { usePlatformRole } from "@/features/admin/hooks/use-platform-role";
import { useSubscriptionPlansQuery } from "@/features/subscription/queries/use-subscription-queries";
import {
    useCreateSubscriptionPlanMutation,
    useUpdateSubscriptionPlanMutation,
    useDeactivateSubscriptionPlanMutation,
} from "@/features/admin/hooks/use-admin-mutations";
import type { SubscriptionPlan } from "@/features/subscription/types/subscription-types";
import type { SubscriptionPlanAdminRequest } from "@/features/admin/types/admin-types";

const inputCls =
    "w-full rounded-lg border border-border dark:border-border-dark bg-white dark:bg-surface-dark px-3 py-2 text-sm text-fg dark:text-fg-dark placeholder:text-fg-subtle dark:placeholder:text-fg-subtle-dark focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60";

// ─── Shared ───────────────────────────────────────────────────────────────────

function Field({
    label,
    hint,
    required,
    children,
}: {
    label: string;
    hint?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-fg-muted dark:text-fg-muted-dark mb-1">
                {label}
                {required && <span className="text-danger ml-0.5">*</span>}
            </label>
            {children}
            {hint && <p className="mt-1 text-[11px] text-fg-subtle dark:text-fg-subtle-dark">{hint}</p>}
        </div>
    );
}

// ─── Trial info ───────────────────────────────────────────────────────────────

function TrialInfoCard() {
    return (
        <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3">
                <Gift className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                <div className="text-sm text-emerald-800 dark:text-emerald-200">
                    <p className="font-semibold">Free trial — 30 days (configurable in Platform settings › Billing)</p>
                    <p className="mt-0.5">
                        Every new landlord account starts on a 30-day free trial with no credit card required —
                        one full rent cycle to verify M-Pesa collection, leases, and the ledger before committing.
                        After the trial they must subscribe to a paid plan to keep access.
                    </p>
                    <ul className="mt-2 space-y-0.5 text-xs list-disc list-inside text-emerald-700 dark:text-emerald-300">
                        <li>Full M-Pesa direct collection (rent goes straight to landlord&apos;s M-Pesa)</li>
                        <li>Digital leases &amp; real-time ledger</li>
                        <li>Automated M-Pesa receipts &amp; tenant notifications</li>
                        <li>No credit card, no hidden fees during trial</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

// ─── Plan Form Modal ──────────────────────────────────────────────────────────

type BillingCycle = "MONTHLY" | "YEARLY" | "QUARTERLY";

type FormValues = {
    code: string;
    name: string;
    description: string;
    billingCycle: BillingCycle;
    maxUnitsStr: string;
    monthlyPriceStr: string;
    yearlyPriceStr: string;
};

function emptyForm(): FormValues {
    return {
        code: "",
        name: "",
        description: "",
        billingCycle: "MONTHLY",
        maxUnitsStr: "",
        monthlyPriceStr: "",
        yearlyPriceStr: "",
    };
}

function planToForm(plan: SubscriptionPlan): FormValues {
    return {
        code: plan.code,
        name: plan.name,
        description: plan.description ?? "",
        billingCycle: plan.billingCycle,
        maxUnitsStr: plan.maxUnits != null ? String(plan.maxUnits) : "",
        monthlyPriceStr:
            plan.monthlyPrice != null ? String(parseFloat(plan.monthlyPrice)) : "",
        yearlyPriceStr:
            plan.yearlyPrice != null ? String(parseFloat(plan.yearlyPrice)) : "",
    };
}

function PlanFormModal({
    plan,
    onClose,
}: {
    plan: SubscriptionPlan | null;
    onClose: () => void;
}) {
    const isEdit = plan != null;
    const [form, setForm] = useState<FormValues>(() =>
        plan ? planToForm(plan) : emptyForm()
    );
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
    const [serverError, setServerError] = useState<string | null>(null);

    const createMutation = useCreateSubscriptionPlanMutation();
    const updateMutation = useUpdateSubscriptionPlanMutation();
    const isPending = createMutation.isPending || updateMutation.isPending;

    const patch = (p: Partial<FormValues>) => {
        setForm((f) => ({ ...f, ...p }));
        setServerError(null);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const validate = (): boolean => {
        const errs: Partial<Record<keyof FormValues, string>> = {};
        if (!isEdit && !form.code.trim()) errs.code = "Plan code is required";
        if (!form.name.trim()) errs.name = "Plan name is required";
        if (form.monthlyPriceStr !== "" && parseFloat(form.monthlyPriceStr) < 0)
            errs.monthlyPriceStr = "Price cannot be negative";
        if (form.yearlyPriceStr !== "" && parseFloat(form.yearlyPriceStr) < 0)
            errs.yearlyPriceStr = "Price cannot be negative";
        if (form.maxUnitsStr !== "" && parseInt(form.maxUnitsStr) < 1)
            errs.maxUnitsStr = "Unit limit must be at least 1";
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const buildRequest = (): SubscriptionPlanAdminRequest => ({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        billingCycle: form.billingCycle,
        maxUnits: form.maxUnitsStr !== "" ? parseInt(form.maxUnitsStr) : null,
        monthlyPrice:
            form.monthlyPriceStr !== "" ? parseFloat(form.monthlyPriceStr) : null,
        yearlyPrice:
            form.yearlyPriceStr !== "" ? parseFloat(form.yearlyPriceStr) : null,
    });

    const handleSubmit = () => {
        if (!validate()) return;
        const req = buildRequest();

        if (isEdit && plan) {
            updateMutation.mutate(
                {
                    id: plan.id,
                    request: {
                        name: req.name,
                        description: req.description,
                        billingCycle: req.billingCycle,
                        maxUnits: req.maxUnits,
                        monthlyPrice: req.monthlyPrice,
                        yearlyPrice: req.yearlyPrice,
                    },
                },
                {
                    onSuccess: onClose,
                    onError: (err) =>
                        setServerError(
                            err instanceof Error ? err.message : "Failed to save. Please retry."
                        ),
                }
            );
        } else {
            createMutation.mutate(req, {
                onSuccess: onClose,
                onError: (err) => {
                    const msg = err instanceof Error ? err.message : "";
                    const isDupe =
                        msg.toLowerCase().includes("duplicate") ||
                        msg.toLowerCase().includes("unique") ||
                        msg.toLowerCase().includes("already");
                    setServerError(
                        isDupe
                            ? `Plan code "${req.code}" already exists. Choose a unique code.`
                            : "Failed to create plan. Please retry."
                    );
                },
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-surface-dark shadow-2xl border border-border dark:border-border-dark overflow-hidden">
                <div className="flex items-center justify-between border-b border-border dark:border-border-dark px-5 py-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                            <CreditCard className="h-4 w-4 text-white" strokeWidth={2} />
                        </div>
                        <h2 className="text-sm font-semibold text-fg dark:text-fg-dark">
                            {isEdit ? `Edit ${plan.name}` : "Create subscription plan"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 hover:bg-border-subtle dark:hover:bg-border-subtle-dark transition-colors"
                    >
                        <X className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    </button>
                </div>

                <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                            label="Plan code"
                            required
                            hint={
                                isEdit
                                    ? "Immutable after creation"
                                    : "Uppercase alphanumeric, e.g. GROWTH"
                            }
                        >
                            <input
                                type="text"
                                maxLength={20}
                                disabled={isEdit || isPending}
                                value={form.code}
                                onChange={(e) =>
                                    patch({
                                        code: e.target.value
                                            .toUpperCase()
                                            .replace(/[^A-Z0-9_]/g, ""),
                                    })
                                }
                                className={inputCls}
                                placeholder="GROWTH"
                            />
                            {fieldErrors.code && (
                                <p className="mt-1 text-[11px] text-danger">{fieldErrors.code}</p>
                            )}
                        </Field>
                        <Field label="Plan name" required>
                            <input
                                type="text"
                                maxLength={100}
                                disabled={isPending}
                                value={form.name}
                                onChange={(e) => patch({ name: e.target.value })}
                                className={inputCls}
                                placeholder="Growth"
                            />
                            {fieldErrors.name && (
                                <p className="mt-1 text-[11px] text-danger">{fieldErrors.name}</p>
                            )}
                        </Field>
                    </div>

                    <Field label="Description" hint="Shown to landlords in the plan picker">
                        <textarea
                            maxLength={500}
                            disabled={isPending}
                            rows={2}
                            value={form.description}
                            onChange={(e) => patch({ description: e.target.value })}
                            className={inputCls + " resize-none"}
                            placeholder="For portfolios that need less chasing"
                        />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Billing cycle">
                            <select
                                disabled={isPending}
                                value={form.billingCycle}
                                onChange={(e) =>
                                    patch({ billingCycle: e.target.value as BillingCycle })
                                }
                                className={inputCls}
                            >
                                <option value="MONTHLY">Monthly</option>
                                <option value="QUARTERLY">Quarterly</option>
                                <option value="YEARLY">Yearly</option>
                            </select>
                        </Field>
                        <Field label="Max units" hint="Leave blank for unlimited">
                            <input
                                type="number"
                                min={1}
                                disabled={isPending}
                                value={form.maxUnitsStr}
                                onChange={(e) => patch({ maxUnitsStr: e.target.value })}
                                className={inputCls}
                                placeholder="30"
                            />
                            {fieldErrors.maxUnitsStr && (
                                <p className="mt-1 text-[11px] text-danger">
                                    {fieldErrors.maxUnitsStr}
                                </p>
                            )}
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                            label="Monthly price (KES)"
                            hint="Leave blank for custom / contact-sales pricing"
                        >
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                disabled={isPending}
                                value={form.monthlyPriceStr}
                                onChange={(e) => patch({ monthlyPriceStr: e.target.value })}
                                className={inputCls}
                                placeholder="5500"
                            />
                            {fieldErrors.monthlyPriceStr && (
                                <p className="mt-1 text-[11px] text-danger">
                                    {fieldErrors.monthlyPriceStr}
                                </p>
                            )}
                        </Field>
                        <Field
                            label="Yearly price (KES)"
                            hint="Optional — leave blank if not offering annual billing"
                        >
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                disabled={isPending}
                                value={form.yearlyPriceStr}
                                onChange={(e) => patch({ yearlyPriceStr: e.target.value })}
                                className={inputCls}
                            />
                            {fieldErrors.yearlyPriceStr && (
                                <p className="mt-1 text-[11px] text-danger">
                                    {fieldErrors.yearlyPriceStr}
                                </p>
                            )}
                        </Field>
                    </div>

                    {serverError && (
                        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                            {serverError}
                        </div>
                    )}

                    {!isEdit && (
                        <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-xs text-info-dark dark:text-info">
                            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" strokeWidth={2} />
                            New plans are created as{" "}
                            <strong className="mx-0.5">active &amp; self-service</strong> by default.
                            Deactivate from the table if needed.
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border dark:border-border-dark px-5 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPending}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark disabled:opacity-60 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-60 transition-colors"
                    >
                        {isPending && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                        )}
                        {isEdit ? "Save changes" : "Create plan"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Deactivate Confirm Modal ─────────────────────────────────────────────────

function DeactivateConfirmModal({
    plan,
    onClose,
}: {
    plan: SubscriptionPlan;
    onClose: () => void;
}) {
    const deactivate = useDeactivateSubscriptionPlanMutation();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-surface-dark shadow-2xl border border-border dark:border-border-dark p-5 space-y-4">
                <div className="flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-danger/10 flex items-center justify-center">
                        <Power className="h-4 w-4 text-danger" strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            Deactivate {plan.name}?
                        </p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">
                            This removes{" "}
                            <span className="font-mono text-[11px]">{plan.code}</span> from the
                            catalog. Existing subscribers keep their current term uninterrupted.
                            The plan will no longer appear in the billing picker for new
                            subscribers.
                        </p>
                    </div>
                </div>
                {deactivate.isError && (
                    <p className="text-xs text-danger">
                        Failed to deactivate. Please retry.
                    </p>
                )}
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={deactivate.isPending}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-fg-muted dark:text-fg-muted-dark hover:bg-border-subtle dark:hover:bg-border-subtle-dark disabled:opacity-60 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() =>
                            deactivate.mutate(plan.id, { onSuccess: onClose })
                        }
                        disabled={deactivate.isPending}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-danger hover:bg-red-600 text-white text-sm font-medium disabled:opacity-60 transition-colors"
                    >
                        {deactivate.isPending && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                        )}
                        Deactivate
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Plan Row ─────────────────────────────────────────────────────────────────

function PlanRow({
    plan,
    isPlatformOwner,
    onEdit,
    onDeactivate,
}: {
    plan: SubscriptionPlan;
    isPlatformOwner: boolean;
    onEdit: (plan: SubscriptionPlan) => void;
    onDeactivate: (plan: SubscriptionPlan) => void;
}) {
    return (
        <tr
            className={`hover:bg-border-subtle/40 dark:hover:bg-border-subtle-dark/40 transition-colors ${
                !plan.active ? "opacity-50" : ""
            }`}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                            plan.active
                                ? "bg-brand-50 dark:bg-brand-900/30"
                                : "bg-border-subtle dark:bg-border-subtle-dark"
                        }`}
                    >
                        <CreditCard
                            className={`h-4 w-4 ${
                                plan.active
                                    ? "text-brand-700 dark:text-brand-300"
                                    : "text-fg-muted dark:text-fg-muted-dark"
                            }`}
                            strokeWidth={2}
                        />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            {plan.name}
                        </p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark font-mono">
                            {plan.code}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark max-w-xs truncate">
                {plan.description ?? "—"}
            </td>
            <td className="px-4 py-3 text-sm font-medium text-fg dark:text-fg-dark">
                {plan.maxUnits != null ? `Up to ${plan.maxUnits}` : "Unlimited"}
            </td>
            <td className="px-4 py-3 text-sm font-semibold text-fg dark:text-fg-dark">
                {plan.monthlyPrice != null ? `${formatCurrency(plan.monthlyPrice)} / mo` : "—"}
            </td>
            <td className="px-4 py-3 text-sm text-fg-muted dark:text-fg-muted-dark">
                {plan.yearlyPrice != null ? `${formatCurrency(plan.yearlyPrice)} / yr` : "—"}
            </td>
            <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                    <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            plan.active
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : "bg-border-subtle text-fg-muted dark:bg-border-subtle-dark dark:text-fg-muted-dark"
                        }`}
                    >
                        {plan.active ? "Active" : "Inactive"}
                    </span>
                    {plan.selfService && plan.active && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                            Self-service
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3">
                {isPlatformOwner ? (
                    plan.active ? (
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => onEdit(plan)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                            >
                                <Pencil className="h-3 w-3" strokeWidth={2} />
                                Edit
                            </button>
                            <button
                                onClick={() => onDeactivate(plan)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-danger bg-danger/10 hover:bg-danger/20 transition-colors"
                            >
                                <Power className="h-3 w-3" strokeWidth={2} />
                                Deactivate
                            </button>
                        </div>
                    ) : (
                        <span className="text-xs text-fg-subtle dark:text-fg-subtle-dark italic">
                            Reactivate via API
                        </span>
                    )
                ) : null}
            </td>
        </tr>
    );
}

// ─── Plan Catalog ─────────────────────────────────────────────────────────────

function PlanCatalog() {
    const { isPlatformOwner, isLoading: roleLoading } = usePlatformRole();
    const { data, isPending, isError, refetch } = useSubscriptionPlansQuery();
    const [formTarget, setFormTarget] = useState<SubscriptionPlan | null | "new">(null);
    const [deactivateTarget, setDeactivateTarget] = useState<SubscriptionPlan | null>(null);

    const isFormOpen = formTarget !== null;
    const isConfirmOpen = deactivateTarget !== null;

    const sortedPlans = data
        ? [...data].sort((a, b) => {
              if (a.active !== b.active) return a.active ? -1 : 1;
              const pa = a.monthlyPrice != null ? parseFloat(a.monthlyPrice) : Infinity;
              const pb = b.monthlyPrice != null ? parseFloat(b.monthlyPrice) : Infinity;
              return pa - pb;
          })
        : [];

    return (
        <>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h2 className="text-sm font-semibold text-fg dark:text-fg-dark">
                            Plan catalog
                        </h2>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                            Active plans appear in the landlord billing picker. Inactive plans are hidden.
                        </p>
                    </div>
                    {!roleLoading && isPlatformOwner && (
                        <button
                            onClick={() => setFormTarget("new")}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-600 text-white text-sm font-medium transition-colors"
                        >
                            <Plus className="h-4 w-4" strokeWidth={2} />
                            Create plan
                        </button>
                    )}
                </div>

                {!roleLoading && !isPlatformOwner && (
                    <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/10 px-4 py-3 text-xs text-info-dark dark:text-info">
                        <Lock className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                        <p>
                            You have read-only access to the plan catalog. Only the platform owner
                            can create, edit, or deactivate plans.
                        </p>
                    </div>
                )}

                {isPending && (
                    <div className="space-y-2">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-14 rounded-xl bg-border-subtle dark:bg-border-subtle-dark animate-pulse"
                            />
                        ))}
                    </div>
                )}

                {isError && !isPending && (
                    <div className="card p-5 text-center">
                        <AlertTriangle
                            className="h-6 w-6 text-warning mx-auto mb-2"
                            strokeWidth={2}
                        />
                        <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-3">
                            Couldn&#39;t load subscription plans.
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="text-xs font-semibold text-brand dark:text-brand-300 underline underline-offset-2"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!isPending && !isError && sortedPlans.length === 0 && (
                    <div className="card p-8 text-center">
                        <CreditCard
                            className="h-8 w-8 text-fg-muted dark:text-fg-muted-dark mx-auto mb-3"
                            strokeWidth={1.5}
                        />
                        <p className="text-sm font-medium text-fg dark:text-fg-dark">
                            No subscription plans yet
                        </p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-1">
                            Create your first plan to start accepting subscriptions.
                        </p>
                    </div>
                )}

                {!isPending && !isError && sortedPlans.length > 0 && (
                    <div className="rounded-xl bg-white dark:bg-surface-dark border border-border dark:border-border-dark shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-border-subtle dark:bg-border-subtle-dark">
                                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-fg-muted dark:text-fg-muted-dark">
                                        <th className="px-4 py-3">Plan</th>
                                        <th className="px-4 py-3">Description</th>
                                        <th className="px-4 py-3">Max units</th>
                                        <th className="px-4 py-3">Monthly price</th>
                                        <th className="px-4 py-3">Yearly price</th>
                                        <th className="px-4 py-3">Status</th>
                                        {isPlatformOwner && (
                                            <th className="px-4 py-3">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border dark:divide-border-dark">
                                    {sortedPlans.map((plan) => (
                                        <PlanRow
                                            key={plan.id}
                                            plan={plan}
                                            isPlatformOwner={isPlatformOwner}
                                            onEdit={(p) => setFormTarget(p)}
                                            onDeactivate={(p) => setDeactivateTarget(p)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {isFormOpen && (
                <PlanFormModal
                    plan={formTarget === "new" ? null : formTarget}
                    onClose={() => setFormTarget(null)}
                />
            )}

            {isConfirmOpen && deactivateTarget && (
                <DeactivateConfirmModal
                    plan={deactivateTarget}
                    onClose={() => setDeactivateTarget(null)}
                />
            )}
        </>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionPlansPage() {
    return (
        <AdminErrorBoundary>
            <div className="min-h-screen bg-surface dark:bg-surface-dark">
                <div className="max-w-7xl mx-auto p-6 space-y-8">
                    <PageHeader
                        title="Subscription plans"
                        subtitle="Platform pricing catalogue and trial policy — the only revenue model"
                        icon={CreditCard}
                        iconTone="from-brand-500 to-brand-600"
                    />

                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-3">
                        <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                            strokeWidth={2}
                        />
                        <p className="text-sm text-emerald-800 dark:text-emerald-200">
                            <span className="font-semibold">Subscription-only billing.</span>{" "}
                            RentManager earns only through flat monthly subscriptions. No commission is
                            ever deducted from landlord rent payments — every shilling goes directly
                            to the landlord&apos;s own M-Pesa.
                        </p>
                    </div>

                    <section className="space-y-3">
                        <h2 className="text-sm font-semibold text-fg dark:text-fg-dark flex items-center gap-2">
                            <Gift className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                            Free trial policy
                        </h2>
                        <TrialInfoCard />
                    </section>

                    <section>
                        <PlanCatalog />
                    </section>
                </div>
            </div>
        </AdminErrorBoundary>
    );
}
