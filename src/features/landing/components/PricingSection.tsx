"use client";

import { Check } from "lucide-react";
import { PRICING_PLANS } from "@/features/landing/data/content";
import { SectionHeader } from "./SectionHeader";
import { Button } from "@/shared/components/ui/Button";

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 md:py-32 overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.03] to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          description="Free for renters. One flat rate for landlords — no percentage cuts, no per-tenant fees."
        />

        <div className="grid md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlight
                  ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.08] to-white/[0.02] shadow-2xl shadow-emerald-600/10"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                  Most popular
                </span>
              )}

              <h3 className="font-display text-xl font-medium text-white">{plan.name}</h3>
              <p className="text-sm text-white/50 mt-1.5">{plan.tagline}</p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white tracking-tight">{plan.price}</span>
                {plan.period && <span className="text-sm text-white/45">{plan.period}</span>}
              </div>

              <ul className="mt-8 space-y-3.5 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" strokeWidth={2.5} aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  href={plan.cta.href}
                  variant={plan.highlight ? "primary" : "outline"}
                  size="lg"
                  fullWidth
                >
                  {plan.cta.label}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-white/40 mt-10">
          All landlord plans come with a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}