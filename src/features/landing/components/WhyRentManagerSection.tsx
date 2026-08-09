"use client";

import type { CSSProperties } from "react";
import { FEATURES } from "@/features/landing/data/content";
import { SectionHeader } from "./SectionHeader";
import { SpotlightCard } from "./SpotlightCard";
import { useInView } from "@/features/landing/hooks/use-in-view";

export function WhyRentManagerSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.1);
  const staggerStyle = (i: number): CSSProperties => ({ transitionDelay: `${i * 60}ms` });

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-20 pointer-events-none" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Why RentManager"
          title="Built for Kenya's rental market"
          description="Everything you need to find, reserve, and manage your rental — without the middlemen."
        />

        <div
          ref={ref}
          className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 ${
            inView ? "opacity-100" : "opacity-0"
          }`}
        >
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <SpotlightCard
                key={feature.title}
                className="hover:-translate-y-1"
                style={staggerStyle(i)}
              >
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-jade-500/25 to-jade-600/10 border border-jade-500/20 flex items-center justify-center mb-5 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-jade-500/25 group-hover:scale-110 group-hover:border-jade-400/40">
                  <Icon className="w-5 h-5 text-jade-300 group-hover:text-jade-200 transition-colors duration-300" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}