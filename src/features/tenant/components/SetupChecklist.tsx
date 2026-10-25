"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Building2, Landmark, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
    useOnboardingProgressQuery,
    useCompleteOnboardingMutation,
} from "../hooks/use-onboarding-progress";
import { useCurrentUser } from "@/features/user/hooks/use-current-user";

interface StepProps {
    done: boolean;
    label: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
}

function Step({ done, label, description, actionLabel, actionHref }: StepProps) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
                {done ? (
                    <CheckCircle2 className="h-5 w-5 text-success-dark dark:text-success" strokeWidth={2} />
                ) : (
                    <Circle className="h-5 w-5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={1.5} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? "text-fg-muted dark:text-fg-muted-dark line-through" : "text-fg dark:text-fg-dark"}`}>
                    {label}
                </p>
                {!done && (
                    <p className="text-xs text-fg-muted dark:text-fg-muted-dark mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            {!done && actionLabel && actionHref && (
                <Link
                    href={actionHref}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-brand-50 dark:bg-brand-900/30 border border-brand-200/60 dark:border-brand-700/40 px-2.5 py-1.5 text-xs font-semibold text-brand dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-800/40 transition-colors"
                >
                    {actionLabel}
                    <ArrowRight className="h-3 w-3" strokeWidth={2} />
                </Link>
            )}
        </div>
    );
}

/**
 * Shown on the dashboard home page while onboarding_completed = false.
 * Tracks setup progress from the backend and disappears once complete.
 * Only visible to OWNER (matches POST /complete which is OWNER-only).
 */
export function SetupChecklist() {
    const { isOwner, isLoading: userLoading } = useCurrentUser();
    const { data: progress, isLoading, isError } = useOnboardingProgressQuery(!userLoading && isOwner);
    const complete = useCompleteOnboardingMutation();

    // Don't render for non-owners, while loading, on error, or after completion
    if (userLoading || !isOwner || isLoading || isError) return null;
    if (!progress || progress.onboardingCompleted) return null;

    const steps = [
        { done: true },  // Org always done when they're on dashboard
        { done: progress.hasProperties },
        { done: progress.paymentConfigured },
    ];
    const completedCount = steps.filter((s) => s.done).length;
    const totalCount = steps.length;
    const progressPct = Math.round((completedCount / totalCount) * 100);
    const canComplete = progress.hasProperties;

    const handleComplete = async () => {
        try {
            await complete.mutateAsync();
            toast.success("Setup complete! Your workspace is active.");
        } catch {
            toast.error("Couldn't complete setup. Please try again.");
        }
    };

    return (
        <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-50/80 via-surface to-surface dark:border-brand-700/40 dark:from-brand-900/20 dark:via-surface-dark dark:to-surface-dark shadow-sm animate-fade-in-up">
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-800 ring-1 ring-brand/15">
                            <Sparkles className="h-4 w-4 text-brand dark:text-brand-300" strokeWidth={1.75} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-fg dark:text-fg-dark">
                                Complete your setup
                            </p>
                            <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                {completedCount} of {totalCount} steps done
                            </p>
                        </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-brand dark:text-brand-300">
                        {progressPct}%
                    </span>
                </div>

                {/* Progress bar */}
                <div className="mb-5 h-1.5 w-full rounded-full bg-border-subtle dark:bg-border-subtle-dark overflow-hidden">
                    <div
                        className="h-full rounded-full bg-brand transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                    />
                </div>

                {/* Steps */}
                <div className="space-y-3.5">
                    <Step
                        done
                        label="Organisation created"
                        description="Your RentManager workspace is ready."
                    />
                    <Step
                        done={progress.hasProperties}
                        label="Add your first property"
                        description="Properties are required to create units, assign tenants, and collect rent."
                        actionLabel="Add property"
                        actionHref="/dashboard/properties/create"
                    />
                    <Step
                        done={progress.paymentConfigured}
                        label="Configure M-Pesa payments"
                        description="Link your Daraja credentials so rent goes straight to your till or paybill."
                        actionLabel="Set up M-Pesa"
                        actionHref="/daraja/config"
                    />
                </div>

                {/* CTA */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleComplete}
                        disabled={!canComplete || complete.isPending}
                        className="btn-primary !text-xs !py-2 !px-4 disabled:opacity-40 inline-flex items-center gap-1.5"
                        title={canComplete ? undefined : "Add at least one property to complete setup"}
                    >
                        {complete.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                        ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                        )}
                        {complete.isPending ? "Activating…" : "Complete setup"}
                    </button>
                    {!progress.hasProperties && (
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            Add at least one property to complete.
                        </p>
                    )}
                </div>
            </div>

            {/* Optional module hints */}
            <div className="border-t border-border/60 dark:border-border-dark/60 px-5 py-3 flex flex-wrap items-center gap-4">
                <p className="text-xs text-fg-subtle dark:text-fg-subtle-dark">Also recommended later:</p>
                <Link href="/dashboard/team" className="inline-flex items-center gap-1 text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors">
                    <Building2 className="h-3 w-3" strokeWidth={1.75} />
                    Invite your team
                </Link>
                <Link href="/dashboard/tax" className="inline-flex items-center gap-1 text-xs text-fg-muted dark:text-fg-muted-dark hover:text-fg dark:hover:text-fg-dark transition-colors">
                    <Landmark className="h-3 w-3" strokeWidth={1.75} />
                    Set up KRA compliance
                </Link>
            </div>
        </div>
    );
}
