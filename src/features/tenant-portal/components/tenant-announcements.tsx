// components/tenant-announcements.tsx
"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bell, CheckCircle2, ChevronDown, Loader2, Megaphone, MessageCircle } from "lucide-react";
import { formatDate } from "./tenant-format";
import {
    useTenantAnnouncementsQuery,
    useWhatsAppOptInQuery,
} from "../hooks/use-tenant-portal-queries";
import {
    useMarkAnnouncementReadMutation,
    useUpdateWhatsAppOptInMutation,
} from "../hooks/use-tenant-portal-mutations";
import { RenterAnnouncementResponse } from "../api/tenant-portal-api";
import {
    PortalPage,
    PortalPageHeader,
    PortalCard,
    PortalEmptyState,
    PortalSkeleton,
    PortalErrorState,
} from "./portal-chrome";

export default function TenantAnnouncements() {
    const announcementsQuery = useTenantAnnouncementsQuery();
    const whatsAppOptInQuery = useWhatsAppOptInQuery();
    const markReadMutation = useMarkAnnouncementReadMutation();
    const optInMutation = useUpdateWhatsAppOptInMutation();

    const [openId, setOpenId] = useState<string | null>(null);

    const toggleAnnouncement = (item: RenterAnnouncementResponse) => {
        setOpenId((current) => (current === item.id ? null : item.id));
        if (!item.read) {
            markReadMutation.mutate(item.id);
        }
    };

    const totalUnread = useMemo(
        () => (announcementsQuery.data ?? []).filter((i) => !i.read).length,
        [announcementsQuery.data],
    );

    // Urgent+unread items are pinned above everything else.
    // Remaining items are sorted date-desc and bucketed into date groups.
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

    return (
        <PortalPage>
            <PortalPageHeader
                icon={Megaphone}
                eyebrow="Your landlord"
                title="Announcements"
                subtitle="Rent changes, maintenance schedules and notices — straight to your portal."
                actions={
                    totalUnread > 0 ? (
                        <span className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                            <Bell className="h-3 w-3" />
                            {totalUnread} unread
                        </span>
                    ) : undefined
                }
            />

            {/* ── WhatsApp opt-in ─────────────────────────────────── */}
            <div className="tenant-panel !p-4 sm:!p-5 flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
                    <MessageCircle className="h-5 w-5 text-brand dark:text-brand-300" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                        WhatsApp announcements
                    </p>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                        Get announcements on WhatsApp too — you can opt out any time.
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
                        <span className="h-6 w-11 rounded-full bg-border dark:bg-border-dark peer-checked:bg-brand transition-colors duration-200 after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-5 peer-disabled:opacity-50" />
                    </label>
                )}
            </div>

            {/* ── List ────────────────────────────────────────────── */}
            {announcementsQuery.isLoading ? (
                <PortalSkeleton rows={3} />
            ) : announcementsQuery.isError ? (
                <PortalErrorState
                    title="Couldn't load announcements"
                    description="This is usually temporary. Check your connection and try again."
                    onRetry={() => announcementsQuery.refetch()}
                />
            ) : (announcementsQuery.data?.length ?? 0) === 0 ? (
                <PortalCard padded={false}>
                    <PortalEmptyState
                        icon={Megaphone}
                        title="No announcements yet"
                        description="When your landlord broadcasts a message, it will appear here. You'll receive it via in-app, SMS, and email."
                    />
                </PortalCard>
            ) : (
                <div className="space-y-5">
                    {/* Pinned urgent-unread section */}
                    {urgentUnread.length > 0 && (
                        <section className="space-y-2">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-danger" />
                                <h2 className="text-xs font-semibold uppercase tracking-wide text-danger">
                                    Urgent
                                </h2>
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
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle dark:text-fg-subtle-dark">
                                {group.label}
                            </h2>
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

    return (
        <button
            type="button"
            aria-expanded={isOpen}
            className={`tenant-panel !p-4 sm:!p-5 w-full text-left transition-all duration-200 hover:-translate-y-0.5 ${
                isUrgent && !item.read
                    ? "border-danger/40 bg-danger-bg/30 dark:bg-danger-bg-dark/15"
                    : !item.read && !isOpen
                      ? "border-brand/40 bg-brand-50/40 dark:bg-brand-900/15"
                      : ""
            }`}
            onClick={onToggle}
        >
            <div className="flex items-start gap-4">
                <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isUrgent
                            ? "bg-danger-bg dark:bg-danger-bg-dark"
                            : "bg-brand-50 dark:bg-brand-900/30"
                    }`}
                >
                    {isUrgent ? (
                        <AlertTriangle className="h-5 w-5 text-danger-dark dark:text-danger" />
                    ) : (
                        <Megaphone className="h-5 w-5 text-brand dark:text-brand-300" />
                    )}
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                        {isUrgent && (
                            <span className="badge badge-danger !text-[10px]">Urgent</span>
                        )}
                        {!item.read && (
                            <span className="badge badge-emerald !text-[10px]">New</span>
                        )}
                        <span className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            {formatDate(item.createdAt)}
                        </span>
                    </div>
                    <p
                        className={`text-sm whitespace-pre-wrap ${!isOpen ? "line-clamp-2" : ""} ${
                            isOpen
                                ? "text-fg dark:text-fg-dark"
                                : item.read
                                  ? "text-fg-muted dark:text-fg-muted-dark"
                                  : "font-medium text-fg dark:text-fg-dark"
                        }`}
                    >
                        {item.message}
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {item.read ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand dark:text-brand-300" />
                    ) : (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                    )}
                    <ChevronDown
                        className={`h-4 w-4 shrink-0 text-fg-subtle dark:text-fg-subtle-dark transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                        }`}
                    />
                </div>
            </div>
        </button>
    );
}
