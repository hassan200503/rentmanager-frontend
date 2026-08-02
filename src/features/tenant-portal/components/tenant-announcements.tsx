// components/tenant-announcements.tsx
"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Megaphone, MessageCircle } from "lucide-react";
import { formatDate } from "./tenant-dashboard";
import {
    useTenantAnnouncementsQuery,
    useWhatsAppOptInQuery,
} from "../hooks/use-tenant-portal-queries";
import {
    useMarkAnnouncementReadMutation,
    useUpdateWhatsAppOptInMutation,
} from "../hooks/use-tenant-portal-mutations";
import { RenterAnnouncementResponse } from "../api/tenant-portal-api";

export default function TenantAnnouncements() {
    const announcementsQuery = useTenantAnnouncementsQuery();
    const whatsAppOptInQuery = useWhatsAppOptInQuery();
    const markReadMutation = useMarkAnnouncementReadMutation();
    const optInMutation = useUpdateWhatsAppOptInMutation();

    const [openId, setOpenId] = useState<string | null>(null);

    const openAnnouncement = (item: RenterAnnouncementResponse) => {
        setOpenId(item.id);
        if (!item.read) {
            markReadMutation.mutate(item.id);
        }
    };

    return (
        <div className="page-container py-6 sm:py-8 space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="page-title">Announcements</h1>
                <p className="page-subtitle">
                    Updates from your landlord - rent changes, maintenance schedules, and notices.
                </p>
            </div>

            {/* ── WhatsApp opt-in consent ─────────────────────────────── */}
            <div className="animate-fade-in-up card-elevated p-4 sm:p-5 flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                    <MessageCircle className="h-5 w-5 text-emerald-600" />
                </span>
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-fg">WhatsApp announcements</p>
                    <p className="text-sm text-fg-muted">
                        Allow your landlord to send you announcements on WhatsApp. This is opt-in -
                        you can change it any time, and you&apos;ll still get in-app, SMS and email
                        updates either way.
                    </p>
                </div>
                {whatsAppOptInQuery.isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-fg-subtle" />
                ) : (
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={whatsAppOptInQuery.data?.enabled ?? false}
                            onChange={(e) => optInMutation.mutate(e.target.checked)}
                            disabled={optInMutation.isPending}
                        />
                        <span className="h-6 w-11 rounded-full bg-border peer-checked:bg-emerald-600 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5 peer-disabled:opacity-50" />
                    </label>
                )}
            </div>

            {/* ── List ────────────────────────────────────────────────── */}
            {announcementsQuery.isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="card-elevated p-4 flex items-center gap-4">
                            <div className="skeleton h-10 w-10 rounded-lg shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-4 w-48 rounded" />
                                <div className="skeleton h-3 w-32 rounded" />
                            </div>
                            <div className="skeleton h-6 w-16 rounded-full" />
                        </div>
                    ))}
                </div>
            ) : announcementsQuery.isError ? (
                <div className="card-elevated p-8 text-center">
                    <p className="text-sm text-fg-muted">Could not load announcements.</p>
                    <button
                        className="btn-outline btn-sm mt-3"
                        onClick={() => announcementsQuery.refetch()}
                    >
                        Retry
                    </button>
                </div>
            ) : announcementsQuery.data?.length === 0 ? (
                <div className="card-elevated p-10 text-center">
                    <Megaphone className="mx-auto h-10 w-10 text-fg-subtle" />
                    <p className="mt-3 text-sm font-medium text-fg">No announcements yet</p>
                    <p className="mt-1 text-sm text-fg-muted">
                        When your landlord broadcasts a message, it will appear here.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {announcementsQuery.data?.map((item) => {
                        const isOpen = openId === item.id;
                        return (
                            <button
                                key={item.id}
                                className={`card-elevated w-full p-4 sm:p-5 text-left transition-colors ${
                                    !item.read && !isOpen ? "border-emerald-600/40 bg-emerald-50/40 dark:bg-emerald-950/20" : ""
                                }`}
                                onClick={() => openAnnouncement(item)}
                            >
                                <div className="flex items-start gap-4">
                                    <span
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                            item.priority === "URGENT"
                                                ? "bg-red-50 dark:bg-red-950/40"
                                                : "bg-emerald-50 dark:bg-emerald-950/40"
                                        }`}
                                    >
                                        {item.priority === "URGENT" ? (
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                        ) : (
                                            <Megaphone className="h-5 w-5 text-emerald-600" />
                                        )}
                                    </span>
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {item.priority === "URGENT" && (
                                                <span className="badge badge-danger !text-[10px]">Urgent</span>
                                            )}
                                            {!item.read && (
                                                <span className="badge badge-emerald !text-[10px]">New</span>
                                            )}
                                            <span className="text-xs text-fg-muted">{formatDate(item.createdAt)}</span>
                                        </div>
                                        <p
                                            className={`line-clamp-2 text-sm ${
                                                isOpen ? "" : item.read ? "text-fg-muted" : "font-medium text-fg"
                                            }`}
                                        >
                                            {item.message}
                                        </p>
                                    </div>
                                    {item.read ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                    ) : (
                                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
