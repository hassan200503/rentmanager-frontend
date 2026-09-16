"use client";

import { useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    BadgeCheck,
    Bell,
    Building2,
    ChevronDown,
    ChevronRight,
    CreditCard,
    FileText,
    HelpCircle,
    Mail,
    MessageCircle,
    Phone,
    Receipt,
    ShieldCheck,
    Smartphone,
    User,
    Wrench,
    type LucideIcon,
} from "lucide-react";
import { useTenantLeaseQuery, useTenantAutoPaySettingsQuery } from "../hooks/use-tenant-portal-queries";
import { PortalPage } from "./portal-chrome";

// ── Types ──────────────────────────────────────────────────────────────────────

type FaqCategory = "all" | "payments" | "maintenance" | "tenancy" | "announcements";

interface FaqItem {
    question: string;
    answer: string;
    icon: LucideIcon;
    category: Exclude<FaqCategory, "all">;
    iconBg: string;
    iconText: string;
}

// ── FAQ data ───────────────────────────────────────────────────────────────────
// Answer text must be traceable to working product behaviour. Never claim a
// feature that doesn't exist.

const FAQS: FaqItem[] = [
    /* ── Payments ── */
    {
        question: "How do I pay my rent?",
        answer:
            "Open the Payments page (or the Quick Payment widget on your dashboard), enter the amount, confirm your M-Pesa number, and approve the prompt on your phone. Your balance updates automatically once the payment is confirmed — usually within seconds.",
        icon: Smartphone,
        category: "payments",
        iconBg: "bg-success-bg dark:bg-success-bg-dark",
        iconText: "text-success-dark dark:text-success",
    },
    {
        question: "I didn't receive the M-Pesa STK push. What now?",
        answer:
            "Check that the M-Pesa number on file is correct and that you have airtime or a linked bank account. Then press 'Check status' or retry from the Payments page. The prompt can arrive a few seconds late — give it a moment before retrying.",
        icon: AlertTriangle,
        category: "payments",
        iconBg: "bg-warning-bg dark:bg-warning-bg-dark",
        iconText: "text-warning-dark dark:text-warning",
    },
    {
        question: "What is auto-pay and how do I set it up?",
        answer:
            "Auto-pay settles your rent automatically from your M-Pesa account on your due date so you never miss a payment. Enable it from the Lease page — toggle 'Turn On' under Auto-Pay Settings and confirm your M-Pesa number.",
        icon: Bell,
        category: "payments",
        iconBg: "bg-brand-50 dark:bg-brand-900/30",
        iconText: "text-brand dark:text-brand-300",
    },
    {
        question: "How do I download a payment receipt?",
        answer:
            "Go to the Payments page and tap the download icon on any transaction row. PDF receipts are available at any time, and eTIMS-compliant invoices are included on the receipt when your landlord has them enabled.",
        icon: Receipt,
        category: "payments",
        iconBg: "bg-success-bg dark:bg-success-bg-dark",
        iconText: "text-success-dark dark:text-success",
    },
    /* ── Maintenance ── */
    {
        question: "How do I report a maintenance issue?",
        answer:
            "Open the Maintenance page and press 'New Request'. Choose a category (plumbing, electrical, etc.) and priority level, describe the issue in detail, and submit. You can track every request's status — from Submitted through to Completed — from the same page.",
        icon: Wrench,
        category: "maintenance",
        iconBg: "bg-amber-50 dark:bg-amber-900/20",
        iconText: "text-amber-600 dark:text-amber-400",
    },
    {
        question: "What do the priority levels mean?",
        answer:
            "Low: minor or cosmetic — no urgency. Medium: affects daily comfort, address soon. High: significantly impacts your safety or use of the property. Urgent: immediate danger such as flooding, a gas leak, or a security breach. Use Urgent only when genuinely necessary so your landlord can triage correctly.",
        icon: AlertTriangle,
        category: "maintenance",
        iconBg: "bg-amber-50 dark:bg-amber-900/20",
        iconText: "text-amber-600 dark:text-amber-400",
    },
    /* ── Tenancy ── */
    {
        question: "Where can I find my lease details?",
        answer:
            "Open the Lease page in your portal. It shows your start and end dates, monthly rent, deposit status, payment history, and your landlord's contact information — all in one place.",
        icon: FileText,
        category: "tenancy",
        iconBg: "bg-brand-50 dark:bg-brand-900/30",
        iconText: "text-brand dark:text-brand-300",
    },
    {
        question: "What happens if I miss a rent payment?",
        answer:
            "Your balance will show as overdue on your dashboard and payments page. Contact your landlord as soon as possible — any late fees or penalties are set by your individual lease agreement. You can view the terms on your Lease page.",
        icon: AlertTriangle,
        category: "tenancy",
        iconBg: "bg-danger-bg dark:bg-danger-bg-dark",
        iconText: "text-danger-dark dark:text-danger",
    },
    {
        question: "How do I give notice to end my tenancy?",
        answer:
            "Contact your landlord directly using the phone, WhatsApp, or email on this page. Your notice period is defined in your lease agreement — check the Lease page for your specific terms. Send written notice (email) so you have a record.",
        icon: FileText,
        category: "tenancy",
        iconBg: "bg-brand-50 dark:bg-brand-900/30",
        iconText: "text-brand dark:text-brand-300",
    },
    /* ── Announcements ── */
    {
        question: "How do I receive announcements on WhatsApp?",
        answer:
            "Open the Announcements page and toggle on 'WhatsApp announcements'. Your landlord can then reach you there — you can switch it off at any time. All announcements also appear in the portal regardless of this setting.",
        icon: MessageCircle,
        category: "announcements",
        iconBg: "bg-[#dcfce7] dark:bg-[#14532d]/30",
        iconText: "text-[#15803d] dark:text-[#4ade80]",
    },
];

const FAQ_TABS: { id: FaqCategory; label: string }[] = [
    { id: "all",           label: "All"           },
    { id: "payments",      label: "Payments"      },
    { id: "maintenance",   label: "Maintenance"   },
    { id: "tenancy",       label: "My Tenancy"    },
    { id: "announcements", label: "Announcements" },
];

// ── FAQ accordion component ────────────────────────────────────────────────────

function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    if (faqs.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-border dark:border-border-dark py-10 text-center">
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">No questions in this category yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {faqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                const Icon = faq.icon;
                return (
                    <div key={faq.question} className="tenant-panel !p-0 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                            aria-expanded={isOpen}
                            className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-ink/[0.02] dark:hover:bg-white/[0.03]"
                        >
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${faq.iconBg} ${faq.iconText}`}>
                                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                            </span>
                            <span className="flex-1 text-sm font-semibold text-fg dark:text-fg-dark">
                                {faq.question}
                            </span>
                            <ChevronDown
                                className={`h-4 w-4 shrink-0 text-fg-subtle dark:text-fg-subtle-dark transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                strokeWidth={2}
                            />
                        </button>
                        {/* Height animation via CSS grid — no JS measurement required */}
                        <div className={`grid transition-all duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                            <div className="overflow-hidden">
                                <div className="border-t border-border/50 px-5 pb-5 pt-4 dark:border-border-dark/50">
                                    <p className="text-sm leading-relaxed text-fg-muted dark:text-fg-muted-dark">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Root ───────────────────────────────────────────────────────────────────────

export default function TenantHelp() {
    const { data: lease }            = useTenantLeaseQuery();
    const { data: autoPaySettings }  = useTenantAutoPaySettingsQuery();

    const [activeCategory, setActiveCategory] = useState<FaqCategory>("all");

    const landlordName   = lease?.landlordName;
    const landlordPhone  = lease?.landlordPhone;
    const landlordEmail  = lease?.landlordEmail;
    const landlordVerified = lease?.landlordVerified ?? false;

    const managerName  = lease?.managerName;
    const managerPhone = lease?.managerPhone;
    const managerEmail = lease?.managerEmail;
    const hasManager   = Boolean(managerName || managerPhone || managerEmail);

    const emergencyPhone = lease?.emergencyContactPhone;
    const emergency24h   = lease?.emergencyContact24h ?? false;

    const waHref = (() => {
        if (!landlordPhone) return null;
        const d = landlordPhone.replace(/\D/g, "");
        const e164 = d.startsWith("0") && d.length === 10 ? `254${d.slice(1)}` : d;
        return `https://wa.me/${e164}`;
    })();

    const filteredFaqs = activeCategory === "all"
        ? FAQS
        : FAQS.filter((f) => f.category === activeCategory);

    const handleCategoryChange = (cat: FaqCategory) => {
        setActiveCategory(cat);
    };

    return (
        <PortalPage>
            {/* ── Hero ── */}
            <div className="tenant-hero-panel relative overflow-hidden !p-6 sm:!p-8">
                {/* Gradient wash */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage:
                            "linear-gradient(135deg, color-mix(in srgb, var(--color-brand) 14%, transparent), transparent 60%)",
                    }}
                    aria-hidden
                />
                {/* Glow orb */}
                <div
                    className="absolute -top-24 -right-16 h-64 w-64 rounded-full pointer-events-none opacity-60 blur-3xl"
                    style={{
                        background:
                            "radial-gradient(circle, color-mix(in srgb, var(--color-brand) 18%, transparent), transparent 70%)",
                    }}
                    aria-hidden
                />

                <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                    {/* Left */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-200/60 dark:ring-brand-700/40">
                                <HelpCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
                            </div>
                            <p className="tenant-eyebrow !mt-0">Support center</p>
                        </div>
                        <h1 className="tenant-hero-title">Help &amp; Support</h1>
                        <p className="tenant-hero-subtitle">
                            Get answers, reach your landlord, and manage everything in one place.
                        </p>
                        <div className="tenant-hero-chips">
                            {lease?.propertyName && (
                                <span className="tenant-context-chip inline-flex">
                                    {lease.propertyThumbnailUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={lease.propertyThumbnailUrl}
                                            alt=""
                                            aria-hidden
                                            className="h-4 w-4 rounded object-cover ring-1 ring-black/[0.08] dark:ring-white/10 shrink-0"
                                        />
                                    ) : (
                                        <Building2 className="h-3.5 w-3.5" strokeWidth={1.9} />
                                    )}
                                    {lease.propertyName}
                                </span>
                            )}
                            {lease?.unitNumber && (
                                <span className="tenant-context-chip inline-flex">
                                    Unit {lease.unitNumber}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right — property + landlord context card */}
                    <div className="shrink-0 lg:min-w-[15rem]">
                        <div className="rounded-2xl border border-brand-200/70 dark:border-brand-700/40 bg-white/70 dark:bg-white/[0.03] backdrop-blur-sm shadow-sm overflow-hidden">
                            {lease ? (
                                <>
                                    {lease.propertyThumbnailUrl && (
                                        <div className="relative h-24 w-full overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={lease.propertyThumbnailUrl}
                                                alt={lease.propertyName}
                                                className="h-full w-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" aria-hidden />
                                            <span className="absolute bottom-2 left-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/80">
                                                Your property
                                            </span>
                                        </div>
                                    )}
                                    <div className="p-4 sm:p-5">
                                        {!lease.propertyThumbnailUrl && (
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted dark:text-fg-muted-dark">
                                                Your property
                                            </p>
                                        )}
                                        <p className={`${lease.propertyThumbnailUrl ? "" : "mt-1.5"} font-semibold text-fg dark:text-fg-dark leading-tight`}>
                                            {lease.propertyName}
                                        </p>
                                        <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                            {lease.propertyAddress || `Unit ${lease.unitNumber}`}
                                        </p>
                                    </div>
                                    <div className="border-t border-brand-100/60 dark:border-brand-800/40 px-4 py-3 sm:px-5">
                                        <div className="flex items-center gap-2">
                                            {lease.landlordLogoUrl ? (
                                                <img
                                                    src={lease.landlordLogoUrl}
                                                    alt=""
                                                    className="h-7 w-7 rounded-lg object-cover ring-1 ring-border dark:ring-border-dark"
                                                />
                                            ) : (
                                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300 ring-1 ring-brand-100 dark:ring-brand-800/40">
                                                    <User className="h-3.5 w-3.5" strokeWidth={2} />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="truncate text-xs font-medium text-fg dark:text-fg-dark">
                                                        {lease.landlordName}
                                                    </p>
                                                    {landlordVerified && (
                                                        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2} />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-fg-subtle dark:text-fg-subtle-dark">Your landlord</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="p-5 space-y-2">
                                    <div className="tenant-skeleton-premium h-3 w-24 rounded" />
                                    <div className="tenant-skeleton-premium h-4 w-36 rounded" />
                                    <div className="tenant-skeleton-premium h-3 w-28 rounded" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Emergency banner — always at top when present ── */}
            {emergencyPhone && (
                <div className="overflow-hidden rounded-2xl border border-danger/25 dark:border-danger/20">
                    <div className="flex items-stretch">
                        <div className="w-1.5 shrink-0 rounded-l-2xl bg-danger" />
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4 p-4 sm:p-5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger-bg dark:bg-danger-bg-dark text-danger-dark dark:text-danger">
                                <AlertTriangle className="h-[18px] w-[18px]" strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-fg dark:text-fg-dark">
                                    Emergency contact{emergency24h ? " · Available 24/7" : ""}
                                </p>
                                <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                    For flooding, fire, gas leaks, or security threats — call immediately.
                                </p>
                                <p className="mt-1.5 font-mono-nums text-sm font-bold text-fg dark:text-fg-dark">
                                    {emergencyPhone}
                                </p>
                            </div>
                            <a
                                href={`tel:${emergencyPhone}`}
                                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-danger/90 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:ring-offset-2"
                            >
                                <Phone className="h-4 w-4" strokeWidth={2.5} />
                                Call Now
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Contact channels ── */}
            <div>
                <div className="mb-3 flex items-center gap-2.5">
                    <div className="h-5 w-[3px] rounded-full bg-brand dark:bg-brand-400" />
                    <h2 className="font-display text-base font-bold text-fg dark:text-fg-dark">
                        Reach your landlord
                    </h2>
                </div>

                {/* Primary 3-action grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Call */}
                    <a
                        href={landlordPhone ? `tel:${landlordPhone}` : undefined}
                        className={`group tenant-panel !p-0 overflow-hidden transition-all duration-200 ${
                            landlordPhone ? "hover:-translate-y-0.5 hover:shadow-md" : "pointer-events-none opacity-50"
                        }`}
                    >
                        <div className="flex items-stretch">
                            <div className="w-1 shrink-0 rounded-l-2xl bg-success dark:bg-success" />
                            <div className="flex flex-1 items-start gap-3.5 p-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success">
                                    <Phone className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-fg dark:text-fg-dark">Call</p>
                                    <p className="mt-0.5 truncate font-mono-nums text-xs text-fg-muted dark:text-fg-muted-dark">
                                        {landlordPhone ?? "Not available"}
                                    </p>
                                    {landlordPhone && (
                                        <p className="mt-1.5 text-xs font-medium text-success-dark dark:text-success opacity-0 transition-opacity group-hover:opacity-100">
                                            Tap to call →
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </a>

                    {/* WhatsApp */}
                    <a
                        href={waHref ?? undefined}
                        target={waHref ? "_blank" : undefined}
                        rel={waHref ? "noopener noreferrer" : undefined}
                        className={`group tenant-panel !p-0 overflow-hidden transition-all duration-200 ${
                            waHref ? "hover:-translate-y-0.5 hover:shadow-md" : "pointer-events-none opacity-50"
                        }`}
                    >
                        <div className="flex items-stretch">
                            <div className="w-1 shrink-0 rounded-l-2xl" style={{ background: "#22c55e" }} />
                            <div className="flex flex-1 items-start gap-3.5 p-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dcfce7] dark:bg-[#14532d]/40 text-[#15803d] dark:text-[#4ade80]">
                                    <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-fg dark:text-fg-dark">WhatsApp</p>
                                    <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                        Quick, informal messages
                                    </p>
                                    {waHref && (
                                        <p className="mt-1.5 text-xs font-medium text-[#15803d] dark:text-[#4ade80] opacity-0 transition-opacity group-hover:opacity-100">
                                            Open chat →
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </a>

                    {/* Email */}
                    <a
                        href={landlordEmail ? `mailto:${landlordEmail}` : undefined}
                        className={`group tenant-panel !p-0 overflow-hidden transition-all duration-200 ${
                            landlordEmail ? "hover:-translate-y-0.5 hover:shadow-md" : "pointer-events-none opacity-50"
                        }`}
                    >
                        <div className="flex items-stretch">
                            <div className="w-1 shrink-0 rounded-l-2xl bg-info dark:bg-info" />
                            <div className="flex flex-1 items-start gap-3.5 p-4">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-bg dark:bg-info-bg-dark text-info-dark dark:text-info">
                                    <Mail className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-fg dark:text-fg-dark">Email</p>
                                    <p className="mt-0.5 truncate text-xs text-fg-muted dark:text-fg-muted-dark">
                                        {landlordEmail ?? "Not available"}
                                    </p>
                                    {landlordEmail && (
                                        <p className="mt-1.5 text-xs font-medium text-info-dark dark:text-info opacity-0 transition-opacity group-hover:opacity-100">
                                            Compose email →
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </a>
                </div>

                {/* Property manager card — only shown when manager data is available */}
                {hasManager && (
                    <div className="mt-3 tenant-panel !p-0 overflow-hidden">
                        <div className="flex items-stretch">
                            <div className="w-1 shrink-0 rounded-l-2xl bg-purple-400 dark:bg-purple-500" />
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4 p-4 sm:p-5">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                    <User className="h-[18px] w-[18px]" strokeWidth={1.75} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                                            {managerName ?? "Property Manager"}
                                        </p>
                                        <span className="rounded-full bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                            Property Manager
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                        For day-to-day property queries
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-2">
                                    {managerPhone && (
                                        <a
                                            href={`tel:${managerPhone}`}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-1.5 text-xs font-medium text-fg dark:text-fg-dark transition-colors hover:border-success/40 hover:text-success-dark dark:hover:text-success"
                                        >
                                            <Phone className="h-3.5 w-3.5" strokeWidth={2} />
                                            {managerPhone}
                                        </a>
                                    )}
                                    {managerEmail && (
                                        <a
                                            href={`mailto:${managerEmail}`}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-3 py-1.5 text-xs font-medium text-fg dark:text-fg-dark transition-colors hover:border-info/40 hover:text-info-dark dark:hover:text-info"
                                        >
                                            <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                                            Email
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── FAQ ── */}
            <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-5 w-[3px] rounded-full bg-brand dark:bg-brand-400" />
                        <h2 className="font-display text-base font-bold text-fg dark:text-fg-dark">
                            Frequently asked questions
                        </h2>
                    </div>
                    <span className="text-xs text-fg-muted dark:text-fg-muted-dark hidden sm:block">
                        {filteredFaqs.length} of {FAQS.length} topics
                    </span>
                </div>

                {/* Category filter tabs */}
                <div
                    role="tablist"
                    aria-label="Filter FAQs by category"
                    className="mb-4 flex flex-wrap gap-1.5"
                >
                    {FAQ_TABS.map((tab) => {
                        const active = activeCategory === tab.id;
                        const count  = tab.id === "all"
                            ? FAQS.length
                            : FAQS.filter((f) => f.category === tab.id).length;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => handleCategoryChange(tab.id)}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                                    active
                                        ? "bg-brand text-white shadow-sm"
                                        : "border border-border dark:border-border-dark text-fg-muted dark:text-fg-muted-dark hover:border-brand/40 hover:text-brand dark:hover:text-brand-300"
                                }`}
                            >
                                {tab.label}
                                <span className={`ml-1.5 tabular-nums ${active ? "opacity-75" : "opacity-60"}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <FaqAccordion faqs={filteredFaqs} />
            </div>

            {/* ── Quick shortcuts ── */}
            <div>
                <div className="mb-3 flex items-center gap-2.5">
                    <div className="h-5 w-[3px] rounded-full bg-brand dark:bg-brand-400" />
                    <h2 className="font-display text-base font-bold text-fg dark:text-fg-dark">Quick links</h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Link
                        href="/portal/maintenance"
                        className="group tenant-panel !p-4 flex items-center gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                            <Wrench className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-fg dark:text-fg-dark">Maintenance</p>
                            <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">Report and track repairs</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle transition-colors group-hover:text-brand dark:text-fg-subtle-dark dark:group-hover:text-brand-400" strokeWidth={2} />
                    </Link>

                    <Link
                        href="/portal/payments"
                        className="group tenant-panel !p-4 flex items-center gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success">
                            <CreditCard className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-fg dark:text-fg-dark">Payments &amp; receipts</p>
                            <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">Pay rent or download a receipt</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle transition-colors group-hover:text-brand dark:text-fg-subtle-dark dark:group-hover:text-brand-400" strokeWidth={2} />
                    </Link>

                    <Link
                        href="/portal/lease"
                        className="group tenant-panel !p-4 flex items-center gap-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                            <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-fg dark:text-fg-dark">Auto-pay</p>
                                {autoPaySettings?.enabled && (
                                    <span className="rounded-full bg-success-bg dark:bg-success-bg-dark px-1.5 py-0.5 text-[10px] font-semibold text-success-dark dark:text-success">
                                        On
                                    </span>
                                )}
                            </div>
                            <p className="mt-0.5 text-xs text-fg-muted dark:text-fg-muted-dark">
                                {autoPaySettings?.enabled ? "Manage your schedule" : "Set up automatic payments"}
                            </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle transition-colors group-hover:text-brand dark:text-fg-subtle-dark dark:group-hover:text-brand-400" strokeWidth={2} />
                    </Link>
                </div>
            </div>

            {/* ── Trust footer ── */}
            <div className="relative tenant-panel !p-5 overflow-hidden border border-brand/12 dark:border-brand/12">
                <div
                    className="absolute inset-0 pointer-events-none opacity-50"
                    style={{
                        backgroundImage:
                            "linear-gradient(120deg, color-mix(in srgb, var(--color-brand) 7%, transparent), transparent 55%)",
                    }}
                    aria-hidden
                />
                <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-brand to-brand" aria-hidden />
                <div className="relative flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                        <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Your data is protected</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted dark:text-fg-muted-dark">
                            All payments are encrypted with 256-bit SSL and processed through certified M-Pesa channels directly to your landlord&apos;s account. Your payment history is always available for download as an official receipt.
                        </p>
                    </div>
                    <FileText className="hidden h-6 w-6 shrink-0 text-fg-subtle dark:text-fg-subtle-dark sm:block" strokeWidth={1.5} />
                </div>
            </div>
        </PortalPage>
    );
}
