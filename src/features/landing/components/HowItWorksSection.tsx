"use client";

import { STEP_ITEMS } from "@/features/landing/data/content";
import { SectionHeader } from "./SectionHeader";
import { useInView } from "@/features/landing/hooks/use-in-view";

export function HowItWorksSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.1);

  return (
    <section id="how-it-works" className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid-white opacity-20 pointer-events-none" aria-hidden="true" />
      <div className="relative max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Simple process"
          title="From search to move-in in four steps"
          description="No brokers, no paperwork, no stress."
        />

        <div className="relative">
          <div
            className="hidden md:block absolute top-[88px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0"
            aria-hidden="true"
          />
          <div
            ref={ref}
            className={`grid md:grid-cols-4 gap-12 md:gap-8 transition-all duration-700 ${
              inView ? "opacity-100" : "opacity-0"
            }`}
          >
            {STEP_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center" style={{ transitionDelay: `${i * 90}ms` }}>
                  <div
                    className={`relative w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${item.color} border border-white/10 flex items-center justify-center animate-float shadow-2xl shadow-black/30`}
                    style={{ animationDelay: `${i * 0.5}s` }}
                  >
                    <Icon className="w-8 h-8 text-white" strokeWidth={1.5} aria-hidden="true" />
                    <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-emerald-600 border border-emerald-400/40 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-emerald-600/40">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-medium text-white mt-6">{item.title}</h3>
                  <p className="text-sm text-white/50 mt-2 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}