"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  ClipboardList,
  Users,
  Wrench,
  Megaphone,
  CreditCard,
  Send,
  Settings,
  Home,
  Wallet,
  FileText,
  Smartphone,
  Bell,
  Search,
  Menu,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  Play,
  Pause,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedGradient } from "@/shared/components/premium-3d";
import { PlatformLogoMark } from "@/shared/components/brand";
import { SectionHeader } from "./SectionHeader";
import { Button } from "@/shared/components/ui/Button";
import { useInView } from "@/features/landing/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/features/landing/hooks/use-prefers-reduced-motion";

const AUTOPLAY_MS = 5000;

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

type DemoScreenProps = { reduced: boolean; scrollY: number };
type DemoScreen = ComponentType<DemoScreenProps>;

const DEMO_STEPS: Array<{
  tag: string;
  title: string;
  caption: string;
  icon: IconType;
}> = [
  {
    tag: "RentManager · Platform",
    title: "The whole system, one app",
    caption: "The real product splash — your entire rental business loads here.",
    icon: Sparkles,
  },
  {
    tag: "Landlord · Portfolio",
    title: "Overview at a glance",
    caption: "Portfolio health, occupancy and revenue in one screen.",
    icon: LayoutDashboard,
  },
  {
    tag: "Landlord · Properties",
    title: "Live property status",
    caption: "Every unit's occupancy, straight from the real feed.",
    icon: Building2,
  },
  {
    tag: "Landlord · Analytics",
    title: "Growth, trends & M-Pesa",
    caption: "Charts, composition and gateway health — real data.",
    icon: TrendingUp,
  },
  {
    tag: "Tenant · Portal",
    title: "Pay rent in seconds",
    caption: "Balance, receipts, lease and repairs from one place.",
    icon: Home,
  },
];

/* ── Small shared primitives (light theme = the real app) ──────────── */

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-1 text-[9px] font-semibold text-slate-800">
      <span className="font-mono-nums tracking-tight">03:09 PM</span>
      <div className="flex items-center gap-1.5 text-slate-700" aria-hidden="true">
        <span className="flex items-end gap-[1.5px] h-2">
          <span className="w-[2px] h-[3px] rounded-sm bg-current" />
          <span className="w-[2px] h-[5px] rounded-sm bg-current" />
          <span className="w-[2px] h-full rounded-sm bg-current" />
        </span>
        <span className="h-2 w-3 rounded-[2px] border border-current relative">
          <span className="absolute inset-x-[1px] top-[1px] h-[1px] bg-current" />
          <span className="absolute right-[-3px] top-1/2 -translate-y-1/2 h-[4px] w-[2px] rounded-r-sm bg-current" />
        </span>
        <span className="font-mono-nums tracking-tight pl-0.5">100%</span>
      </div>
    </div>
  );
}

function TabBar({ tabs, active }: { tabs: Array<{ label: string; icon: IconType; active?: boolean }>; active: number }) {
  return (
    <div className="flex items-stretch justify-between border-t border-slate-200 bg-white px-2 pb-2 pt-1.5">
      {tabs.map((tab, i) => (
        <div
          key={tab.label}
          className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 ${
            i === active ? "text-emerald-700" : "text-slate-400"
          }`}
        >
          <tab.icon className="h-3.5 w-3.5" strokeWidth={i === active ? 2.5 : 1.75} />
          <span className={`text-[7px] leading-none ${i === active ? "font-bold" : "font-medium"}`}>{tab.label}</span>
        </div>
      ))}
    </div>
  );
}

function Badge({ tone, children }: { tone: "emerald" | "amber" | "sky" | "slate" | "red"; children: ReactNode }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[7px] font-semibold leading-none ${tones[tone]}`}>
      {children}
    </span>
  );
}

function KpiTile({ label, value, sub, tone = "text-slate-900" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
      <p className="text-[7px] font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-bold font-mono-nums ${tone}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[6.5px] font-medium text-slate-500">{sub}</p>}
    </div>
  );
}

/* ── Screen 1 (boot): the real product splash ──────────────────────── */

function BrandIntroScreen({ reduced }: DemoScreenProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-white">
      {/* Ambient boot backdrop — matches the real app's splash feel */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-slate-50" aria-hidden="true" />
      <div className="demo-boot-glow absolute left-1/2 top-[38%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_62%)]" aria-hidden="true" />

      <div className="demo-boot-mark relative flex flex-col items-center px-8 text-center">
        {/* App-icon tile renders the owner-configured system logo — the same
            mark the product ships today, not a stale placeholder */}
        <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white shadow-xl shadow-emerald-900/10 ring-1 ring-slate-900/5">
          <PlatformLogoMark size={58} />
        </div>
        <p className="mt-5 flex items-center justify-center gap-1.5 font-brand text-[26px] font-semibold tracking-[-0.01em] text-slate-900">
          <span>Rent</span>
          <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
            Manager
          </span>
          <span
            aria-hidden="true"
            className="h-2 w-2 rotate-45 rounded-[1px] bg-gradient-to-br from-emerald-500 to-emerald-700"
          />
        </p>
        <p className="mt-1.5 text-[8px] font-semibold uppercase tracking-[0.22em] text-slate-400">Property management · Kenya</p>
      </div>

      {/* Splash loading bar */}
      <div className="relative mt-10 w-40">
        <div className="h-[3px] w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="demo-boot-fill h-full w-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
            style={reduced ? { animation: "none", transform: "scaleX(1)" } : undefined}
          />
        </div>
        <p className="mt-3 text-center text-[8px] font-medium text-slate-400">Loading your workspace…</p>
      </div>
    </div>
  );
}

/* ── Screen 2: Landlord portfolio overview ─────────────────────────── */

function LandlordOverviewScreen({ reduced, scrollY }: DemoScreenProps) {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-3 pb-2.5 pt-1 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
            <Menu className="h-3 w-3" strokeWidth={2} />
          </div>
          <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1.5 text-slate-400">
            <Search className="h-3 w-3" strokeWidth={2} />
            <span className="text-[8px] font-medium">Search anything...</span>
          </div>
          <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Bell className="h-3 w-3" strokeWidth={2} />
            <span className="absolute -right-1 -top-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[6px] font-bold text-white ring-2 ring-white">
              9+
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-bold text-white">K</div>
          <span className="text-[9px] font-semibold text-slate-800">nyali rentals</span>
          <ChevronDown className="h-2.5 w-2.5 text-slate-400" strokeWidth={2.5} />
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden px-3 pt-3">
        <motion.div
          className="pb-6"
          initial={false}
          animate={reduced ? { y: 0 } : { y: [0, 0, -scrollY, -scrollY] }}
          transition={{ duration: 5, times: [0, 0.09, 0.86, 1], ease: ["linear", "easeInOut", "linear"] }}
        >
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-3.5 text-white shadow-lg shadow-emerald-900/20">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold">Portfolio Overview</p>
            <button className="flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[8px] font-bold backdrop-blur">
              <Plus className="h-2.5 w-2.5" strokeWidth={3} /> Add Property
            </button>
          </div>
          <p className="mt-1 text-[7.5px] text-emerald-100/80">Your rental business at a glance · Updated 03:09 PM</p>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/15 pt-3">
            <div>
              <p className="text-[7px] font-medium uppercase tracking-wider text-emerald-100/70">Portfolio Health</p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="font-mono-nums text-lg font-bold">22%</span>
                <span className="rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[6.5px] font-bold text-white">Needs attention</span>
              </div>
            </div>
            <div>
              <p className="text-[7px] font-medium uppercase tracking-wider text-emerald-100/70">Occupancy</p>
              <p className="mt-0.5 font-mono-nums text-lg font-bold">0%</p>
            </div>
            <div>
              <p className="text-[7px] font-medium uppercase tracking-wider text-emerald-100/70">Monthly Revenue</p>
              <p className="mt-0.5 font-mono-nums text-lg font-bold">KES 0</p>
            </div>
            <div>
              <p className="text-[7px] font-medium uppercase tracking-wider text-emerald-100/70">Collection Rate</p>
              <p className="mt-0.5 font-mono-nums text-lg font-bold">—</p>
            </div>
          </div>
        </div>

        <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-slate-800">Portfolio Health</p>
            <Badge tone="red">Needs attention</Badge>
          </div>
          <div className="mt-2 space-y-1.5">
            {[
              { label: "Occupancy", value: 0, color: "bg-rose-500" },
              { label: "Collections", value: 22, color: "bg-amber-500" },
              { label: "Maintenance", value: 100, color: "bg-emerald-500" },
              { label: "Revenue", value: 10, color: "bg-slate-400" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2">
                <span className="w-16 text-[7.5px] font-medium text-slate-500">{row.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.value}%` }} />
                </div>
                <span className="w-7 text-right font-mono-nums text-[7.5px] font-semibold text-slate-500">{row.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-slate-800">Key Metrics</p>
            <Badge tone="amber">2 need attention</Badge>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <KpiTile label="Total Properties" value="5" sub="in portfolio" />
            <KpiTile label="Active Properties" value="3" sub="60% of total" />
            <KpiTile label="Fully Occupied" value="0" sub="0% occupancy" />
            <KpiTile label="Occupancy Rate" value="0%" sub="of active properties" />
            <KpiTile label="Vacant" value="2" sub="properties to fill" tone="text-rose-600" />
            <KpiTile label="Under Maintenance" value="0" sub="properties" />
          </div>
        </div>

        <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold text-slate-800">Financial Intelligence</p>
            <span className="text-[7px] font-semibold text-emerald-700">View payments ›</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-[6.5px] font-medium uppercase tracking-wider text-slate-400">Monthly Revenue</p>
              <p className="mt-0.5 font-mono-nums text-[10px] font-bold text-slate-800">KES 0</p>
              <p className="text-[6px] text-slate-400">no data</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-[6.5px] font-medium uppercase tracking-wider text-slate-400">Collected Today</p>
              <p className="mt-0.5 font-mono-nums text-[10px] font-bold text-slate-800">KES 0</p>
              <p className="text-[6px] text-slate-400">no payments today</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-[6.5px] font-medium uppercase tracking-wider text-slate-400">Outstanding</p>
              <p className="mt-0.5 font-mono-nums text-[10px] font-bold text-slate-800">KES 0</p>
              <p className="text-[6px] text-slate-400">across all properties</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-[6.5px] font-medium uppercase tracking-wider text-slate-400">M-Pesa Success</p>
              <p className="mt-0.5 font-mono-nums text-[10px] font-bold text-slate-800">—</p>
              <p className="text-[6px] text-slate-400">no transactions yet</p>
            </div>
          </div>
        </div>

        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" aria-hidden="true" />
      </div>

      <TabBar
        active={0}
        tabs={[
          { label: "Portfolio", icon: LayoutDashboard, active: true },
          { label: "Properties", icon: Building2 },
          { label: "Payments", icon: Receipt },
          { label: "Rent Ledger", icon: ClipboardList },
          { label: "Tenants", icon: Users },
        ]}
      />
    </div>
  );
}

/* ── Screen 3: Landlord properties + quick actions ─────────────────── */

const PROPERTY_ROWS = [
  { initials: "GR", name: "Green land Apartments", type: "hostel", status: "active", occupancy: "partially occupied", tone: "emerald" as const },
  { initials: "BL", name: "Blue House", type: "bedsitter", status: "active", occupancy: "vacant", tone: "amber" as const },
  { initials: "WH", name: "Whitney's & Hassan", type: "apartment", status: "active", occupancy: "vacant", tone: "amber" as const },
];

function LandlordPropertiesScreen({ reduced, scrollY }: DemoScreenProps) {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-3 pb-2.5 pt-1 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
            <Menu className="h-3 w-3" strokeWidth={2} />
          </div>
          <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1.5 text-slate-400">
            <Search className="h-3 w-3" strokeWidth={2} />
            <span className="text-[8px] font-medium">Search anything...</span>
          </div>
          <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Bell className="h-3 w-3" strokeWidth={2} />
            <span className="absolute -right-1 -top-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[6px] font-bold text-white ring-2 ring-white">
              9+
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden px-3 pt-3">
        <motion.div
          className="pb-6"
          initial={false}
          animate={reduced ? { y: 0 } : { y: [0, 0, -scrollY, -scrollY] }}
          transition={{ duration: 5, times: [0, 0.09, 0.86, 1], ease: ["linear", "easeInOut", "linear"] }}
        >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-900">Properties</p>
            <p className="text-[7px] text-slate-400">3 properties · 3 active</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-0.5">
            <span className="rounded-md bg-white px-2 py-0.5 text-[7px] font-bold text-slate-800 shadow-sm">Active</span>
            <span className="px-2 py-0.5 text-[7px] font-semibold text-slate-500">All</span>
          </div>
        </div>

        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.6fr_1fr_0.8fr_1fr] gap-1 border-b border-slate-100 bg-slate-50/80 px-2.5 py-1.5 text-[6.5px] font-bold uppercase tracking-wide text-slate-400">
            <span>Property</span>
            <span>Type</span>
            <span>Status</span>
            <span className="text-right">Occupancy</span>
          </div>
          {PROPERTY_ROWS.map((row) => (
            <div key={row.name} className="grid grid-cols-[1.6fr_1fr_0.8fr_1fr] items-center gap-1 border-b border-slate-100 px-2.5 py-2 last:border-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-[7px] font-bold text-emerald-700">
                  {row.initials}
                </div>
                <span className="truncate text-[7.5px] font-semibold text-slate-800">{row.name}</span>
              </div>
              <span className="truncate text-[7px] text-slate-500">{row.type}</span>
              <Badge tone="emerald">{row.status}</Badge>
              <span className="flex justify-end">
                <Badge tone={row.tone}>{row.occupancy}</Badge>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-50 text-amber-600">
              <AlertTriangle className="h-3 w-3" strokeWidth={2} />
            </div>
            <p className="text-[9px] font-bold text-slate-800">Alerts</p>
            <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[7px] font-bold text-amber-700">2</span>
          </div>
          <div className="mt-1.5 space-y-1.5">
            <div className="rounded-lg bg-rose-50/70 p-2">
              <p className="text-[8px] font-semibold text-rose-700">2 vacant properties</p>
              <p className="text-[7px] text-slate-500">Review pricing or run promotions to attract tenants.</p>
            </div>
            <div className="rounded-lg bg-amber-50/70 p-2">
              <p className="text-[8px] font-semibold text-amber-700">Occupancy at 0%</p>
              <p className="text-[7px] text-slate-500">Below the 80% target. Focus on leasing vacant units.</p>
            </div>
          </div>
        </div>

        <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="text-[9px] font-bold text-slate-800">Quick Actions</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {[
              { icon: Plus, label: "Add Property", sub: "Create a listing" },
              { icon: FileText, label: "Create Lease", sub: "Draft an agreement" },
              { icon: Receipt, label: "Record Payment", sub: "Log rent received" },
              { icon: Send, label: "Disbursement", sub: "B2C payout" },
              { icon: Users, label: "Invite Tenant", sub: "Add new resident" },
              { icon: Settings, label: "Settings", sub: "Configure account" },
            ].map((a) => (
              <div key={a.label} className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                  <a.icon className="h-3 w-3" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[7.5px] font-semibold text-slate-800">{a.label}</p>
                  <p className="truncate text-[6px] text-slate-400">{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" aria-hidden="true" />
      </div>

      <TabBar
        active={1}
        tabs={[
          { label: "Portfolio", icon: LayoutDashboard },
          { label: "Properties", icon: Building2, active: true },
          { label: "Payments", icon: Receipt },
          { label: "Rent Ledger", icon: ClipboardList },
          { label: "Tenants", icon: Users },
        ]}
      />
    </div>
  );
}

/* ── Screen 4: Analytics, composition, M-Pesa ───────────────────────── */

function GrowthLine({ points, height = 56 }: { points: number[]; height?: number }) {
  const max = 100;
  const w = 260;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => `${i * step},${height - (p / max) * height}`);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${coords.join(" ")} ${w},${height}`} fill="url(#growthFill)" />
      <polyline points={coords.join(" ")} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.split(",")[0]} cy={c.split(",")[1]} r="2.2" fill="#fff" stroke="#059669" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

const GROWTH_POINTS = [12, 22, 34, 30, 46, 52, 58, 66, 74, 82, 90, 100];

function LandlordAnalyticsScreen({ reduced, scrollY }: DemoScreenProps) {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-3 pb-2.5 pt-1 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600">
            <Menu className="h-3 w-3" strokeWidth={2} />
          </div>
          <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1.5 text-slate-400">
            <Search className="h-3 w-3" strokeWidth={2} />
            <span className="text-[8px] font-medium">Search anything...</span>
          </div>
          <div className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <Bell className="h-3 w-3" strokeWidth={2} />
            <span className="absolute -right-1 -top-1 flex h-3 min-w-3 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[6px] font-bold text-white ring-2 ring-white">
              9+
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden px-3 pt-3">
        <motion.div
          className="pb-6"
          initial={false}
          animate={reduced ? { y: 0 } : { y: [0, 0, -scrollY, -scrollY] }}
          transition={{ duration: 5, times: [0, 0.09, 0.86, 1], ease: ["linear", "easeInOut", "linear"] }}
        >
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-800">Portfolio Growth</p>
              <p className="text-[7px] text-slate-400">12-month trend</p>
            </div>
            <Badge tone="emerald">+Growing</Badge>
          </div>
          <div className="mt-2">
            <GrowthLine points={GROWTH_POINTS} />
          </div>
          <div className="mt-1 flex justify-between text-[6.5px] font-medium text-slate-400">
            <span>Sep</span>
            <span>Nov</span>
            <span>Jan</span>
            <span>Mar</span>
            <span>May</span>
            <span>Jul</span>
          </div>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <p className="text-[8.5px] font-bold text-slate-800">Portfolio Composition</p>
            <p className="text-[6.5px] text-slate-400">Active vs archived</p>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full bg-emerald-500" style={{ width: "60%" }} />
              <div className="h-full bg-slate-300" style={{ width: "40%" }} />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-[7px] text-slate-600">Active · 3 (60%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="text-[7px] text-slate-600">Draft · 0 (0%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span className="text-[7px] text-slate-600">Archived · 2 (40%)</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[8.5px] font-bold text-slate-800">Occupancy Trend</p>
              <Badge tone="amber">0%</Badge>
            </div>
            <p className="text-[6.5px] text-slate-400">Last 12 months</p>
            <div className="mt-3 flex h-14 items-end gap-[3px] px-0.5">
              {[0, 0, 0, 8, 4, 0, 0, 10, 6, 0, 4, 0].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-t-sm ${h >= 8 ? "bg-emerald-400" : h > 0 ? "bg-amber-300" : "bg-slate-200"}`}
                  style={{ height: `${Math.max(h, 4)}%` }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[6px] text-slate-400">
              <span>Sep</span>
              <span>Mar</span>
              <span>Now</span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-800">Top Properties</p>
              <p className="text-[7px] text-slate-400">By occupancy rate</p>
            </div>
            <Sparkles className="h-3 w-3 text-emerald-600" strokeWidth={1.75} />
          </div>
          <div className="mt-2 space-y-1.5">
            {[
              { rank: 1, name: "Green land Apartments", pct: 43 },
              { rank: 2, name: "Whitney's & Hassan", pct: 0 },
              { rank: 3, name: "Blue House", pct: 9 },
            ].map((p) => (
              <div key={p.rank} className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[7px] font-bold text-slate-600">{p.rank}</span>
                <span className="flex-1 truncate text-[7.5px] font-medium text-slate-700">{p.name}</span>
                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${p.pct >= 40 ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${Math.max(p.pct, 4)}%` }} />
                </div>
                <span className="w-8 text-right font-mono-nums text-[7.5px] font-bold text-slate-700">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Smartphone className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <p className="text-[8.5px] font-bold text-slate-800">M-Pesa · Payment gateway</p>
              <p className="text-[7px] text-slate-400">Collect rent via STK push</p>
            </div>
            <Badge tone="emerald">
              <span className="h-1 w-1 rounded-full bg-emerald-500" aria-hidden="true" />
              Connected
            </Badge>
          </div>
        </div>

        <div className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 text-amber-600">
              <Lightbulb className="h-3 w-3" strokeWidth={2} />
            </div>
            <p className="text-[9px] font-bold text-amber-800">Insights</p>
          </div>
          <p className="mt-1.5 text-[7.5px] leading-relaxed text-amber-900/80">
            Occupancy dropped to 0%. Review pricing and run promotions to attract tenants.
          </p>
        </div>

        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" aria-hidden="true" />
      </div>

      <TabBar
        active={2}
        tabs={[
          { label: "Portfolio", icon: LayoutDashboard },
          { label: "Properties", icon: Building2 },
          { label: "Payments", icon: Receipt, active: true },
          { label: "Rent Ledger", icon: ClipboardList },
          { label: "Tenants", icon: Users },
        ]}
      />
    </div>
  );
}

/* ── Screen 5: Tenant portal ───────────────────────────────────────── */

function TenantPortalScreen({ reduced, scrollY }: DemoScreenProps) {
  const nav = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Payments", icon: CreditCard },
    { label: "Lease", icon: FileText },
    { label: "Landlord", icon: ShieldCheck },
    { label: "Announcements", icon: Megaphone, badge: 2 },
    { label: "Maintenance", icon: Wrench },
    { label: "Help & Support", icon: Users },
  ];
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex flex-1 min-h-0">
        {/* Narrow sidebar */}
        <div className="flex w-[64px] shrink-0 flex-col border-r border-slate-200 bg-white py-2">
          <div className="mx-1.5 mb-2 flex h-7 items-center justify-center rounded-lg bg-emerald-600 text-[7px] font-black tracking-tight text-white">
            RM
          </div>
          {nav.map((item) => (
            <div
              key={item.label}
              className={`relative mx-1.5 mb-0.5 flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 ${
                item.active ? "bg-emerald-50 text-emerald-700" : "text-slate-400"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" strokeWidth={item.active ? 2.5 : 1.75} />
              <span className={`text-[5.5px] leading-none ${item.active ? "font-bold" : "font-medium"}`}>{item.label}</span>
              {item.badge != null && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3 min-w-3 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[5px] font-bold text-white">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
          <div className="mt-auto flex flex-col items-center gap-1 rounded-lg p-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-bold text-white">HK</div>
            <span className="text-[5px] font-semibold text-slate-600">Hassan</span>
            <span className="text-[4.5px] leading-tight text-slate-400 text-center">Unit HWSW · Green land</span>
          </div>
        </div>

        {/* Main column */}
        <div className="relative flex-1 min-w-0 bg-slate-50">
          <div className="relative h-full overflow-hidden bg-slate-50">
            <motion.div
              className="h-full pb-6"
              initial={false}
              animate={reduced ? { y: 0 } : { y: [0, 0, -scrollY, -scrollY] }}
              transition={{ duration: 5, times: [0, 0.09, 0.86, 1], ease: ["linear", "easeInOut", "linear"] }}
            >
            <div className="rounded-b-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-3 pb-4 pt-3 text-white shadow-lg shadow-emerald-900/20">
              <p className="text-[6.5px] font-semibold uppercase tracking-widest text-emerald-100/70">Welcome back</p>
              <div className="mt-0.5 flex items-center justify-between">
                <p className="text-[13px] font-bold leading-tight">Hassan Karungwa</p>
                <Badge tone="emerald">
                  <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                  <span className="text-white">active</span>
                </Badge>
              </div>
              <p className="text-[7px] text-emerald-100/80">Unit HWSW · Green land Apartments</p>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/15 pt-3">
                <div>
                  <p className="text-[6.5px] font-medium uppercase tracking-wider text-emerald-100/70">Balance Due</p>
                  <p className="font-mono-nums text-base font-bold">Ksh 0.00</p>
                </div>
                <div>
                  <p className="text-[6.5px] font-medium uppercase tracking-wider text-emerald-100/70">Overdue</p>
                  <p className="font-mono-nums text-base font-bold">Ksh 0.00</p>
                </div>
                <div>
                  <p className="text-[6.5px] font-medium uppercase tracking-wider text-emerald-100/70">Next Due</p>
                  <p className="font-mono-nums text-[11px] font-bold">—</p>
                </div>
                <div>
                  <p className="text-[6.5px] font-medium uppercase tracking-wider text-emerald-100/70">Monthly Rent</p>
                  <p className="font-mono-nums text-[11px] font-bold">Ksh 1</p>
                </div>
              </div>
            </div>

            <div className="px-3 pt-2.5">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-slate-800">Recent Payments</p>
                  <span className="text-[7px] font-semibold text-emerald-700">View all ›</span>
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                    <Wallet className="h-3.5 w-3.5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] font-semibold text-slate-800">Deposit</p>
                    <p className="truncate text-[6.5px] text-slate-400">29 Jul 2026 · UGTBF11C79 · M-Pesa: UGTBF11C79</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-nums text-[9px] font-bold text-slate-800">−Ksh 1</p>
                    <Badge tone="emerald">deposit</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-[9px] font-bold text-slate-800">Quick Actions</p>
                <div className="mt-2">
                  <p className="text-[6.5px] font-medium uppercase tracking-widest text-slate-400">Amount to pay</p>
                  <div className="mt-1 flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                    <span className="font-mono-nums text-[9px] font-semibold text-slate-500">KSh</span>
                    <span className="ml-2 font-mono-nums text-[11px] font-bold text-slate-800">0</span>
                    <span className="ml-auto text-[7px] text-slate-400">|</span>
                  </div>
                  <button className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-[8.5px] font-bold text-white shadow-md shadow-emerald-600/25">
                    <Smartphone className="h-3 w-3" strokeWidth={2} />
                    Continue to Payment
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  {[
                    { icon: CreditCard, label: "View Payment History", sub: "Download receipts, check status" },
                    { icon: FileText, label: "Lease Agreement", sub: "View terms, landlord contacts" },
                    { icon: Wrench, label: "Maintenance Request", sub: "Submit a repair request" },
                  ].map((a) => (
                    <div key={a.label} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                        <a.icon className="h-3 w-3" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[7.5px] font-semibold text-slate-800">{a.label}</p>
                        <p className="text-[6px] text-slate-400">{a.sub}</p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-slate-300" strokeWidth={2} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= 4 ? "text-amber-400" : "text-slate-200"}>★</span>
                  ))}
                  <span className="text-[8px] font-semibold text-slate-700">4/5</span>
                </div>
                <p className="mt-1.5 text-[7px] leading-relaxed text-slate-500">
                  &ldquo;This system has full automation to the rent lifecycles, I love it ❤️.&rdquo;
                </p>
                <p className="mt-1 text-[6px] text-slate-400">Updates are re-moderated before going live.</p>
              </div>
            </div>

            </motion.div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" aria-hidden="true" />
          </div>
        </div>
      </div>

      <TabBar
        active={0}
        tabs={[
          { label: "Dashboard", icon: Home, active: true },
          { label: "Payments", icon: CreditCard },
          { label: "Lease", icon: FileText },
          { label: "Landlord", icon: ShieldCheck },
          { label: "More", icon: Menu },
        ]}
      />
    </div>
  );
}

/* ── Phone frame + section ──────────────────────────────────────────── */

/* scroll = how far the hand drags the content (px), locked 1:1 so the
   fingertip stays glued to the row it starts on. Screens with more
   content travel further in the same 4s scroll. */
const SCREENS: Array<{ render: DemoScreen; scroll: number; scrollable: boolean }> = [
  { render: BrandIntroScreen, scroll: 0, scrollable: false },
  { render: LandlordOverviewScreen, scroll: 220, scrollable: true },
  { render: LandlordPropertiesScreen, scroll: 220, scrollable: true },
  { render: LandlordAnalyticsScreen, scroll: 200, scrollable: true },
  { render: TenantPortalScreen, scroll: 140, scrollable: true },
];

export function Premium3DDashboardSection() {
  const { ref, inView } = useInView<HTMLDivElement>(0.15);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  const autoplay = playing && !prefersReducedMotion && inView;

  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % SCREENS.length), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplay]);

  const goTo = (i: number) => setActive(Math.floor(i) % SCREENS.length);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-jade-500/[0.04] to-transparent" aria-hidden="true">
        <AnimatedGradient variant="orbs" className="absolute inset-0" />
        <div className="absolute inset-0 bg-grid-white opacity-20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Dashboard"
          title="Powerful tools for landlords"
          description="Track revenue, occupancy, and payments in real time. Manage your entire portfolio from one place."
        />

        <div ref={ref} className={`transition-all duration-1000 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-20">
            {/* ── Phone demo ── */}
            <div className="relative mx-auto w-fit">
              {/* Floating chips */}
              <div className="absolute -left-8 top-14 hidden xl:flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b111f]/90 backdrop-blur px-3 py-2.5 shadow-2xl shadow-black/50 demo-float" style={{ animationDelay: "0.6s" }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Smartphone className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white">M-Pesa STK push</p>
                  <p className="text-[9px] text-white/40">Rent collected · receipt issued</p>
                </div>
              </div>
              <div className="absolute -right-6 bottom-64 hidden xl:flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b111f]/90 backdrop-blur px-3 py-2.5 shadow-2xl shadow-black/50 demo-float" style={{ animationDelay: "1.4s" }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-jade-500/15 text-jade-400">
                  <FileText className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white">Digital lease signed</p>
                  <p className="text-[9px] text-white/40">Unit HWSW · stored forever</p>
                </div>
              </div>

              <div className="lg:-rotate-2 hover:rotate-0 transition-transform duration-700 relative">
                <div className="phone-bezel demo-float relative w-[250px] sm:w-[272px] rounded-[2.9rem] p-[10px]">
                  {/* Side buttons */}
                  <div className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-full bg-white/25" aria-hidden="true" />
                  <div className="absolute -left-[3px] top-36 h-14 w-[3px] rounded-full bg-white/25" aria-hidden="true" />
                  <div className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-full bg-white/25" aria-hidden="true" />

                  <div className="relative overflow-hidden rounded-[2.3rem] bg-white shadow-inner">
                    {/* Story-style progress segments */}
                    <div className="absolute inset-x-0 top-2 z-40 flex gap-1 px-5">
                      {DEMO_STEPS.map((step, i) => (
                        <button
                          key={step.title}
                          type="button"
                          onClick={() => goTo(i)}
                          aria-label={`Show demo step ${i + 1}: ${step.title}`}
                          className="relative h-[3px] flex-1 cursor-pointer overflow-hidden rounded-full bg-black/20"
                        >
                          <span
                            className="absolute inset-y-0 left-0 rounded-full bg-white"
                            style={
                              i < active
                                ? { width: "100%" }
                                : i === active
                                ? {
                                    width: "100%",
                                    transformOrigin: "left",
                                    animation: `demoProgressFill ${AUTOPLAY_MS}ms linear forwards`,
                                    animationPlayState: autoplay ? "running" : "paused",
                                  }
                                : { width: "0%" }
                            }
                          />
                        </button>
                      ))}
                    </div>

                    {/* Dynamic island */}
                    <div className="absolute left-1/2 top-1.5 z-40 h-[12px] w-[44px] -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />

                    {/* Screen: remount on change to replay the demo animation */}
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, scale: 0.985 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="relative h-[530px] sm:h-[572px]"
                    >
                      <ScreenWithStatusBar step={SCREENS[active].render} scroll={SCREENS[active].scroll} reduced={prefersReducedMotion} />
                    </motion.div>

                    {/* Glass reflection — makes the device read as real filmed glass */}
                    <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-br from-white/[0.13] via-white/[0.02] to-transparent" aria-hidden="true" />
                    <div className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/2 -skew-x-[18deg] bg-gradient-to-r from-white/[0.09] via-white/[0.04] to-transparent" aria-hidden="true" />
                    <div className="pointer-events-none absolute inset-0 z-30 rounded-[2.3rem] shadow-[inset_0_0_26px_rgba(0,0,0,0.09)] ring-1 ring-inset ring-black/[0.05]" aria-hidden="true" />
                  </div>

                  {/* Speaker */}
                  <div className="absolute left-1/2 top-[18px] z-40 hidden h-[3px] w-14 -translate-x-1/2 rounded-full bg-white/30 sm:block" aria-hidden="true" />
                </div>

                {/* Real hand driving the swipe — it enters, scrolls the content
                    for ~4s with the fingertip locked to the row it started on,
                    then lifts off and disappears until the next screen, like
                    live activity. */}
                <AnimatePresence>
                  {autoplay && SCREENS[active].scrollable && (
                    <motion.div
                      key={`demo-hand-${active}`}
                      initial={{ opacity: 0, y: 26, scale: 0.95 }}
                      animate={{
                        opacity: [0, 1, 1, 1, 0],
                        y: [26, 0, 0, -SCREENS[active].scroll, -SCREENS[active].scroll - 12],
                        scale: [0.95, 1, 1, 1, 0.98],
                      }}
                      transition={{ duration: 5, times: [0, 0.07, 0.09, 0.86, 0.94], ease: ["easeOut", "linear", "easeInOut", "easeIn"] }}
                      exit={{ opacity: 0, y: -16, transition: { duration: 0.35, ease: "easeIn" } }}
                      className="absolute right-[-70px] bottom-[-40px] z-40 w-[230px] pointer-events-none select-none"
                      aria-hidden="true"
                    >
                      <div className="relative">
                        {/* Fingertip contact light on the glass — synced to the swipe */}
                        <span className="demo-contact-glow absolute left-[9%] top-[2%] h-5 w-5 rounded-full bg-emerald-500/35 blur-[6px]" aria-hidden="true" />
                        <img
                          src="/images/demo-hand-african.png"
                          alt=""
                          draggable={false}
                          className="w-full drop-shadow-[0_22px_30px_rgba(0,0,0,0.45)]"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Walkthrough panel ── */}
            <div className="max-w-xl lg:mx-0 mx-auto w-full">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">Live walkthrough · real screens</p>
              </div>

              <h3 className="font-display mt-4 text-2xl sm:text-3xl font-medium text-white [text-wrap:balance]">
                See the real product in motion — landlord and tenant, side by side.
              </h3>
              <p className="text-sm text-white/55 mt-3 leading-relaxed">
                No renders, no mockups: this is the actual RentManager dashboard and tenant portal, playing through
                the workflows your business runs every day.
              </p>

              <div className="mt-7 space-y-2.5">
                {DEMO_STEPS.map((step, i) => {
                  const isActive = i === active;
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.title}
                      type="button"
                      onClick={() => goTo(i)}
                      className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 ${
                        isActive
                          ? "border-emerald-500/40 bg-emerald-500/[0.07] shadow-lg shadow-emerald-500/10"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[0.06] text-white/50 group-hover:text-white/80"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold ${isActive ? "text-emerald-300" : "text-white/80"}`}>
                          <span className="font-normal text-white/40">{i + 1}.</span> {step.title}
                        </p>
                        <p className="text-[11px] text-white/45 mt-0.5 truncate sm:whitespace-normal">{step.caption}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[8px] font-semibold uppercase tracking-wider text-white/40">
                        {step.tag}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Playback controls */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => goTo(active - 1)}
                  aria-label="Previous screen"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  onClick={() => setPlaying((p) => !p)}
                  aria-label={playing ? "Pause demo" : "Play demo"}
                  className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-white/70 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  {playing ? <Pause className="h-3.5 w-3.5" strokeWidth={2} /> : <Play className="h-3.5 w-3.5" strokeWidth={2} />}
                  {playing ? "Pause" : "Play"}
                </button>
                <span className="text-[11px] font-medium text-white/40">
                  Screen {active + 1} of {SCREENS.length}
                </span>
              </div>

              <div className="mt-8 border-t border-white/10 pt-7">
                <Button href="/public/sign-up?intent=landlord" variant="primary" size="lg">
                  Create a free landlord account
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                </Button>
                <p className="text-xs text-white/40 mt-3">No credit card · Free to list · Cancel anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScreenWithStatusBar({ step: Screen, scroll, reduced }: { step: DemoScreen; scroll: number; reduced: boolean }) {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="relative z-10 shrink-0 bg-white">
        <StatusBar />
      </div>
      <div className="relative min-h-0 flex-1">
        <Screen reduced={reduced} scrollY={scroll} />
      </div>
    </div>
  );
}