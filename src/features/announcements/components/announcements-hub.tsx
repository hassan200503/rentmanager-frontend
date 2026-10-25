// components/announcements-hub.tsx
"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    Info,
    Loader2,
    Mail,
    Megaphone,
    MessageCircle,
    MessageSquare,
    Send,
    Smartphone,
    X,
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
    IN_APP: { label: "In-app", icon: Smartphone, hint: "Always on · renter portal" },
    SMS: { label: "SMS", icon: MessageSquare, hint: "Full message · billed per send" },
    EMAIL: { label: "Email", icon: Mail, hint: "Full message · free" },
    WHATSAPP: { label: "WhatsApp", icon: MessageCircle, hint: "Template link · opt-in only" },
};

const TEMPLATES = [
    {
        label: "Rent reminder",
        text: "This is a reminder that rent is due on the 5th of every month. Please ensure your payment is made on time to avoid late fees.",
    },
    {
        label: "Scheduled maintenance",
        text: "Scheduled maintenance will be carried out on [DATE] from [START TIME] to [END TIME]. Access to [AREA] may be temporarily limited during this period.",
    },
    {
        label: "Water outage",
        text: "We regret to inform you that there will be a water outage on [DATE] from [START TIME] to [END TIME]. Please make the necessary arrangements.",
    },
    {
        label: "Rent increase notice",
        text: "Please note that effective [DATE], the monthly rent for your unit will be revised to KES [AMOUNT]. Your updated lease will be shared with you shortly.",
    },
];

const STATUS_META: Record<AnnouncementDeliveryStatus, { badge: string; label: string }> = {
    PENDING: { badge: "badge-neutral", label: "pending" },
    SENT: { badge: "badge-info", label: "sent" },
    DELIVERED: { badge: "badge-success", label: "delivered" },
    FAILED: { badge: "badge-danger", label: "failed" },
    SKIPPED_NO_OPTIN: { badge: "badge-warning", label: "skipped" },
};

function formatDate(value: string | null): string {
    if (!value) return "–";
    return new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function timeAgo(value: string): string {
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return formatDate(value);
}

export function AnnouncementsHub() {
    const historyQuery = useAnnouncementsHistoryQuery();
    const createMutation = useCreateAnnouncementMutation();

    const [message, setMessage] = useState("");
    const [priority, setPriority] = useState<AnnouncementPriority>("INFO");
    const [selected, setSelected] = useState<Set<AnnouncementChannel>>(new Set(ALL_CHANNELS));
    const [expiresAt, setExpiresAt] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

    const selectedList = useMemo(() => ALL_CHANNELS.filter((c) => selected.has(c)), [selected]);
    const charCount = message.length;
    const isUrgent = priority === "URGENT";
    const whatsAppSelected = selected.has("WHATSAPP");
    const smsSelected = selected.has("SMS");

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

    const handleOpenConfirm = () => {
        if (!canSend) return;
        setShowConfirm(true);
    };

    const handleConfirm = () => {
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
                    setShowConfirm(false);
                },
                onError: () => {
                    setShowConfirm(false);
                },
            },
        );
    };

    return (
        <div className="page-container space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="page-title">Announcements</h1>
                <p className="page-subtitle">
                    Broadcast a message to every active renter — in-app, SMS, email, and WhatsApp.
                </p>
            </div>

            <div className="animate-fade-in-up grid gap-6 lg:grid-cols-5">
                {/* ── Compose ─────────────────────────────────────────── */}
                <section
                    className={`card space-y-5 lg:col-span-3 transition-colors duration-200 ${
                        isUrgent ? "border-danger/40 ring-1 ring-danger/10" : ""
                    }`}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="section-title">Compose broadcast</h2>
                            <p className="section-subtitle">
                                Delivered verbatim via in-app, SMS, and email. WhatsApp carries a
                                template link.
                            </p>
                        </div>
                        {isUrgent && (
                            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-danger-bg px-3 py-1 text-xs font-semibold text-danger-dark dark:bg-danger-bg-dark dark:text-danger">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Urgent
                            </span>
                        )}
                    </div>

                    {/* Quick-fill templates */}
                    <div className="space-y-2">
                        <span className="form-label">Quick templates</span>
                        <div className="flex flex-wrap gap-2">
                            {TEMPLATES.map((t) => (
                                <button
                                    key={t.label}
                                    type="button"
                                    onClick={() => setMessage(t.text)}
                                    className="rounded-full border border-border px-3 py-1 text-xs font-medium text-fg-muted transition-colors hover:border-brand hover:text-brand dark:border-border-dark dark:text-fg-muted-dark dark:hover:border-brand-400 dark:hover:text-brand-300"
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message textarea */}
                    <div className="space-y-1.5">
                        <label className="form-label" htmlFor="announcement-message">
                            Message
                        </label>
                        <textarea
                            id="announcement-message"
                            className={`form-input min-h-36 resize-y transition-colors ${
                                isUrgent ? "border-danger/40 focus:border-danger/60" : ""
                            }`}
                            placeholder="e.g. Lift maintenance is scheduled for Friday 14 Feb, 8 am – 12 pm. The staircase will remain accessible."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={2000}
                        />
                        <div className="flex items-center justify-between">
                            <p
                                className={`text-xs ${
                                    charCount > 1800
                                        ? "font-medium text-danger"
                                        : charCount > 1400
                                          ? "text-warning-dark"
                                          : "text-fg-muted dark:text-fg-muted-dark"
                                }`}
                            >
                                {charCount}/2000
                                {whatsAppSelected && charCount > 500 && (
                                    <span className="ml-2 text-warning-dark">
                                        · WhatsApp uses first 500 chars
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Priority + expiry */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="form-label" htmlFor="announcement-priority">
                                Priority
                            </label>
                            <select
                                id="announcement-priority"
                                className={`form-input ${
                                    isUrgent ? "border-danger/40 text-danger dark:text-danger" : ""
                                }`}
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                            >
                                <option value="INFO">Info — routine update</option>
                                <option value="URGENT">Urgent — requires attention</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
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

                    {/* Channels */}
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
                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-all duration-150 ${
                                            checked
                                                ? "border-brand/40 bg-brand-50/60 dark:border-brand-700/40 dark:bg-brand-900/20"
                                                : "border-border hover:border-brand/30 dark:border-border-dark"
                                        } ${locked ? "cursor-default" : ""}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="mt-0.5 h-4 w-4 accent-brand"
                                            checked={checked}
                                            disabled={locked}
                                            onChange={() => toggleChannel(channel)}
                                        />
                                        <span className="flex-1 space-y-0.5">
                                            <span className="flex items-center gap-2 text-sm font-medium text-fg dark:text-fg-dark">
                                                <Icon
                                                    className={`h-4 w-4 ${
                                                        checked
                                                            ? "text-brand"
                                                            : "text-fg-muted dark:text-fg-muted-dark"
                                                    }`}
                                                />
                                                {meta.label}
                                                {locked && (
                                                    <span className="text-[10px] font-normal text-fg-subtle dark:text-fg-subtle-dark">
                                                        always on
                                                    </span>
                                                )}
                                            </span>
                                            <span className="block text-xs text-fg-muted dark:text-fg-muted-dark">
                                                {meta.hint}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        {(smsSelected || whatsAppSelected) && (
                            <div className="alert-card alert-warning">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                <p className="text-xs">
                                    {smsSelected && whatsAppSelected
                                        ? "SMS and WhatsApp"
                                        : smsSelected
                                          ? "SMS"
                                          : "WhatsApp"}{" "}
                                    {smsSelected && whatsAppSelected ? "are" : "is"} billed per
                                    recipient. You&apos;ll see the count before confirming.
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        className={`w-full ${isUrgent ? "btn-danger" : "btn-primary"}`}
                        onClick={handleOpenConfirm}
                        disabled={!canSend}
                    >
                        {isUrgent ? (
                            <AlertTriangle className="h-4 w-4" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        {isUrgent ? "Send urgent broadcast" : "Review & send"}
                    </button>
                </section>

                {/* ── Recipient preview ───────────────────────────────── */}
                <aside className="space-y-4 lg:col-span-2">
                    <div className="card">
                        <h2 className="section-title">Recipient preview</h2>
                        <p className="section-subtitle mb-4">
                            Live counts — what you confirm is what executes.
                        </p>

                        {!previewEnabled ? (
                            <p className="empty-state py-8 text-sm">
                                Start typing a message to see who this will reach.
                            </p>
                        ) : previewQuery.isLoading ? (
                            <div className="space-y-3 py-2">
                                <div className="skeleton h-10 w-full" />
                                <div className="skeleton h-10 w-full" />
                                <div className="skeleton h-10 w-full" />
                            </div>
                        ) : previewQuery.isError || !previewQuery.data ? (
                            <div className="py-8 text-center">
                                <p className="mb-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                                    Could not load preview.
                                </p>
                                <button
                                    className="text-xs font-medium text-brand hover:underline"
                                    onClick={() => previewQuery.refetch()}
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <ul className="space-y-2">
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
                                        channel === "WHATSAPP"
                                            ? previewQuery.data!.whatsappSkipped
                                            : 0;
                                    const Icon = CHANNEL_META[channel].icon;
                                    return (
                                        <li
                                            key={channel}
                                            className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 dark:border-border-dark"
                                        >
                                            <span className="flex items-center gap-2 text-sm text-fg dark:text-fg-dark">
                                                <Icon className="h-4 w-4 text-brand" />
                                                {CHANNEL_META[channel].label}
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <span className="tabular-nums text-sm font-semibold text-fg dark:text-fg-dark">
                                                    {count}
                                                </span>
                                                {skipped > 0 && (
                                                    <span className="badge badge-warning !text-[10px]">
                                                        {skipped} skipped
                                                    </span>
                                                )}
                                            </span>
                                        </li>
                                    );
                                })}
                                <li className="flex items-center justify-between rounded-lg border border-brand/20 bg-brand-50/60 px-3 py-2.5 dark:bg-brand-900/20">
                                    <span className="text-sm font-medium text-fg dark:text-fg-dark">
                                        Total active renters
                                    </span>
                                    <span className="tabular-nums text-sm font-bold text-brand dark:text-brand-300">
                                        {previewQuery.data.totalActiveRenters}
                                    </span>
                                </li>
                            </ul>
                        )}
                    </div>

                    <div className="alert-card alert-info">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="text-xs leading-relaxed">
                            WhatsApp uses an approved utility template — never free text. Renters
                            opt in from their portal; consent is never assumed.
                        </p>
                    </div>
                </aside>
            </div>

            {/* ── History ────────────────────────────────────────────── */}
            <section className="animate-fade-in-up card">
                <div className="mb-4">
                    <h2 className="section-title">Broadcast history</h2>
                    <p className="section-subtitle">
                        Delivery outcomes and read rates for every broadcast you&apos;ve sent.
                    </p>
                </div>

                {historyQuery.isLoading ? (
                    <div className="space-y-2">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="skeleton h-16 w-full rounded-lg" />
                        ))}
                    </div>
                ) : historyQuery.isError ? (
                    <div className="py-10 text-center">
                        <p className="mb-2 text-sm text-fg-muted dark:text-fg-muted-dark">
                            Could not load history.
                        </p>
                        <button
                            className="text-xs font-medium text-brand hover:underline"
                            onClick={() => historyQuery.refetch()}
                        >
                            Retry
                        </button>
                    </div>
                ) : historyQuery.data?.length === 0 ? (
                    <div className="empty-state py-12">
                        <Megaphone className="empty-state-icon" />
                        <p className="empty-state-title">No broadcasts yet</p>
                        <p className="empty-state-description">
                            Delivery stats for every broadcast will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {historyQuery.data?.map((item) => (
                            <HistoryCard
                                key={item.id}
                                item={item}
                                isExpanded={expandedHistoryId === item.id}
                                onToggle={() =>
                                    setExpandedHistoryId(
                                        expandedHistoryId === item.id ? null : item.id,
                                    )
                                }
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Confirm send dialog ─────────────────────────────────── */}
            {showConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center bg-ink/40 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="confirm-dialog-title"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowConfirm(false);
                    }}
                >
                    <div className="card w-full max-w-md space-y-5 shadow-2xl animate-fade-in-up">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <span
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                        isUrgent
                                            ? "bg-danger-bg dark:bg-danger-bg-dark"
                                            : "bg-brand-50 dark:bg-brand-900/30"
                                    }`}
                                >
                                    {isUrgent ? (
                                        <AlertTriangle className="h-5 w-5 text-danger" />
                                    ) : (
                                        <Send className="h-5 w-5 text-brand dark:text-brand-300" />
                                    )}
                                </span>
                                <div>
                                    <h3
                                        id="confirm-dialog-title"
                                        className="text-sm font-semibold text-fg dark:text-fg-dark"
                                    >
                                        Confirm broadcast
                                    </h3>
                                    <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                        This sends immediately to all active renters.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                aria-label="Close"
                                className="text-fg-subtle transition-colors hover:text-fg dark:text-fg-subtle-dark dark:hover:text-fg-dark"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Message preview */}
                        <div className="rounded-lg bg-ink/[0.04] p-3 dark:bg-white/[0.04]">
                            <p className="mb-1 text-[11px] uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                Message
                            </p>
                            <p className="line-clamp-4 whitespace-pre-wrap text-sm text-fg dark:text-fg-dark">
                                {message.trim()}
                            </p>
                        </div>

                        {/* Channel / recipient breakdown */}
                        {previewQuery.data && (
                            <div className="space-y-2">
                                <p className="text-[11px] uppercase tracking-wide text-fg-muted dark:text-fg-muted-dark">
                                    Recipients
                                </p>
                                {selectedList.map((channel) => {
                                    const count =
                                        channel === "IN_APP"
                                            ? previewQuery.data!.inApp
                                            : channel === "SMS"
                                              ? previewQuery.data!.sms
                                              : channel === "EMAIL"
                                                ? previewQuery.data!.email
                                                : previewQuery.data!.whatsapp;
                                    const Icon = CHANNEL_META[channel].icon;
                                    return (
                                        <div
                                            key={channel}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="flex items-center gap-2 text-fg-muted dark:text-fg-muted-dark">
                                                <Icon className="h-3.5 w-3.5 text-brand" />
                                                {CHANNEL_META[channel].label}
                                            </span>
                                            <span className="tabular-nums font-medium text-fg dark:text-fg-dark">
                                                {count}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Cost warning */}
                        {(smsSelected || whatsAppSelected) && (
                            <div className="alert-card alert-warning">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                <p className="text-xs">
                                    {smsSelected && whatsAppSelected
                                        ? "SMS and WhatsApp sends"
                                        : smsSelected
                                          ? "SMS sends"
                                          : "WhatsApp sends"}{" "}
                                    will be billed against your Daraja account.
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                disabled={createMutation.isPending}
                                className="btn-secondary flex-1"
                            >
                                Go back
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={createMutation.isPending}
                                className={`flex-1 ${isUrgent ? "btn-danger" : "btn-primary"}`}
                            >
                                {createMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                {createMutation.isPending ? "Sending…" : "Confirm & send"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function HistoryCard({
    item,
    isExpanded,
    onToggle,
}: {
    item: AnnouncementHistoryItem;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const totalFailed = item.stats.reduce((sum, s) => sum + s.failed, 0);
    const totalSkipped = item.stats.reduce((sum, s) => sum + s.skippedNoOptIn, 0);
    const readPercent =
        item.totalRecipients > 0
            ? Math.round((item.readCount / item.totalRecipients) * 100)
            : 0;

    return (
        <div
            className={`rounded-lg border transition-colors duration-150 ${
                item.priority === "URGENT"
                    ? "border-danger/30 bg-danger-bg/20 dark:bg-danger-bg-dark/10"
                    : "border-border dark:border-border-dark"
            }`}
        >
            <button
                type="button"
                className="w-full text-left"
                onClick={onToggle}
                aria-expanded={isExpanded}
            >
                <div className="flex items-start gap-3 px-4 py-3">
                    <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                            item.priority === "URGENT"
                                ? "bg-danger-bg dark:bg-danger-bg-dark"
                                : "bg-brand-50 dark:bg-brand-900/30"
                        }`}
                    >
                        {item.priority === "URGENT" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                        ) : (
                            <Megaphone className="h-3.5 w-3.5 text-brand" />
                        )}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium text-fg dark:text-fg-dark">
                            {item.message}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-fg-subtle dark:text-fg-subtle-dark">
                                {timeAgo(item.createdAt)}
                            </span>
                            <span className="text-xs text-fg-subtle dark:text-fg-subtle-dark">·</span>
                            <span className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                {item.totalRecipients} recipients
                            </span>
                            {totalFailed > 0 && (
                                <span className="badge badge-danger !text-[10px]">
                                    {totalFailed} failed
                                </span>
                            )}
                            {totalSkipped > 0 && (
                                <span className="badge badge-warning !text-[10px]">
                                    {totalSkipped} skipped
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden items-center gap-1.5 text-xs text-fg-muted sm:flex dark:text-fg-muted-dark">
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                            {readPercent}% read
                        </span>
                        <ChevronDown
                            className={`h-4 w-4 text-fg-subtle transition-transform duration-200 dark:text-fg-subtle-dark ${
                                isExpanded ? "rotate-180" : ""
                            }`}
                        />
                    </div>
                </div>
            </button>

            {isExpanded && (
                <div className="space-y-4 border-t border-border px-4 py-4 dark:border-border-dark">
                    {/* Full message */}
                    <p className="whitespace-pre-wrap text-sm text-fg dark:text-fg-dark">
                        {item.message}
                    </p>

                    {/* Timestamps */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                        <span className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            Sent:{" "}
                            <span className="text-fg dark:text-fg-dark">
                                {formatDate(item.createdAt)}
                            </span>
                        </span>
                        {item.expiresAt && (
                            <span className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                Hides:{" "}
                                <span className="text-fg dark:text-fg-dark">
                                    {formatDate(item.expiresAt)}
                                </span>
                            </span>
                        )}
                    </div>

                    {/* Per-channel stats */}
                    <div className="space-y-2">
                        {item.stats.map((stat) => {
                            const Icon = CHANNEL_META[stat.channel].icon;
                            return (
                                <div key={stat.channel} className="flex items-center gap-3">
                                    <span className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                        <Icon className="h-3.5 w-3.5 text-brand" />
                                        {CHANNEL_META[stat.channel].label}
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {stat.delivered > 0 && (
                                            <span
                                                className={`badge ${STATUS_META.DELIVERED.badge} !text-[10px]`}
                                            >
                                                {stat.delivered} delivered
                                            </span>
                                        )}
                                        {stat.sent > 0 && (
                                            <span
                                                className={`badge ${STATUS_META.SENT.badge} !text-[10px]`}
                                            >
                                                {stat.sent} sent
                                            </span>
                                        )}
                                        {stat.pending > 0 && (
                                            <span
                                                className={`badge ${STATUS_META.PENDING.badge} !text-[10px]`}
                                            >
                                                {stat.pending} pending
                                            </span>
                                        )}
                                        {stat.failed > 0 && (
                                            <span
                                                className={`badge ${STATUS_META.FAILED.badge} !text-[10px]`}
                                            >
                                                {stat.failed} failed
                                            </span>
                                        )}
                                        {stat.skippedNoOptIn > 0 && (
                                            <span
                                                className={`badge ${STATUS_META.SKIPPED_NO_OPTIN.badge} !text-[10px]`}
                                            >
                                                {stat.skippedNoOptIn} skipped
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Read progress */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-fg-muted dark:text-fg-muted-dark">
                            <span>Opened in portal</span>
                            <span className="font-medium text-fg dark:text-fg-dark">
                                {item.readCount} / {item.totalRecipients}
                            </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border dark:bg-border-dark">
                            <div
                                className="h-full rounded-full bg-brand transition-all duration-500"
                                style={{ width: `${readPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
