// features/settings/components/tax-compliance-note.tsx
// Ultra-lightweight, muted inline CTA shown ONLY when the landlord has no KRA
// PIN set — used on secondary money pages (e.g. Rent Ledger) where the full
// banner would be redundant noise. Returns null in every other state (PIN set,
// loading, or no settings context), so it adds no visual weight when complete.
"use client";

import Link from "next/link";
import { useTenantSettingsQuery } from "../hooks/use-tenant-settings-query";

export function TaxComplianceNote() {
    const { data, isLoading } = useTenantSettingsQuery();

    if (isLoading || !data) return null;
    if ((data.kraPin ?? "").trim()) return null;

    return (
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-fg-muted dark:text-fg-muted-dark animate-fade-in-up">
            <span>KRA PIN not set —</span>
            <Link
                href="/dashboard/settings"
                className="font-medium text-brand dark:text-brand-300 underline underline-offset-2 transition-opacity hover:opacity-80"
            >
                enable e-invoicing in Settings
            </Link>
            <span>.</span>
        </p>
    );
}
