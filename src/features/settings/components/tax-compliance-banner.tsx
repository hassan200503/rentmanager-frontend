// features/settings/components/tax-compliance-banner.tsx
// Client-side tax-treatment summary surfaced on the Billing/Transactions page.
// Shows the landlord's KRA compliance state derived purely from the tenant
// settings already returned by the existing API (kraPin + vatRegistered) —
// no new backend contract. Compliments the in-Settings TaxComplianceCard with
// a lightweight, glanceable status + drive-to-Settings when the PIN is missing.
"use client";

import Link from "next/link";
import { Landmark, ShieldCheck, AlertTriangle, ArrowRight, Settings2 } from "lucide-react";
import { useTenantSettingsQuery } from "../hooks/use-tenant-settings-query";

export function TaxComplianceBanner() {
    const { data, isLoading } = useTenantSettingsQuery();

    // Don't flash a warning while the settings query is still in flight (or a
    // non-landlord context where there is no settings endpoint).
    if (isLoading || !data) return null;

    const kraPin = (data.kraPin ?? "").trim();
    const vatRegistered = data.vatRegistered ?? false;

    // ── No KRA PIN yet: soft, fail-open nudge ──
    if (!kraPin) {
        return (
            <div className="flex flex-col gap-3 rounded-2xl border border-warning/25 bg-warning/5 p-4 sm:flex-row sm:items-center animate-fade-in-up">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15">
                    <AlertTriangle className="h-5 w-5 text-warning-dark dark:text-warning" strokeWidth={1.75} />
                </div>
                <div className="flex-1 text-sm">
                    <p className="font-semibold text-ink dark:text-fg-dark">Complete your KRA tax profile</p>
                    <p className="mt-0.5 text-ink-muted dark:text-fg-muted">
                        Add your KRA PIN to enable e-invoicing. Residential rent is MRI-eligible
                        (7.5% final tax); commercial rent attracts 16% VAT when you&apos;re VAT-registered.
                    </p>
                </div>
                <Link
                    href="/dashboard/settings"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-warning/15 px-4 py-2 text-sm font-medium text-warning-dark dark:text-warning transition-colors hover:bg-warning/25"
                >
                    Set up <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
            </div>
        );
    }

    // ── KRA PIN present: show applied treatment ──
    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-brand-200/60 bg-brand-50/60 p-4 dark:border-brand-800 dark:bg-brand-900/20 sm:flex-row sm:items-center animate-fade-in-up">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                <Landmark className="h-5 w-5 text-brand" strokeWidth={1.75} />
            </div>
            <div className="flex-1 text-sm">
                <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-ink dark:text-fg-dark">
                    KRA PIN set
                    {vatRegistered ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success-dark dark:text-success">
                            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} /> VAT registered
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted">
                            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} /> Not VAT registered
                        </span>
                    )}
                </p>
                <p className="mt-0.5 text-ink-muted dark:text-fg-muted">
                    Residential rent is MRI-eligible (7.5% final tax).{" "}
                    {vatRegistered
                        ? "Commercial rent is charged 16% VAT on your account."
                        : "Commercial rent stays VAT-exempt until you confirm VAT registration."}
                </p>
            </div>
            <Link
                href="/dashboard/settings"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-surface px-4 py-2 text-sm font-medium text-ink ring-1 ring-border/70 transition-colors hover:bg-ink/[0.02] dark:bg-border-subtle-dark dark:text-fg-dark"
            >
                <Settings2 className="h-4 w-4" strokeWidth={1.75} /> Manage
            </Link>
        </div>
    );
}
