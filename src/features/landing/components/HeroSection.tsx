"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCircle2, ShieldCheck, FileText, Building2, Home } from "lucide-react";
import { motion } from "framer-motion";
import { PremiumVideoHero } from "./PremiumVideoHero";
import { useScrollReveal } from "@/shared/hooks/use-scroll-reveal";
import { SIGNIN_LANDLORD_HREF, SIGNIN_RENTER_HREF } from "@/lib/auth/signin-links";

export function HeroSection({
  totalProperties,
  totalUnits,
  cityCount,
}: {
  totalProperties: number;
  totalUnits: number;
  cityCount: number;
}) {
  const router = useRouter();
  const [heroQuery, setHeroQuery] = useState("");
  const { ref: revealRef, isVisible: revealInView } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 });

  const trustItems = [
    { icon: CheckCircle2, text: "Verified listings" },
    { icon: ShieldCheck, text: "Secure deposits" },
    { icon: FileText, text: "Digital leases" },
  ];

  const eyebrow = (
    <div className="inline-flex items-center gap-2.5 text-[11px] font-semibold tracking-widest uppercase text-jade-300 bg-jade-500/10 border border-jade-500/20 px-4 py-1.5 rounded-full">
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
    </div>
  );

  return (
    <PremiumVideoHero eyebrow={eyebrow}>
      <div
        ref={revealRef}
        className={`transition-all duration-1000 ease-out ${
          revealInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <p className="mt-6 text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed [text-wrap:balance] [text-shadow:0_1px_20px_rgba(0,0,0,0.9)]">
          Verified vacancies across Kenya. Reserve any unit with a refundable deposit.
          {" "}No agents, no fake listings, no hassle.
        </p>

        {/* Search - enhanced with focus lift */}
        <div className="mt-10 max-w-2xl mx-auto">
          <form
            className="glass rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl transition-all duration-300 focus-within:-translate-y-1 focus-within:shadow-jade-500/20"
            onSubmit={(e) => {
              e.preventDefault();
              const q = heroQuery.trim();
              router.push(q ? `/listings?q=${encodeURIComponent(q)}` : "/listings");
            }}
            role="search"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" strokeWidth={2} />
              <input
                type="search"
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="City, neighbourhood or property name…"
                aria-label="Search properties by city, neighbourhood or name"
                enterKeyHint="search"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/40 pl-10 pr-3 py-3.5 rounded-xl border border-white/10 focus:border-jade-500/60 focus:ring-2 focus:ring-jade-500/20 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-jade-600 hover:bg-jade-500 text-sm font-bold text-white transition-all shadow-lg shadow-jade-600/30 flex-shrink-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-400"
            >
              <Search className="w-4 h-4" strokeWidth={2.5} />
              Search
            </button>
          </form>

          <p className="flex items-center justify-center gap-2 text-sm mt-4 min-h-[24px] text-white/55">
            <span className="w-1.5 h-1.5 rounded-full bg-jade-400" aria-hidden="true" />
            Every vacancy is checked before it can be reserved
          </p>
        </div>

        {/* Persona sign-in */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-xs text-white/50">
          <span>Already have an account?</span>
          <a
            href={SIGNIN_LANDLORD_HREF}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 min-h-10 font-medium text-white/75 transition-all hover:border-jade-500/40 hover:text-jade-300"
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-white/[0.12] to-white/[0.03] ring-1 ring-inset ring-white/[0.12] transition-all duration-300 group-hover:from-jade-500/25 group-hover:to-jade-500/5 group-hover:ring-jade-400/40"
            >
              <Building2 className="h-3.5 w-3.5 text-jade-300 transition-colors duration-300 group-hover:text-jade-200" strokeWidth={1.75} />
            </span>
            Sign in as a landlord
          </a>
          <span className="opacity-50" aria-hidden="true">·</span>
          <a
            href={SIGNIN_RENTER_HREF}
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 min-h-10 font-medium text-white/75 transition-all hover:border-jade-500/40 hover:text-jade-300"
          >
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-white/[0.12] to-white/[0.03] ring-1 ring-inset ring-white/[0.12] transition-all duration-300 group-hover:from-jade-500/25 group-hover:to-jade-500/5 group-hover:ring-jade-400/40"
            >
              <Home className="h-3.5 w-3.5 text-jade-300 transition-colors duration-300 group-hover:text-jade-200" strokeWidth={1.75} />
            </span>
            Sign in as a tenant or renter
          </a>
        </div>

        {/* Trust chips - animated */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs text-white/55">
          {trustItems.map((item, i) => (
            <motion.span
              key={item.text}
              initial={{ scale: 0, opacity: 0 }}
              animate={revealInView ? { scale: 1, opacity: 1 } : {}}
              transition={{
                delay: 0.8 + i * 0.15,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex items-center gap-1.5"
            >
              <item.icon className="w-3.5 h-3.5 text-jade-400" strokeWidth={2} aria-hidden="true" />
              {item.text}
            </motion.span>
          ))}
        </div>

        {/* Live stats strip */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-stretch justify-center gap-x-10 gap-y-6">
          <div className="text-center">
            <p className="font-mono-nums text-2xl md:text-3xl font-bold text-white">
              {Math.max(1, totalProperties).toLocaleString()}
              <span className="text-jade-400">+</span>
            </p>
            <p className="text-xs text-white/50 mt-1">Verified properties</p>
          </div>
          <div className="w-px bg-white/10 hidden sm:block" aria-hidden="true" />
          <div className="text-center">
            <p className="font-mono-nums text-2xl md:text-3xl font-bold text-white">
              {Math.max(1, totalUnits).toLocaleString()}
              <span className="text-jade-400">+</span>
            </p>
            <p className="text-xs text-white/50 mt-1">Available units</p>
          </div>
          <div className="w-px bg-white/10 hidden sm:block" aria-hidden="true" />
          <div className="text-center">
            <p className="font-mono-nums text-2xl md:text-3xl font-bold text-white">
              {cityCount}
              <span className="text-jade-400">+</span>
            </p>
            <p className="text-xs text-white/50 mt-1">Regions across Kenya</p>
          </div>
          <div className="w-px bg-white/10 hidden sm:block" aria-hidden="true" />
          <div className="text-center">
            <p className="font-mono-nums text-2xl md:text-3xl font-bold text-white">
              0<span className="text-jade-400"> KES</span>
            </p>
            <p className="text-xs text-white/50 mt-1">Broker fees. Ever.</p>
          </div>
        </div>
      </div>
    </PremiumVideoHero>
  );
}