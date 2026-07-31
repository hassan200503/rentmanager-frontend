// components/tenant-landlord.tsx
"use client";

import { AlertTriangle, BadgeCheck, Building2, CalendarDays, Copy, Home, Mail, MapPin, MessageCircle, Phone, Save, ShieldCheck, Sparkles, User, Landmark } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTenantLeaseQuery } from "../hooks/use-tenant-portal-queries";
import type { TenantLeaseResponse } from "../api/tenant-portal-api";

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
        brand: "bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300",
        green: "bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success",
        blue: "bg-info-bg dark:bg-info-bg-dark text-info-dark dark:text-info",
        amber: "bg-warning-bg dark:bg-warning-bg-dark text-warning-dark dark:text-warning",
        violet: "bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300",
    };
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border/60 dark:border-border-dark/60">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
                <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">{label}</p>
                <div className="text-sm font-medium text-fg dark:text-fg-dark break-words">{value}</div>
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
            <Icon className="h-4 w-4 text-success-dark dark:text-success" strokeWidth={2} />
            <span>{label}</span>
        </>
    );
    const cls = "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border border-border dark:border-border-dark hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-900/15 disabled:opacity-50 disabled:pointer-events-none";
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
            <div className="page-container space-y-6">
                <div className="hero-card p-6 space-y-3">
                    <div className="skeleton h-20 w-20 rounded-2xl" />
                    <div className="skeleton h-6 w-1/3" />
                    <div className="skeleton h-4 w-1/4" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="card-elevated p-4"><div className="skeleton h-16 w-full" /></div>
                    ))}
                </div>
                <div className="card-elevated p-4"><div className="skeleton h-48 w-full" /></div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="page-container">
                <div className="card p-6 text-center max-w-md mx-auto">
                    <AlertTriangle className="h-10 w-10 mx-auto text-danger mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">Failed to load landlord details</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">Please try again</p>
                    <button onClick={() => refetch()} className="btn-outline btn-sm">Retry</button>
                </div>
            </div>
        );
    }

    if (!lease) {
        return (
            <div className="page-container">
                <div className="card p-8 text-center max-w-md mx-auto">
                    <Building2 className="h-12 w-12 mx-auto text-fg-muted dark:text-fg-muted-dark mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No landlord details yet</p>
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mb-4">
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

    return (
        <div className="page-container space-y-6 animate-fade-in-up">
            {/* Hero / identity card */}
            <div className="hero-card relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-gradient-to-br from-brand/15 via-brand/5 to-transparent dark:from-brand/25 dark:via-brand/10 dark:to-transparent pointer-events-none"
                    aria-hidden
                />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                    {landlordLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={landlordLogoUrl}
                            alt={`${landlordName} logo`}
                            className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/60 dark:ring-white/10 shadow-dropdown bg-surface dark:bg-surface-dark"
                        />
                    ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-500 text-2xl font-semibold text-white shadow-dropdown">
                            {initials}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted dark:text-fg-muted-dark">
                                Your Landlord
                            </p>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wide bg-gradient-to-r from-brand to-brand-500 text-white dark:from-brand-400 dark:to-brand-500 dark:text-brand-950 shadow-sm">
                                <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
                                Premium
                            </span>
                        </div>
                        <h1 className="page-title !text-[1.75rem] mt-1 flex flex-wrap items-center gap-2">
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
                            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
                                Renting with this landlord since {memberSince}
                            </p>
                        )}
                    </div>
                </div>

                {/* Quick contact actions */}
                <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
                    <a
                        href={landlordPhone ? `tel:${landlordPhone}` : undefined}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border border-border dark:border-border-dark hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-900/15 ${!landlordPhone ? "opacity-50 pointer-events-none" : ""}`}
                    >
                        <Phone className="h-4 w-4 text-success-dark dark:text-success" strokeWidth={2} />
                        Call
                    </a>
                    <ContactAction href={waLink} icon={MessageCircle} label="WhatsApp" />
                    <a
                        href={landlordEmail ? `mailto:${landlordEmail}` : undefined}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border border-border dark:border-border-dark hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-900/15 ${!landlordEmail ? "opacity-50 pointer-events-none" : ""}`}
                    >
                        <Mail className="h-4 w-4 text-info-dark dark:text-info" strokeWidth={2} />
                        Email
                    </a>
                    <button
                        type="button"
                        onClick={() => downloadVCard(lease)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border border-border dark:border-border-dark hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50/40 dark:hover:bg-brand-900/15"
                    >
                        <Save className="h-4 w-4 text-brand dark:text-brand-300" strokeWidth={2} />
                        Save Contact
                    </button>
                </div>
            </div>

            {/* Contact details */}
            <div>
                <h3 className="section-header !text-sm mb-3">Contact Details</h3>
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
                </div>
            </div>

            {/* Trust / reassurance */}
            <div className="card-elevated p-5 border-2 border-brand/15 dark:border-brand/15">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                        <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            {landlordVerified
                                ? "Verified landlord — you're in safe hands"
                                : "Payments are always protected"}
                        </p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                            Rent payments are processed securely through RentManager and remitted directly to {landlordName ?? "your landlord"}&apos;s
                            M-Pesa account. Every payment you make is recorded in your ledger and receipt history.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success text-[11px] font-semibold uppercase tracking-wide">
                            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                            Secure
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
