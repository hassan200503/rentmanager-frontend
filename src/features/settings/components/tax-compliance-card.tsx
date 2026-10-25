// features/settings/components/tax-compliance-card.tsx
// KRA tax profile for the landlord organisation: KRA PIN + VAT-registration
// status. These are the fail-closed inputs that (together with COMMERCIAL
// premises) decide whether rent attracts the 16% VAT branch; residential
// rent always pays MRI (7.5% final tax). Free tier.
"use client";

import { useState } from "react";
import { Landmark, Loader2, Check, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
    useTenantSettingsQuery,
    useUpdateTenantSettingsMutation,
} from "../hooks/use-tenant-settings-query";

const normalizeKraPin = (value: string) => {
    const trimmed = value.trim().toUpperCase();
    return trimmed || null;
};

function TaxComplianceForm({
    initialKraPin,
    initialVatRegistered,
}: {
    initialKraPin: string;
    initialVatRegistered: boolean;
}) {
    const update = useUpdateTenantSettingsMutation();
    const [kraPin, setKraPin] = useState(initialKraPin);
    const [vatRegistered, setVatRegistered] = useState(initialVatRegistered);

    const handleSave = async () => {
        try {
            await update.mutateAsync({
                kraPin: normalizeKraPin(kraPin),
                vatRegistered,
            });
            toast.success("Tax profile saved. Commercial rent billing will follow this setting.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save tax profile");
        }
    };

    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <Landmark className="h-4 w-4 text-brand" strokeWidth={2} />
                Tax &amp; compliance
            </h2>
            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                Your KRA identity for invoices and returns. Residential rent pays MRI at
                7.5% (final tax, resident landlords — Finance Act 2023). Non-resident
                landlords are subject to a separate regime under ITA section 6B; confirm
                your rate with a tax advisor. Commercial rent on VAT-registered accounts
                attracts 16% VAT.
            </p>

            <div className="mt-4">
                <label className="form-label">KRA PIN</label>
                <input
                    type="text"
                    value={kraPin}
                    onChange={(e) => setKraPin(e.target.value)}
                    placeholder="e.g. A123456789X"
                    maxLength={11}
                    autoCapitalize="characters"
                    className="form-input mt-1 font-mono uppercase"
                />
                <p className="mt-1 text-xs text-fg-muted dark:text-fg-muted-dark">
                    Used on eTIMS invoices and eRITS property registrations once KRA
                    transmission is enabled.
                </p>
            </div>

            <label className="mt-4 flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    <div>
                        <p className="text-sm font-medium text-fg dark:text-fg-dark">VAT registered</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            Confirm with your accountant before enabling — commercial rent
                            becomes standard-rated 16% VAT.
                        </p>
                    </div>
                </div>
                <div className="relative shrink-0">
                    <input
                        type="checkbox"
                        checked={vatRegistered}
                        onChange={(e) => setVatRegistered(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-9 h-5 rounded-full bg-border dark:bg-border-dark peer-checked:bg-brand transition-colors cursor-pointer after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </div>
            </label>

            <div className="mt-4 flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={update.isPending}
                    className="btn-primary gap-2"
                >
                    {update.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                    ) : (
                        <Check className="h-4 w-4" strokeWidth={2} />
                    )}
                    Save tax profile
                </button>
                {update.isSuccess && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>
                )}
            </div>
        </div>
    );
}

export function TaxComplianceCard() {
    const { data, isLoading, isError, refetch } = useTenantSettingsQuery();

    if (isLoading) {
        return (
            <div className="card animate-fade-in-up">
                <h2 className="section-header inline-flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    Tax &amp; compliance
                </h2>
                <div className="skeleton h-24" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="card animate-fade-in-up">
                <h2 className="section-header inline-flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    Tax &amp; compliance
                </h2>
                <div className="mt-3 flex flex-col items-start gap-3">
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                        We couldn&#39;t load your KRA tax profile.
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="btn-outline gap-2"
                    >
                        <RefreshCw className="h-4 w-4" strokeWidth={2} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <TaxComplianceForm
            key={`${data?.kraPin ?? ""}|${data?.vatRegistered ?? false}`}
            initialKraPin={data?.kraPin ?? ""}
            initialVatRegistered={data?.vatRegistered ?? false}
        />
    );
}
