"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PRICING_PLANS, LANDLORD_PLAN_META, FALLBACK_LANDLORD_PLANS } from "@/features/landing/data/content";
import { SectionHeader } from "./SectionHeader";
import { Button } from "@/shared/components/ui/Button";
import { usePublicSubscriptionPlansQuery } from "@/features/subscription/queries/use-public-subscription-plans";
import type { SubscriptionPlan } from "@/features/subscription/types/subscription-types";

type Billing = "monthly" | "annual";

interface RenderPlan {
    key: string;
    name: string;
    tagline: string;
    priceLabel: string;
    periodLabel: string;
    capacity?: string;
    features: string[];
    highlight: boolean;
    ctaLabel: string;
    ctaHref: string;
    live: boolean;
    monthlyPrice: number | null;
}

const RENTER_PLAN = PRICING_PLANS[0];

const genericFeatures = [
    "Unlimited property listings",
    "M-Pesa rent collection & reminders",
    "Digital lease agreements",
    "Tenant & occupancy tracking",
    "eTIMS-ready digital receipts",
    "Priority support",
];

const isDisplayable = (plan: SubscriptionPlan) =>
    plan.active && plan.selfService && plan.monthlyPrice != null && plan.monthlyPrice > 0;

function toLandlordPlan(plan: SubscriptionPlan, index: number, total: number): RenderPlan {
    const meta = LANDLORD_PLAN_META[plan.code.toUpperCase()];

    return {
        key: plan.code,
        name: plan.name,
        tagline: meta?.tagline ?? plan.description ?? genericFeatures[5],
        priceLabel: `KES ${plan.monthlyPrice!.toLocaleString()}`,
        periodLabel: "per month",
        capacity: plan.maxUnits != null ? `Up to ${plan.maxUnits} units` : undefined,
        features: meta?.features ?? genericFeatures,
        // Middle card is the natural "most popular" position; a single
        // card column stands alone unless there are exactly two.
        highlight: total >= 2 ? index === Math.floor(total / 2) : index === 0,
        ctaLabel: "Start free trial",
        ctaHref: "/public/sign-up?intent=landlord",
        live: true,
        monthlyPrice: plan.monthlyPrice,
    };
}

const ANNUAL_DISCOUNT = 0.8;

function PricePlate({ plan, billing }: { plan: RenderPlan; billing: Billing }) {
    if (plan.monthlyPrice == null) {
        return (
            <div className="mt-6 flex items-baseline gap-2">
                <span className="font-data text-4xl font-semibold text-white tracking-tight">
                    {plan.priceLabel}
                </span>
                <span className="text-sm text-white/45 font-medium">{plan.periodLabel}</span>
            </div>
        );
    }

    const shown =
        billing === "annual" ? Math.round(plan.monthlyPrice * ANNUAL_DISCOUNT) : plan.monthlyPrice;

    return (
        <div className="mt-6 flex items-baseline gap-1.5">
            <span className="mt-1 font-data text-lg font-semibold text-jade-300/80">KES</span>
            <span className="relative flex h-10 items-center overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={shown}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="font-data text-4xl font-semibold text-white tracking-tight"
                    >
                        {shown.toLocaleString()}
                    </motion.span>
                </AnimatePresence>
            </span>
            <span className="text-sm text-white/45 font-medium">
                {billing === "annual" ? "/mo · billed annually" : plan.periodLabel}
            </span>
        </div>
    );
}

function BillingToggle({ billing, onChange }: { billing: Billing; onChange: (b: Billing) => void }) {
    return (
        <div
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-sm"
            role="group"
            aria-label="Billing period"
        >
            {(["monthly", "annual"] as const).map((option) => {
                const active = billing === option;
                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onChange(option)}
                        aria-pressed={active}
                        className={`relative rounded-full px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-400 ${
                            active ? "text-white" : "text-white/45 hover:text-white/75"
                        }`}
                    >
                        {active && (
                            <motion.span
                                layoutId="billing-pill"
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-jade-500 to-jade-600/80 shadow-lg shadow-jade-600/30"
                                transition={{ type: "spring", stiffness: 480, damping: 32 }}
                            />
                        )}
                        <span className="relative z-10 inline-flex items-center gap-1.5">
                            {option === "monthly" ? "Monthly" : "Annual"}
                            {option === "annual" && (
                                <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
                                    -20%
                                </span>
                            )}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function PlanCard({ plan, billing }: { plan: RenderPlan; billing: Billing }) {
    return (
        <div
            className={`relative flex h-full flex-col p-8 rounded-3xl transition-all duration-300 group ${
                plan.highlight
                    ? "bg-gradient-to-b from-jade-500/[0.14] via-white/[0.04] to-white/[0.02] border border-jade-400/50 shadow-[0_0_80px_-16px_rgba(16,185,129,0.5)] hover:shadow-[0_0_100px_-12px_rgba(16,185,129,0.65)] hover:-translate-y-1.5"
                    : "bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05] hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/40"
            } backdrop-blur-sm`}
        >
            {plan.highlight && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] bg-gradient-to-r from-jade-500 to-jade-600 text-white shadow-lg shadow-jade-600/40 ring-1 ring-jade-300/40 inline-flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-3 h-3" strokeWidth={2.5} />
                    Most popular
                </span>
            )}

            <h3 className="font-display text-xl font-medium text-white">{plan.name}</h3>
            <p className="text-sm text-white/50 mt-1.5">{plan.tagline}</p>

            <PricePlate plan={plan} billing={billing} />

            {plan.capacity && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase text-jade-300/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-jade-400" />
                    {plan.capacity}
                </p>
            )}

            <ul className="mt-8 space-y-3.5 flex-1">
                {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-white/70">
                        <span
                            className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full ${
                                plan.highlight
                                    ? "bg-jade-500/20 text-jade-300"
                                    : "bg-white/[0.06] text-jade-400/80"
                            }`}
                        >
                            <Check className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
                        </span>
                        {feature}
                    </li>
                ))}
            </ul>

            <div className="mt-8">
                <Button
                    href={plan.ctaHref}
                    variant={plan.highlight ? "primary" : "outline"}
                    size="lg"
                    fullWidth
                >
                    {plan.ctaLabel}
                </Button>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 space-y-4 animate-pulse">
            <div className="h-5 w-1/3 rounded-lg bg-white/[0.08]" />
            <div className="h-4 w-1/2 rounded-lg bg-white/[0.06]" />
            <div className="h-9 w-2/3 rounded-lg bg-white/[0.08] mt-4" />
            <div className="space-y-2.5 pt-6">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                        <div className="h-4 w-4 rounded-full bg-white/[0.06]" />
                        <div className={`h-3.5 rounded-lg bg-white/[0.05] ${i % 2 ? "w-3/4" : "w-1/2"}`} />
                    </div>
                ))}
            </div>
            <div className="h-12 w-full rounded-xl bg-white/[0.06] mt-8" />
        </div>
    );
}

export function PricingSection() {
    const { data, isLoading, isError } = usePublicSubscriptionPlansQuery();
    const [billing, setBilling] = useState<Billing>("monthly");

    const livePlans: RenderPlan[] = (data ?? [])
        .filter(isDisplayable)
        .sort((a, b) => (a.monthlyPrice ?? 0) - (b.monthlyPrice ?? 0))
        .map((plan, index, all) => toLandlordPlan(plan, index, all.length));

    const fallbackPlans: RenderPlan[] = FALLBACK_LANDLORD_PLANS.map((fallback, index) =>
        toLandlordPlan(
            {
                id: fallback.code,
                code: fallback.code,
                name: fallback.name,
                description: null,
                billingCycle: "MONTHLY",
                maxProperties: null,
                maxUnits: fallback.maxUnits,
                maxUsers: null,
                maxStorageGb: null,
                monthlyPrice: fallback.monthlyPrice,
                yearlyPrice: null,
                active: true,
                selfService: true,
            },
            index,
            FALLBACK_LANDLORD_PLANS.length
        )
    );

    const landlordPlans = livePlans.length > 0 ? livePlans : fallbackPlans;
    const isLive = livePlans.length > 0 && !isLoading && !isError;
    const isSkeleton = isLoading && !livePlans.length;
    const renterPlan: RenderPlan = {
        key: "renter",
        name: RENTER_PLAN.name,
        tagline: RENTER_PLAN.tagline,
        priceLabel: "Free",
        periodLabel: "forever",
        features: [...RENTER_PLAN.features],
        highlight: false,
        ctaLabel: RENTER_PLAN.cta.label,
        ctaHref: RENTER_PLAN.cta.href,
        live: true,
        monthlyPrice: null,
    };

    return (
        <section id="pricing" className="relative py-24 md:py-32 overflow-hidden">
            <div
                className="absolute inset-0 bg-gradient-to-b from-transparent via-jade-500/[0.03] to-transparent pointer-events-none"
                aria-hidden="true"
            />
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-jade-500/[0.07] blur-[140px] pointer-events-none"
                aria-hidden="true"
            />
            <div className="relative max-w-6xl mx-auto px-6">
                <SectionHeader
                    eyebrow="Pricing"
                    title="Simple, transparent pricing"
                    description="Free for renters. One flat rate for landlords — no percentage cuts, no per-tenant fees."
                />

                <div className="flex flex-wrap items-center justify-center gap-3 -mt-6 mb-12">
                    {isLive ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-jade-400/30 bg-jade-500/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-jade-300">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade-400 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-jade-400" />
                            </span>
                            Live pricing — synced with the platform catalog
                        </span>
                    ) : isError ? (
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-amber-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Unable to refresh pricing — showing reference rates
                        </span>
                    ) : null}
                    {!isSkeleton && <BillingToggle billing={billing} onChange={setBilling} />}
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6 max-w-6xl mx-auto">
                    {isSkeleton ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        <>
                            <PlanCard plan={renterPlan} billing={billing} />
                            {landlordPlans.map((plan) => (
                                <PlanCard key={plan.key} plan={plan} billing={billing} />
                            ))}
                        </>
                    )}
                </div>

                <p className="text-center text-xs text-white/40 mt-10 flex items-center justify-center gap-1.5">
                    All landlord plans come with a 14-day free trial. No credit card required.
                </p>
            </div>
        </section>
    );
}