"use client";

import Link from "next/link";
import { Landmark, Plus, Building } from "lucide-react";
import { PropertyStatus } from "@/features/property/types/property";
import type { Property } from "@/features/property/types/property";
import { typeStyle, typeLabel } from "./property-type-meta";

interface PropertyDistributionChartProps {
  properties: Property[];
  isLoading?: boolean;
}

const MAX_ROWS = 6;

function DistributionSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="skeleton h-7 w-7 rounded-lg shrink-0" />
            <div className="skeleton h-3.5 w-24 rounded" />
            <div className="skeleton h-3.5 w-8 rounded ml-auto" />
          </div>
          <div className="skeleton h-1 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function PropertyDistributionChart({ properties, isLoading }: PropertyDistributionChartProps) {
  if (isLoading) return <DistributionSkeleton />;

  const live = properties.filter(
    (p) => p.status !== PropertyStatus.DRAFT && p.status !== PropertyStatus.ARCHIVED
  );

  const counts = new Map<string, number>();
  for (const p of live) {
    const key = String(p.propertyType ?? "UNKNOWN").toUpperCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
          <Landmark className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.75} />
        </div>
        <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No properties yet</p>
        <p className="max-w-[16rem] text-xs text-fg-muted dark:text-fg-muted-dark mb-4">
          Add properties to see your portfolio mix by type.
        </p>
        <Link
          href="/dashboard/properties/create"
          className="btn-secondary inline-flex items-center gap-1.5 !text-xs !py-2 !px-3"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Add property
        </Link>
      </div>
    );
  }

  const total = live.length;
  const top = sorted.slice(0, MAX_ROWS);
  const others = sorted.slice(MAX_ROWS).reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-3.5">
      {top.map(([type, count]) => {
        const { icon: Icon, color } = typeStyle(type);
        const pct = Math.round((count / total) * 100);
        return (
          <div key={type} className="group">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5 transition-transform group-hover:scale-105 dark:ring-white/10"
                style={{ backgroundColor: `${color}14`, color }}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-fg dark:text-fg-dark">
                {typeLabel(type)}
              </span>
              <span className="font-mono-nums text-xs font-bold text-fg dark:text-fg-dark">{count}</span>
              <span className="w-9 text-right font-mono-nums text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
                {pct}%
              </span>
            </div>
            <div className="ml-9.5 mt-1.5 h-1 w-auto overflow-hidden rounded-full bg-border-subtle dark:bg-border-subtle-dark">
              <div
                className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}

      {others > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-surface/60 px-3 py-2 text-xs shadow-sm dark:border-border-dark/60 dark:bg-surface-dark/60">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-black/5 dark:ring-white/10">
            <Building className="h-3.5 w-3.5 text-fg-subtle dark:text-fg-subtle-dark" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1 truncate font-medium text-fg-muted dark:text-fg-muted-dark">
            Other types
          </span>
          <span className="font-mono-nums text-xs font-bold text-fg dark:text-fg-dark">{others}</span>
          <span className="w-9 text-right font-mono-nums text-[10px] text-fg-subtle dark:text-fg-subtle-dark">
            {Math.round((others / total) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}