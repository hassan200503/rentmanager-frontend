"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";
import { OnboardTenantForm } from "@/features/tenant/components/onboard-tenant-form";

export default function OnboardingPage() {
    const router = useRouter();
    const { isLoading, isPendingOnboarding, user } = useCurrentUser();

    // A user who already has a tenantId has nothing to onboard — bounce them
    // to the dashboard rather than showing the form again. No shared
    // ROLE_LANDLORD-gated layout/middleware exists yet (none was provided),
    // so this check lives here rather than in a layout guard.
    useEffect(() => {
        if (!isLoading && user && !isPendingOnboarding) {
            router.replace("/dashboard");
        }
    }, [isLoading, user, isPendingOnboarding, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-canvas dark:bg-canvas-dark">
                <p className="text-sm text-ink-muted dark:text-ink-muted-dark">Loading…</p>
            </div>
        );
    }

    if (!isPendingOnboarding) {
        // Redirect above is in flight; render nothing to avoid a form flash.
        return null;
    }

    return (
        <div className="min-h-screen bg-canvas dark:bg-canvas-dark">
            <div className="max-w-lg mx-auto py-12 px-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-semibold text-ink dark:text-ink-dark">
                        Set up your account
                    </h1>
                    <p className="text-sm text-ink-muted dark:text-ink-muted-dark mt-1">
                        Tell us a bit about your business to get started.
                    </p>
                </div>
                <div className="card">
                    <OnboardTenantForm />
                </div>
            </div>
        </div>
    );
}