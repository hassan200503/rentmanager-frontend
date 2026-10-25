// features/settings/components/branding-card.tsx
"use client";

import { useState } from "react";
import { Palette, Loader2, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
    useTenantSettingsQuery,
    useUpdateTenantSettingsMutation,
} from "../hooks/use-tenant-settings-query";

const PRESET_COLORS = [
    { name: "Emerald", value: "#059669" },
    { name: "Royal", value: "#4F46E5" },
    { name: "Ocean", value: "#0891B2" },
    { name: "Ruby", value: "#E11D48" },
    { name: "Amber", value: "#D97706" },
    { name: "Violet", value: "#7C3AED" },
];

function BrandingForm({
    initialPrimary,
    initialSecondary,
}: {
    initialPrimary: string;
    initialSecondary: string;
}) {
    const update = useUpdateTenantSettingsMutation();
    const [primary, setPrimary] = useState(initialPrimary);
    const [secondary, setSecondary] = useState(initialSecondary);

    const handleSave = async () => {
        try {
            await update.mutateAsync({
                primaryColor: primary.trim() ? primary.trim() : null,
                secondaryColor: secondary.trim() ? secondary.trim() : null,
            });
            toast.success("Branding saved. Visible to renters while you're on the Premium plan.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save branding");
        }
    };

    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <Palette className="h-4 w-4 text-brand" strokeWidth={2} />
                Branding
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 text-[10px] font-semibold text-brand-dark dark:text-brand-300 border border-brand-200 dark:border-brand-700">
                    <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
                    Premium
                </span>
            </h2>
            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                Brand the tenant portal with your colors. Applied to renters only while your
                subscription is active.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="form-label">Primary color</label>
                    <div className="mt-1 flex items-center gap-3">
                        <input
                            type="color"
                            value={primary}
                            onChange={(e) => setPrimary(e.target.value)}
                            className="h-10 w-14 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark cursor-pointer"
                        />
                        <input
                            value={primary}
                            onChange={(e) => setPrimary(e.target.value)}
                            placeholder="#059669"
                            className="form-input flex-1"
                        />
                    </div>
                </div>
                <div>
                    <label className="form-label">Secondary color</label>
                    <div className="mt-1 flex items-center gap-3">
                        <input
                            type="color"
                            value={secondary}
                            onChange={(e) => setSecondary(e.target.value)}
                            className="h-10 w-14 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark cursor-pointer"
                        />
                        <input
                            value={secondary}
                            onChange={(e) => setSecondary(e.target.value)}
                            placeholder="#10B981"
                            className="form-input flex-1"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                    <button
                        key={c.name}
                        type="button"
                        onClick={() => setPrimary(c.value)}
                        title={c.name}
                        className="h-8 w-8 rounded-lg border border-border dark:border-border-dark transition-transform hover:scale-110"
                        style={{ backgroundColor: c.value }}
                    />
                ))}
            </div>

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
                    Save branding
                </button>
                {update.isSuccess && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>
                )}
            </div>
        </div>
    );
}

export function BrandingCard() {
    const { data, isLoading } = useTenantSettingsQuery();

    if (isLoading) {
        return (
            <div className="card animate-fade-in-up">
                <h2 className="section-header inline-flex items-center gap-2">
                    <Palette className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    Branding
                </h2>
                <div className="skeleton h-24" />
            </div>
        );
    }

    return (
        <BrandingForm
            key={`${data?.primaryColor ?? "d"}|${data?.secondaryColor ?? "d"}`}
            initialPrimary={data?.primaryColor ?? "#059669"}
            initialSecondary={data?.secondaryColor ?? "#10B981"}
        />
    );
}
