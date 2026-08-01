// features/settings/components/emergency-contact-card.tsx
"use client";

import { useState } from "react";
import { PhoneCall, Loader2, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import {
    useTenantSettingsQuery,
    useUpdateTenantSettingsMutation,
} from "../hooks/use-tenant-settings-query";

function EmergencyContactForm({
    initialPhone,
    initial24h,
}: {
    initialPhone: string;
    initial24h: boolean;
}) {
    const update = useUpdateTenantSettingsMutation();
    const [phone, setPhone] = useState(initialPhone);
    const [is24h, setIs24h] = useState(initial24h);

    const handleSave = async () => {
        try {
            await update.mutateAsync({
                emergencyContactPhone: phone.trim() ? phone.trim() : null,
                emergencyContact24h: is24h,
            });
            toast.success("Emergency contact saved. Renters see it on the tenant portal.");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save emergency contact");
        }
    };

    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <PhoneCall className="h-4 w-4 text-brand" strokeWidth={2} />
                Emergency Contact
            </h2>
            <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                Shown to all your renters on the tenant portal — available on every plan.
            </p>

            <div className="mt-4">
                <label className="form-label">Phone number</label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254712345678"
                    className="form-input mt-1"
                />
            </div>

            <label className="mt-4 flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg hover:bg-border-subtle/50 dark:hover:bg-border-subtle-dark/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    <div>
                        <p className="text-sm font-medium text-fg dark:text-fg-dark">Available 24/7</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            Renters will treat this line as always reachable
                        </p>
                    </div>
                </div>
                <div className="relative shrink-0">
                    <input
                        type="checkbox"
                        checked={is24h}
                        onChange={(e) => setIs24h(e.target.checked)}
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
                    Save emergency contact
                </button>
                {update.isSuccess && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>
                )}
            </div>
        </div>
    );
}

export function EmergencyContactCard() {
    const { data, isLoading } = useTenantSettingsQuery();

    if (isLoading) {
        return (
            <div className="card animate-fade-in-up">
                <h2 className="section-header inline-flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                    Emergency Contact
                </h2>
                <div className="skeleton h-24" />
            </div>
        );
    }

    return (
        <EmergencyContactForm
            key={`${data?.emergencyContactPhone ?? ""}|${data?.emergencyContact24h ?? false}`}
            initialPhone={data?.emergencyContactPhone ?? ""}
            initial24h={data?.emergencyContact24h ?? false}
        />
    );
}
