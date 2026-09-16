// components/tenant-announcements.tsx
"use client";

import { useMemo, useState } from "react";
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    ChevronDown,
    Clock,
    Inbox,
    Loader2,
    Megaphone,
    MessageCircle,
} from "lucide-react";
import { formatDate } from "./tenant-format";
import {
    useTenantAnnouncementsQuery,
    useWhatsAppOptInQuery,
    tenantPortalKeys,
} from "../hooks/use-tenant-portal-queries";
import {
    useMarkAnnouncementReadMutation,
    useUpdateWhatsAppOptInMutation,
} from "../hooks/use-tenant-portal-mutations";
import { tenantPortalApi, RenterAnnouncementResponse } from "../api/tenant-portal-api";
import { useQueryClient } from "@tanstack/react-query";
import {
    PortalPage,
    PortalCard,
    PortalEmptyState,
    PortalSkeleton,
    PortalErrorState,
} from "./portal-chrome";

function relativeTime(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return formatDate(iso);
    const mins = Math.floor(ms / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return formatDate(iso);
}

export default function TenantAnnouncements() {
    const announcementsQuery = useTenantAnnouncementsQuery();
    const whatsAppOptInQuery = useWhatsAppOptInQuery();
    const markReadMutation = useMarkAnnouncementReadMutation();
    const optInMutation = useUpdateWhatsAppOptInMutation();
    const queryClient = useQueryClient();

    const [openId, setOpenId] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);

    const toggleAnnouncement = (item: RenterAnnouncementResponse) => {
        setOpenId((current) => (current === item.id ? null : item.id));
        if (!item.read) {
            markReadMutation.mutate(item.id);
        }
    };

    const unreadItems = useMemo(
        () => (announcementsQuery.data ?? []).filter((i) => !i.read),
        [announcementsQuery.data],
    );
    const totalUnread = unreadItems.length;

    const handleMarkAllRead = async () => {
        if (markingAll || totalUnread === 0) return;
        setMarkingAll(true);
        try {
            await Promise.all(unreadItems.map((i) => tenantPortalApi.markAnnouncementRead(i.id)));
            queryClient.invalidateQueries({ queryKey: tenantPortalKeys.announcements() });
            queryClient.invalidateQueries({ queryKey: tenantPortalKeys.unreadAnnouncementCount() });
        } finally {
            setMarkingAll(false);
        }
    };

    const { urgentUnread, dateGroups } = useMemo(() => {
        const all = announcementsQuery.data ?? [];
        const pinned = all.filter((i) => i.priority === "URGENT" && !i.read);
        const rest = all
            .filter((i) => !(i.priority === "URGENT" && !i.read))
            .slice()
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            );

        // eslint-disable-next-line react-hooks/purity
        const now = Date.now();
        const DAY = 86_400_000;
        const WEEK = 7 * DAY;

        const today = rest.filter((i) => now - new Date(i.createdAt).getTime() < DAY);
        const thisWeek = rest.filter((i) => {
            const age = now - new Date(i.createdAt).getTime();
            return age >= DAY && age < WEEK;
        });
        const older = rest.filter(
            (i) => now - new Date(i.createdAt).getTime() >= WEEK,
        );

        return {
            urgentUnread: pinned,
            dateGroups: [
                { label: "Today", items: today },
                { label: "This week", items: thisWeek },
                { label: "Older", items: older },
            ].filter((g) => g.items.length > 0),
        };
    }, [announcementsQuery.data]);

    const totalCount = announcementsQuery.data?.length ?? 0;

    return (
        <PortalPage>
            {/* ── Hero ────────────────────────────────────────────── */}
            <div className="tenant-hero-panel relative overflow-hidden !p-6 sm:!p-8">
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage:
                            "linear-gradient(135deg, color-mix(in srgb, var(--color-brand) 14%, transparent), transparent 60%)",
                    }}
                    aria-hidden
                />
                <div
                    className="absolute -top-24 -right-16 h-64 w-64 rounded-full pointer-events-none opacity-70 blur-3xl"
                    style={{
                        background:
                            "radial-gradient(circle, color-mix(in srgb, var(--color-brand) 16%, transparent), transparent 70%)",
                    }}
                    aria-hidden
                />

                <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                    {/* Left — heading */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                                <Megaphone className="h-[18px] w-[18px]" strokeWidth={1.75} />
                            </div>
                            <p className="tenant-eyebrow !mt-0">Your landlord</p>
                        </div>
                        <h1 className="tenant-hero-title">Announcements</h1>
                        <p className="tenant-hero-subtitle">
                            Rent changes, maintenance schedules and notices — straight to your portal.
                        </p>
                        <div className="tenant-hero-chips">
                            <span className="tenant-context-chip inline-flex">
                                <Bell className="h-3.5 w-3.5" strokeWidth={1.9} />
                                From your landlord
                            </span>
                            {totalUnread > 0 && (
                                <button
                                    type="button"
                                    onClick={handleMarkAllRead}
                                    disabled={markingAll}
                                    className="tenant-context-chip inline-flex cursor-pointer transition-colors hover:bg-brand-100 dark:hover:bg-brand-900/40 disabled:opacity-60"
                                >
                                    {markingAll ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                                    ) : (
                                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                                    )}
                                    Mark all read
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right — inbox stat block */}
                    <div className="shrink-0 lg:min-w-[14rem]">
                        <div className="rounded-2xl border border-brand-200/70 dark:border-brand-700/40 bg-white/70 dark:bg-white/[0.03] p-5 backdrop-blur-sm shadow-sm">
                            {announcementsQuery.isLoading ? (
                                <>
                                    <div className="tenant-skeleton-premium h-3 w-24" />
                                    <div className="tenant-skeleton-premium h-10 w-16 mt-3" />
                                    <div className="tenant-skeleton-premium h-4 w-28 mt-3" />
                                </>
                            ) : (
                                <>
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted dark:text-fg-muted-dark">
                                        Inbox
                                    </p>
                                    <div className="mt-1.5 flex items-end gap-1.5">
                                        <span className="font-data text-4xl font-bold leading-none text-fg dark:text-fg-dark">
                                            {totalCount}
                                        </span>
                                        <span className="mb-0.5 text-xs text-fg-subtle dark:text-fg-subtle-dark">
                                            {totalCount === 1 ? "notice" : "notices"}
                                        </span>
                                    </div>
                                    {totalUnread > 0 ? (
                                        <div className="mt-2.5 flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                                            <p className="text-xs font-medium text-brand dark:text-brand-300">
                                                {totalUnread} unread
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                                            All caught up
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── WhatsApp opt-in ─────────────────────────────────── */}
            <div className="tenant-panel overflow-hidden !p-0">
                <div className="relative flex items-center gap-4 p-4 sm:p-5">
                    {/* Green left accent */}
                    <div
                        className="absolute inset-y-0 left-0 w-1"
                        style={{ background: "linear-gradient(to bottom, #22c55e, #16a34a)" }}
                        aria-hidden
                    />
                    <span
                        className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-[#86efac]/60 dark:ring-[#4ade80]/20"
                        style={{ background: "linear-gradient(135deg, #dcfce7, #bbf7d0)" }}
                    >
                        <MessageCircle className="h-5 w-5 text-[#15803d]" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            WhatsApp announcements
                        </p>
                        <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                            {whatsAppOptInQuery.data?.enabled
                                ? "Active — new announcements are also sent to your WhatsApp"
                                : "Get announcements on WhatsApp too — opt out any time"}
                        </p>
                    </div>
                    {whatsAppOptInQuery.isLoading ? (
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-fg-subtle dark:text-fg-subtle-dark" />
                    ) : (
                        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={whatsAppOptInQuery.data?.enabled ?? false}
                                onChange={(e) => optInMutation.mutate(e.target.checked)}
                                disabled={optInMutation.isPending}
                            />
                            <span className="h-6 w-11 rounded-full bg-border dark:bg-border-dark peer-checked:bg-[#16a34a] dark:peer-checked:bg-[#22c55e] transition-colors duration-200 after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-5 peer-disabled:opacity-50" />
                        </label>
                    )}
                </div>
            </div>

            {/* ── Announcement list ────────────────────────────────── */}
            {announcementsQuery.isLoading ? (
                <PortalSkeleton rows={3} />
            ) : announcementsQuery.isError ? (
                <PortalErrorState
                    title="Couldn't load announcements"
                    description="This is usually temporary. Check your connection and try again."
                    onRetry={() => announcementsQuery.refetch()}
                />
            ) : totalCount === 0 ? (
                <PortalCard padded={false}>
                    <PortalEmptyState
                        icon={Inbox}
                        title="No announcements yet"
                        description="When your landlord broadcasts a message, it will appear here. You'll be notified via in-app and WhatsApp if enabled."
                    />
                </PortalCard>
            ) : (
                <div className="space-y-5">
                    {/* Pinned urgent-unread */}
                    {urgentUnread.length > 0 && (
                        <section className="space-y-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-red-500" strokeWidth={2.5} />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-red-600 dark:text-red-400">
                                    Urgent — action may be required
                                </span>
                            </div>
                            {urgentUnread.map((item) => (
                                <AnnouncementRow
                                    key={item.id}
                                    item={item}
                                    isOpen={openId === item.id}
                                    onToggle={() => toggleAnnouncement(item)}
                                />
                            ))}
                        </section>
                    )}

                    {/* Date-grouped remaining items */}
                    {dateGroups.map((group) => (
                        <section key={group.label} className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-px flex-1 bg-border dark:bg-border-dark" />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-subtle dark:text-fg-subtle-dark">
                                    {group.label}
                                </span>
                                <div className="h-px flex-1 bg-border dark:bg-border-dark" />
                            </div>
                            {group.items.map((item) => (
                                <AnnouncementRow
                                    key={item.id}
                                    item={item}
                                    isOpen={openId === item.id}
                                    onToggle={() => toggleAnnouncement(item)}
                                />
                            ))}
                        </section>
                    ))}
                </div>
            )}
        </PortalPage>
    );
}

function AnnouncementRow({
    item,
    isOpen,
    onToggle,
}: {
    item: RenterAnnouncementResponse;
    isOpen: boolean;
    onToggle: () => void;
}) {
    const isUrgent = item.priority === "URGENT";
    const timeLabel = relativeTime(item.createdAt);
    const absoluteDate = formatDate(item.createdAt);
    const showAbsoluteDate = timeLabel !== absoluteDate;
    // eslint-disable-next-line react-hooks/purity
    const nowMs = Date.now();
    const expiryDaysLeft = item.expiresAt
        ? Math.ceil((new Date(item.expiresAt).getTime() - nowMs) / 86_400_000)
        : null;

    return (
        <button
            type="button"
            aria-expanded={isOpen}
            onClick={onToggle}
            className={`w-full overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5 ${
                isUrgent && !item.read
                    ? "border-red-200 dark:border-red-800/50 bg-red-50/60 dark:bg-red-900/10 hover:border-red-300 dark:hover:border-red-700/50 hover:shadow-sm"
                    : !item.read
                    ? "border-brand-200/70 dark:border-brand-700/30 bg-brand-50/40 dark:bg-brand-900/10 hover:border-brand-300/70 dark:hover:border-brand-600/40 hover:shadow-sm"
                    : "border-border dark:border-border-dark bg-surface dark:bg-surface-dark hover:border-fg-subtle/30 dark:hover:border-fg-subtle-dark/30"
            }`}
        >
            <div className="flex items-stretch">
                {/* Priority bar */}
                <div
                    className={`w-[3px] shrink-0 ${
                        isUrgent
                            ? "bg-red-500"
                            : !item.read
                            ? "bg-brand dark:bg-brand-400"
                            : "bg-border dark:bg-border-dark"
                    }`}
                />

                <div className="flex min-w-0 flex-1 items-start gap-3 p-4 sm:p-5">
                    {/* Icon */}
                    <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isUrgent
                                ? "bg-red-100 dark:bg-red-900/30"
                                : item.read
                                ? "bg-surface dark:bg-surface-dark ring-1 ring-border dark:ring-border-dark"
                                : "bg-brand-50 dark:bg-brand-900/30"
                        }`}
                    >
                        {isUrgent ? (
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" strokeWidth={2} />
                        ) : (
                            <Megaphone
                                className={`h-4 w-4 ${
                                    item.read
                                        ? "text-fg-subtle dark:text-fg-subtle-dark"
                                        : "text-brand dark:text-brand-300"
                                }`}
                                strokeWidth={2}
                            />
                        )}
                    </span>

                    {/* Body */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            {isUrgent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
                                    <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.5} />
                                    Urgent
                                </span>
                            )}
                            {!item.read && (
                                <span className="inline-flex items-center rounded-full bg-brand-100 dark:bg-brand-900/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand dark:text-brand-300">
                                    New
                                </span>
                            )}
                            <span className="text-[11px] text-fg-muted dark:text-fg-muted-dark">
                                {timeLabel}
                            </span>
                            {showAbsoluteDate && (
                                <span className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark">
                                    · {absoluteDate}
                                </span>
                            )}
                        </div>

                        {/* Message */}
                        <p
                            className={`text-sm leading-relaxed whitespace-pre-wrap ${
                                !isOpen ? "line-clamp-2" : ""
                            } ${
                                isOpen
                                    ? "text-fg dark:text-fg-dark"
                                    : item.read
                                    ? "text-fg-muted dark:text-fg-muted-dark"
                                    : "font-medium text-fg dark:text-fg-dark"
                            }`}
                        >
                            {item.message}
                        </p>

                        {/* Expiry warning */}
                        {isOpen && expiryDaysLeft !== null && expiryDaysLeft > 0 && expiryDaysLeft <= 30 && (
                            <p className="flex items-center gap-1.5 text-[11px] font-medium text-warning-dark dark:text-warning">
                                <Clock className="h-3 w-3" strokeWidth={2} />
                                Expires in {expiryDaysLeft} day{expiryDaysLeft === 1 ? "" : "s"}
                            </p>
                        )}
                    </div>

                    {/* Right: read indicator + chevron */}
                    <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                        {item.read ? (
                            <CheckCircle2
                                className="h-4 w-4 text-brand/50 dark:text-brand-300/50"
                                strokeWidth={2}
                            />
                        ) : (
                            <span
                                className={`h-2 w-2 rounded-full animate-pulse ${
                                    isUrgent ? "bg-red-500" : "bg-brand"
                                }`}
                            />
                        )}
                        <ChevronDown
                            className={`h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </div>
                </div>
            </div>
        </button>
    );
}
