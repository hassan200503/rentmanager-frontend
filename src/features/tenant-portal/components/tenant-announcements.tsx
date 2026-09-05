// components/tenant-announcements.tsx
"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, Megaphone, MessageCircle } from "lucide-react";
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

    return (
        <PortalPage>
            <PortalPageHeader
                icon={Megaphone}
                eyebrow="Your landlord"
                title="Announcements"
                subtitle="Rent changes, maintenance schedules and notices — sent straight to your portal."
            />

            {/* ── WhatsApp opt-in consent ─────────────────────────────── */}
            {/* Was raw Tailwind emerald throughout — the landlord-side
                equivalent toggle (emergency-contact-card.tsx) already uses
                peer-checked:bg-brand; this is the one instance in the app
                still on the un-tokened color. */}
            <div className="tenant-panel !p-4 sm:!p-5 flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30">
                    <MessageCircle className="h-5 w-5 text-brand dark:text-brand-300" />
                </span>
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-fg dark:text-fg-dark">WhatsApp announcements</p>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                        Allow your landlord to send you announcements on WhatsApp. This is opt-in -
                        you can change it any time, and you&apos;ll still get in-app, SMS and email
                        updates either way.
                    </p>
                </div>
                {whatsAppOptInQuery.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-fg-subtle dark:text-fg-subtle-dark" />
                ) : (
                    <label className="relative inline-flex cursor-pointer items-center">
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

            {/* ── List ────────────────────────────────────────────────── */}
            {announcementsQuery.isLoading ? (
                <PortalSkeleton rows={3} />
            ) : announcementsQuery.isError ? (
                <PortalErrorState
                    title="Couldn't load announcements"
                    description="This is usually temporary. Check your connection and try again."
                    onRetry={() => announcementsQuery.refetch()}
                />
            ) : announcementsQuery.data?.length === 0 ? (
                <PortalCard padded={false}>
                    <PortalEmptyState
                        icon={Megaphone}
                        title="No announcements yet"
                        description="When your landlord broadcasts a message, it will appear here."
                    />
                </PortalCard>
            ) : (
                <div className="space-y-3">
                    {announcementsQuery.data?.map((item) => {
                        const isOpen = openId === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                aria-expanded={isOpen}
                                className={`tenant-panel !p-4 sm:!p-5 w-full text-left transition-all duration-200 hover:-translate-y-0.5 ${
                                    !item.read && !isOpen ? "border-brand/40 bg-brand-50/40 dark:bg-brand-900/15" : ""
                                }`}
                                onClick={() => toggleAnnouncement(item)}
                            >
                                <div className="flex items-start gap-4">
                                    <span
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                            item.priority === "URGENT"
                                                ? "bg-danger-bg dark:bg-danger-bg-dark"
                                                : "bg-brand-50 dark:bg-brand-900/30"
                                        }`}
                                    >
                                        {item.priority === "URGENT" ? (
                                            <AlertTriangle className="h-5 w-5 text-danger-dark dark:text-danger" />
                                        ) : (
                                            <Megaphone className="h-5 w-5 text-brand dark:text-brand-300" />
                                        )}
                                    </span>
                                    <div className="flex-1 min-w-0 space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.priority === "URGENT" && (
                                                <span className="badge badge-danger !text-[10px]">Urgent</span>
                                            )}
                                            {!item.read && (
                                                <span className="badge badge-emerald !text-[10px]">New</span>
                                            )}
                                            <span className="text-xs text-fg-muted dark:text-fg-muted-dark">{formatDate(item.createdAt)}</span>
                                        </div>
                                        {/* line-clamp-2 used to stay applied even when isOpen
                                            was true — clicking marked the announcement read and
                                            changed its text color, but never actually revealed
                                            anything past the second line. Any message longer than
                                            two lines (a rent change, a maintenance notice — the
                                            exact content this page exists for) had no way to be
                                            read in full. */}
                                        <p
                                            className={`text-sm whitespace-pre-wrap ${!isOpen ? "line-clamp-2" : ""} ${
                                                isOpen ? "text-fg dark:text-fg-dark" : item.read ? "text-fg-muted dark:text-fg-muted-dark" : "font-medium text-fg dark:text-fg-dark"
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
                                        {/* Nothing previously hinted these cards were
                                            expandable — a renter had no way to know clicking
                                            did anything at all. */}
                                        <ChevronDown
                                            className={`h-4 w-4 shrink-0 text-fg-subtle dark:text-fg-subtle-dark transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </PortalPage>
    );
}
