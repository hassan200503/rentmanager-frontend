"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, BarChart3, Smartphone } from "lucide-react";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { OnboardTenantForm } from "@/features/tenant/components/onboard-tenant-form";

const VALUE_PROPS = [
    {
        icon: Building2,
        title: "Manage all your properties",
        desc: "Units, leases, tenants and maintenance in one place.",
    },
    {
        icon: Smartphone,
        title: "Collect rent via M-Pesa",
        desc: "Payments go straight to your till — no intermediaries.",
    },
    {
        icon: BarChart3,
        title: "Real-time portfolio insights",
        desc: "Occupancy, overdue balances and activity at a glance.",
    },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { isLoading, isPendingOnboarding, user } = useCurrentUser();

    // A user who already has a tenantId has nothing to onboard
    useEffect(() => {
        if (!isLoading && user && !isPendingOnboarding) {
            router.replace("/dashboard");
        }
    }, [isLoading, user, isPendingOnboarding, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-canvas dark:bg-canvas-dark">
                <p className="text-sm text-fg-muted dark:text-fg-muted-dark">Loading…</p>
            </div>
        );
    }

    if (!isPendingOnboarding) {
        return null;
    }

    return (
        <div className="min-h-screen bg-canvas dark:bg-canvas-dark">
            <div className="mx-auto grid max-w-5xl grid-cols-1 lg:grid-cols-2 min-h-screen">

                {/* Left — value props (hidden on mobile) */}
                <div className="hidden lg:flex flex-col justify-center px-12 py-16 bg-gradient-to-br from-brand-50 via-surface to-surface dark:from-brand-900/20 dark:via-surface-dark dark:to-surface-dark border-r border-border dark:border-border-dark">
                    <div className="mb-10">
                        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-900/40 border border-brand-200/60 dark:border-brand-700/40 px-3 py-1.5 mb-6">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                            <span className="text-xs font-semibold text-brand dark:text-brand-300">RentManager</span>
                        </div>
                        <h2 className="text-2xl font-bold text-fg dark:text-fg-dark leading-snug">
                            Property management,<br />
                            built for Kenya.
                        </h2>
                        <p className="mt-3 text-sm text-fg-muted dark:text-fg-muted-dark leading-relaxed">
                            From single apartments to large portfolios — collect rent, manage
                            leases, and stay compliant from one dashboard.
                        </p>
                    </div>

                    <div className="space-y-5">
                        {VALUE_PROPS.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-3.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-800 ring-1 ring-brand/10">
                                    <Icon className="h-4 w-4 text-brand dark:text-brand-300" strokeWidth={1.75} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-fg dark:text-fg-dark">{title}</p>
                                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right — form */}
                <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
                    <div className="mb-8">
                        {/* Mobile logo */}
                        <div className="flex items-center gap-2 mb-6 lg:hidden">
                            <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-white" strokeWidth={2} />
                            </div>
                            <span className="text-sm font-bold text-fg dark:text-fg-dark">RentManager</span>
                        </div>

                        <h1 className="text-2xl font-bold text-fg dark:text-fg-dark">
                            Set up your workspace
                        </h1>
                        <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-1">
                            Takes less than 2 minutes. You can add properties right after.
                        </p>
                    </div>

                    <div className="card">
                        <OnboardTenantForm />
                    </div>

                    <p className="mt-4 text-xs text-center text-fg-subtle dark:text-fg-subtle-dark">
                        By creating a workspace you agree to our{" "}
                        <span className="underline cursor-pointer">Terms of Service</span> and{" "}
                        <span className="underline cursor-pointer">Privacy Policy</span>.
                    </p>
                </div>
            </div>
        </div>
    );
}
