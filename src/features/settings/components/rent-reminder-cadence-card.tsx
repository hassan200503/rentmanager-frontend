// features/settings/components/rent-reminder-cadence-card.tsx
//
// The landlord's control over what their tenants are sent about rent, and
// the only place the cadence is visible from inside the product. Without it
// the scheduler messages real renters every morning on defaults nobody
// chose and nobody can see.
//
// SMS is billed to the landlord per message, so the count of SMS-enabled
// milestones is shown as a running cost signal rather than buried — a
// landlord flipping all six on should understand what they just agreed to
// before the invoice explains it.
"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, Check, Loader2, Mail, MessageCircle, MessageSquare, UserCog } from "lucide-react";
import {
    useRentReminderCadenceQuery,
    useUpdateRentReminderCadenceMutation,
} from "../hooks/use-rent-reminder-cadence";
import { RentReminderPolicy } from "../types/rent-reminder-cadence";

function Toggle({
    checked,
    onChange,
    disabled,
    label,
}: {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
    label: string;
}) {
    return (
        <label
            className={`relative inline-flex shrink-0 ${
                disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
            }`}
        >
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={onChange}
                aria-label={label}
                className="sr-only peer"
            />
            <div className="w-9 h-5 rounded-full bg-border dark:bg-border-dark peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
        </label>
    );
}

export function RentReminderCadenceCard() {
    const { data, isLoading, isError } = useRentReminderCadenceQuery();
    const mutation = useUpdateRentReminderCadenceMutation();

    const [draft, setDraft] = useState<RentReminderPolicy[] | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (data) setDraft(data);
    }, [data]);

    const dirty = useMemo(() => {
        if (!data || !draft) return false;
        return JSON.stringify(data) !== JSON.stringify(draft);
    }, [data, draft]);

    const smsCount = useMemo(
        () => (draft ?? []).filter((p) => p.enabled && p.smsEnabled).length,
        [draft],
    );

    const whatsappCount = useMemo(
        () => (draft ?? []).filter((p) => p.enabled && p.whatsappEnabled).length,
        [draft],
    );

    const patch = (milestone: string, changes: Partial<RentReminderPolicy>) => {
        setSaved(false);
        setDraft((prev) =>
            (prev ?? []).map((p) => (p.milestone === milestone ? { ...p, ...changes } : p)),
        );
    };

    const save = () => {
        if (!draft) return;
        mutation.mutate(
            {
                milestones: draft.map((p) => ({
                    milestone: p.milestone,
                    enabled: p.enabled,
                    smsEnabled: p.smsEnabled,
                    emailEnabled: p.emailEnabled,
                    whatsappEnabled: p.whatsappEnabled,
                    notifyLandlord: p.notifyLandlord,
                })),
            },
            { onSuccess: () => setSaved(true) },
        );
    };

    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <BellRing className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                Rent reminders
            </h2>

            <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-1">
                What your tenants are sent about rent, and when. Reminders go out each morning at
                9:00 EAT.
            </p>
            <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark mb-5">
                Each tenant receives a given reminder once — a reminder is never sent twice for the
                same month, even if the system restarts.
            </p>

            {isLoading && (
                <div className="space-y-2" aria-busy="true">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-14 rounded-lg bg-border-subtle/60 dark:bg-border-subtle-dark/40 animate-pulse" />
                    ))}
                </div>
            )}

            {isError && (
                <p className="text-sm text-danger py-4">
                    Could not load your reminder settings. Refresh the page to try again.
                </p>
            )}

            {draft && !isLoading && !isError && (
                <>
                    {/* Column headings — hidden on mobile, where each row stacks. */}
                    <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle dark:text-fg-subtle-dark">
                        <span>When</span>
                        <span className="w-9 text-center">On</span>
                        <span className="w-9 text-center">Email</span>
                        <span className="w-9 text-center">SMS</span>
                        <span className="w-9 text-center">WA</span>
                        <span className="w-9 text-center">You</span>
                    </div>

                    <div className="divide-y divide-border dark:divide-border-dark">
                        {draft.map((p) => (
                            <div
                                key={p.milestone}
                                className="grid grid-cols-2 sm:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-4 gap-y-3 items-center px-3 py-3"
                            >
                                <div className="col-span-2 sm:col-span-1 min-w-0">
                                    <p className="text-sm font-medium text-fg dark:text-fg-dark">
                                        {p.label}
                                    </p>
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                        {p.dayOffset === 0
                                            ? "Sent on the day rent falls due"
                                            : p.dayOffset < 0
                                              ? `Sent ${Math.abs(p.dayOffset)} days ahead of the due date`
                                              : `Sent ${p.dayOffset} day${p.dayOffset === 1 ? "" : "s"} after rent was due`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 sm:block sm:w-9 sm:text-center">
                                    <span className="sm:hidden text-xs text-fg-muted dark:text-fg-muted-dark">On</span>
                                    <Toggle
                                        checked={p.enabled}
                                        onChange={() => patch(p.milestone, { enabled: !p.enabled })}
                                        label={`Enable ${p.label}`}
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 sm:block sm:w-9 sm:text-center">
                                    <Mail className="h-3.5 w-3.5 sm:hidden text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                                    <Toggle
                                        checked={p.emailEnabled}
                                        disabled={!p.enabled}
                                        onChange={() => patch(p.milestone, { emailEnabled: !p.emailEnabled })}
                                        label={`Email for ${p.label}`}
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 sm:block sm:w-9 sm:text-center">
                                    <MessageSquare className="h-3.5 w-3.5 sm:hidden text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                                    <Toggle
                                        checked={p.smsEnabled}
                                        disabled={!p.enabled}
                                        onChange={() => patch(p.milestone, { smsEnabled: !p.smsEnabled })}
                                        label={`SMS for ${p.label}`}
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 sm:block sm:w-9 sm:text-center">
                                    <MessageCircle className="h-3.5 w-3.5 sm:hidden text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                                    <Toggle
                                        checked={p.whatsappEnabled}
                                        disabled={!p.enabled}
                                        onChange={() => patch(p.milestone, { whatsappEnabled: !p.whatsappEnabled })}
                                        label={`WhatsApp for ${p.label}`}
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 sm:block sm:w-9 sm:text-center">
                                    <UserCog className="h-3.5 w-3.5 sm:hidden text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                                    <Toggle
                                        checked={p.notifyLandlord}
                                        disabled={!p.enabled}
                                        onChange={() => patch(p.milestone, { notifyLandlord: !p.notifyLandlord })}
                                        label={`Notify me for ${p.label}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border dark:border-border-dark flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            {smsCount === 0 && whatsappCount === 0 ? (
                                <>Email only — no SMS or WhatsApp charges.</>
                            ) : (
                                <>
                                    {smsCount > 0 && (
                                        <span className="font-medium text-fg dark:text-fg-dark">
                                            {smsCount} SMS
                                        </span>
                                    )}
                                    {smsCount > 0 && whatsappCount > 0 && " + "}
                                    {whatsappCount > 0 && (
                                        <span className="font-medium text-fg dark:text-fg-dark">
                                            {whatsappCount} WhatsApp
                                        </span>
                                    )}
                                    {" "}per tenant per month at most. WhatsApp only reaches opted-in renters. Email costs nothing.
                                </>
                            )}
                        </p>

                        <div className="flex items-center gap-3">
                            {saved && !dirty && (
                                <span className="inline-flex items-center gap-1.5 text-xs text-success">
                                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                    Saved
                                </span>
                            )}
                            {mutation.isError && (
                                <span className="text-xs text-danger">
                                    Could not save. Try again.
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={save}
                                disabled={!dirty || mutation.isPending}
                                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {mutation.isPending && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                                )}
                                Save changes
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
