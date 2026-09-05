"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { useAuth, useUser } from "@clerk/nextjs";
import {
    User,
    Palette,
    AlertTriangle,
    LogOut,
    Sun,
    Moon,
    Monitor,
    Check,
    Smartphone,
    ShieldCheck,
} from "lucide-react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { BrandingCard } from "@/features/settings/components/branding-card";
import { EmergencyContactCard } from "@/features/settings/components/emergency-contact-card";
import { TaxComplianceCard } from "@/features/settings/components/tax-compliance-card";
import { DarajaConfigCard } from "@/features/daraja/components/daraja-config-card";
import { RentReminderCadenceCard } from "@/features/settings/components/rent-reminder-cadence-card";
import { PayoutDestinationCard } from "@/features/settings/components/payout-destination-card";
import { useRouter } from "next/navigation";

function SectionCard({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                {label}
            </h2>
            {children}
        </div>
    );
}

function ThemeOption({ value, label, icon: Icon, current, onSelect }: {
    value: string;
    label: string;
    icon: typeof Sun;
    current: string;
    onSelect: (v: string) => void;
}) {
    const active = current === value;
    return (
        <button
            type="button"
            onClick={() => onSelect(value)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                active
                    ? "border-brand bg-brand-50 dark:bg-brand-800/40 dark:border-brand-600"
                    : "border-border dark:border-border-dark hover:border-brand-200 dark:hover:border-brand-600"
            }`}
        >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                active ? "bg-brand text-white" : "bg-border-subtle dark:bg-border-subtle-dark text-fg-muted dark:text-fg-muted-dark"
            }`}>
                <Icon className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="flex-1">
                <p className={`text-sm font-medium ${active ? "text-brand-dark dark:text-brand-200" : "text-fg dark:text-fg-dark"}`}>
                    {label}
                </p>
            </div>
            {active && <Check className="h-4 w-4 text-brand" strokeWidth={2.5} />}
        </button>
    );
}

export default function SettingsPage() {
    const { user, isOwner, isLoading: isUserLoading } = useCurrentUser();
    const { theme, setTheme } = useTheme();
    const { signOut } = useAuth();
    const { user: clerkUser } = useUser();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useState(() => { setMounted(true); });

    if (isUserLoading) {
        return (
            <div className="page-container max-w-2xl space-y-6">
                <div className="skeleton h-8 w-32" />
                <div className="skeleton h-4 w-64" />
                <div className="space-y-4 mt-6">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="card skeleton h-32" />
                    ))}
                </div>
            </div>
        );
    }

    const themeValue = mounted ? theme ?? "system" : "system";
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Account";

    return (
        <div className="page-container max-w-2xl space-y-6">
            <div className="animate-fade-in-up">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Manage your account, appearance, and preferences.</p>
            </div>

            {/* ── Account ──────────────────────────────────────── */}
            <SectionCard icon={User} label="Account">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-800 text-lg font-semibold text-brand-dark dark:text-brand-200">
                            {fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-fg dark:text-fg-dark">{fullName}</p>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark">{user?.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? ""}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="form-label">First name</label>
                            <input
                                value={user?.firstName ?? ""}
                                readOnly
                                className="form-input opacity-70 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="form-label">Last name</label>
                            <input
                                value={user?.lastName ?? ""}
                                readOnly
                                className="form-input opacity-70 cursor-not-allowed"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Email</label>
                        <input
                            value={user?.email ?? clerkUser?.primaryEmailAddress?.emailAddress ?? ""}
                            readOnly
                            className="form-input opacity-70 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-fg-muted dark:text-fg-muted-dark">
                            Managed by your auth provider (Clerk). Update your name and email from your Clerk profile.
                        </p>
                    </div>
                </div>
            </SectionCard>

            {/* ── Branding (Premium) ─────────────────────────── */}
            <BrandingCard />

            {/* ── Emergency contact ───────────────────────────── */}
            <EmergencyContactCard />

            {/* ── Tax & compliance (KRA) ──────────────────────── */}
            <TaxComplianceCard />

            {/* ── M-Pesa (Daraja) ─────────────────────────────── */}
            {isOwner && user?.tenantId ? (
                <DarajaConfigCard tenantId={user.tenantId} />
            ) : (
                <div className="card animate-fade-in-up">
                    <h2 className="section-header inline-flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        M-Pesa
                    </h2>
                    <div className="mt-4 flex items-center gap-3 rounded-lg bg-border-subtle/50 dark:bg-border-subtle-dark/50 px-4 py-3">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                        <p className="text-sm text-fg-muted dark:text-fg-muted-dark">
                            Only account owners can manage M-Pesa credentials. Ask an account owner for access.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Appearance ───────────────────────────────────── */}
            <SectionCard icon={Palette} label="Appearance">
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-4">
                    Choose your preferred theme. System follows your device settings.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ThemeOption
                        value="light"
                        label="Light"
                        icon={Sun}
                        current={themeValue}
                        onSelect={setTheme}
                    />
                    <ThemeOption
                        value="dark"
                        label="Dark"
                        icon={Moon}
                        current={themeValue}
                        onSelect={setTheme}
                    />
                    <ThemeOption
                        value="system"
                        label="System"
                        icon={Monitor}
                        current={themeValue}
                        onSelect={setTheme}
                    />
                </div>
            </SectionCard>

            {/* ── Notifications ────────────────────────────────── */}
            {/* The four-toggle section that used to sit here was local state
                labelled "UI only — not persisted", and it could not have been
                anything else: tenant_settings is an @Entity with no migration
                behind it, so emailNotificationsEnabled / smsNotificationsEnabled
                have no table to live in. Rent reminders are configured below,
                per milestone, against a table that does exist. */}

            {/* ── Payout destination ───────────────────────────── */}
            {/* Above the reminder cadence deliberately: without a payout
                number, rent is collected and never disbursed, and until now
                there was no way to set one at all. That is the more urgent
                thing for a landlord to find on this page. */}
            <PayoutDestinationCard />

            {/* ── Rent reminder cadence ────────────────────────── */}
            <RentReminderCadenceCard />

            {/* ── Danger zone ──────────────────────────────────── */}
            <div className="card animate-fade-in-up border-danger/20 dark:border-danger/20">
                <h2 className="section-header inline-flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-danger" strokeWidth={2} />
                    <span className="text-danger">Danger zone</span>
                </h2>
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-4">
                    Irreversible actions for account owners.
                </p>
                <button
                    type="button"
                    onClick={() => signOut(() => router.push("/"))}
                    className="btn-danger"
                >
                    <LogOut className="h-4 w-4" strokeWidth={2} />
                    Sign out
                </button>
            </div>
        </div>
    );
}