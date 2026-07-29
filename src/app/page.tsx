"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  Home,
  Building2,
  Users,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Menu,
  X,
  Star,
  CheckCircle2,
  TrendingUp,
  Key,
  FileText,
  Smartphone,
  HeadphonesIcon,
} from "lucide-react";
import VideoBackground from "@/shared/components/landing/VideoBackground";
import { BrandBadge } from "@/shared/components/brand";
import { publicPropertyApi } from "@/features/public-listings/api/public-property-api";
import { publicUnitApi } from "@/features/public-listings/api/public-unit-api";
import type { PublicPropertyResponse } from "@/features/public-listings/types/public-property";

/* ─── Video Sources ─────────────────────────────────────── */
const VIDEOS = {
  hero: "/videos/hero.mp4",
  nairobi: "/videos/sunset.mp4",
  apartment: "/videos/apartment.mp4",
};

/* ─── Hooks ─────────────────────────────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.unobserve(el); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useScrollY() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return scrollY;
}

function useCountUp(end: number, duration = 2000, suffix = "") {
  const { ref, inView } = useInView(0.3);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    let raf: number;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);
  return { ref, count: count.toLocaleString() + suffix };
}

/* ─── Skyline (preserved, refined) ─────────────────────── */
type Building = { x: number; width: number; floors: number; cols: number; depth: "back" | "front" };
const LAYOUT: Building[] = [
  { x: -20, width: 110, floors: 10, cols: 3, depth: "back" },
  { x: 90, width: 80, floors: 7, cols: 2, depth: "back" },
  { x: 175, width: 130, floors: 14, cols: 4, depth: "front" },
  { x: 300, width: 90, floors: 8, cols: 3, depth: "back" },
  { x: 385, width: 115, floors: 12, cols: 3, depth: "front" },
  { x: 495, width: 75, floors: 6, cols: 2, depth: "back" },
  { x: 565, width: 140, floors: 17, cols: 4, depth: "front" },
  { x: 700, width: 95, floors: 9, cols: 3, depth: "back" },
  { x: 790, width: 120, floors: 13, cols: 4, depth: "front" },
  { x: 905, width: 85, floors: 7, cols: 2, depth: "back" },
  { x: 985, width: 135, floors: 15, cols: 4, depth: "front" },
  { x: 1115, width: 90, floors: 8, cols: 3, depth: "back" },
  { x: 1200, width: 110, floors: 11, cols: 3, depth: "front" },
  { x: 1305, width: 80, floors: 6, cols: 2, depth: "back" },
  { x: 1380, width: 100, floors: 9, cols: 3, depth: "front" },
];

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type SceneName = "dusk" | "night" | "dawn";
const SCENE_PALETTES: Record<SceneName, { sky: string; glow: string; litBias: number; heightJitter: number }> = {
  dusk: { sky: "linear-gradient(180deg, #0A0F1C 0%, #101A31 55%, #16213D 100%)", glow: "linear-gradient(180deg, rgba(5,150,105,0) 0%, rgba(5,150,105,0.12) 100%)", litBias: 0, heightJitter: 0 },
  night: { sky: "linear-gradient(180deg, #030712 0%, #0B1020 55%, #11162A 100%)", glow: "linear-gradient(180deg, rgba(5,150,105,0) 0%, rgba(5,150,105,0.08) 100%)", litBias: 0.18, heightJitter: 7 },
  dawn: { sky: "linear-gradient(180deg, #1B1330 0%, #3A2C4F 55%, #6A4A5A 100%)", glow: "linear-gradient(180deg, rgba(16,185,129,0) 0%, rgba(16,185,129,0.12) 100%)", litBias: -0.1, heightJitter: 14 },
};

function buildSkyline(seed: number, litBias: number, heightJitter: number) {
  const rand = mulberry32(seed);
  return LAYOUT.map((b) => {
    const groundY = 340;
    const floorH = 12;
    const floors = Math.max(4, b.floors + Math.round((rand() - 0.5) * 2 * (heightJitter / floorH)));
    const height = floors * floorH;
    const y = groundY - height;
    const windows: { cx: number; cy: number; variant: "bright" | "mid" | "dim"; delay: number; duration: number }[] = [];
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < b.cols; c++) {
        if (rand() < 0.08) continue;
        const roll = rand() - litBias;
        const variant = roll < 0.18 ? "bright" : roll < 0.55 ? "mid" : "dim";
        windows.push({ cx: b.x + 10 + c * ((b.width - 20) / Math.max(1, b.cols - 1 || 1)), cy: y + 8 + f * floorH, variant, delay: rand() * 10, duration: 4 + rand() * 8 });
      }
    }
    return { ...b, id: `bld-${((seed + LAYOUT.indexOf(b) * 7919) % 10000)}`, y, height, windows };
  });
}

const SCENES = [
  { name: "dusk" as SceneName, buildings: buildSkyline(1337, 0, 0) },
  { name: "night" as SceneName, buildings: buildSkyline(7919, 0.18, 7) },
  { name: "dawn" as SceneName, buildings: buildSkyline(4242, -0.1, 14) },
];

function SkylineBackground({ parallaxOffset = 0 }: { parallaxOffset?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {SCENES.map((scene, i) => (
        <div key={scene.name} className="sky-scene absolute inset-0" style={{ animationDelay: `${-(i * 15)}s` }}>
          <div className="absolute inset-0" style={{ background: SCENE_PALETTES[scene.name].sky }} />
          <div className="absolute left-0 right-0 bottom-0 h-40" style={{ background: SCENE_PALETTES[scene.name].glow }} />
          <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax slice" style={{ transform: `translateY(${parallaxOffset * 0.15}px)` }}>
            {scene.buildings.map((b: { id: string; x: number; y: number; width: number; height: number; floors: number; cols: number; depth: "back" | "front"; windows: Array<{ cx: number; cy: number; variant: "bright" | "mid" | "dim"; delay: number; duration: number }> }) => (
              <g key={b.id}>
                <rect x={b.x} y={b.y} width={b.width} height={b.height} fill={b.depth === "back" ? "#182647" : "#0A0F1C"} opacity={b.depth === "back" ? 0.75 : 1} />
                {b.windows.map((w: { cx: number; cy: number; variant: "bright" | "mid" | "dim"; delay: number; duration: number }, wi: number) => (
                  <rect key={wi} x={w.cx} y={w.cy} width={5} height={7} rx={0.5} className={`sky-window sky-window--${w.variant}`} style={{ animationDelay: `${w.delay}s`, animationDuration: `${w.duration}s` }} fill="#F2C879" />
                ))}
              </g>
            ))}
          </svg>
        </div>
      ))}
    </div>
  );
}

/* ─── Live Search Stats ────────────────────────────────── */
function LiveSearchStats() {
  const stats = [
    { icon: "🔥", text: "properties added today", count: 24 },
    { icon: "●", text: "people searching now", count: 112 },
    { icon: "✓", text: "units reserved this hour", count: 8 },
  ];
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setShow(false);
      setTimeout(() => { setIndex((i) => (i + 1) % stats.length); setShow(true); }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const s = stats[index];
  return (
    <div className="flex items-center justify-center gap-2 text-sm mt-4 min-h-[24px]">
      <span className={`transition-all duration-400 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
        <span className={s.icon === "●" ? "text-emerald-400" : s.icon === "🔥" ? "text-orange-400" : "text-blue-400"}>{s.icon}</span>
        <span className="text-white/60 ml-1.5">
          <span className="font-semibold text-white">{s.count}</span> {s.text}
        </span>
      </span>
    </div>
  );
}

/* ─── Premium Property Card (from real API) ────────────── */
function PropertyCard({ property, index }: { property: PublicPropertyResponse; index: number }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <Link
      href={`/listings/${property.propertyId}`}
      className="group block rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-500 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5 hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative overflow-hidden aspect-[4/3]">
        {property.images?.[0] ? (
          <>
            <div className={`absolute inset-0 bg-[#0a0f1c] transition-opacity duration-500 ${imgLoaded ? "opacity-0" : "opacity-100"}`} />
            <img
              src={property.images[0]}
              alt={property.name}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-900/20 to-blue-900/20 flex items-center justify-center">
            <Home className="w-10 h-10 text-white/20" strokeWidth={1.25} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/80 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 backdrop-blur-sm">
            {property.propertyType?.toLowerCase()}
          </span>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
          {property.name}
        </h3>
        {property.address?.city && (
          <div className="flex items-center gap-1.5 text-sm text-white/50">
            <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span>
              {property.address.city}
              {property.address.state ? `, ${property.address.state}` : ""}
            </span>
          </div>
        )}
        {property.description && (
          <p className="text-sm text-white/40 line-clamp-2 leading-relaxed">
            {property.description}
          </p>
        )}
        <div className="pt-2 flex items-center text-sm font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <span>View details</span>
          <ArrowUpRight className="w-3.5 h-3.5 ml-1" strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}

/* ─── Animated Counter ─────────────────────────────────── */
function AnimatedCounter({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const { ref, count } = useCountUp(end, 2000, suffix);
  return (
    <div ref={ref} className="text-center">
      <p className="font-mono-nums text-3xl md:text-4xl font-bold text-white">{count}</p>
      <p className="text-xs md:text-sm text-white/50 mt-1.5">{label}</p>
    </div>
  );
}

/* ─── Testimonials Carousel ────────────────────────────── */
function TestimonialsCarousel() {
  const testimonials = [
    { name: "Jane W.", location: "Nairobi", role: "Tenant", text: "I reserved my apartment without paying any broker. The whole process took 15 minutes.", rating: 5 },
    { name: "Peter K.", location: "Mombasa", role: "Landlord", text: "Found a tenant in 3 days. RentManager made the whole process seamless.", rating: 5 },
    { name: "Amina H.", location: "Kisumu", role: "Tenant", text: "Verified listings only. No more fake agents wasting my time.", rating: 5 },
    { name: "David M.", location: "Nakuru", role: "Landlord", text: "The deposit system is transparent and refundable. Exactly what we needed.", rating: 5 },
    { name: "Sarah N.", location: "Eldoret", role: "Tenant", text: "Digital lease signing saved me a trip across town. Incredibly convenient.", rating: 5 },
    { name: "James O.", location: "Nairobi", role: "Landlord", text: "Payment collection is automatic. I haven't chased a tenant for rent in months.", rating: 5 },
  ];
  const duplicated = [...testimonials, ...testimonials];
  return (
    <div className="overflow-hidden">
      <div className="animate-scroll flex gap-6 w-max">
        {duplicated.map((t, i) => (
          <div key={i} className="relative rounded-2xl w-80 flex-shrink-0 overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6">
            <div className="flex text-amber-400 text-sm mb-4">{Array.from({ length: t.rating }).map((_, j) => (<Star key={j} className="w-4 h-4 fill-current" strokeWidth={0} />))}</div>
            <p className="text-sm text-white/70 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 flex items-center justify-center text-sm font-bold text-emerald-300 border border-emerald-500/20">{t.name[0]}</span>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <span>{t.location}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Dashboard Preview ────────────────────────────────── */
function DashboardPreview() {
  return (
    <div className="laptop-mockup relative">
      <div className="relative mx-auto max-w-4xl">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent rounded-2xl blur-3xl" />
        <div className="screen relative glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <div className="flex items-center gap-1.5 px-5 pt-4 pb-3 border-b border-white/5">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-amber-500/60" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="ml-3 text-[11px] text-white/30 font-medium">RentManager Executive Dashboard</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
            {[
              { label: "Portfolio Health", value: "94%", color: "from-emerald-600 to-emerald-400", icon: TrendingUp },
              { label: "Monthly Revenue", value: "KES 1.2M", color: "from-blue-600 to-blue-400", icon: TrendingUp },
              { label: "Active Tenants", value: "847", color: "from-violet-600 to-violet-400", icon: Users },
              { label: "Properties", value: "124", color: "from-amber-600 to-amber-400", icon: Building2 },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`rounded-xl bg-gradient-to-br ${stat.color} p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] text-white/60 uppercase tracking-wider">{stat.label}</p>
                    <Icon className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                  </div>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                </div>
              );
            })}
          </div>
          <div className="px-5 pb-5">
            <div className="h-20 rounded-xl bg-white/5 flex items-center justify-center">
              <div className="flex items-end gap-1.5 h-12">
                {[40, 60, 35, 80, 55, 70, 90, 65, 75, 85, 95, 70].map((h, i) => (
                  <div key={i} className="w-3 rounded-t-sm transition-all duration-500" style={{
                    height: `${h}%`,
                    background: `linear-gradient(to top, var(--color-brand), var(--color-brand-300))`,
                    opacity: 0.6 + (h / 200),
                    animation: `float2 ${2 + i * 0.2}s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }} />
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-3 right-4 text-[9px] text-white/20">Revenue is up 23% this month</div>
        </div>
      </div>
    </div>
  );
}

/* ─── How It Works Timeline ───────────────────────────── */
const HOW_IT_WORKS = [
  { step: "01", title: "Browse", desc: "Explore verified vacancies across Kenya. Filter by location, price, or property type.", icon: Search, color: "from-blue-500/30 to-blue-600/10" },
  { step: "02", title: "Reserve", desc: "Pay a small, fully refundable deposit to secure your unit instantly.", icon: ShieldCheck, color: "from-emerald-500/30 to-emerald-600/10" },
  { step: "03", title: "Sign Lease", desc: "Review and sign your digital lease agreement online. No paperwork.", icon: FileText, color: "from-violet-500/30 to-violet-600/10" },
  { step: "04", title: "Move In", desc: "Your lease activates automatically. Rent reminders and receipts handled for you.", icon: Key, color: "from-amber-500/30 to-amber-600/10" },
];

/* ─── Features (Why RentManager) ──────────────────────── */
const FEATURES = [
  { title: "Verified Owners", desc: "Fake listings eliminated. Every property is owner-confirmed with documentation.", icon: ShieldCheck, color: "from-emerald-500/30 to-emerald-600/10" },
  { title: "Secure Deposits", desc: "Deposits held safely until move-in is confirmed by both parties.", icon: CheckCircle2, color: "from-blue-500/30 to-blue-600/10" },
  { title: "Digital Leases", desc: "Sign your lease agreement online. No paperwork, no delays, no trips.", icon: FileText, color: "from-violet-500/30 to-violet-600/10" },
  { title: "Instant Receipts", desc: "Every payment generates a digital receipt automatically. Track everything.", icon: Smartphone, color: "from-amber-500/30 to-amber-600/10" },
  { title: "M-Pesa Integration", desc: "Pay rent via M-Pesa. Automatic reconciliation and payment reminders.", icon: Smartphone, color: "from-emerald-500/30 to-emerald-600/10" },
  { title: "24/7 Support", desc: "Our team is available around the clock to help with any questions.", icon: HeadphonesIcon, color: "from-blue-500/30 to-blue-600/10" },
];

/* ─── Premium City Video Grid ──────────────────────────── */
interface CityVideo {
  name: string;
  count: string;
  desc: string;
  video: string;
  overlay: string;
  objectPosition: string;
  span: string;
}

const CITY_VIDEOS: CityVideo[] = [
  { name: "Nairobi", count: "132", desc: "Capital city · 4M+ residents", video: VIDEOS.hero, overlay: "from-emerald-900/80 via-emerald-800/40 to-[#030712]/95", objectPosition: "center 30%", span: "md:col-span-2 md:row-span-2" },
  { name: "Mombasa", count: "78", desc: "Coastal metropolis", video: VIDEOS.nairobi, overlay: "from-cyan-900/80 via-cyan-800/40 to-[#030712]/95", objectPosition: "center 50%", span: "" },
  { name: "Kisumu", count: "44", desc: "Lakeside city", video: VIDEOS.apartment, overlay: "from-teal-900/80 via-teal-800/40 to-[#030712]/95", objectPosition: "center 50%", span: "" },
  { name: "Nakuru", count: "28", desc: "Rift Valley hub", video: VIDEOS.hero, overlay: "from-amber-900/80 via-amber-800/40 to-[#030712]/95", objectPosition: "center 60%", span: "" },
  { name: "Eldoret", count: "22", desc: "North Rift economic center", video: VIDEOS.nairobi, overlay: "from-violet-900/80 via-violet-800/40 to-[#030712]/95", objectPosition: "center 40%", span: "" },
];

function CityVideoCard({ city, index }: { city: CityVideo; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`relative group cursor-pointer overflow-hidden rounded-2xl border border-white/[0.06] transition-all duration-700 hover:border-white/[0.15] hover:shadow-2xl hover:shadow-emerald-500/5 ${city.span} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-700`}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <video
        ref={videoRef}
        autoPlay loop muted playsInline
        className="absolute inset-0 w-full h-full object-cover transition-all duration-[800ms] group-hover:scale-110"
        style={{ objectPosition: city.objectPosition }}
        onCanPlay={() => setLoaded(true)}
      >
        <source src={city.video} type="video/mp4" />
      </video>
      <div className={`absolute inset-0 bg-gradient-to-t ${city.overlay} transition-opacity duration-500 group-hover:opacity-90`} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30" />
      <div className="absolute inset-0 bg-[#030712]/10" />
      <div className="relative h-full flex flex-col justify-end p-5 md:p-7 z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live-pulse" />
              <span className="text-[9px] font-semibold tracking-[0.15em] text-white/40 uppercase">{city.desc}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">{city.name}</h3>
          </div>
          <div className="text-right">
            <p className="text-xl md:text-2xl font-bold text-white tabular-nums">{city.count}</p>
            <p className="text-[8px] text-white/30 uppercase tracking-widest">listings</p>
          </div>
        </div>
      </div>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-400 translate-x-2 group-hover:translate-x-0">
        <ArrowUpRight className="w-4 h-4 text-white/40" strokeWidth={1.5} />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/40 to-emerald-500/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-center" />
    </div>
  );
}

/* ─── Footer Links ────────────────────────────────────── */
const FOOTER_LINKS = {
  Company: ["About", "Careers", "Blog", "Press"],
  Platform: ["Browse Properties", "List Property", "Pricing", "FAQ"],
  Resources: ["Help Center", "Guides", "Community", "Status"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Licenses"],
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  const scrollY = useScrollY();
  const heroParallax = Math.min(scrollY * 0.5, 300);
  const isScrolled = scrollY > 80;
  const [mobileMenu, setMobileMenu] = useState(false);

  const { ref: heroReveal, inView: heroInView } = useInView(0.1);
  const { ref: staggerRef, inView: staggerInView } = useInView(0.1);
  const { ref: featuresRef, inView: featuresInView } = useInView(0.1);
  const { ref: statsRef, inView: statsInView } = useInView(0.1);

  /* ── Real data from APIs ─────────────────────────────── */
  const propertiesQuery = useQuery({
    queryKey: ["public-properties", "landing"],
    queryFn: () => publicPropertyApi.list({ page: 0, size: 8 }),
  });

  const unitsQuery = useQuery({
    queryKey: ["public-units", "landing"],
    queryFn: () => publicUnitApi.list({ page: 0, size: 1 }),
  });

  const featuredProperties = propertiesQuery.data?.content ?? [];
  const totalProperties = propertiesQuery.data?.totalElements ?? 0;
  const totalUnits = unitsQuery.data?.totalElements ?? 0;

  const statsData = [
    { end: totalProperties || 1200, suffix: "+", label: "Properties Listed" },
    { end: totalUnits || 5800, suffix: "+", label: "Available Units" },
    { end: 38, suffix: "", label: "Cities Covered" },
    { end: Math.round((totalProperties ? Math.min(totalProperties * 0.78, 94) : 94)), suffix: "%", label: "Occupancy Rate" },
  ];

  return (
    <main className="min-h-screen bg-[#030712] text-white overflow-x-hidden">
      {/* ═══════════ NAVIGATION ═══════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#030712]/90 backdrop-blur-xl border-b border-white/5" : ""}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            <Link href="/" className="flex items-center gap-3">
              <BrandBadge size="lg" />
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link href="/listings" className="text-white/60 hover:text-white transition-colors">Browse</Link>
              <Link href="/public/sign-up" className="text-white/60 hover:text-white transition-colors">List property</Link>
              <Link href="#how-it-works" className="text-white/60 hover:text-white transition-colors">How it works</Link>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/public/sign-in" className="text-sm font-medium text-white/70 hover:text-white transition-colors px-4 py-2">Sign in</Link>
              <Link href="/public/sign-up" className="text-sm font-semibold px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/25">
                Get started
              </Link>
            </div>

            <button type="button" onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors" aria-label="Menu">
              {mobileMenu ? <X className="w-5 h-5" strokeWidth={2} /> : <Menu className="w-5 h-5" strokeWidth={2} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t border-white/5 bg-[#030712]/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-2">
              <Link href="/listings" onClick={() => setMobileMenu(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors">Browse</Link>
              <Link href="/public/sign-up" onClick={() => setMobileMenu(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors">List property</Link>
              <Link href="#how-it-works" onClick={() => setMobileMenu(false)} className="block px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors">How it works</Link>
              <div className="pt-3 space-y-2">
                <Link href="/public/sign-in" onClick={() => setMobileMenu(false)} className="block w-full text-center px-4 py-3 rounded-xl text-sm font-medium text-white/70 border border-white/10 hover:text-white hover:border-white/20 transition-colors">Sign in</Link>
                <Link href="/public/sign-up" onClick={() => setMobileMenu(false)} className="block w-full text-center px-4 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all">Get started</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <VideoBackground videoSrc={VIDEOS.hero} overlay="medium" zoom environmental className="absolute inset-0">
          <SkylineBackground parallaxOffset={heroParallax} />
        </VideoBackground>

        <div ref={heroReveal} className="relative w-full max-w-6xl mx-auto px-6 pt-32 pb-24 text-center z-10">
          <div className={`transition-all duration-1000 ${heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live-pulse" />
              Kenya&apos;s trusted rental platform
            </div>

            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[84px] font-bold leading-[0.92] tracking-tight text-white">
              Find your next home.
              <br />
              <span className="gradient-text-accent">Reserve it instantly.</span>
              <br />
              Move in with confidence.
            </h1>

            <p className="mt-6 text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
              Verified vacancies across Kenya. Reserve any unit with a refundable deposit.
              <br className="hidden sm:block" />
              No agents, no fake listings, no hassle.
            </p>

            {/* Search Panel */}
            <div className="mt-10 max-w-2xl mx-auto">
              <div className="glass rounded-2xl p-2 flex flex-col sm:flex-row gap-2 animate-pulse-glow shadow-2xl shadow-emerald-500/5">
                <div className="flex-1 relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                  <input type="text" placeholder="Where do you want to live?" className="w-full bg-transparent text-sm text-white placeholder:text-white/30 pl-10 pr-3 py-3.5 rounded-xl border border-white/10 focus:border-emerald-500/50 outline-none transition-colors" />
                </div>
                <select className="bg-transparent text-sm text-white/70 px-4 py-3.5 rounded-xl border border-white/10 focus:border-emerald-500/50 outline-none transition-colors appearance-none cursor-pointer">
                  <option>Any budget</option>
                  <option>KES 5K — 15K</option>
                  <option>KES 15K — 30K</option>
                  <option>KES 30K — 50K</option>
                  <option>KES 50K+</option>
                </select>
                <Link href="/listings" className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-600/30 flex-shrink-0">
                  <Search className="w-4 h-4" strokeWidth={2.5} />
                  Search
                </Link>
              </div>
              <LiveSearchStats />
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/40">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                Verified listings
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                Secure deposits
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2} />
                Digital leases
              </span>
            </div>
          </div>
        </div>

        {/* Floating property cards — removed */}
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white opacity-20" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-400">Simple process</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-3">From search to move-in in four steps</h2>
            <p className="text-white/50 mt-3 max-w-lg mx-auto">No brokers, no paperwork, no stress.</p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0" />
            <div className={`grid md:grid-cols-4 gap-10 stagger-children ${staggerInView ? "in-view" : ""}`} ref={staggerRef}>
              {HOW_IT_WORKS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="text-center">
                    <div className={`w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br ${item.color} border border-white/10 flex items-center justify-center mb-5 animate-float`} style={{ animationDelay: `${i * 0.5}s` }}>
                      <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest text-emerald-400">{item.step}</span>
                    <h3 className="font-display text-xl font-bold text-white mt-2">{item.title}</h3>
                    <p className="text-sm text-white/50 mt-2 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURED PROPERTIES (from API) ═══════════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-400">Featured</span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-3">Available properties</h2>
              <p className="text-white/50 mt-2">Real listings from our platform, updated in real-time.</p>
            </div>
            <Link href="/listings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors group">
              View all properties
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
          </div>

          {propertiesQuery.isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <div className="aspect-[4/3] skeleton" />
                  <div className="p-5 space-y-3">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProperties.slice(0, 4).map((property, i) => (
                <PropertyCard key={property.propertyId} property={property} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Home className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1.25} />
              <p className="text-lg font-semibold text-white/60">No properties available yet</p>
              <p className="text-sm text-white/40 mt-2">Check back soon for new listings.</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════ KENYA COVERAGE — Premium Video Grid ═══════════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.03] to-transparent" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-400">Coverage</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-3">All across Kenya</h2>
            <p className="text-white/50 mt-3 max-w-md mx-auto">Live vacancies in major cities, updated in real-time.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[200px] md:auto-rows-[240px]">
            {CITY_VIDEOS.map((city, i) => (
              <CityVideoCard key={city.name} city={city} index={i} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mt-8 text-xs text-white/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live-pulse" />
            Data updates in real-time from live platform listings
          </div>
        </div>
      </section>

      {/* ═══════════ STATISTICS (from API) ═══════════ */}
      <section ref={statsRef} className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-emerald-500/5" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-400">By the numbers</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-3">RentManager in data</h2>
            <p className="text-white/50 mt-3 max-w-lg mx-auto">Real platform metrics, updated live from our database.</p>
          </div>
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-10 ${statsInView ? "" : "opacity-0"} transition-all duration-700`}>
            {statsData.map((stat) => (
              <AnimatedCounter key={stat.label} end={stat.end} suffix={stat.suffix} label={stat.label} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ WHY RENTMANAGER ═══════════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white opacity-20" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-400">Why RentManager</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-3">Built for Kenya&apos;s rental market</h2>
            <p className="text-white/50 mt-3 max-w-lg mx-auto">Everything you need to find, reserve, and manage your rental.</p>
          </div>
          <div ref={featuresRef} className={`grid md:grid-cols-2 lg:grid-cols-3 gap-6 ${featuresInView ? "" : "opacity-0"} transition-all duration-700`}>
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.05] hover:-translate-y-0.5" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} border border-white/10 flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ TRUST & SECURITY ═══════════ */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-400">Trust & Security</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mt-3">Your peace of mind is our priority</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: "Verified Owners", desc: "ID-verified property owners" },
              { icon: CheckCircle2, title: "Secure Payments", desc: "Encrypted M-Pesa transactions" },
              { icon: FileText, title: "Digital Leases", desc: "Legally binding online agreements" },
              { icon: HeadphonesIcon, title: "24/7 Support", desc: "Real-time assistance always" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-emerald-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-xs text-white/50">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-400">Testimonials</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-3">Trusted by thousands</h2>
            <p className="text-white/50 mt-3 max-w-lg mx-auto">Hear from tenants and landlords across Kenya.</p>
          </div>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* ═══════════ DASHBOARD PREVIEW ═══════════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-10">
            <source src={VIDEOS.nairobi} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#030712]/90 to-[#030712]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-400">Dashboard</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-3">Powerful tools for landlords</h2>
            <p className="text-white/50 mt-3 max-w-lg mx-auto">Track revenue, occupancy, and payments in real time. Manage your entire portfolio from one place.</p>
          </div>
          <DashboardPreview />
          <div className="text-center mt-10">
            <Link href="/public/sign-up" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-600/25">
              Create a free account
              <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="relative py-32 overflow-hidden">
        <VideoBackground videoSrc={VIDEOS.nairobi} overlay="dark" zoom environmental className="absolute inset-0">
          <SkylineBackground />
        </VideoBackground>
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/80 via-[#030712]/60 to-[#030712]/80" />
        <div className="relative text-center max-w-4xl mx-auto px-6 z-10">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Ready to find your next home?
          </h2>
          <p className="text-lg text-white/50 mt-4 max-w-lg mx-auto">Join thousands of Kenyans who find and reserve their homes on RentManager.</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/listings" className="px-8 py-3.5 rounded-xl bg-white text-[#030712] text-sm font-bold hover:bg-white/90 transition-all shadow-2xl flex items-center gap-2">
              Browse Properties
              <Search className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <Link href="/public/sign-up" className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2">
              List Property
              <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
              <BrandBadge size="md" />
            </Link>
              <p className="text-xs text-white/55 leading-relaxed max-w-xs">The modern way to find and reserve rental properties across Kenya. Verified listings, secure deposits, digital leases.</p>
              <div className="flex items-center gap-3 mt-4">
                {["Twitter", "LinkedIn", "Instagram"].map((social) => (
                  <Link key={social} href="#" className="text-xs text-white/60 hover:text-white/90 transition-colors">{social}</Link>
                ))}
              </div>
            </div>
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-white/60 mb-4">{category}</p>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm text-white/60 hover:text-white/90 transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/50">&copy; {new Date().getFullYear()} RentManager. All rights reserved.</p>
            <div className="flex items-center gap-6 text-xs text-white/55">
              <Link href="#" className="hover:text-white/85 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white/85 transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-white/85 transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}