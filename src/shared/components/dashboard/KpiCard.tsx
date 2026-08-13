"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { ElementType, CSSProperties } from "react";

interface KpiCardProps {
  icon: ElementType;
  label: string;
  value: string | number;
  trend?: { value: number; positive: boolean };
  subtitle?: string;
  badge?: { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" | "emerald" };
  sparklineData?: number[];
  iconColor?: string;
  iconBg?: string;
}

function MiniSparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 72;
  const h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const color = data[data.length - 1] >= data[0] ? "var(--color-success)" : "var(--color-danger)";
  const gradientId = `sparkline-${data.join("").slice(0, 8)}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.12} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={`M${points} L${w},${h} L0,${h} Z`}
        fill={`url(#${gradientId})`}
      />
      <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="card-elevated">
      <div className="flex items-start justify-between mb-3">
        <div className="skeleton h-10 w-10 rounded-xl" />
      </div>
      <div className="skeleton h-3 w-20 mb-2" />
      <div className="skeleton h-9 w-28 mb-2" />
      <div className="skeleton h-3 w-32" />
    </div>
  );
}

export default function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  subtitle,
  badge,
  sparklineData,
  iconColor,
  iconBg,
}: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, "")) || 0;
  const isFormatted = typeof value === "string" && /[%£$€KES]/.test(String(value));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now();
          const duration = 800;
          const from = 0;
          const to = numericValue;
          const raf = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplayValue(Math.round(from + (to - from) * eased));
            if (t < 1) requestAnimationFrame(raf);
          };
          requestAnimationFrame(raf);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [numericValue]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="card-elevated kpi-card-premium group cursor-default min-h-[10rem] !p-4 sm:!p-5"
    >
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-black/5 transition-all duration-200 group-hover:shadow-sm group-hover:scale-105 dark:ring-white/10"
          style={{ backgroundColor: iconBg || "var(--color-brand-50)", color: iconColor || "var(--color-brand)" } as CSSProperties}
        >
          {/* @ts-expect-error - React 19 ElementType inference issue */}
          <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} />
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className={`badge badge-${badge.variant} !text-[10px] !px-2 !py-0`}>
              <span className="status-badge-dot" />
              {badge.label}
            </span>
          )}
        </div>
      </div>
      <div className="relative z-10">
        <p className="kpi-label mb-2">{label}</p>
        <p className="kpi-value mb-2" aria-live="polite">
          {isFormatted ? value : displayValue.toLocaleString()}
        </p>
        <div className="flex min-h-6 items-center gap-2">
          {trend && (
            <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${trend.positive ? "bg-success-bg text-success dark:bg-success-bg-dark" : "bg-danger-bg text-danger dark:bg-danger-bg-dark"}`}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d={trend.positive ? "M5 1.5L8.5 7H1.5L5 1.5Z" : "M5 8.5L1.5 3H8.5L5 8.5Z"} fill="currentColor" />
              </svg>
              {trend.value}%
            </span>
          )}
          {subtitle && <span className="truncate text-xs text-fg-muted dark:text-fg-muted-dark">{subtitle}</span>}
          {sparklineData && !trend && (
            <span className="ml-auto">
              <MiniSparkline data={sparklineData} />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
