// components/tenant-help.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    Bell,
    ChevronDown,
    CreditCard,
    FileText,
    HelpCircle,
    Mail,
    MessageCircle,
    Phone,
    Receipt,
    ShieldCheck,
    Smartphone,
    Wrench,
    type LucideIcon,
} from "lucide-react";
import { useTenantLeaseQuery, useTenantAutoPaySettingsQuery } from "../hooks/use-tenant-portal-queries";
import { PortalPage, PortalPageHeader } from "./portal-chrome";

interface FaqItem {
    question: string;
    answer: string;
    icon: LucideIcon;
}

const FAQS: FaqItem[] = [
    {
        question: "How do I pay my rent?",
        answer:
            "Open the Payments page (or the Quick Payment widget on your dashboard), enter the amount, confirm your M-Pesa number, and approve the prompt on your phone. Your balance updates automatically as soon as the payment is confirmed — usually within seconds.",
        icon: Smartphone,
    },
    {
        question: "I didn't receive the M-Pesa STK push. What now?",
        answer:
            "First check that the M-Pesa number on file is correct and that you have airtime or a linked bank account. Then press 'Check status' or retry from the Payments page. Your phone may also have received the prompt a few seconds late — give it a moment before retrying.",
        icon: AlertTriangle,
    },
    {
        question: "What is auto-pay and how do I set it up?",
        answer:
            "Auto-pay settles your rent automatically from your M-Pesa account on your due date, so you never miss a payment. You can enable it from your Lease page — toggle 'Turn On' under Auto-Pay Settings.",
        icon: Bell,
    },
    {
        question: "How do I get a receipt for a payment?",
        answer:
            "Go to the Payments page and tap the download icon on any payment row. You can download a PDF receipt at any time, and eTIMS-compliant invoices appear on the receipt when available.",
        icon: Receipt,
    },
    {
        question: "How do I report a maintenance issue?",
        answer:
            "Open Maintenance in the portal and press 'New Request'. Choose the category (plumbing, electrical, etc.) and priority, describe the issue, and submit. You can track the status of every request from the same page.",
        icon: Wrench,
    },
    {
        question: "How do I receive announcements on WhatsApp?",
        answer:
            "Open the Announcements page and toggle on 'WhatsApp announcements'. Your landlord can then reach you there — you can switch it off at any time, and you'll still get in-app updates either way.",
        icon: MessageCircle,
    },
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="space-y-2">
            {FAQS.map((faq, index) => {
                const isOpen = openIndex === index;
                const Icon = faq.icon;
                return (
                    <div
                        key={faq.question}
                        className="tenant-panel !p-0 overflow-hidden"
                    >
                        <button
                            type="button"
                            onClick={() => setOpenIndex(isOpen ? null : index)}
                            aria-expanded={isOpen}
                            className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-ink/[0.02] dark:hover:bg-white/[0.03]"
                        >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                                <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                            </span>
                            <span className="flex-1 text-sm font-semibold text-fg dark:text-fg-dark text-left">
                                {faq.question}
                            </span>
                            <ChevronDown
                                className={`h-4 w-4 shrink-0 text-fg-subtle dark:text-fg-subtle-dark transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                strokeWidth={2}
                            />
                        </button>
                        {isOpen && (
                            <div className="px-5 pb-5 pt-1 border-t border-border/50 dark:border-border-dark/50 text-sm text-fg-muted dark:text-fg-muted-dark leading-relaxed">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default function TenantHelp() {
    const { data: lease } = useTenantLeaseQuery();
    const { data: autoPaySettings } = useTenantAutoPaySettingsQuery();

    const landlordName = lease?.landlordName;
    const landlordPhone = lease?.landlordPhone;
    const landlordEmail = lease?.landlordEmail;
    const emergencyPhone = lease?.emergencyContactPhone;
    const emergency24h = lease?.emergencyContact24h;
    const whatsappHref = landlordPhone
        ? `https://wa.me/${landlordPhone.replace(/\D/g, "")}`
        : null;

    return (
        <PortalPage>
            <PortalPageHeader
                icon={HelpCircle}
                eyebrow="Support center"
                title="Help & Support"
                subtitle="Everything you need to manage your rental. Can't find an answer? Reach your landlord directly."
            />

            {/* Quick contact channels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                    href={landlordPhone ? `tel:${landlordPhone}` : undefined}
                    className={`tenant-panel !p-5 flex items-start gap-4 transition-all duration-200 ${
                        landlordPhone ? "hover:-translate-y-0.5 hover:shadow-dropdown" : "opacity-60 pointer-events-none"
                    }`}
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success">
                        <Phone className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Call your landlord</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                            {landlordName ? `${landlordName} · ` : ""}
                            {landlordPhone ?? "Not available"}
                        </p>
                        {landlordPhone && (
                            <p className="text-xs text-success-dark dark:text-success mt-1.5 font-medium">Tap to call →</p>
                        )}
                    </div>
                </a>

                <a
                    href={whatsappHref ?? undefined}
                    target={whatsappHref ? "_blank" : undefined}
                    rel={whatsappHref ? "noopener noreferrer" : undefined}
                    className={`tenant-panel !p-5 flex items-start gap-4 transition-all duration-200 ${
                        whatsappHref ? "hover:-translate-y-0.5 hover:shadow-dropdown" : "opacity-60 pointer-events-none"
                    }`}
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#dcfce7] dark:bg-[#14532d]/40 text-[#15803d] dark:text-[#4ade80]">
                        <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">WhatsApp</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                            Quick messages for non-urgent issues
                        </p>
                        {whatsappHref && (
                            <p className="text-xs text-[#15803d] dark:text-[#4ade80] mt-1.5 font-medium">Open chat →</p>
                        )}
                    </div>
                </a>

                <a
                    href={landlordEmail ? `mailto:${landlordEmail}` : undefined}
                    className={`tenant-panel !p-5 flex items-start gap-4 transition-all duration-200 ${
                        landlordEmail ? "hover:-translate-y-0.5 hover:shadow-dropdown" : "opacity-60 pointer-events-none"
                    }`}
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-info-bg dark:bg-info-bg-dark text-info-dark dark:text-info">
                        <Mail className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Email</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                            Formal correspondence &amp; documents
                        </p>
                        {landlordEmail && (
                            <p className="text-xs text-info-dark dark:text-info mt-1.5 font-medium">Compose email →</p>
                        )}
                    </div>
                </a>
            </div>

            {/* Emergency banner */}
            {emergencyPhone && (
                <div className="tenant-panel !p-5 flex flex-col sm:flex-row sm:items-center gap-4 border-l-4 border-l-danger">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger-bg dark:bg-danger-bg-dark text-danger-dark dark:text-danger">
                        <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            Emergency contact{emergency24h ? " (24/7)" : ""}
                        </p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                            For urgent issues like flooding, fire, or security — call this number immediately.
                        </p>
                        <p className="text-sm font-mono-nums font-semibold text-fg dark:text-fg-dark mt-1">{emergencyPhone}</p>
                    </div>
                    <a
                        href={`tel:${emergencyPhone}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-5 py-2.5 text-sm font-semibold text-white hover:bg-danger/90 active:scale-95 transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 focus-visible:ring-offset-2"
                    >
                        <Phone className="h-4 w-4" strokeWidth={2.5} />
                        Call Now
                    </a>
                </div>
            )}

            {/* FAQ */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-display font-bold text-fg dark:text-fg-dark">
                        Frequently asked questions
                    </h2>
                    <span className="text-xs text-fg-muted dark:text-fg-muted-dark hidden sm:block">
                        {FAQS.length} topics
                    </span>
                </div>
                <FAQSection />
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/portal/maintenance" className="tenant-panel !p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dropdown group">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning-bg dark:bg-warning-bg-dark text-warning-dark dark:text-warning">
                        <Wrench className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Maintenance request</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">Report and track repairs</p>
                    </div>
                    <ChevronDown className="h-4 w-4 -rotate-90 text-fg-subtle group-hover:text-brand transition-colors" strokeWidth={2} />
                </Link>

                <Link href="/portal/payments" className="tenant-panel !p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dropdown group">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success-bg dark:bg-success-bg-dark text-success-dark dark:text-success">
                        <CreditCard className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">Payments &amp; receipts</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">Pay rent or download a receipt</p>
                    </div>
                    <ChevronDown className="h-4 w-4 -rotate-90 text-fg-subtle group-hover:text-brand transition-colors" strokeWidth={2} />
                </Link>

                <Link href="/portal/lease" className="tenant-panel !p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dropdown group">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                        <Bell className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                            Auto-pay {autoPaySettings?.enabled ? "· On" : ""}
                        </p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                            {autoPaySettings?.enabled ? "Manage your auto-pay" : "Set up automatic rent payments"}
                        </p>
                    </div>
                    <ChevronDown className="h-4 w-4 -rotate-90 text-fg-subtle group-hover:text-brand transition-colors" strokeWidth={2} />
                </Link>
            </div>

            {/* Trust footer */}
            <div className="relative tenant-panel !p-5 overflow-hidden border-2 border-brand/15 dark:border-brand/15">
                <div
                    className="absolute inset-0 pointer-events-none opacity-60"
                    style={{ backgroundImage: "linear-gradient(120deg, color-mix(in srgb, var(--color-brand) 6%, transparent), transparent 60%)" }}
                    aria-hidden
                />
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-brand to-brand-accent" aria-hidden />
                <div className="relative flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-300">
                        <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-fg dark:text-fg-dark">You&apos;re covered</p>
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">
                            All payments are encrypted with 256-bit SSL and processed through certified M-Pesa channels. Your
                            payment history is always available for download as an official receipt.
                        </p>
                    </div>
                    <FileText className="h-6 w-6 shrink-0 text-fg-subtle dark:text-fg-subtle-dark hidden sm:block" strokeWidth={1.5} />
                </div>
            </div>
        </PortalPage>
    );
}
