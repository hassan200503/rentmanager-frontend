"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCircle2, ShieldCheck, FileText, Building2, Home } from "lucide-react";
import VideoBackground from "@/shared/components/landing/VideoBackground";
import { SkylineBackground } from "./SkylineBackground";
import { useInView } from "@/features/landing/hooks/use-in-view";
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
  const { ref: revealRef, inView: revealInView } = useInView<HTMLDivElement>(0.1);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <VideoBackground
        videoSrc="/videos/hero.mp4"
        overlay="dark"
        zoom
        environmental
        className="absolute inset-0"
      >
        <SkylineBackground />
      </VideoBackground>

      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#030712] to-transparent pointer-events-none" />

      <div
        ref={revealRef}
        className="relative w-full max-w-6xl mx-auto px-6 pt-32 pb-20 md:pt-40 text-center z-10"
      >
        <div
          className={`transition-all duration-1000 ease-out ${
            revealInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live-pulse" aria-hidden="true" />
            Kenya&apos;s trusted rental platform
          </div>

          {/* Headline */}
          <h1 className="font-display text-[44px] sm:text-6xl md:text-7xl lg:text-[88px] font-medium leading-[1.02] tracking-tight text-white mt-8 [text-wrap:balance] [text-shadow:0_2px_40px_rgba(0,0,0,0.85)]">
            Find your next home.
            <br />
            <span className="gradient-text-accent">Reserve it in minutes.</span>
            <br />
            Move in with confidence.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-white/70 max-w-xl mx-auto leading-relaxed [text-wrap:balance] [text-shadow:0_1px_20px_rgba(0,0,0,0.9)]">
            Verified vacancies across Kenya. Reserve any unit with a refundable deposit.
            {" "}No agents, no fake listings, no hassle.
          </p>

          {/* Search */}
          <div className="mt-10 max-w-2xl mx-auto">
            <form
              className="glass rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-2xl shadow-emerald-500/10 animate-pulse-glow"
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
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/40 pl-10 pr-3 py-3.5 rounded-xl border border-white/10 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-600/30 flex-shrink-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <Search className="w-4 h-4" strokeWidth={2.5} />
                Search
              </button>
            </form>

            <p className="flex items-center justify-center gap-2 text-sm mt-4 min-h-[24px] text-white/55">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Every vacancy is checked before it can be reserved
            </p>
          </div>

          {/* Persona sign-in */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-xs text-white/50">
            <span>Already have an account?</span>
            <a
              href={SIGNIN_LANDLORD_HREF}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 min-h-10 font-medium text-white/75 transition-all hover:border-emerald-500/40 hover:text-emerald-300"
            >
              <Building2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Sign in as a landlord
            </a>
            <span className="opacity-50" aria-hidden="true">·</span>
            <a
              href={SIGNIN_RENTER_HREF}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 min-h-10 font-medium text-white/75 transition-all hover:border-emerald-500/40 hover:text-emerald-300"
            >
              <Home className="h-3.5 w-3.5" strokeWidth={1.75} />
              Sign in as a tenant or renter
            </a>
          </div>

          {/* Trust chips */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs text-white/55">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} aria-hidden="true" />
              Verified listings
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} aria-hidden="true" />
              Secure deposits
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} aria-hidden="true" />
              Digital leases
            </span>
          </div>

          {/* Live stats strip */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap items-stretch justify-center gap-x-10 gap-y-6">
            <div className="text-center">
              <p className="font-mono-nums text-2xl md:text-3xl font-bold text-white">
                {Math.max(1, totalProperties).toLocaleString()}
                <span className="text-emerald-400">+</span>
              </p>
              <p className="text-xs text-white/50 mt-1">Verified properties</p>
            </div>
            <div className="w-px bg-white/10 hidden sm:block" aria-hidden="true" />
            <div className="text-center">
              <p className="font-mono-nums text-2xl md:text-3xl font-bold text-white">
                {Math.max(1, totalUnits).toLocaleString()}
                <span className="text-emerald-400">+</span>
              </p>
              <p className="text-xs text-white/50 mt-1">Available units</p>
            </div>
            <div className="w-px bg-white/10 hidden sm:block" aria-hidden="true" />
            <div className="text-center">
              <p className="font-mono-nums text-2xl md:text-3xl font-bold text-white">
                {cityCount}
                <span className="text-emerald-400">+</span>
              </p>
              <p className="text-xs text-white/50 mt-1">Regions across Kenya</p>
            </div>
            <div className="w-px bg-white/10 hidden sm:block" aria-hidden="true" />
            <div className="text-center">
              <p className="font-mono-nums text-2xl md:text-3xl font-bold text-white">
                0<span className="text-emerald-400"> KES</span>
              </p>
              <p className="text-xs text-white/50 mt-1">Broker fees. Ever.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}