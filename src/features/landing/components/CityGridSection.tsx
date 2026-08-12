"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { CITIES } from "@/features/landing/data/content";
import { SectionHeader } from "./SectionHeader";
import { usePrefersReducedMotion } from "@/features/landing/hooks/use-prefers-reduced-motion";

const CITY_VIDEO: Record<string, string> = {
  Nairobi: "/videos/hero.mp4",
  Mombasa: "/videos/sunset.mp4",
  Kisumu: "/videos/apartment.mp4",
  Nakuru: "/videos/hero.mp4",
  Eldoret: "/videos/sunset.mp4",
};

const CITY_POSITIONS: Record<string, { x: string; y: string }> = {
  Nairobi: { x: "48%", y: "58%" },
  Mombasa: { x: "72%", y: "75%" },
  Kisumu: { x: "28%", y: "52%" },
  Nakuru: { x: "40%", y: "48%" },
  Eldoret: { x: "38%", y: "38%" },
};

function KenyaMap({ hoveredCity, onHoverCity }: { hoveredCity: string | null; onHoverCity: (name: string | null) => void }) {
  return (
    <div className="relative aspect-[2/3] max-w-md mx-auto w-full">
      <svg viewBox="0 0 200 300" className="w-full h-full" fill="none" aria-hidden="true">
        <path
          d="M 60 40 L 80 35 L 100 30 L 120 35 L 140 45 L 150 60 L 155 80 L 160 100 L 165 120 L 168 140 L 170 160 L 168 180 L 165 200 L 160 220 L 150 240 L 140 255 L 120 265 L 100 270 L 80 268 L 60 260 L 45 245 L 35 225 L 30 200 L 28 180 L 30 160 L 32 140 L 35 120 L 40 100 L 45 80 L 50 60 Z"
          fill="rgba(41, 147, 106, 0.1)"
          stroke="rgba(41, 147, 106, 0.35)"
          strokeWidth="1"
        />
      </svg>

      {CITIES.map((city, index) => {
        const pos = CITY_POSITIONS[city.name];
        if (!pos) return null;
        return (
          <div
            key={city.name}
            className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{ left: pos.x, top: pos.y }}
            onMouseEnter={() => onHoverCity(city.name)}
            onMouseLeave={() => onHoverCity(null)}
            onFocus={() => onHoverCity(city.name)}
            onBlur={() => onHoverCity(null)}
            tabIndex={0}
            role="button"
            aria-label={`${city.name} — ${city.desc}`}
          >
            <div
              className={`w-full h-full rounded-full bg-jade-400 ${
                hoveredCity === city.name ? "animate-ping" : "map-pin"
              }`}
              style={{ animationDelay: `${index * 0.3}s` }}
            />
            <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-white/80">
              {city.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CityCard({
  city,
  hovered,
  onHover,
}: {
  city: (typeof CITIES)[number];
  hovered: boolean;
  onHover: (name: string | null) => void;
}) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <Link
      href={`/listings?location=${encodeURIComponent(city.name)}`}
      className={`relative group overflow-hidden rounded-2xl border border-white/[0.06] transition-all duration-700 hover:border-white/20 hover:shadow-2xl hover:shadow-jade-500/10 ${city.span} min-h-[200px] md:min-h-[240px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-400 ${
        hovered ? "scale-[1.02] border-jade-400/40" : ""
      }`}
      onMouseEnter={() => {
        setVideoPlaying(true);
        onHover(city.name);
      }}
      onMouseLeave={() => {
        setVideoPlaying(false);
        onHover(null);
      }}
      onFocus={() => {
        setVideoPlaying(true);
        onHover(city.name);
      }}
      onBlur={() => {
        setVideoPlaying(false);
        onHover(null);
      }}
      aria-label={`${city.name} — ${city.desc}`}
    >
      {videoPlaying && !reducedMotion && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] group-hover:scale-110"
          style={{ objectPosition: city.objectPosition }}
        >
          <source src={CITY_VIDEO[city.name]} type="video/mp4" />
        </video>
      )}

      <div className={`absolute inset-0 bg-gradient-to-t ${city.gradient} transition-opacity duration-500 ${videoPlaying && !reducedMotion ? "opacity-60" : "opacity-100"}`} aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/40 pointer-events-none" aria-hidden="true" />

      <div className="relative h-full min-h-[200px] md:min-h-[240px] flex flex-col justify-end p-5 md:p-7 z-10">
        <div className="space-y-1.5">
          <p className="flex items-center gap-2 text-[9px] font-semibold tracking-[0.15em] uppercase text-white/55">
            <MapPin className="w-3 h-3 text-jade-400" strokeWidth={2} aria-hidden="true" />
            {city.desc}
          </p>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">{city.name}</h3>
            <ArrowUpRight className="w-4 h-4 text-white/40 transition-all duration-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 max-md:opacity-100" strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-jade-500/0 via-jade-500/40 to-jade-500/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-center"
        aria-hidden="true"
      />
    </Link>
  );
}

export function CityGridSection() {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-jade-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>
      <div className="relative max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Coverage"
          title="All across Kenya"
          description="Featured rentals in major cities, with verified vacancies."
        />
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-center">
          {/* Kenya map with pulsing markers */}
          <div className="hidden lg:block lg:col-span-2">
            <KenyaMap hoveredCity={hoveredCity} onHoverCity={setHoveredCity} />
          </div>

          {/* City cards */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-[200px] md:auto-rows-[240px]">
            {CITIES.map((city) => (
              <CityCard key={city.name} city={city} hovered={hoveredCity === city.name} onHover={setHoveredCity} />
            ))}
          </div>
        </div>
        <p className="flex items-center justify-center gap-2 mt-8 text-xs text-white/50">
          <span className="w-1.5 h-1.5 rounded-full bg-jade-400" aria-hidden="true" />
          Every unit is verified before it&apos;s listed
        </p>
      </div>
    </section>
  );
}