// components/tenant-landlord.tsx
"use client";

import { AlertTriangle, BadgeCheck, Building2, CalendarDays, Contact, Copy, Home, Mail, MapPin, MessageCircle, Phone, Save, ShieldCheck, Sparkles, User, Landmark, PhoneCall, Clock, BriefcaseBusiness } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTenantLeaseQuery } from "../hooks/use-tenant-portal-queries";
import { isPremiumLandlord, type TenantLeaseResponse } from "../api/tenant-portal-api";

const formatMemberSince = (iso: string | null) => {
    if (!iso) return null;
    const date = new Date(iso);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-KE", { year: "numeric", month: "long" });
};

const whatsappLink = (phone: string | null) =>
    phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : null;

const downloadVCard = (lease: TenantLeaseResponse) => {
    const name = lease.landlordName ?? "Landlord";
    const vcard = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${name}`,
        lease.landlordPhone ? `TEL;TYPE=CELL:${lease.landlordPhone}` : null,
        lease.landlordEmail ? `EMAIL;TYPE=INTERNET:${lease.landlordEmail}` : null,
        lease.landlordAddress ? `ADR;TYPE=HOME:;;${lease.landlordAddress};;;` : null,
        lease.propertyName ? `ORG:${lease.propertyName}` : null,
        "END:VCARD",
    ]
        .filter((line): line is string => line !== null)
        .join("\n");

    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
};

const DetailItem = ({ icon: Icon, label, value, tone = "brand" }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
    tone?: "brand" | "green" | "blue" | "amber" | "violet";
}) => {
    const tones: Record<string, string> = {
        brand: "bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-brand-200/60 dark:ring-brand-700/40",
        green: "bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success ring-success/20 dark:ring-success/30",
        blue: "bg-info-bg dark:bg-info-bg-dark text-info-dark dark:text-info ring-info/20 dark:ring-info/30",
        amber: "bg-warning-bg dark:bg-warning-bg-dark text-warning-dark dark:text-warning ring-warning/20 dark:ring-warning/30",
        violet: "bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-brand-200/60 dark:ring-brand-700/40",
    };
    return (
        <div className="group flex items-start gap-3.5 p-3.5 rounded-xl bg-surface dark:bg-surface-dark/60 border border-border/70 dark:border-border-dark/60 transition-all duration-200 hover:border-brand-300/70 dark:hover:border-brand-700/50 hover:bg-brand-50/40 dark:hover:bg-brand-900/10 hover:shadow-sm">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${tones[tone]}`}>
                {/* @ts-expect-error - React 19 ElementType inference issue */}
                <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
            </div>
            <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted dark:text-fg-muted-dark">{label}</p>
                <div className="mt-0.5 text-sm font-medium text-fg dark:text-fg-dark break-words">{value}</div>
            </div>
        </div>
    );
};

const ContactAction = ({ href, icon: Icon, label, external = true }: {
    href: string | null;
    icon: React.ElementType;
    label: string;
    external?: boolean;
}) => {
    const inner = (
        <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success transition-transform duration-200 group-hover:scale-105">
                {/* @ts-expect-error - React 19 ElementType inference issue */}
                <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <span>{label}</span>
        </>
    );
    const cls = "group flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-border dark:border-border-dark bg-surface/80 dark:bg-surface-dark/60 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/15 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-offset-surface-dark disabled:opacity-50 disabled:pointer-events-none";
    if (!href) {
        return <span className={`${cls} opacity-50 cursor-not-allowed`}>{inner}</span>;
    }
    return (
        <a
            href={href}
            className={cls}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
        >
            {inner}
        </a>
    );
};

export const TenantLandlordPage = () => {
    const { data: lease, isLoading, isError, refetch } = useTenantLeaseQuery();
    const [copied, setCopied] = useState(false);

    const copyPhone = async (phone: string | null) => {
        if (!phone) return;
        try {
            await navigator.clipboard.writeText(phone);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
        }
    };

    if (isLoading) {
        return (
            <div className="page-container space-y-6 animate-fade-in-up">
                <div className="tenant-hero-panel !p-6 sm:!p-8 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        <div className="tenant-skeleton-premium h-20 w-20 rounded-2xl shrink-0" />
                        <div className="space-y-2.5 flex-1">
                            <div className="tenant-skeleton-premium h-3 w-24 rounded" />
                            <div className="tenant-skeleton-premium h-7 w-1/3 rounded" />
                            <div className="tenant-skeleton-premium h-4 w-2/5 rounded" />
                            <div className="tenant-skeleton-premium h-3 w-1/4 rounded" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="tenant-skeleton-premium h-12 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
                <div className="tenant-panel !p-5 space-y-3">
                    <div className="tenant-skeleton-premium h-4 w-32 rounded" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="tenant-skeleton-premium h-16 w-full rounded-xl" />
                        ))}
                    </div>
                </div>
                <div className="tenant-skeleton-premium h-16 w-full rounded-2xl" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="page-container">
                <div className="tenant-panel !p-8 text-center max-w-md mx-auto animate-fade-in-up">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-bg dark:bg-danger-bg-dark text-danger dark:text-danger ring-1 ring-danger/20 mb-4">
                        <AlertTriangle className="h-7 w-7" strokeWidth={1.75} />
                    </div>
                    <p className="text-sm font-semibold text-fg dark:text-fg-dark mb-1">Failed to load landlord details</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-5">Please try again</p>
                    <button onClick={() => refetch()} className="btn-outline btn-sm">Retry</button>
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
                    <p className="text-sm font-semibold text-fg dark:text-fg-dark mb-1">No landlord details yet</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-5">
                        Your landlord&apos;s profile will appear here once your lease is activated.
                    </p>
                    <Link href="/portal" className="btn-outline btn-sm">Back to Dashboard</Link>
                </div>
            </div>
        );
    }

    const {
        landlordName,
        landlordPhone,
        landlordEmail,
        landlordCode,
        landlordAddress,
        landlordLogoUrl,
        landlordSince,
        landlordVerified,
        propertyName,
        propertyAddress,
        unitNumber,
        unitLabel,
    } = lease;

    const initials =
        (landlordName ?? "L")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase() || "L";

    const memberSince = formatMemberSince(landlordSince);
    const waLink = whatsappLink(landlordPhone);
    const premium = isPremiumLandlord(lease);
    const hasBranding = Boolean(lease.landlordPrimaryColor) || Boolean(lease.landlordSecondaryColor);
    const themeVars = hasBranding
        ? ({
              "--brand-theme-primary": lease.landlordPrimaryColor || "#059669",
              "--brand-theme-secondary": lease.landlordSecondaryColor || "#10B981",
          } as React.CSSProperties)
        : undefined;

    return (
        <div className="page-container space-y-6 animate-fade-in-up" style={themeVars}>
            {/* Hero / identity card — was .hero-card, a separate (also
                well-built) glass treatment from .tenant-panel used by every
                other section on this page. Both are fully dark-mode-safe, so
                this wasn't a bug, but one consistent panel language reads as
                more considered than two equally good ones mixed on the same
                page. */}
            <div className="tenant-hero-panel relative !p-6 sm:!p-8">
                {/* Branding gradient wash */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: hasBranding
                            ? "linear-gradient(135deg, color-mix(in srgb, var(--brand-theme-primary) 22%, transparent), color-mix(in srgb, var(--brand-theme-secondary) 8%, transparent) 55%, transparent)"
                            : undefined,
                    }}
                    aria-hidden
                />
                {/* Decorative glow orb */}
                <div
                    className="absolute -top-24 -right-16 h-64 w-64 rounded-full pointer-events-none opacity-70 blur-3xl"
                    style={{
                        background: hasBranding
                            ? "radial-gradient(circle, color-mix(in srgb, var(--brand-theme-primary) 30%, transparent), transparent 70%)"
                            : "radial-gradient(circle, color-mix(in srgb, var(--color-brand) 16%, transparent), transparent 70%)",
                    }}
                    aria-hidden
                />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="relative shrink-0">
                        {landlordLogoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={landlordLogoUrl}
                                alt={`${landlordName} logo`}
                                className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white/70 dark:ring-white/10 shadow-dropdown bg-surface dark:bg-surface-dark"
                            />
                        ) : (
                            <div
                                className="flex h-24 w-24 items-center justify-center rounded-2xl text-2xl font-semibold text-white shadow-dropdown ring-1 ring-white/40 dark:ring-white/10"
                                style={
                                    hasBranding
                                        ? { backgroundImage: "linear-gradient(135deg, var(--brand-theme-primary), var(--brand-theme-secondary))" }
                                        : { backgroundImage: "linear-gradient(135deg, var(--color-brand), var(--color-brand-accent))" }
                                }
                            >
                                {initials}
                            </div>
                        )}
                        {landlordVerified && (
                            <span
                                className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface dark:bg-surface-dark text-brand dark:text-brand-300 ring-2 ring-white/80 dark:ring-surface-dark shadow-sm"
                                title="Verified RentManager account holder"
                            >
                                <BadgeCheck className="h-4.5 w-4.5" strokeWidth={2.5} />
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted dark:text-fg-muted-dark">
                                Your Landlord
                            </p>
                            {premium && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide bg-gradient-to-r from-brand to-brand-500 text-white dark:from-brand-400 dark:to-brand-500 dark:text-brand-950 shadow-sm">
                                    <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
                                    Premium
                                </span>
                            )}
                            <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
                                    lease.status === "ACTIVE"
                                        ? "bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success ring-1 ring-inset ring-success/20 dark:ring-success/30"
                                        : "bg-surface dark:bg-surface-dark text-fg-muted dark:text-fg-muted-dark border border-border dark:border-border-dark"
                                }`}
                                title={`Lease status: ${lease.status?.toLowerCase()}`}
                            >
                                <span className={`status-dot ${lease.status === "ACTIVE" ? "status-dot-success status-dot-live" : ""}`} />
                                {lease.status?.toLowerCase()}
                            </span>
                        </div>
                        <h1 className="page-title !text-[1.75rem] mt-1.5 flex flex-wrap items-center gap-2">
                            {landlordName ?? "Your Landlord"}
                            {landlordVerified && (
                                <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                                    title="This landlord is an active, verified RentManager account holder"
                                >
                                    <BadgeCheck className="h-3 w-3" strokeWidth={2.5} />
                                    Verified
                                </span>
                            )}
                        </h1>
                        <p className="page-subtitle !text-sm mt-1">
                            {propertyName} · Unit {unitNumber}{unitLabel ? ` · ${unitLabel}` : ""}
                        </p>
                        {memberSince && (
                            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
                                Renting with this landlord since {memberSince}
                            </p>
                        )}
                    </div>
                </div>

                {/* Quick contact actions */}
                <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-7">
                    <a
                        href={landlordPhone ? `tel:${landlordPhone}` : undefined}
                        className={`group flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-border dark:border-border-dark bg-surface/80 dark:bg-surface-dark/60 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/15 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-offset-surface-dark ${!landlordPhone ? "opacity-50 pointer-events-none" : ""}`}
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success transition-transform duration-200 group-hover:scale-105">
                            <Phone className="h-4 w-4" strokeWidth={2} />
                        </span>
                        Call
                    </a>
                    <ContactAction href={waLink} icon={MessageCircle} label="WhatsApp" />
                    <a
                        href={landlordEmail ? `mailto:${landlordEmail}` : undefined}
                        className={`group flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-border dark:border-border-dark bg-surface/80 dark:bg-surface-dark/60 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/15 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-offset-surface-dark ${!landlordEmail ? "opacity-50 pointer-events-none" : ""}`}
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-bg dark:bg-info-bg-dark text-info-dark dark:text-info transition-transform duration-200 group-hover:scale-105">
                            <Mail className="h-4 w-4" strokeWidth={2} />
                        </span>
                        Email
                    </a>
                    <button
                        type="button"
                        onClick={() => downloadVCard(lease)}
                        className="group flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 border border-border dark:border-border-dark bg-surface/80 dark:bg-surface-dark/60 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/50 dark:hover:bg-brand-900/15 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:focus-visible:ring-offset-surface-dark"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 transition-transform duration-200 group-hover:scale-105">
                            <Save className="h-4 w-4" strokeWidth={2} />
                        </span>
                        Save Contact
                    </button>
                </div>
            </div>

            {/* Contact details */}
            <div className="tenant-panel !p-5 sm:!p-6">
                <div className="flex items-center gap-2.5 mb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                        <Contact className="h-4.5 w-4.5" strokeWidth={2} />
                    </span>
                    <div>
                        <h3 className="section-header !text-sm !mb-0">Contact Details</h3>
                        <p className="text-[11px] text-fg-subtle dark:text-fg-subtle-dark -mt-0.5">Reach your landlord &amp; reference info</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <DetailItem
                        icon={Phone}
                        tone="green"
                        label="Phone Number"
                        value={
                            <span className="inline-flex items-center gap-2">
                                <a href={`tel:${landlordPhone}`} className="hover:text-brand dark:hover:text-brand-300 transition-colors">
                                    {landlordPhone ?? "—"}
                                </a>
                                {landlordPhone && (
                                    <button
                                        type="button"
                                        onClick={() => copyPhone(landlordPhone)}
                                        aria-label="Copy phone number"
                                        className="text-fg-subtle dark:text-fg-subtle-dark hover:text-brand dark:hover:text-brand-300 transition-colors"
                                    >
                                        {copied ? (
                                            <BadgeCheck className="h-3.5 w-3.5 text-success" strokeWidth={2} />
                                        ) : (
                                            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                                        )}
                                    </button>
                                )}
                            </span>
                        }
                    />
                    <DetailItem
                        icon={Mail}
                        tone="blue"
                        label="Email Address"
                        value={
                            landlordEmail ? (
                                <a href={`mailto:${landlordEmail}`} className="hover:text-brand dark:hover:text-brand-300 transition-colors break-all">
                                    {landlordEmail}
                                </a>
                            ) : "—"
                        }
                    />
                    <DetailItem
                        icon={Landmark}
                        tone="violet"
                        label="Landlord ID"
                        value={landlordCode ? (
                            <span className="font-mono-nums text-[13px] tracking-wide">{landlordCode}</span>
                        ) : "—"}
                    />
                    <DetailItem
                        icon={MapPin}
                        tone="amber"
                        label="Landlord Address"
                        value={landlordAddress ?? "—"}
                    />
                    <DetailItem
                        icon={Home}
                        tone="brand"
                        label="Property Address"
                        value={propertyAddress ?? "—"}
                    />
                    <DetailItem
                        icon={User}
                        tone="green"
                        label="Lease Status"
                        value={
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${lease.status === "ACTIVE" ? "text-success-dark dark:text-success" : "text-fg-muted dark:text-fg-muted-dark"}`}>
                                <span className={`status-dot-live ${lease.status === "ACTIVE" ? "status-dot-success" : ""}`} />
                                {lease.status?.toLowerCase()}
                            </span>
                        }
                    />
                    {lease.managerName && (
                        <DetailItem
                            icon={BriefcaseBusiness}
                            tone="brand"
                            label="Property Manager"
                            value={
                                <div className="space-y-0.5">
                                    <p className="font-medium text-fg dark:text-fg-dark">{lease.managerName}</p>
                                    {lease.managerPhone && (
                                        <a href={`tel:${lease.managerPhone}`} className="block text-xs text-fg-muted dark:text-fg-muted-dark hover:text-brand dark:hover:text-brand-300 transition-colors">
                                            {lease.managerPhone}
                                        </a>
                                    )}
                                    {lease.managerEmail && (
                                        <a href={`mailto:${lease.managerEmail}`} className="block text-xs text-fg-muted dark:text-fg-muted-dark hover:text-brand dark:hover:text-brand-300 transition-colors break-all">
                                            {lease.managerEmail}
                                        </a>
                                    )}
                                </div>
                            }
                        />
                    )}
                    {lease.emergencyContactPhone && (
                        <DetailItem
                            icon={PhoneCall}
                            tone="amber"
                            label="Emergency Contact"
                            value={
                                <div className="space-y-1.5">
                                    <a
                                        href={`tel:${lease.emergencyContactPhone}`}
                                        className="inline-flex items-center gap-2 rounded-lg border border-border dark:border-border-dark px-2.5 py-1.5 text-sm font-medium text-fg dark:text-fg-dark hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-900/15 transition-all"
                                    >
                                        <PhoneCall className="h-3.5 w-3.5 text-success-dark dark:text-success" strokeWidth={2} />
                                        {lease.emergencyContactPhone}
                                    </a>
                                    {lease.emergencyContact24h && (
                                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-success-dark dark:text-success">
                                            <Clock className="h-3 w-3" strokeWidth={2} />
                                            24/7
                                        </span>
                                    )}
                                </div>
                            }
                        />
                    )}
                </div>
            </div>

            {/* Trust / reassurance */}
            <div className="relative tenant-panel !p-5 sm:!p-6 overflow-hidden border-2 border-brand/20 dark:border-brand/20">
                <div
                    className="absolute inset-0 pointer-events-none opacity-70"
                    style={{
                        backgroundImage: "linear-gradient(120deg, color-mix(in srgb, var(--color-brand) 8%, transparent), transparent 60%)",
                    }}
                    aria-hidden
                />
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-brand to-brand-accent" aria-hidden />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                        <ShieldCheck className="h-5.5 w-5.5" strokeWidth={1.75} />
                    </div>
                    {/* TRUST COPY — every sentence here must be traceable to code.
                        What was here before made three claims the system does not
                        support: "Payments are always protected" (there is no
                        protection scheme, escrow or insurance behind it),
                        "you're in safe hands", and "remitted directly to <landlord>'s
                        M-Pesa account" — which is simply not how rent flows.
                        RentPaymentInitiationService charges rent against the
                        PLATFORM's Daraja credentials and the landlord is paid
                        afterwards by B2C disbursement, so nothing is remitted
                        directly. What IS true is stronger anyway: the PIN never
                        leaves the renter's own phone, and the ledger is
                        append-only with a matched M-Pesa receipt per payment. */}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            Every payment leaves a receipt
                        </p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5 leading-relaxed">
                            You approve each payment with your M-Pesa PIN on your own phone — it is never
                            shared with us or with {landlordName ?? "your landlord"}. Each payment is matched
                            to its M-Pesa receipt number and written to your ledger, where records cannot be
                            edited or deleted, only corrected by a visible reversal.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ring-success/20 dark:ring-success/30">
                            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                            Secure
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
