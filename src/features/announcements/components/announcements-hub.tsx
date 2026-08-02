// components/announcements-hub.tsx
"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Info,
    Loader2,
    Mail,
    Megaphone,
    MessageCircle,
    MessageSquare,
    Send,
    Smartphone,
} from "lucide-react";
import {
    useAnnouncementPreviewQuery,
    useAnnouncementsHistoryQuery,
    useCreateAnnouncementMutation,
} from "../hooks/use-announcements-query";
import {
    AnnouncementChannel,
    AnnouncementDeliveryStatus,
    AnnouncementHistoryItem,
    AnnouncementPriority,
} from "../types/announcement-response";

const ALL_CHANNELS: AnnouncementChannel[] = ["IN_APP", "SMS", "EMAIL", "WHATSAPP"];

const CHANNEL_META: Record<AnnouncementChannel, { label: string; icon: React.ComponentType<{ className?: string }>; hint: string }> = {
    IN_APP: { label: "In-app", icon: Smartphone, hint: "Always on - the renter portal" },
    SMS: { label: "SMS", icon: MessageSquare, hint: "Full message, billed per message" },
    EMAIL: { label: "Email", icon: Mail, hint: "Full message, free" },
    WHATSAPP: { label: "WhatsApp", icon: MessageCircle, hint: "Template-constrained, opt-in only" },
};

const STATUS_META: Record<AnnouncementDeliveryStatus, { badge: string; label: string }> = {
    PENDING: { badge: "badge-neutral", label: "pending" },
    SENT: { badge: "badge-info", label: "sent" },
    DELIVERED: { badge: "badge-success", label: "delivered" },
    FAILED: { badge: "badge-danger", label: "failed" },
    SKIPPED_NO_OPTIN: { badge: "badge-warning", label: "skipped - no opt-in" },
};

function formatDate(value: string | null): string {
    if (!value) return "-";
    return new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function AnnouncementsHub() {
    const historyQuery = useAnnouncementsHistoryQuery();
    const createMutation = useCreateAnnouncementMutation();

    const [message, setMessage] = useState("");
    const [priority, setPriority] = useState<AnnouncementPriority>("INFO");
    const [selected, setSelected] = useState<Set<AnnouncementChannel>>(new Set(ALL_CHANNELS));
    const [expiresAt, setExpiresAt] = useState("");

    const selectedList = useMemo(() => ALL_CHANNELS.filter((c) => selected.has(c)), [selected]);

    const previewEnabled = message.trim().length > 0;
    const previewQuery = useAnnouncementPreviewQuery(selectedList, previewEnabled);

    const toggleChannel = (channel: AnnouncementChannel) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(channel)) {
                next.delete(channel);
            } else {
                next.add(channel);
            }
            return next;
        });
    };

    const canSend = message.trim().length > 0 && !createMutation.isPending;

    const handleSend = () => {
        if (!canSend) return;
        createMutation.mutate(
            {
                message: message.trim(),
                priority,
                channels: selectedList,
                expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
            },
            {
                onSuccess: () => {
                    setMessage("");
                    setExpiresAt("");
                },
            },
        );
    };

    return (
        <div className="page-container space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="page-title">Announcements</h1>
                <p className="page-subtitle">
                    Broadcast a message to every active renter - in-app, SMS, email, and WhatsApp.
                    SMS and WhatsApp cost real money per message, so you always see the recipient
                    count before confirming.
                </p>
            </div>

            <div className="animate-fade-in-up grid gap-6 lg:grid-cols-5">
                {/* ── Compose ─────────────────────────────────────────── */}
                <section className="card space-y-5 lg:col-span-3">
                    <div className="section-header">
                        <h2 className="section-title">Compose broadcast</h2>
                        <p className="section-subtitle">
                            The message is delivered verbatim to in-app, SMS and email; WhatsApp
                            carries a template link back into the app.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="form-label" htmlFor="announcement-message">
                            Message
                        </label>
                        <textarea
                            id="announcement-message"
                            className="form-input min-h-32 resize-y"
                            placeholder="e.g. Lift maintenance is scheduled for Friday, 8am - 12pm..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={2000}
                        />
                        <p className="text-xs text-fg-muted">
                            {message.length}/2000 characters
                            {message.length > 500 && (
                                <span className="ml-2 text-fg-subtle">
                                    WhatsApp will carry the first 500 characters (template limit).
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="form-label" htmlFor="announcement-priority">
                                Priority
                            </label>
                            <select
                                id="announcement-priority"
                                className="form-input"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                            >
                                <option value="INFO">Info</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="form-label" htmlFor="announcement-expiry">
                                Hide after (optional)
                            </label>
                            <input
                                id="announcement-expiry"
                                type="datetime-local"
                                className="form-input"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="form-label">Channels</span>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {ALL_CHANNELS.map((channel) => {
                                const meta = CHANNEL_META[channel];
                                const Icon = meta.icon;
                                const checked = selected.has(channel);
                                const locked = channel === "IN_APP";
                                return (
                                    <label
                                        key={channel}
                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                                            checked
                                                ? "border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/30"
                                                : "border-border hover:border-fg-subtle/40"
                                        } ${locked ? "cursor-default" : ""}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="mt-0.5 h-4 w-4 accent-emerald-600"
                                            checked={checked}
                                            disabled={locked}
                                            onChange={() => toggleChannel(channel)}
                                        />
                                        <span className="space-y-0.5">
                                            <span className="flex items-center gap-2 text-sm font-medium text-fg">
                                                <Icon className="h-4 w-4 text-emerald-600" />
                                                {meta.label}
                                            </span>
                                            <span className="block text-xs text-fg-muted">{meta.hint}</span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        className="btn-primary w-full"
                        onClick={handleSend}
                        disabled={!canSend}
                    >
                        {createMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        Send announcement
                    </button>
                </section>

                {/* ── Recipient preview ───────────────────────────────── */}
                <aside className="space-y-4 lg:col-span-2">
                    <div className="card">
                        <div className="section-header">
                            <h2 className="section-title">Recipient preview</h2>
                            <p className="section-subtitle">
                                Live counts from the same planner the broadcast job runs - what you
                                confirm is what executes.
                            </p>
                        </div>

                        {!previewEnabled ? (
                            <p className="empty-state py-8 text-sm">
                                Start typing a message to see who this will reach.
                            </p>
                        ) : previewQuery.isLoading ? (
                            <div className="space-y-3 py-2">
                                <div className="skeleton h-10 w-full" />
                                <div className="skeleton h-10 w-full" />
                            </div>
                        ) : previewQuery.isError || !previewQuery.data ? (
                            <p className="empty-state py-8 text-sm">
                                Could not load the recipient preview.{" "}
                                <button className="text-emerald-600 hover:underline" onClick={() => previewQuery.refetch()}>
                                    Retry
                                </button>
                            </p>
                        ) : (
                            <ul className="space-y-3">
                                {ALL_CHANNELS.filter((c) => selected.has(c)).map((channel) => {
                                    const count =
                                        channel === "IN_APP"
                                            ? previewQuery.data!.inApp
                                            : channel === "SMS"
                                              ? previewQuery.data!.sms
                                              : channel === "EMAIL"
                                                ? previewQuery.data!.email
                                                : previewQuery.data!.whatsapp;
                                    const skipped =
                                        channel === "WHATSAPP" ? previewQuery.data!.whatsappSkipped : 0;
                                    return (
                                        <li
                                            key={channel}
                                            className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
                                        >
                                            <span className="flex items-center gap-2 text-sm font-medium text-fg">
                                                {(() => {
                                                    const Icon = CHANNEL_META[channel].icon;
                                                    return <Icon className="h-4 w-4 text-emerald-600" />;
                                                })()}
                                                {CHANNEL_META[channel].label}
                                            </span>
                                            <span className="flex items-center gap-2 text-sm">
                                                <span className="font-semibold text-fg">{count}</span>
                                                {skipped > 0 && (
                                                    <span className="badge badge-warning !text-[10px]">
                                                        {skipped} skipped
                                                    </span>
                                                )}
                                            </span>
                                        </li>
                                    );
                                })}
                                <li className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5 dark:bg-emerald-950/30">
                                    <span className="text-sm font-medium text-fg">Total active renters</span>
                                    <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                        {previewQuery.data.totalActiveRenters}
                                    </span>
                                </li>
                            </ul>
                        )}

                        {previewQuery.data && previewQuery.data.whatsappSkipped > 0 && selected.has("WHATSAPP") && (
                            <div className="alert-card alert-warning mt-4">
                                <Info className="h-4 w-4 shrink-0" />
                                <p className="text-xs">
                                    {previewQuery.data.whatsappSkipped} renter(s) have not opted in to
                                    WhatsApp - they still get in-app, SMS and email.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="alert-card alert-info">
                        <Info className="h-4 w-4 shrink-0" />
                        <p className="text-xs">
                            WhatsApp broadcasts use the approved utility template and never carry free
                            text. Renters opt in from their portal - consent is never assumed.
                        </p>
                    </div>
                </aside>
            </div>

            {/* ── History ────────────────────────────────────────────── */}
            <section className="animate-fade-in-up card">
                <div className="section-header">
                    <h2 className="section-title">History</h2>
                    <p className="section-subtitle">
                        Per-channel outcomes and how many renters opened each announcement.
                    </p>
                </div>

                {historyQuery.isLoading ? (
                    <div className="space-y-3">
                        <div className="skeleton h-12 w-full" />
                        <div className="skeleton h-12 w-full" />
                        <div className="skeleton h-12 w-full" />
                    </div>
                ) : historyQuery.isError ? (
                    <p className="empty-state py-10 text-sm">
                        Could not load announcement history.{" "}
                        <button className="text-emerald-600 hover:underline" onClick={() => historyQuery.refetch()}>
                            Retry
                        </button>
                    </p>
                ) : historyQuery.data?.length === 0 ? (
                    <div className="empty-state py-10">
                        <Megaphone className="empty-state-icon" />
                        <p className="empty-state-title">No announcements yet</p>
                        <p className="empty-state-description">
                            Your broadcasts and their delivery stats will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table-premium w-full">
                            <thead>
                                <tr>
                                    <th>Message</th>
                                    <th>Channels</th>
                                    <th>Outcomes</th>
                                    <th>Opened</th>
                                    <th>Sent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyQuery.data?.map((item) => (
                                    <HistoryRow key={item.id} item={item} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

function HistoryRow({ item }: { item: AnnouncementHistoryItem }) {
    return (
        <tr>
            <td className="max-w-xs">
                <div className="space-y-1">
                    <p className="line-clamp-2 text-sm font-medium text-fg">{item.message}</p>
                    <div className="flex items-center gap-2">
                        <span
                            className={`badge ${item.priority === "URGENT" ? "badge-danger" : "badge-info"} !text-[10px]`}
                        >
                            {item.priority === "URGENT" ? "Urgent" : "Info"}
                        </span>
                        <span className="text-xs text-fg-subtle">{formatDate(item.createdAt)}</span>
                        {item.expiresAt && (
                            <span className="text-xs text-fg-subtle">· hides {formatDate(item.expiresAt)}</span>
                        )}
                    </div>
                </div>
            </td>
            <td>
                <div className="flex flex-wrap gap-1.5">
                    {item.channels.map((channel) => {
                        const Icon = CHANNEL_META[channel].icon;
                        return (
                            <span
                                key={channel}
                                className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-fg-muted"
                            >
                                <Icon className="h-3 w-3 text-emerald-600" />
                                {CHANNEL_META[channel].label}
                            </span>
                        );
                    })}
                </div>
            </td>
            <td>
                <div className="space-y-1">
                    {item.stats.map((stat) => (
                        <div key={stat.channel} className="flex items-center gap-2">
                            <span className="w-16 text-[11px] text-fg-muted">{CHANNEL_META[stat.channel].label}</span>
                            {stat.failed > 0 && (
                                <span className={`badge ${STATUS_META.FAILED.badge} !text-[10px]`}>
                                    {stat.failed} failed
                                </span>
                            )}
                            {stat.skippedNoOptIn > 0 && (
                                <span className={`badge ${STATUS_META.SKIPPED_NO_OPTIN.badge} !text-[10px]`}>
                                    {stat.skippedNoOptIn} skipped
                                </span>
                            )}
                            {stat.delivered > 0 && (
                                <span className={`badge ${STATUS_META.DELIVERED.badge} !text-[10px]`}>
                                    {stat.delivered} delivered
                                </span>
                            )}
                            {stat.sent > 0 && (
                                <span className={`badge ${STATUS_META.SENT.badge} !text-[10px]`}>
                                    {stat.sent} sent
                                </span>
                            )}
                            {stat.pending > 0 && (
                                <span className={`badge ${STATUS_META.PENDING.badge} !text-[10px]`}>
                                    {stat.pending} pending
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </td>
            <td>
                <span className="flex items-center gap-1.5 text-sm text-fg">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {item.readCount}
                    <span className="text-xs text-fg-muted">/ {item.totalRecipients}</span>
                </span>
            </td>
            <td>
                <div className="flex items-center gap-1 text-sm text-fg">
                    {item.priority === "URGENT" ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                        <Megaphone className="h-4 w-4 text-fg-subtle" />
                    )}
                    {item.totalRecipients}
                </div>
            </td>
        </tr>
    );
}
