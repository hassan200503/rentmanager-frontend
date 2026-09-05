"use client";

import { Search, ArrowUpRight } from "lucide-react";
import { SkylineBackground } from "./SkylineBackground";
import { Button } from "@/shared/components/ui/Button";
import { useInView } from "@/features/landing/hooks/use-in-view";
import { SIGNUP_LANDLORD_HREF } from "@/lib/auth/signup-links";

export function FinalCTASection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);

  return (
    <section className="relative py-32 md:py-44 overflow-hidden">
      <SkylineBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/85 via-[#030712]/55 to-[#030712]/85 pointer-events-none" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712] pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-jade-500/[0.07] rounded-full blur-[140px] pointer-events-none" aria-hidden="true" />

      <div
        ref={ref}
        className={`relative text-center max-w-4xl mx-auto px-6 transition-all duration-1000 ${
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <span className="inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-widest uppercase text-jade-400 bg-jade-500/10 border border-jade-500/20 px-4 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-jade-400 animate-live-pulse" aria-hidden="true" />
          <span className="flex items-center gap-1 font-brand font-semibold normal-case tracking-[-0.01em] text-[14px] text-jade-300">
            <span>RentManager</span>
            <span
              aria-hidden="true"
              className="h-1 w-1 rotate-45 rounded-[0.5px] bg-jade-300 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
            />
          </span>
          <span className="w-px h-3.5 bg-white/15" aria-hidden="true" />
          Kenya&apos;s trusted rental platform
        </span>

        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white mt-8 leading-[1.05] [text-wrap:balance]">
          Ready to find your next home?
        </h2>
        <p className="text-lg text-white/60 mt-5 max-w-lg mx-auto [text-wrap:balance]">
          Join thousands of Kenyans who find and reserve their homes on{" "}
          <span className="font-brand font-semibold text-white">RentManager</span>.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/listings" variant="light" size="lg" fullWidth>
            Browse Properties
            <Search className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
          </Button>
          <Button href={SIGNUP_LANDLORD_HREF} variant="primary" size="lg">
            List Property
            <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
          </Button>
        </div>

        <p className="text-xs text-white/40 mt-8">
          Free to browse · Refundable deposits · Digital leases included
        </p>
      </div>
    </section>
  );
}