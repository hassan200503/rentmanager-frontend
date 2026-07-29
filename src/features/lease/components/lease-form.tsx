"use client";

import { useForm, useController, Controller, Resolver, Control } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    DoorOpen,
    FileText,
    Wallet,
    Settings2,
    Loader2,
    Building2,
    KeyRound,
} from "lucide-react";
import { useCreateLease } from "../hooks/use-create-lease";
import type { LeaseType, BillingCycle } from "../types/lease-response";
import { leaseSchema, LeaseFormValues } from "../validations/lease-schema";
import { usePropertiesQuery } from "@/features/property/queries/use-properties-query";
import { useUnitsQuery } from "@/features/unit/queries/use-units-query";
import { Combobox } from "@/shared/components/ui/Combobox";
import { toast } from "sonner";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";

type LeaseFormProps = {
    onSubmit?: () => void;
};

const resolver: Resolver<LeaseFormValues> = async (values) => {
    const result = leaseSchema.safeParse(values);
    if (result.success) return { values: result.data, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!errors[path]) errors[path] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors };
};

const defaultValues: LeaseFormValues = {
    propertyId: "",
    unitId: "",
    tenantProfileId: "",
    leaseNumber: `LSE-${Date.now().toString(36).toUpperCase()}`,
    leaseType: "FIXED_TERM" as LeaseType,
    billingCycle: "MONTHLY" as BillingCycle,
    startDate: "",
    endDate: "",
    rentAmount: 0,
    securityDeposit: 0,
    lateFeeAmount: 0,
    gracePeriodDays: 0,
    autoRenew: false,
};

function SectionHeader({ icon: Icon, title, description }: { icon: typeof DoorOpen; title: string; description?: string }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-50 dark:bg-brand-900/40">
                <Icon className="h-3.5 w-3.5 text-brand dark:text-brand-300" strokeWidth={2} />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-fg dark:text-fg-dark leading-tight">{title}</h3>
                {description && <p className="text-xs text-fg-muted dark:text-fg-muted-dark leading-tight mt-0.5">{description}</p>}
            </div>
        </div>
    );
}

function CurrencyInput({ label, name, control, error }: { label: string; name: "rentAmount" | "securityDeposit" | "lateFeeAmount"; control: Control<LeaseFormValues>; error?: string }) {
    const { field } = useController({ name, control });
    return (
        <label className="space-y-1.5">
            <span className="form-label">{label}</span>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-fg-muted dark:text-fg-muted-dark pointer-events-none">KES</span>
                <input
                    {...field}
                    value={field.value ?? 0}
                    className="form-input font-mono-nums !pl-12 pr-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    type="text"
                    inputMode="numeric"
                    onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9.]/g, "");
                        field.onChange(raw === "" ? 0 : Number(raw));
                    }}
                />
            </div>
            {error && <span className="text-xs text-danger">{error}</span>}
        </label>
    );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-center justify-between gap-4 cursor-pointer">
            <div>
                <span className="text-sm font-medium text-fg dark:text-fg-dark">{label}</span>
                {description && <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">{description}</p>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${checked ? "bg-brand" : "bg-border dark:bg-border-dark"}`}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
        </label>
    );
}

export const LeaseForm = ({ onSubmit }: LeaseFormProps) => {
    const router = useRouter();
    const { createLease, isLoading } = useCreateLease();
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<LeaseFormValues>({ resolver, defaultValues });

    const selectedPropertyId = watch("propertyId");

    const propertiesQuery = usePropertiesQuery({ page: 0, size: 100 });
    const unitsQuery = useUnitsQuery({ propertyId: selectedPropertyId, page: 0, size: 100 });

    const propertyOptions = (propertiesQuery.data?.content ?? []).map((p) => ({
        value: p.propertyId,
        label: p.name,
        description: p.propertyType?.toLowerCase(),
    }));

    const unitOptions = (unitsQuery.data?.content ?? []).map((u) => ({
        value: u.id,
        label: `Unit ${u.unitNumber}`,
        description: u.label || (u.status ? u.status.toLowerCase() : undefined),
    }));

    async function onValid(values: LeaseFormValues) {
        setSubmitError(null);
        try {
            const lease = await createLease({
                propertyId: values.propertyId,
                unitId: values.unitId,
                tenantProfileId: values.tenantProfileId,
                leaseNumber: values.leaseNumber,
                leaseType: values.leaseType,
                billingCycle: values.billingCycle,
                startDate: values.startDate,
                endDate: values.endDate,
                rentAmount: values.rentAmount,
                securityDeposit: values.securityDeposit,
                lateFeeAmount: values.lateFeeAmount,
                gracePeriodDays: values.gracePeriodDays,
                autoRenew: values.autoRenew,
            });
            onSubmit?.();
            router.push(`/dashboard/leases/${lease.id}`);
        } catch (err) {
            const msg = getProcessErrorMessage(err, "Could not create the lease. Please try again.");
            setSubmitError(msg);
            toast.error(msg);
        }
    }

    return (
        <form onSubmit={handleSubmit(onValid)} className="space-y-8 animate-fade-in-up">
            {/* ── Section 1: Assignment ── */}
            <div>
                <SectionHeader icon={Building2} title="Assignment" description="Select the property, unit, and tenant for this lease" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Controller
                        name="propertyId"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                label="Property"
                                required
                                options={propertyOptions}
                                value={field.value}
                                onChange={(val) => { field.onChange(val); setValue("unitId", ""); }}
                                placeholder="Search properties…"
                                searchPlaceholder="Search properties…"
                                loading={propertiesQuery.isLoading}
                                emptyMessage="No properties found"
                                error={errors.propertyId?.message}
                            />
                        )}
                    />
                    <Controller
                        name="unitId"
                        control={control}
                        render={({ field }) => (
                            <Combobox
                                label="Unit"
                                required
                                options={unitOptions}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder={selectedPropertyId ? "Search units…" : "Select a property first"}
                                searchPlaceholder="Search units…"
                                loading={unitsQuery.isLoading && !!selectedPropertyId}
                                disabled={!selectedPropertyId}
                                emptyMessage={selectedPropertyId ? "No units found" : "Select a property first"}
                                error={errors.unitId?.message}
                            />
                        )}
                    />
                </div>
                <div className="mt-4">
                    <label className="form-label flex items-center gap-1">
                        Tenant Profile ID <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark pointer-events-none" strokeWidth={2} />
                        <input {...register("tenantProfileId")} className="form-input font-mono-nums !pl-9 text-xs" placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" />
                    </div>
                    {errors.tenantProfileId?.message && <p className="text-xs text-danger mt-1">{errors.tenantProfileId.message}</p>}
                    <p className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark mt-1.5">Paste the tenant&apos;s profile UUID from their details page.</p>
                </div>
            </div>

            {/* ── Section 2: Lease Terms ── */}
            <div className="border-t border-border dark:border-border-dark pt-6">
                <SectionHeader icon={FileText} title="Lease terms" description="Define the lease type, billing cycle, and duration" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-1.5">
                        <span className="form-label">Lease number</span>
                        <input {...register("leaseNumber")} className="form-input font-mono-nums" placeholder="LSE-..." />
                        {errors.leaseNumber?.message && <span className="text-xs text-danger">{errors.leaseNumber.message}</span>}
                    </label>
                    <label className="space-y-1.5">
                        <span className="form-label">Lease type</span>
                        <select {...register("leaseType")} className="form-input">
                            <option value="STANDARD">Standard</option>
                            <option value="FIXED_TERM">Fixed Term</option>
                            <option value="MONTH_TO_MONTH">Month to Month</option>
                        </select>
                        {errors.leaseType?.message && <span className="text-xs text-danger">{errors.leaseType.message}</span>}
                    </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <label className="space-y-1.5">
                        <span className="form-label">Billing cycle</span>
                        <select {...register("billingCycle")} className="form-input">
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="QUARTERLY">Quarterly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                    </label>
                    <label className="space-y-1.5">
                        <span className="form-label">Start date</span>
                        <input type="date" {...register("startDate")} className="form-input" />
                        {errors.startDate?.message && <span className="text-xs text-danger">{errors.startDate.message}</span>}
                    </label>
                    <label className="space-y-1.5">
                        <span className="form-label">End date</span>
                        <input type="date" {...register("endDate")} className="form-input" />
                        {errors.endDate?.message && <span className="text-xs text-danger">{errors.endDate.message}</span>}
                    </label>
                </div>
            </div>

            {/* ── Section 3: Financial ── */}
            <div className="border-t border-border dark:border-border-dark pt-6">
                <SectionHeader icon={Wallet} title="Financial terms" description="Set rent, deposit, and penalty configuration" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CurrencyInput label="Rent amount" name="rentAmount" control={control} error={errors.rentAmount?.message} />
                    <CurrencyInput label="Security deposit" name="securityDeposit" control={control} error={errors.securityDeposit?.message} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <CurrencyInput label="Late fee" name="lateFeeAmount" control={control} error={errors.lateFeeAmount?.message} />
                    <label className="space-y-1.5">
                        <span className="form-label">Grace period (days)</span>
                        <input type="number" min="0" step="1" {...register("gracePeriodDays", { valueAsNumber: true })} className="form-input font-mono-nums" />
                        {errors.gracePeriodDays?.message && <span className="text-xs text-danger">{errors.gracePeriodDays.message}</span>}
                    </label>
                </div>
            </div>

            {/* ── Section 4: Options ── */}
            <div className="border-t border-border dark:border-border-dark pt-6">
                <SectionHeader icon={Settings2} title="Options" description="Configure renewal behaviour" />
                <div className="card-sm">
                    <Controller
                        name="autoRenew"
                        control={control}
                        render={({ field }) => (
                            <Toggle
                                label="Auto-renew"
                                description="Automatically renew this lease when it expires"
                                checked={field.value}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </div>
            </div>

            {submitError && (
                <div className="rounded-xl bg-danger-bg dark:bg-danger-bg-dark border border-danger/20 px-4 py-3 flex items-center gap-2">
                    <span className="text-sm text-danger dark:text-danger">{submitError}</span>
                </div>
            )}

            <div className="border-t border-border dark:border-border-dark pt-6">
                <button type="submit" disabled={isLoading} className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
                    {isLoading ? "Creating…" : "Create lease"}
                </button>
            </div>
        </form>
    );
};
