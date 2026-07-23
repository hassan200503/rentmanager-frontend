"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import VideoBackground from "@/shared/components/landing/VideoBackground";

/* ============================================================
   VIDEO SOURCES
   Replace these paths with your own video files in /public/videos/
   Supported: free stock footage from Pexels, Coverr, Mixkit
   ============================================================ */

const VIDEOS = {
  hero: "/videos/hero.mp4",
  nairobi: "/videos/sunset.mp4",
  kisumu: "",
  mombasa: "",
  featured1: "/videos/apartment.mp4",
  featured2: "/videos/apartment.mp4",
  featured3: "/videos/apartment.mp4",
  featured4: "/videos/apartment.mp4",
  dashboard: "",
  testimonial1: "",
  testimonial2: "",
  testimonial3: "",
  testimonial4: "",
};

/* ============================================================
   LIVE STATS — rotating indicators below search bar
   ============================================================ */

function LiveSearchStats() {
  const stats = [
    { icon: "🔥", text: "apartments added today", count: 24 },
    { icon: "●", text: "people searching now", count: 112 },
    { icon: "✓", text: "units reserved this hour", count: 8 },
  ];
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % stats.length);
        setShow(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

/* ============================================================
   SKYLINE — dusk, night, dawn crossfade (preserved from original)
   ============================================================ */

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
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type SceneName = "dusk" | "night" | "dawn";

const SCENE_PALETTES: Record<SceneName, { sky: string; glow: string; litBias: number; heightJitter: number }> = {
  dusk: {
    sky: "linear-gradient(180deg, #0A0F1C 0%, #101A31 55%, #16213D 100%)",
    glow: "linear-gradient(180deg, rgba(37,99,235,0) 0%, rgba(37,99,235,0.12) 100%)",
    litBias: 0, heightJitter: 0,
  },
  night: {
    sky: "linear-gradient(180deg, #030712 0%, #0B1020 55%, #11162A 100%)",
    glow: "linear-gradient(180deg, rgba(56,189,248,0) 0%, rgba(56,189,248,0.08) 100%)",
    litBias: 0.18, heightJitter: 7,
  },
  dawn: {
    sky: "linear-gradient(180deg, #1B1330 0%, #3A2C4F 55%, #6A4A5A 100%)",
    glow: "linear-gradient(180deg, rgba(251,146,60,0) 0%, rgba(251,146,60,0.18) 100%)",
    litBias: -0.1, heightJitter: 14,
  },
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
        windows.push({
          cx: b.x + 10 + c * ((b.width - 20) / Math.max(1, b.cols - 1 || 1)),
          cy: y + 8 + f * floorH,
          variant,
          delay: rand() * 10,
          duration: 4 + rand() * 8,
        });
      }
    }
    return { ...b, id: `bld-${bi(seed, LAYOUT.indexOf(b))}`, y, height, windows };
  });
}

function bi(seed: number, i: number) { return `bld-${(seed + i * 7919) % 10000}`; }

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
          <svg
            className="absolute bottom-0 left-0 w-full h-full"
            viewBox="0 0 1440 400"
            preserveAspectRatio="xMidYMax slice"
            style={{ transform: `translateY(${parallaxOffset * 0.15}px)` }}
          >
            {scene.buildings.map((b) => (
              <g key={b.id}>
                <rect x={b.x} y={b.y} width={b.width} height={b.height} fill={b.depth === "back" ? "#182647" : "#0A0F1C"} opacity={b.depth === "back" ? 0.75 : 1} />
                {b.windows.map((w, wi) => (
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

/* ============================================================
   HOOKS
   ============================================================ */

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

/* ============================================================
   SECTION COMPONENTS
   ============================================================ */

function FloatingCard({
  city, type, price, tag, tagColor, index, videoSrc,
}: {
  city: string; type: string; price: string; tag: string; tagColor: string; index: number; videoSrc?: string;
}) {
  const animClass = index % 3 === 0 ? "animate-float" : index % 3 === 1 ? "animate-float2" : "animate-float3";
  const left = [50, 15, 72][index];
  const top = [22, 48, 38][index];
  return (
    <div
      className={`absolute ${animClass}`}
      style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * 1.5}s` }}
    >
      <div className="relative rounded-xl w-56 shadow-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-black/40">
        {videoSrc && (
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-40">
            <source src={videoSrc} type="video/mp4" />
          </video>
        )}
        <div className="relative p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">{city}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
          </div>
          <p className="text-sm font-medium text-white/90">{type}</p>
          <p className="text-lg font-bold text-white mt-1">{price}<span className="text-xs font-normal text-white/50">/mo</span></p>
        </div>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const activities = [
    { text: "Brian reserved a unit in Kilimani", time: "12s ago", icon: "✓" },
    { text: "Apartment verified in Westlands", time: "45s ago", icon: "✓" },
    { text: "New listing in Kisumu", time: "2m ago", icon: "+" },
    { text: "Deposit received KES 5,000", time: "3m ago", icon: "●" },
    { text: "Lease signed for 2BR in Mombasa", time: "5m ago", icon: "✓" },
    { text: "Unit reserved in Ruaka", time: "7m ago", icon: "✓" },
  ];
  const [visible, setVisible] = useState(activities.slice(0, 3));
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible((prev) => {
        const next = [...prev];
        next.pop();
        next.unshift(activities[Math.floor(Math.random() * activities.length)]);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="space-y-2">
      {visible.map((a, i) => (
        <div key={`${a.text}-${i}`} className="flex items-center gap-3 glass-card rounded-lg px-3 py-2 text-sm transition-all" style={{ animation: "fadeIn 0.4s ease-out" }}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${a.icon === "✓" ? "bg-emerald-500/20 text-emerald-400" : a.icon === "+" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>{a.icon}</span>
          <span className="flex-1 text-white/80">{a.text}</span>
          <span className="text-[11px] text-white/30">{a.time}</span>
        </div>
      ))}
    </div>
  );
}

const CITY_GRADIENTS: Record<string, string> = {
  Nairobi: "from-blue-900/60 via-slate-800/40 to-blue-950/60",
  Kisumu: "from-emerald-900/60 via-teal-800/40 to-emerald-950/60",
  Mombasa: "from-cyan-900/60 via-blue-800/40 to-cyan-950/60",
  Nakuru: "from-amber-900/60 via-orange-800/40 to-amber-950/60",
  Eldoret: "from-violet-900/60 via-purple-800/40 to-violet-950/60",
};

function CityCard({ name, count, desc, gradient }: { name: string; count: string; desc: string; gradient: string; onClick?: () => void }) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const vidRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    const onCanPlay = () => setVideoLoaded(true);
    v.addEventListener("canplay", onCanPlay);
    return () => v.removeEventListener("canplay", onCanPlay);
  }, []);
  return (
    <div className="relative h-36 rounded-xl overflow-hidden border border-white/10 group cursor-pointer hover:border-blue-500/30 transition-all duration-500">
      <video ref={vidRef} autoPlay loop muted playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105" style={{ opacity: videoLoaded ? 0.5 : 0 }}>
        <source src={`/videos/${name.toLowerCase()}.mp4`} type="video/mp4" />
      </video>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="relative h-full flex items-center justify-between px-5">
        <div>
          <p className="text-base font-bold text-white">{name}</p>
          <p className="text-[11px] text-white/50 mt-0.5">{desc}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-blue-400">{count}</p>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">listings</p>
        </div>
      </div>
    </div>
  );
}

function KenyaMap() {
  const cities = [
    { name: "Nairobi", x: 52, y: 58, listings: 132, desc: "Capital city, 4M+ residents" },
    { name: "Kisumu", x: 28, y: 44, listings: 44, desc: "Lakeside city" },
    { name: "Mombasa", x: 72, y: 72, listings: 78, desc: "Coastal metropolis" },
    { name: "Nakuru", x: 45, y: 45, listings: 28, desc: "Rift Valley hub" },
    { name: "Eldoret", x: 35, y: 32, listings: 22, desc: "North Rift economic center" },
  ];
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg viewBox="0 0 100 110" className="w-full h-auto" fill="none">
        <path
          d="M25 15 L40 10 L55 12 L65 18 L75 15 L85 20 L88 30 L85 40 L90 50 L88 60 L80 70 L85 80 L78 85 L70 82 L60 88 L50 85 L40 88 L30 85 L25 78 L20 70 L15 65 L10 55 L15 45 L12 35 L18 28 L22 22 Z"
          stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" fill="rgba(37,99,235,0.05)"
        />
        <path d="M18 60 L10 65 L15 72 L22 68 Z" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" fill="rgba(37,99,235,0.05)" />
        {cities.map((city, i) => (
          <g key={city.name}>
            <circle
              cx={city.x} cy={city.y} r={hovered === i ? 4 : 2.5}
              fill={hovered === i ? "#3B82F6" : "#2563EB"}
              stroke={hovered === i ? "#60A5FA" : "rgba(255,255,255,0.3)"}
              strokeWidth="1"
              className="transition-all duration-300 cursor-pointer map-pin"
              style={{ animationDelay: `${i * 0.3}s` }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            {hovered === i && (
              <>
                <text x={city.x} y={city.y - 10} textAnchor="middle" fill="white" fontSize="3.5" fontWeight="600">{city.name}</text>
                <text x={city.x} y={city.y - 6} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="2.8">{city.listings} listings</text>
              </>
            )}
            <text x={city.x} y={city.y + 6} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="2.8" fontWeight="500">{city.name}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function TestimonialsCarousel() {
  const testimonials = [
    { name: "Jane W.", location: "Nairobi", text: "I reserved my apartment without paying any broker. The whole process took 15 minutes.", rating: 5, video: VIDEOS.testimonial1 },
    { name: "Peter K.", location: "Mombasa", text: "Found a tenant in 3 days. RentManager made the whole process seamless.", rating: 5, video: VIDEOS.testimonial2 },
    { name: "Amina H.", location: "Kisumu", text: "Verified listings only. No more fake agents wasting my time.", rating: 5, video: VIDEOS.testimonial3 },
    { name: "David M.", location: "Nakuru", text: "The deposit system is transparent and refundable. Exactly what we needed.", rating: 5, video: VIDEOS.testimonial4 },
  ];
  const duplicated = [...testimonials, ...testimonials];
  return (
    <div className="overflow-hidden">
      <div className="animate-scroll flex gap-4 w-max">
        {duplicated.map((t, i) => (
          <div key={i} className="relative rounded-xl w-72 flex-shrink-0 overflow-hidden border border-white/10">
            {t.video && (
              <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-30">
                <source src={t.video} type="video/mp4" />
              </video>
            )}
            <div className="relative p-5 backdrop-blur-xl bg-black/40">
              <div className="flex text-amber-400 text-xs mb-3">{Array.from({ length: t.rating }).map((_, j) => (<span key={j}>★</span>))}</div>
              <p className="text-sm text-white/80 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400">{t.name[0]}</span>
                <div>
                  <p className="text-xs font-medium text-white">{t.name}</p>
                  <p className="text-[10px] text-white/40">{t.location}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedCounter({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const { ref, count } = useCountUp(end, 2000, suffix);
  return (
    <div ref={ref} className="text-center">
      <p className="font-display text-3xl md:text-4xl font-bold text-white">{count}</p>
      <p className="text-xs text-white/50 mt-1">{label}</p>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="laptop-mockup relative">
      <div className="relative mx-auto max-w-3xl">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent rounded-2xl blur-3xl" />
        <div className="screen relative glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-white/5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
            <span className="ml-3 text-[10px] text-white/30 font-medium">RentManager Dashboard</span>
          </div>
          <div className="p-4 grid grid-cols-4 gap-2">
            {[
              { label: "Total Revenue", value: "KES 1.2M", color: "from-blue-600 to-blue-400" },
              { label: "Occupancy", value: "94%", color: "from-emerald-600 to-emerald-400" },
              { label: "Active Tenants", value: "847", color: "from-violet-600 to-violet-400" },
              { label: "Properties", value: "124", color: "from-amber-600 to-amber-400" },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-lg bg-gradient-to-br ${stat.color} p-2.5`}>
                <p className="text-[9px] text-white/60 uppercase tracking-wider">{stat.label}</p>
                <p className="text-sm font-bold text-white mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <div className="h-16 rounded-lg bg-white/5 flex items-center justify-center">
              <div className="flex items-center gap-1">
                {[40, 60, 35, 80, 55, 70, 90, 65, 75, 85].map((h, i) => (
                  <div key={i} className="w-2 bg-blue-500/40 rounded-t-sm" style={{ height: `${h}%`, animation: `float2 ${2 + i * 0.2}s ease-in-out infinite`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 right-3 text-[8px] text-white/20">↑ Revenue is up 23% this month</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function HomePage() {
  const scrollY = useScrollY();
  const heroParallax = Math.min(scrollY * 0.5, 300);
  const { ref: heroReveal, inView: heroInView } = useInView(0.1);
  const { ref: activityRef, inView: activityInView } = useInView(0.1);
  const { ref: staggerRef, inView: staggerInView } = useInView(0.1);

  const features = [
    { title: "Verified Owners", desc: "Fake listings eliminated. Every property is owner-confirmed.", icon: "✓" },
    { title: "Secure Deposits", desc: "Deposits held safely until move-in is confirmed by both parties.", icon: "✓" },
    { title: "Digital Lease", desc: "Sign your lease agreement online. No paperwork, no delays.", icon: "✓" },
    { title: "Instant Receipts", desc: "Every payment generates a digital receipt automatically.", icon: "✓" },
  ];

  const howItWorks = [
    { step: "01", title: "Search", desc: "Filter by location, price, or property type to find verified vacancies across Kenya.", icon: "🔍" },
    { step: "02", title: "Reserve", desc: "Pay a small, fully refundable deposit to secure your unit instantly.", icon: "📋" },
    { step: "03", title: "Lease", desc: "Review and sign your digital lease agreement online.", icon: "✍" },
    { step: "04", title: "Move In", desc: "Your lease activates automatically. Rent reminders and receipts handled for you.", icon: "🏠" },
  ];

  const footerLinks = {
    Company: ["About", "Careers", "Blog", "Press"],
    Product: ["Browse", "List Property", "Pricing", "FAQ"],
    Resources: ["Help Center", "Guides", "Community", "Status"],
    Legal: ["Privacy", "Terms", "Cookies", "Licenses"],
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white overflow-x-hidden">
      {/* ============ NAVBAR ============ */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="glass my-3 rounded-2xl px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="text-blue-500">
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="4" width="5" height="24" rx="2" fill="currentColor" />
                  <path d="M11 4h5a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6h-5" fill="currentColor" />
                  <path d="M17 8L25 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              <span className="font-display text-base font-semibold tracking-tight text-white">RentManager</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
              <Link href="/listings" className="text-white/60 hover:text-white transition-colors">Browse</Link>
              <Link href="/public/sign-up" className="text-white/60 hover:text-white transition-colors">List property</Link>
            </nav>
            <div className="flex items-center gap-2.5">
              <Link href="/public/sign-in" className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5">Sign in</Link>
              <Link href="/public/sign-up" className="text-sm font-semibold px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/25">Get started</Link>
            </div>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <VideoBackground
          videoSrc={VIDEOS.hero}
          overlay="medium"
          zoom
          environmental
          className="absolute inset-0"
        >
          <SkylineBackground parallaxOffset={heroParallax} />
        </VideoBackground>

        <div ref={heroReveal} className="relative w-full max-w-6xl mx-auto px-6 pt-32 pb-24 text-center z-10">
          <div className={`transition-all duration-1000 ${heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-live-pulse" />
              Live in Kenya
            </div>

            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold leading-[0.95] tracking-tight text-white">
              Find your next home.
              <br />
              <span className="gradient-text-blue">Reserve it online.</span>
              <br />
              Move in with confidence.
            </h1>

            <p className="mt-6 text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
              Verified vacancies across Kenya. Reserve any unit with a refundable deposit. No agents, no fake listings.
            </p>

            <div className="mt-10 max-w-2xl mx-auto">
              <div className="glass rounded-2xl p-2 flex flex-col sm:flex-row gap-2 animate-pulse-glow">
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input type="text" placeholder="Where do you want to live?" className="w-full bg-transparent text-sm text-white placeholder:text-white/30 pl-9 pr-3 py-3 rounded-xl border border-white/10 focus:border-blue-500/50 outline-none transition-colors" />
                </div>
                <select className="bg-transparent text-sm text-white/70 px-3 py-3 rounded-xl border border-white/10 focus:border-blue-500/50 outline-none transition-colors appearance-none cursor-pointer">
                  <option>Any budget</option><option>KES 5K-15K</option><option>KES 15K-30K</option><option>KES 30K-50K</option><option>KES 50K+</option>
                </select>
                <Link href="/listings" className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-600/30 flex-shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  Search
                </Link>
              </div>
              <LiveSearchStats />
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-amber-400 text-sm">
              <span className="text-lg">★★★★★</span>
              <span className="text-white/50 ml-2">Trusted by landlords and tenants across Kenya</span>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/listings" className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold text-white transition-all border border-white/10">Browse Apartments</Link>
              <Link href="/public/sign-up" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-600/25">List Property</Link>
            </div>
          </div>
        </div>

        {/* Floating cards with video backgrounds */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-10">
          <FloatingCard city="Nairobi" type="Luxury Apartment" price="KES 35,000" tag="Available Now" tagColor="bg-emerald-500/20 text-emerald-400" index={0} />
          <FloatingCard city="Kisumu" type="Studio" price="KES 12,000" tag="Reserved 2m ago" tagColor="bg-amber-500/20 text-amber-400" index={1} />
          <FloatingCard city="Mombasa" type="2 Bedroom" price="KES 45,000" tag="Available" tagColor="bg-blue-500/20 text-blue-400" index={2} />
        </div>
      </section>

      {/* ============ LIVE ACTIVITY FEED ============ */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white opacity-30" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className={`reveal ${activityInView ? "in-view" : ""}`} ref={activityRef}>
            <div className="transition-all duration-800">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-400">Live feed</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mt-2 mb-10">Real-time activity</h2>
            </div>
          </div>
          <div className="max-w-lg mx-auto">
            <ActivityFeed />
          </div>
        </div>
      </section>

      {/* ============ KENYA MAP ============ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-400">Coverage</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mt-2">All across Kenya</h2>
            <p className="text-white/50 mt-3 max-w-md mx-auto">Live vacancies in major cities, updated in real-time.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <KenyaMap />
            <div className="space-y-4">
              {[
                { name: "Nairobi", count: "132", desc: "Capital city, 4M+ residents", gradient: CITY_GRADIENTS.Nairobi },
                { name: "Mombasa", count: "78", desc: "Coastal metropolis", gradient: CITY_GRADIENTS.Mombasa },
                { name: "Kisumu", count: "44", desc: "Lakeside city", gradient: CITY_GRADIENTS.Kisumu },
                { name: "Nakuru", count: "28", desc: "Rift Valley hub", gradient: CITY_GRADIENTS.Nakuru },
                { name: "Eldoret", count: "22", desc: "North Rift economic center", gradient: CITY_GRADIENTS.Eldoret },
              ].map((c) => (
                <CityCard key={c.name} name={c.name} count={c.count} desc={c.desc} gradient={c.gradient} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURED PROPERTIES ============ */}
      <section className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-400">Featured</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mt-2">Premium properties</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { id: "featured1", title: "Luxury Apartment", location: "Westlands, Nairobi", price: "KES 85,000", type: "3 Bedroom", gradient: "from-blue-900/80 to-blue-700/20", video: VIDEOS.featured1 },
              { id: "featured2", title: "Penthouse Suite", location: "Diani, Mombasa", price: "KES 120,000", type: "4 Bedroom", gradient: "from-violet-900/80 to-violet-700/20", video: VIDEOS.featured2 },
              { id: "featured3", title: "Waterfront Studio", location: "Kisumu CBD", price: "KES 18,000", type: "Studio", gradient: "from-emerald-900/80 to-emerald-700/20", video: VIDEOS.featured3 },
              { id: "featured4", title: "Executive 2BR", location: "Riverside, Nairobi", price: "KES 55,000", type: "2 Bedroom", gradient: "from-amber-900/80 to-amber-700/20", video: VIDEOS.featured4 },
            ].map((p) => (
              <Link key={p.id} href="/listings" className="featured-card group relative h-72 rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all duration-500">
                {p.video && (
                  <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                    <source src={p.video} type="video/mp4" />
                  </video>
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient}`} />
                <div className="card-overlay absolute inset-0 bg-[#030712]/60 opacity-60" />
                <div className="relative h-full flex flex-col justify-end p-6">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-blue-400 mb-2">
                    <span>{p.type}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>Featured</span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">{p.title}</h3>
                  <p className="text-sm text-white/60 mt-0.5">{p.location}</p>
                  <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                    <p className="text-lg font-bold text-white">{p.price}<span className="text-xs font-normal text-white/40">/mo</span></p>
                    <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                      View <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATISTICS ============ */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-blue-500/5" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-400">By the numbers</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mt-2">RentManager in data</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            <AnimatedCounter end={2400} suffix="+" label="Verified Landlords" />
            <AnimatedCounter end={5800} suffix="+" label="Active Tenants" />
            <AnimatedCounter end={1200} suffix="+" label="Monthly Reservations" />
            <AnimatedCounter end={38} suffix="" label="Cities Covered" />
            <AnimatedCounter end={94} suffix="%" label="Occupancy Rate" />
            <AnimatedCounter end={50000000} suffix="+ KES" label="Rent Collected" />
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="relative py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-400">Process</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mt-2">From search to move-in</h2>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0" />
            <div className={`grid md:grid-cols-4 gap-8 stagger-children ${staggerInView ? "in-view" : ""}`} ref={staggerRef}>
              {howItWorks.map((item, i) => (
                <div key={item.step} className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-400/10 border border-blue-500/20 flex items-center justify-center text-2xl mb-4 animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
                    <span className="text-blue-400 text-2xl">{item.icon}</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-blue-400">{item.step}</span>
                  <h3 className="font-display text-lg font-bold text-white mt-1">{item.title}</h3>
                  <p className="text-sm text-white/50 mt-2 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY RENTMANAGER ============ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white opacity-20" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden border border-white/10">
              <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                <source src={VIDEOS.featured1 || "/videos/living.mp4"} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/80 via-blue-900/30 to-transparent" />
              <div className="relative h-full flex items-end p-6">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  <p className="text-sm text-white/60">Modern living, verified</p>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-400">Why RentManager</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight">Built for the <span className="gradient-text-blue">modern Kenyan</span> rental market</h2>
              <div className="space-y-4">
                {features.map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-400 text-[10px] font-bold">{f.icon}</span>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{f.title}</p>
                      <p className="text-sm text-white/50 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-400">Testimonials</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mt-2">Trusted by thousands</h2>
          </div>
          <TestimonialsCarousel />
        </div>
      </section>

      {/* ============ LANDLORD DASHBOARD ============ */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-20">
            <source src={VIDEOS.dashboard || "/videos/office.mp4"} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#030712]/90 to-[#030712]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-blue-400">Dashboard</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mt-2">Powerful tools for landlords</h2>
            <p className="text-white/50 mt-3 max-w-lg mx-auto">Track revenue, occupancy, and payments in real time.</p>
          </div>
          <DashboardPreview />
          <div className="text-center mt-8">
            <Link href="/public/sign-up" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-600/25">
              Create a free account
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative py-32 overflow-hidden">
        <VideoBackground
          videoSrc={VIDEOS.nairobi}
          overlay="dark"
          zoom
          environmental
          className="absolute inset-0"
        >
          <SkylineBackground />
        </VideoBackground>
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/80 via-[#030712]/60 to-[#030712]/80" />
        <div className="relative text-center max-w-4xl mx-auto px-6 z-10">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Ready to find your next home?
          </h2>
          <p className="text-lg text-white/50 mt-4 max-w-lg mx-auto">Join thousands of Kenyans who find and reserve their homes on RentManager.</p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/listings" className="px-8 py-3 rounded-xl bg-white text-[#030712] text-sm font-bold hover:bg-white/90 transition-all shadow-2xl">Browse Properties</Link>
            <Link href="/public/sign-up" className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-all shadow-lg shadow-blue-600/25">List Property</Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <span className="text-blue-500">
                  <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="4" width="5" height="24" rx="2" fill="currentColor" />
                    <path d="M11 4h5a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6h-5" fill="currentColor" />
                    <path d="M17 8L25 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-display text-sm font-semibold tracking-tight text-white">RentManager</span>
              </Link>
              <p className="text-xs text-white/40 leading-relaxed max-w-xs">The modern way to find and reserve rental properties across Kenya. Verified listings, secure deposits, digital leases.</p>
            </div>
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-white/50 mb-3">{category}</p>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-white/30">&copy; {new Date().getFullYear()} RentManager. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {["Twitter", "Instagram", "LinkedIn", "YouTube"].map((social) => (
                <Link key={social} href="#" className="text-[11px] text-white/30 hover:text-white/50 transition-colors">{social}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
