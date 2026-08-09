"use client";

import { useRef } from "react";
import { TrendingUp, Wallet, ArrowUpRight } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionHeader } from "./SectionHeader";
import { Button } from "@/shared/components/ui/Button";
import { useInView } from "@/features/landing/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/features/landing/hooks/use-prefers-reduced-motion";

gsap.registerPlugin(ScrollTrigger);

const DASHBOARD_STATS = [
  { label: "Portfolio Health", value: "94%", bar: "w-[94%]", tone: "text-jade-300 bg-jade-500/10 border-jade-500/20" },
  { label: "Monthly Revenue", value: "KES 1.2M", bar: "w-[82%]", tone: "text-blue-300 bg-blue-500/10 border-blue-500/20" },
  { label: "Active Tenants", value: "847", bar: "w-[76%]", tone: "text-violet-300 bg-violet-500/10 border-violet-500/20" },
  { label: "Properties", value: "124", bar: "w-[68%]", tone: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
];

const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"];

export function DashboardPreviewSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const screenRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (!screenRef.current) return;
      gsap.fromTo(
        screenRef.current,
        { rotateX: prefersReducedMotion ? 0 : 8 },
        {
          rotateX: 0,
          ease: "none",
          scrollTrigger: {
            trigger: screenRef.current,
            start: "top 85%",
            end: "center 60%",
            scrub: 1,
          },
        }
      );
    },
    { scope: ref, dependencies: [prefersReducedMotion] }
  );

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-jade-950/20 to-[#030712]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-jade-500/[0.06] rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Dashboard"
          title="Powerful tools for landlords"
          description="Track revenue, occupancy, and payments in real time. Manage your entire portfolio from one place."
        />

        <div ref={ref} className={`transition-all duration-1000 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="laptop-mockup relative">
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute inset-0 bg-gradient-to-b from-jade-500/10 to-transparent rounded-3xl blur-3xl" aria-hidden="true" />

              <div ref={screenRef} className="screen relative glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 px-5 pt-4 pb-3 border-b border-white/5">
                  <span className="w-3 h-3 rounded-full bg-red-500/60" aria-hidden="true" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/60" aria-hidden="true" />
                  <span className="w-3 h-3 rounded-full bg-jade-500/60" aria-hidden="true" />
                  <span className="ml-3 text-[11px] text-white/40 font-medium">RentManager Executive Dashboard</span>
                </div>

                {/* KPI grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
                  {DASHBOARD_STATS.map((s) => (
                      <div key={s.label} className={`rounded-xl border p-4 backdrop-blur-sm ${s.tone}`}>
                        <p className="text-[9px] text-white/60 uppercase tracking-wider">{s.label}</p>
                        <p className="mt-2 text-base font-bold text-white">{s.value}</p>
                        <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r from-white/50 to-white/25 ${s.bar}`} aria-hidden="true" />
                        </div>
                      </div>
                    ))}
                </div>

                {/* Revenue chart */}
                <div className="px-5 pb-5">
                  <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Revenue</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-jade-300 bg-jade-500/10 border border-jade-500/20 rounded-full px-2 py-0.5">
                        <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.5} aria-hidden="true" />
                        +23% this month
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5 h-24" role="img" aria-label="Revenue chart trending up over the last 12 weeks">
                      {BARS.map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm transition-transform duration-500 hover:scale-y-110 origin-bottom"
                          style={{
                            height: `${height}%`,
                            background: `linear-gradient(to top, #059669, #34D399)`,
                            opacity: 0.35 + (height / 240),
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2">
                      {BARS.map((_, i) => (
                        <span key={i} className="text-[8px] text-white/30 hidden sm:block">{BARS[i] % 2 === 0 ? WEEKS[i] : ""}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating receipt chip */}
                <div className="absolute -bottom-4 right-6 hidden md:flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b111f]/90 backdrop-blur px-3.5 py-2.5 shadow-2xl shadow-black/50">
                  <Wallet className="w-4 h-4 text-jade-400" strokeWidth={1.75} aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-semibold text-white">M-Pesa receipt issued</p>
                    <p className="text-[9px] text-white/40">Rent collected · KES 18,500</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button href="/public/sign-up?intent=landlord" variant="primary" size="lg">
              Create a free landlord account
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
            </Button>
            <p className="text-xs text-white/40 mt-3">No credit card · Free to list · Cancel anytime</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const BARS = [40, 60, 35, 80, 55, 70, 90, 65, 75, 85, 95, 70];