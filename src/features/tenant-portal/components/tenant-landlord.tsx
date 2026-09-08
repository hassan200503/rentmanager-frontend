// components/tenant-landlord.tsx
"use client";

import {
    AlertTriangle, ArrowRight, BadgeCheck, Bell, BriefcaseBusiness,
    Building2, CalendarDays, CheckCircle2, Clock, Contact, Copy,
    CreditCard, Home, Landmark, Mail, MapPin, MessageCircle,
    Navigation, Phone, PhoneCall, RefreshCw, Save, Share2, ShieldCheck,
    Sparkles, Star, User, Wrench, CheckCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
    useTenantLeaseQuery,
    useTenantPaymentSummaryQuery,
    useTenantAnnouncementsQuery,
    useTenantMaintenanceRequestsQuery,
    useMyReviewQuery,
} from "../hooks/use-tenant-portal-queries";
import { isPremiumLandlord, type TenantLeaseResponse, type RenterAnnouncementResponse } from "../api/tenant-portal-api";
import { formatCurrency, toMoneyNumber } from "@/shared/utils/money";

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatDate = (iso: string | null, opts?: Intl.DateTimeFormatOptions) => {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString("en-KE", opts ?? { year: "numeric", month: "short", day: "numeric" });
};

const formatMemberSince = (iso: string | null) =>
    formatDate(iso, { year: "numeric", month: "long" });

// WhatsApp requires E.164 format without the leading "+".
// Kenyan numbers are commonly stored locally (0XXXXXXXXX, 10 digits) —
// normalise them before building the wa.me URL so the link actually resolves.
const waLink = (phone: string | null): string | null => {
    if (!phone) return null;
    const d = phone.replace(/\D/g, "");
    const e164 = d.startsWith("0") && d.length === 10 ? `254${d.slice(1)}` : d;
    return `https://wa.me/${e164}`;
};

const safeHex = (c: string | null | undefined): string | null =>
    c && /^#[0-9A-Fa-f]{6}$/.test(c) ? c : null;

// Pure black is a valid brand choice but looks harsh for UI tints — nudge it.
const usableAccent = (primary: string | null): string => {
    const h = safeHex(primary);
    if (!h) return "var(--color-brand)";
    if (h === "#000000") return "#374151";
    return h;
};

const downloadVCard = (lease: TenantLeaseResponse) => {
    const name = lease.landlordName ?? "Landlord";
    const lines = [
        "BEGIN:VCARD", "VERSION:3.0",
        `FN:${name}`,
        lease.landlordPhone ? `TEL;TYPE=CELL:${lease.landlordPhone}` : null,
        lease.landlordEmail ? `EMAIL;TYPE=INTERNET:${lease.landlordEmail}` : null,
        lease.landlordAddress ? `ADR;TYPE=HOME:;;${lease.landlordAddress};;;` : null,
        lease.propertyName ? `ORG:${lease.propertyName}` : null,
        "END:VCARD",
    ].filter((l): l is string => l !== null).join("\n");
    const url = URL.createObjectURL(new Blob([lines], { type: "text/vcard;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
};

type IconFC = React.FC<{ className?: string; strokeWidth?: number }>;

// ─── action tile ─────────────────────────────────────────────────────────────

const ActionTile = ({
    href, onClick, icon: Icon, label, iconClass, disabled = false, external = false,
}: {
    href?: string | null; onClick?: () => void; icon: IconFC; label: string;
    iconClass?: string; disabled?: boolean; external?: boolean;
}) => {
    const base = "group flex flex-col items-center gap-2 rounded-xl py-3.5 px-2 text-[11px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 text-fg dark:text-fg-dark select-none";
    const enabled = "border border-border dark:border-border-dark bg-surface/70 dark:bg-surface-dark/50 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/60 dark:hover:bg-brand-900/20 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 active:translate-y-0 cursor-pointer";
    const off = "border border-border/40 dark:border-border-dark/30 bg-surface/40 dark:bg-surface-dark/20 opacity-40 cursor-not-allowed pointer-events-none";
    const iconEl = (
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${iconClass ?? "bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success"} ${!disabled ? "group-hover:scale-110 group-hover:shadow-sm" : ""}`}>
            <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
        </span>
    );
    if (onClick) return <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${disabled ? off : enabled}`}>{iconEl}{label}</button>;
    if (href && !disabled) return <a href={href} className={`${base} ${enabled}`} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{iconEl}{label}</a>;
    return <div className={`${base} ${off}`}>{iconEl}{label}</div>;
};

// ─── detail item ─────────────────────────────────────────────────────────────

const DetailItem = ({
    icon: Icon, label, value, tone = "brand", mapAddress, copyValue,
}: {
    icon: IconFC; label: string; value: React.ReactNode;
    tone?: "brand" | "green" | "blue" | "amber" | "red";
    mapAddress?: string | null; copyValue?: string | null;
}) => {
    const [copied, setCopied] = useState(false);
    const tones: Record<string, string> = {
        brand: "bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-brand-200/60 dark:ring-brand-700/40",
        green: "bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success ring-success/20",
        blue: "bg-info-bg dark:bg-info-bg-dark text-info-dark dark:text-info ring-info/20",
        amber: "bg-warning-bg dark:bg-warning-bg-dark text-warning-dark dark:text-warning ring-warning/20",
        red: "bg-danger-bg dark:bg-danger-bg-dark text-danger ring-danger/20",
    };
    const copy = async () => {
        if (!copyValue) return;
        try { await navigator.clipboard.writeText(copyValue); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* silent */ }
    };
    return (
        <div className="group flex items-start gap-3.5 p-3.5 rounded-xl bg-surface dark:bg-surface-dark/60 border border-border/70 dark:border-border-dark/60 transition-all duration-200 hover:border-brand-300/70 dark:hover:border-brand-700/50 hover:bg-brand-50/40 dark:hover:bg-brand-900/10 hover:shadow-sm">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
                <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted dark:text-fg-muted-dark">{label}</p>
                <div className="mt-0.5 text-sm font-medium text-fg dark:text-fg-dark break-words">{value}</div>
                {(mapAddress || copyValue) && (
                    <div className="mt-1.5 flex items-center gap-2">
                        {copyValue && (
                            <button type="button" onClick={copy} className="inline-flex items-center gap-1 text-[10px] font-medium text-fg-subtle dark:text-fg-subtle-dark hover:text-brand dark:hover:text-brand-300 transition-colors">
                                {copied ? <><CheckCircle2 className="h-3 w-3 text-success" strokeWidth={2.5} />Copied</> : <><Copy className="h-3 w-3" strokeWidth={2} />Copy</>}
                            </button>
                        )}
                        {mapAddress && (
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(mapAddress)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-medium text-fg-subtle dark:text-fg-subtle-dark hover:text-brand dark:hover:text-brand-300 transition-colors">
                                <Navigation className="h-3 w-3" strokeWidth={2} />Directions
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── snapshot item ────────────────────────────────────────────────────────────

const SnapshotItem = ({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "green" | "red" | "amber" | "default" }) => {
    const toneClass = tone === "red" ? "text-danger" : tone === "green" ? "text-success-dark dark:text-success" : tone === "amber" ? "text-warning-dark dark:text-warning" : "text-fg dark:text-fg-dark";
    return (
        <div className="flex flex-col gap-0.5 rounded-xl bg-surface dark:bg-surface-dark/60 border border-border/60 dark:border-border-dark/50 px-4 py-3.5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-fg-subtle dark:text-fg-subtle-dark">{label}</span>
            <span className={`font-data text-base font-semibold leading-tight ${toneClass}`}>{value}</span>
            {sub && <span className="text-[10px] text-fg-muted dark:text-fg-muted-dark">{sub}</span>}
        </div>
    );
};

// ─── star display ─────────────────────────────────────────────────────────────

const StarDisplay = ({ rating, max = 5 }: { rating: number; max?: number }) => (
    <div className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-border dark:text-border-dark fill-border dark:fill-border-dark"}`} strokeWidth={1.5} />
        ))}
    </div>
);

// ─── announcement chip ───────────────────────────────────────────────────────

const AnnouncementChip = ({ a }: { a: RenterAnnouncementResponse }) => {
    const isUrgent = a.priority === "URGENT";
    return (
        <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${isUrgent ? "border-danger/25 bg-danger/5 dark:bg-danger/8" : "border-border/60 dark:border-border-dark/50 bg-surface dark:bg-surface-dark/60"}`}>
            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${isUrgent ? "bg-danger text-white" : "bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300"}`}>
                {isUrgent ? "!" : "i"}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-fg dark:text-fg-dark leading-relaxed">{a.message}</p>
                <p className="mt-1 text-[10px] text-fg-muted dark:text-fg-muted-dark flex items-center gap-2">
                    {formatDate(a.createdAt)}
                    {a.read && <span className="inline-flex items-center gap-0.5 text-fg-subtle dark:text-fg-subtle-dark"><CheckCheck className="h-3 w-3" strokeWidth={2} />Read</span>}
                </p>
            </div>
        </div>
    );
};

// ─── section header ───────────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, sub, action }: {
    icon: IconFC; title: string; sub?: string; action?: React.ReactNode;
}) => (
    <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <div>
                <h3 className="section-header !text-sm !mb-0">{title}</h3>
                {sub && <p className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark -mt-0.5">{sub}</p>}
            </div>
        </div>
        {action}
    </div>
);

// ─── quick link tile ─────────────────────────────────────────────────────────

const QuickLink = ({ href, icon: Icon, title, sub, iconClass }: {
    href: string; icon: IconFC; title: string; sub: string; iconClass: string;
}) => (
    <Link href={href} className="group flex items-center justify-between gap-3 rounded-xl border border-border dark:border-border-dark bg-surface/70 dark:bg-surface-dark/50 px-4 py-3.5 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/15 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
        <div className="flex items-center gap-3">
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`}>
                <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <div>
                <p className="text-xs font-semibold text-fg dark:text-fg-dark">{title}</p>
                <p className="text-[10px] text-fg-muted dark:text-fg-muted-dark">{sub}</p>
            </div>
        </div>
        <ArrowRight className="h-4 w-4 text-fg-subtle dark:text-fg-subtle-dark transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
    </Link>
);

// ─── page ─────────────────────────────────────────────────────────────────────

export const TenantLandlordPage = () => {
    const { data: lease, isLoading, isError, refetch } = useTenantLeaseQuery();
    const { data: summary } = useTenantPaymentSummaryQuery();
    const { data: announcements } = useTenantAnnouncementsQuery();
    const { data: maintenance } = useTenantMaintenanceRequestsQuery();
    const { data: myReview } = useMyReviewQuery();
    const [shareState, setShareState] = useState<"idle" | "copied">("idle");

    const handleShare = async (name: string, phone: string | null, email: string | null, property: string | null) => {
        const text = [name, phone, email, property].filter(Boolean).join("\n");
        try {
            if (typeof navigator !== "undefined" && navigator.share) {
                await navigator.share({ title: `${name} — Contact`, text });
            } else {
                await navigator.clipboard.writeText(text);
                setShareState("copied");
                setTimeout(() => setShareState("idle"), 2500);
            }
        } catch { /* user cancelled */ }
    };

    if (isLoading) {
        return (
            <div className="page-container space-y-5 animate-fade-in-up">
                <div className="tenant-hero-panel !p-6 sm:!p-8 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="tenant-skeleton-premium h-24 w-24 rounded-2xl shrink-0" />
                        <div className="space-y-2.5 flex-1">
                            <div className="tenant-skeleton-premium h-3 w-24 rounded" />
                            <div className="tenant-skeleton-premium h-7 w-48 rounded" />
                            <div className="tenant-skeleton-premium h-4 w-2/5 rounded" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[0,1,2,3,4,5].map(i => <div key={i} className="tenant-skeleton-premium h-20 rounded-xl" />)}
                    </div>
                </div>
                <div className="tenant-panel !p-5 space-y-3">
                    <div className="tenant-skeleton-premium h-4 w-32 rounded" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[0,1,2,3,4,5].map(i => <div key={i} className="tenant-skeleton-premium h-[4.5rem] rounded-xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="page-container">
                <div className="tenant-panel !p-8 text-center max-w-md mx-auto animate-fade-in-up">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-bg dark:bg-danger-bg-dark text-danger ring-1 ring-danger/20 mb-4">
                        <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
                    </div>
                    <p className="text-sm font-semibold text-fg dark:text-fg-dark mb-1">Could not load landlord details</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-5">Check your connection and try again.</p>
                    <button onClick={() => refetch()} className="btn-outline btn-sm inline-flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="page-container">
                <div className="tenant-panel !p-8 text-center max-w-md mx-auto animate-fade-in-up">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40 mb-4">
                        <Building2 className="h-8 w-8" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm font-semibold text-fg dark:text-fg-dark mb-1">No active lease</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-5">Landlord details appear once your lease is activated.</p>
                    <Link href="/portal" className="btn-outline btn-sm">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const {
        landlordName, landlordPhone, landlordEmail, landlordCode, landlordAddress,
        landlordLogoUrl, landlordSince, landlordVerified, landlordPrimaryColor, landlordSecondaryColor,
        propertyName, propertyAddress, unitNumber, unitLabel,
        monthlyRent, startDate, endDate,
        managerName, managerPhone, managerEmail,
        emergencyContactPhone, emergencyContact24h,
    } = lease;

    const initials = (landlordName ?? "L").split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase() || "L";
    const memberSince = formatMemberSince(landlordSince);
    const waHref = waLink(landlordPhone);
    const premium = isPremiumLandlord(lease);
    const accent = usableAccent(landlordPrimaryColor);
    const accentAlt = usableAccent(landlordSecondaryColor) ?? accent;
    const hasBranding = !!safeHex(landlordPrimaryColor);

    const rentAmount = formatCurrency(toMoneyNumber(monthlyRent));
    const balance = summary ? toMoneyNumber(summary.currentBalance) : 0;
    const overdue = summary ? toMoneyNumber(summary.overdueAmount) : 0;

    const openMaint = maintenance?.filter(m => !["COMPLETED", "CANCELLED"].includes(m.status)) ?? [];
    const completedMaint = maintenance?.filter(m => m.status === "COMPLETED") ?? [];

    const recentAnnouncements = (announcements ?? [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);
    const urgentCount = recentAnnouncements.filter(a => a.priority === "URGENT").length;

    return (
        <div className="page-container space-y-5 animate-fade-in-up">

            {/* Urgent announcement banner */}
            {urgentCount > 0 && (
                <div className="flex items-center gap-3 rounded-xl border border-danger/25 bg-danger/8 dark:bg-danger/10 px-4 py-3">
                    <Bell className="h-4 w-4 shrink-0 text-danger animate-pulse" strokeWidth={2} />
                    <p className="text-xs font-semibold text-danger flex-1">
                        {urgentCount === 1 ? "1 urgent announcement" : `${urgentCount} urgent announcements`} from your landlord — check below.
                    </p>
                    <Link href="/portal/announcements" className="text-[11px] font-semibold text-danger underline underline-offset-2 shrink-0">View all</Link>
                </div>
            )}

            {/* ── Hero ─────────────────────────────────────────────── */}
            <div className="tenant-hero-panel relative overflow-hidden !p-6 sm:!p-8">
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: hasBranding ? `linear-gradient(135deg, color-mix(in srgb, ${accent} 18%, transparent), color-mix(in srgb, ${accentAlt} 7%, transparent) 60%, transparent)` : undefined }} aria-hidden />
                <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full pointer-events-none opacity-50 blur-3xl" style={{ background: `radial-gradient(circle, color-mix(in srgb, ${accent} 25%, transparent), transparent 70%)` }} aria-hidden />

                <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="relative shrink-0">
                        {landlordLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={landlordLogoUrl} alt={`${landlordName} logo`} className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white/60 dark:ring-white/10 shadow-dropdown" />
                        ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-dropdown ring-1 ring-white/25" style={{ backgroundImage: `linear-gradient(135deg, ${accent}, ${accentAlt})` }}>
                                {initials}
                            </div>
                        )}
                        {landlordVerified && (
                            <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface dark:bg-surface-dark ring-2 ring-white/80 dark:ring-surface-dark shadow-sm" style={{ color: accent }} title="Verified RentManager account holder">
                                <BadgeCheck className="h-[18px] w-[18px]" strokeWidth={2.5} />
                            </span>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted dark:text-fg-muted-dark">Your Landlord</p>
                            {premium && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-gradient-to-r from-brand to-brand-500 text-white shadow-sm">
                                    <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />Premium
                                </span>
                            )}
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${lease.status === "ACTIVE" ? "bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success ring-1 ring-inset ring-success/20" : "bg-surface dark:bg-surface-dark text-fg-muted dark:text-fg-muted-dark border border-border dark:border-border-dark"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${lease.status === "ACTIVE" ? "bg-success animate-pulse" : "bg-fg-subtle"}`} />
                                {lease.status?.toLowerCase()}
                            </span>
                        </div>
                        <h1 className="page-title !text-[1.75rem] mt-1.5 flex flex-wrap items-center gap-2">
                            {landlordName ?? "Your Landlord"}
                            {landlordVerified && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border" style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)`, borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`, color: accent }}>
                                    <BadgeCheck className="h-3 w-3" strokeWidth={2.5} />Verified
                                </span>
                            )}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                            {lease.propertyThumbnailUrl ? (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 dark:border-white/10 bg-white/20 dark:bg-white/[0.06] backdrop-blur-sm px-2 py-1">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={lease.propertyThumbnailUrl}
                                        alt=""
                                        aria-hidden
                                        className="h-5 w-5 rounded object-cover ring-1 ring-black/10 dark:ring-white/10 shrink-0"
                                    />
                                    <span className="text-sm font-medium text-fg dark:text-fg-dark">
                                        {propertyName} · Unit {unitNumber}{unitLabel ? ` · ${unitLabel}` : ""}
                                    </span>
                                </span>
                            ) : (
                                <p className="page-subtitle !text-sm !mt-0">
                                    {propertyName} · Unit {unitNumber}{unitLabel ? ` · ${unitLabel}` : ""}
                                </p>
                            )}
                        </div>
                        {memberSince && (
                            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />Renting with this landlord since {memberSince}
                            </p>
                        )}
                    </div>
                </div>

                {/* 6-tile action grid */}
                <div className="relative grid grid-cols-3 sm:grid-cols-6 gap-2 mt-7">
                    <ActionTile href={landlordPhone ? `tel:${landlordPhone}` : null} icon={Phone} label="Call" iconClass="bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success" disabled={!landlordPhone} />
                    <ActionTile href={waHref} icon={MessageCircle} label="WhatsApp" iconClass="bg-[#dcfce7] dark:bg-[#14532d]/40 text-[#15803d] dark:text-[#4ade80]" disabled={!waHref} external />
                    <ActionTile href={landlordEmail ? `mailto:${landlordEmail}` : null} icon={Mail} label="Email" iconClass="bg-info-bg dark:bg-info-bg-dark text-info-dark dark:text-info" disabled={!landlordEmail} />
                    <ActionTile href={propertyAddress ? `https://maps.google.com/?q=${encodeURIComponent(propertyAddress)}` : null} icon={Navigation} label="Directions" iconClass="bg-warning-bg dark:bg-warning-bg-dark text-warning-dark dark:text-warning" disabled={!propertyAddress} external />
                    <ActionTile onClick={() => handleShare(landlordName ?? "Landlord", landlordPhone, landlordEmail, propertyName)} icon={shareState === "copied" ? CheckCircle2 : Share2} label={shareState === "copied" ? "Copied!" : "Share"} iconClass={shareState === "copied" ? "bg-success-bg dark:bg-success-bg-dark text-success" : "bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300"} />
                    <ActionTile onClick={() => downloadVCard(lease)} icon={Save} label="Save" iconClass="bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300" />
                </div>
            </div>

            {/* ── 2-col layout ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Left column (2/3) */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Contact Details */}
                    <div className="tenant-panel !p-5 sm:!p-6">
                        <SectionHeader icon={Contact} title="Contact Details" sub="Reach your landlord & reference info" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <DetailItem icon={Phone} tone="green" label="Phone Number" copyValue={landlordPhone || null}
                                value={landlordPhone ? (
                                    <div>
                                        <a href={`tel:${landlordPhone}`} className="hover:text-brand dark:hover:text-brand-300 transition-colors">{landlordPhone}</a>
                                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                            <a href={`tel:${landlordPhone}`} className="inline-flex items-center gap-1 rounded-md bg-success-bg dark:bg-success-bg-dark px-2 py-0.5 text-[10px] font-semibold text-success-dark dark:text-success hover:bg-success/15 transition-colors">
                                                <Phone className="h-3 w-3" strokeWidth={2.5} />Call
                                            </a>
                                            {waHref && (
                                                <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-[#dcfce7] dark:bg-[#14532d]/30 px-2 py-0.5 text-[10px] font-semibold text-[#15803d] dark:text-[#4ade80] hover:bg-[#bbf7d0] dark:hover:bg-[#14532d]/50 transition-colors">
                                                    <MessageCircle className="h-3 w-3" strokeWidth={2.5} />WhatsApp
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ) : <span className="italic text-xs text-fg-muted dark:text-fg-muted-dark">Not yet provided</span>} />
                            <DetailItem icon={Mail} tone="blue" label="Email Address" copyValue={landlordEmail || null}
                                value={landlordEmail ? <a href={`mailto:${landlordEmail}`} className="hover:text-brand dark:hover:text-brand-300 transition-colors break-all">{landlordEmail}</a> : <span className="italic text-xs text-fg-muted dark:text-fg-muted-dark">Not yet provided</span>} />
                            <DetailItem icon={Landmark} tone="brand" label="Account Code" copyValue={landlordCode || null}
                                value={landlordCode ? <span className="font-mono text-[13px] tracking-wide">{landlordCode}</span> : <span className="italic text-xs text-fg-muted dark:text-fg-muted-dark">Not yet provided</span>} />
                            <DetailItem icon={MapPin} tone="amber" label="Landlord Address" mapAddress={landlordAddress || null}
                                value={landlordAddress ?? <span className="italic text-xs text-fg-muted dark:text-fg-muted-dark">Not yet provided</span>} />
                            <DetailItem icon={Home} tone="brand" label="Property Address" mapAddress={propertyAddress || null}
                                value={propertyAddress ?? <span className="italic text-xs text-fg-muted dark:text-fg-muted-dark">Not yet provided</span>} />
                            <DetailItem icon={User} tone="green" label="Lease Status"
                                value={<span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${lease.status === "ACTIVE" ? "text-success-dark dark:text-success" : "text-fg-muted dark:text-fg-muted-dark"}`}><span className={`h-1.5 w-1.5 rounded-full ${lease.status === "ACTIVE" ? "bg-success animate-pulse" : "bg-fg-subtle"}`} />{lease.status?.toLowerCase()}</span>} />
                        </div>
                        {managerName && (
                            <div className="mt-3">
                                <DetailItem icon={BriefcaseBusiness} tone="brand" label="Property Manager"
                                    value={
                                        <div className="space-y-1">
                                            <p className="font-medium">{managerName}</p>
                                            {managerPhone && (
                                                <>
                                                    <a href={`tel:${managerPhone}`} className="block text-xs text-fg-muted dark:text-fg-muted-dark hover:text-brand transition-colors">{managerPhone}</a>
                                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                                        <a href={`tel:${managerPhone}`} className="inline-flex items-center gap-1 rounded-md bg-success-bg dark:bg-success-bg-dark px-2 py-0.5 text-[10px] font-semibold text-success-dark dark:text-success hover:bg-success/15 transition-colors">
                                                            <Phone className="h-3 w-3" strokeWidth={2.5} />Call
                                                        </a>
                                                        <a href={waLink(managerPhone)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-[#dcfce7] dark:bg-[#14532d]/30 px-2 py-0.5 text-[10px] font-semibold text-[#15803d] dark:text-[#4ade80] hover:bg-[#bbf7d0] dark:hover:bg-[#14532d]/50 transition-colors">
                                                            <MessageCircle className="h-3 w-3" strokeWidth={2.5} />WhatsApp
                                                        </a>
                                                    </div>
                                                </>
                                            )}
                                            {managerEmail && <a href={`mailto:${managerEmail}`} className="block text-xs text-fg-muted dark:text-fg-muted-dark hover:text-brand transition-colors break-all">{managerEmail}</a>}
                                        </div>
                                    } />
                            </div>
                        )}
                    </div>

                    {/* Announcements */}
                    {recentAnnouncements.length > 0 && (
                        <div className="tenant-panel !p-5 sm:!p-6">
                            <SectionHeader icon={Bell} title="Announcements" sub="Latest from your landlord"
                                action={<Link href="/portal/announcements" className="inline-flex items-center gap-1 text-[11px] font-medium text-brand dark:text-brand-300 hover:underline">View all <ArrowRight className="h-3 w-3" strokeWidth={2} /></Link>}
                            />
                            <div className="space-y-2">
                                {recentAnnouncements.map(a => <AnnouncementChip key={a.id} a={a} />)}
                            </div>
                        </div>
                    )}

                    {/* Maintenance */}
                    {maintenance !== undefined && (
                        <div className="tenant-panel !p-5 sm:!p-6">
                            <SectionHeader icon={Wrench} title="Maintenance" sub="Your active requests"
                                action={<Link href="/portal/maintenance" className="inline-flex items-center gap-1 text-[11px] font-medium text-brand dark:text-brand-300 hover:underline">View all <ArrowRight className="h-3 w-3" strokeWidth={2} /></Link>}
                            />
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <SnapshotItem label="Open" value={String(openMaint.length)} tone={openMaint.length > 0 ? "amber" : "default"} />
                                <SnapshotItem label="Completed" value={String(completedMaint.length)} tone={completedMaint.length > 0 ? "green" : "default"} />
                                <SnapshotItem label="Total" value={String(maintenance.length)} />
                            </div>
                            {openMaint.length > 0 ? (
                                <div className="space-y-2 mb-3">
                                    {openMaint.slice(0, 2).map(m => (
                                        <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 dark:border-border-dark/50 bg-surface dark:bg-surface-dark/60 px-3.5 py-2.5">
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-fg dark:text-fg-dark truncate">{m.title}</p>
                                                <p className="text-[10px] text-fg-muted dark:text-fg-muted-dark mt-0.5">{m.category} · {m.status.replace(/_/g, " ").toLowerCase()}</p>
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${m.priority === "URGENT" || m.priority === "HIGH" ? "bg-danger-bg dark:bg-danger-bg-dark text-danger" : "bg-warning-bg dark:bg-warning-bg-dark text-warning-dark dark:text-warning"}`}>
                                                {m.priority.toLowerCase()}
                                            </span>
                                        </div>
                                    ))}
                                    {openMaint.length > 2 && <p className="text-[11px] text-fg-muted dark:text-fg-muted-dark text-center">+{openMaint.length - 2} more open</p>}
                                </div>
                            ) : (
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark italic text-center py-2 mb-3">No open maintenance requests — all clear.</p>
                            )}
                            <Link href="/portal/maintenance" className="w-full flex items-center justify-center gap-2 rounded-lg border border-warning/30 bg-warning-bg/60 dark:bg-warning-bg-dark/40 text-warning-dark dark:text-warning px-4 py-2.5 text-xs font-semibold hover:bg-warning-bg dark:hover:bg-warning-bg-dark transition-colors">
                                <Wrench className="h-3.5 w-3.5" strokeWidth={2} />Report a new issue
                            </Link>
                        </div>
                    )}
                </div>

                {/* Right sidebar (1/3) */}
                <div className="space-y-5">

                    {/* Rental Snapshot */}
                    <div className="tenant-panel !p-5 sm:!p-6">
                        <SectionHeader icon={CreditCard} title="Rental Snapshot" sub="Your lease at a glance" />
                        <div className="grid grid-cols-2 gap-2.5">
                            <SnapshotItem label="Monthly Rent" value={rentAmount} />
                            <SnapshotItem label="Balance" value={formatCurrency(balance)} tone={overdue > 0 ? "red" : balance < 0 ? "green" : "default"} sub={overdue > 0 ? `${formatCurrency(overdue)} overdue` : balance < 0 ? "In credit" : undefined} />
                            <SnapshotItem label="Lease Start" value={formatDate(startDate) ?? "—"} />
                            <SnapshotItem label="Lease End" value={formatDate(endDate) ?? "Open-ended"} />
                            {summary?.lastPaymentDate && (
                                <div className="col-span-2">
                                    <SnapshotItem label="Last Payment" value={formatCurrency(toMoneyNumber(summary.lastPaymentAmount))} sub={formatDate(summary.lastPaymentDate) ?? undefined} tone="green" />
                                </div>
                            )}
                            {summary && summary.paymentsThisYear > 0 && (
                                <div className="col-span-2">
                                    <SnapshotItem label="Paid This Year" value={formatCurrency(toMoneyNumber(summary.totalPaid))} sub={`${summary.paymentsThisYear} payment${summary.paymentsThisYear === 1 ? "" : "s"}`} />
                                </div>
                            )}
                        </div>
                        <Link href="/portal/lease" className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-fg-muted dark:text-fg-muted-dark hover:text-brand dark:hover:text-brand-300 transition-colors group">
                            Pay rent or view full lease <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                        </Link>
                    </div>

                    {/* Your Review */}
                    <div className="tenant-panel !p-5 sm:!p-6">
                        <SectionHeader icon={Star} title="Your Review" sub="Your rating of this landlord" />
                        {myReview ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <StarDisplay rating={myReview.rating} />
                                    <span className="text-xs font-semibold text-fg dark:text-fg-dark">{myReview.rating}/5</span>
                                    <span className={`ml-auto text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${myReview.status === "APPROVED" ? "bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success" : myReview.status === "PENDING" ? "bg-warning-bg dark:bg-warning-bg-dark text-warning-dark dark:text-warning" : "bg-border-subtle dark:bg-border-subtle-dark text-fg-muted dark:text-fg-muted-dark"}`}>
                                        {myReview.status.toLowerCase()}
                                    </span>
                                </div>
                                {myReview.comment && (
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark italic leading-relaxed line-clamp-4">&ldquo;{myReview.comment}&rdquo;</p>
                                )}
                                <p className="text-[10px] text-fg-subtle dark:text-fg-subtle-dark">Submitted {formatDate(myReview.createdAt)}</p>
                            </div>
                        ) : (
                            <div className="text-center py-2 space-y-2">
                                <div className="flex justify-center gap-1">
                                    {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 text-border dark:text-border-dark" strokeWidth={1.5} />)}
                                </div>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">You haven&apos;t reviewed this landlord yet.</p>
                                <Link href="/portal/review" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand dark:text-brand-300 hover:underline">
                                    Leave a review <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Emergency Contact */}
                    {emergencyContactPhone && (
                        <div className="relative tenant-panel !p-5 overflow-hidden border border-danger/25 dark:border-danger/20">
                            <div className="absolute inset-0 bg-gradient-to-br from-danger/5 to-transparent pointer-events-none" aria-hidden />
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-danger to-danger/40" aria-hidden />
                            <div className="relative">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-bg dark:bg-danger-bg-dark text-danger ring-1 ring-danger/20">
                                            <PhoneCall className="h-[18px] w-[18px]" strokeWidth={2} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-danger">Emergency</p>
                                            <p className="text-[10px] text-fg-muted dark:text-fg-muted-dark">Urgent matters only</p>
                                        </div>
                                    </div>
                                    {emergencyContact24h && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-success-bg dark:bg-success-bg-dark border border-success/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success-dark dark:text-success">
                                            <Clock className="h-2.5 w-2.5" strokeWidth={2.5} />24/7
                                        </span>
                                    )}
                                </div>
                                <p className="font-mono text-xl font-bold text-fg dark:text-fg-dark mb-3">{emergencyContactPhone}</p>
                                <a href={`tel:${emergencyContactPhone}`} className="flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-bold text-white hover:bg-danger/90 active:scale-95 transition-all shadow-sm shadow-danger/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50">
                                    <Phone className="h-4 w-4" strokeWidth={2.5} />Call Now
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Quick links ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <QuickLink href="/portal/maintenance" icon={Wrench} title="Report an Issue" sub="Maintenance requests" iconClass="bg-warning-bg dark:bg-warning-bg-dark text-warning-dark dark:text-warning" />
                <QuickLink href="/portal/payments" icon={CreditCard} title="Payment History" sub="Receipts & records" iconClass="bg-info-bg dark:bg-info-bg-dark text-info-dark dark:text-info" />
                <QuickLink href="/portal/lease" icon={Home} title="My Lease" sub="Pay rent & lease details" iconClass="bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success" />
            </div>

            {/* ── Trust panel ──────────────────────────────────────── */}
            <div className="relative tenant-panel !p-5 sm:!p-6 overflow-hidden border-2 border-brand/15 dark:border-brand/15">
                <div className="absolute inset-0 pointer-events-none opacity-60" style={{ backgroundImage: "linear-gradient(120deg, color-mix(in srgb, var(--color-brand) 8%, transparent), transparent 60%)" }} aria-hidden />
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-brand to-brand-accent" aria-hidden />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                        <ShieldCheck className="h-[22px] w-[22px]" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Every payment leaves a permanent receipt</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5 leading-relaxed">
                            You approve each payment with your M-Pesa PIN on your own phone — it is never shared with us or with{" "}
                            {landlordName ?? "your landlord"}. Payments are matched to their M-Pesa receipt number and written to
                            your ledger, where records cannot be edited or deleted, only corrected by a visible reversal.
                        </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ring-success/20 dark:ring-success/30">
                        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />Secure
                    </span>
                </div>
            </div>

        </div>
    );
};
