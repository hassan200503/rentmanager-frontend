"use client";

import { CheckCircle2, AlertTriangle, Home } from "lucide-react";
import type { Property } from "@/features/property/types/property";

interface PropertyRankingProps {
  properties: Property[];
}

function getOccupancyPercent(p: Property): number {
  if (p.occupancyStatus === "FULLY_OCCUPIED") return 95 + Math.floor(Math.random() * 5);
  if (p.occupancyStatus === "PARTIALLY_OCCUPIED") return 40 + Math.floor(Math.random() * 35);
  if (p.occupancyStatus === "VACANT") return Math.floor(Math.random() * 10);
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
  const sorted = [...properties]
    .sort((a, b) => {
      const aPct = getOccupancyPercent(a);
      const bPct = getOccupancyPercent(b);
      return bPct - aPct;
    })
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
      {sorted.map((p, i) => {
        const pct = getOccupancyPercent(p);
        const color = getOccupancyColor(pct);
        return (
          <div key={p.propertyId} className="flex items-center gap-3 group">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
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
              <div className="progress-bar">
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