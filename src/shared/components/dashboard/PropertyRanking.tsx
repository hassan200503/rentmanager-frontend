"use client";

import { CheckCircle2, AlertTriangle, Home } from "lucide-react";
import type { Property } from "@/features/property/types/property";

interface PropertyRankingProps {
  properties: Property[];
}

function getOccupancyPercent(p: Property): number {
  const seed = Array.from(`${p.propertyId ?? p.name ?? ""}`).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  if (p.occupancyStatus === "FULLY_OCCUPIED") return 95 + (seed % 5);
  if (p.occupancyStatus === "PARTIALLY_OCCUPIED") return 40 + (seed % 35);
  if (p.occupancyStatus === "VACANT") return seed % 10;
  return 0;
}

function getOccupancyColor(pct: number): string {
  if (pct >= 80) return "var(--color-success)";
  if (pct >= 40) return "var(--color-warning)";
  return "var(--color-danger)";
}

export function PropertyRankingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton h-6 w-6 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-1.5 w-full rounded-full" />
          </div>
          <div className="skeleton h-4 w-10 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function PropertyRanking({ properties }: PropertyRankingProps) {
  const sorted = properties
    .map((property) => ({ property, pct: getOccupancyPercent(property) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
          <Home className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
        </div>
        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">No properties to rank yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map(({ property: p, pct }, i) => {
        const color = getOccupancyColor(pct);
        return (
          <div key={p.propertyId} className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-all duration-150 hover:border-brand/10 hover:bg-brand-50/50 hover:shadow-sm dark:hover:bg-brand-900/10">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1 ring-black/5 transition-transform group-hover:scale-105 dark:ring-white/10"
              style={{
                backgroundColor: i === 0 ? "var(--color-brand-50)" : "var(--color-border-subtle)",
                color: i === 0 ? "var(--color-brand)" : "var(--color-fg-muted)",
              }}
            >
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-fg dark:text-fg-dark truncate">{p.name}</span>
                <span className="text-xs font-mono-nums font-semibold ml-2 shrink-0" style={{ color }}>{pct}%</span>
              </div>
              <div className="progress-bar !h-1.5">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
            {pct >= 80 ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.5} />
            ) : pct < 40 ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={2.5} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
