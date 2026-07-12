// src/app/dashboard/leases/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateLease } from "@/features/lease/hooks/use-create-lease";
import { LeaseType, BillingCycle } from "@/features/lease/types/lease-response";

// ASSUMPTION FLAGGED: propertyId/unitId/tenantProfileId are plain text UUID
// inputs here rather than searchable dropdowns, since no confirmed
// useProperties/useUnitsQuery(no propertyId)/useTenantProfiles hooks were
// available to wire real lookups. Replace with real selectors once those
// hooks are confirmed — this is functionally correct but poor UX as-is.

export default function CreateLeasePage() {
    const router = useRouter();
    const { createLease, isLoading, error } = useCreateLease();

    const [form, setForm] = useState({
        propertyId: "",
        unitId: "",
        tenantProfileId: "",
        leaseNumber: "",
        leaseType: "FIXED_TERM" as LeaseType,
        billingCycle: "MONTHLY" as BillingCycle,
        startDate: "",
        endDate: "",
        rentAmount: "",
        securityDeposit: "",
        lateFeeAmount: "0",
        gracePeriodDays: "0",
        autoRenew: false,
    });

    const update = (field: keyof typeof form, value: string | boolean) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const lease = await createLease({
                propertyId: form.propertyId,
                unitId: form.unitId,
                tenantProfileId: form.tenantProfileId,
                leaseNumber: form.leaseNumber,
                leaseType: form.leaseType,
                billingCycle: form.billingCycle,
                startDate: form.startDate,
                endDate: form.endDate,
                rentAmount: Number(form.rentAmount),
                securityDeposit: Number(form.securityDeposit),
                lateFeeAmount: Number(form.lateFeeAmount),
                gracePeriodDays: Number(form.gracePeriodDays),
                autoRenew: form.autoRenew,
            });
            router.push(`/dashboard/leases/${lease.id}`);
        } catch {
            // error surfaced via toast in useCreateLeaseMutation; nothing extra to do here
        }
    };

    return (
        <div className="page-container space-y-6">
            <div>
                <h1 className="page-title mb-1">New Lease</h1>
                <p className="page-subtitle">Create a new lease agreement</p>
            </div>

            <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="form-label">Property ID</label>
                        <input className="form-input" value={form.propertyId} onChange={(e) => update("propertyId", e.target.value)} required />
                    </div>
                    <div>
                        <label className="form-label">Unit ID</label>
                        <input className="form-input" value={form.unitId} onChange={(e) => update("unitId", e.target.value)} required />
                    </div>
                    <div>
                        <label className="form-label">Tenant Profile ID</label>
                        <input className="form-input" value={form.tenantProfileId} onChange={(e) => update("tenantProfileId", e.target.value)} required />
                    </div>
                </div>

                <div>
                    <label className="form-label">Lease Number</label>
                    <input className="form-input" value={form.leaseNumber} onChange={(e) => update("leaseNumber", e.target.value)} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="form-label">Lease Type</label>
                        <select className="form-input" value={form.leaseType} onChange={(e) => update("leaseType", e.target.value)}>
                            <option value="STANDARD">Standard</option>
                            <option value="FIXED_TERM">Fixed Term</option>
                            <option value="MONTH_TO_MONTH">Month to Month</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Billing Cycle</label>
                        <select className="form-input" value={form.billingCycle} onChange={(e) => update("billingCycle", e.target.value)}>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="QUARTERLY">Quarterly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="form-label">Start Date</label>
                        <input type="date" className="form-input" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} required />
                    </div>
                    <div>
                        <label className="form-label">End Date</label>
                        <input type="date" className="form-input" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="form-label">Rent Amount</label>
                        <input type="number" min="0" step="0.01" className="form-input" value={form.rentAmount} onChange={(e) => update("rentAmount", e.target.value)} required />
                    </div>
                    <div>
                        <label className="form-label">Security Deposit</label>
                        <input type="number" min="0" step="0.01" className="form-input" value={form.securityDeposit} onChange={(e) => update("securityDeposit", e.target.value)} required />
                    </div>
                    <div>
                        <label className="form-label">Late Fee</label>
                        <input type="number" min="0" step="0.01" className="form-input" value={form.lateFeeAmount} onChange={(e) => update("lateFeeAmount", e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="form-label">Grace Period (days)</label>
                        <input type="number" min="0" className="form-input" value={form.gracePeriodDays} onChange={(e) => update("gracePeriodDays", e.target.value)} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-ink-muted mb-2">
                        <input type="checkbox" checked={form.autoRenew} onChange={(e) => update("autoRenew", e.target.checked)} />
                        Auto-renew
                    </label>
                </div>

                {error && <p className="text-sm text-danger">{error.message}</p>}

                <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? "Creating…" : "Create Lease"}
                </button>
            </form>
        </div>
    );
}