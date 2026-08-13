"use client";

import { Home } from "lucide-react";
import { OccupancyStatus, PropertyStatus } from "@/features/property/types/property";
import type { Property } from "@/features/property/types/property";
import OccupancyDonut from "./OccupancyDonut";

interface OccupancyMixChartProps {
  properties: Property[];
  isLoading?: boolean;
}

function OccupancyMixSkeleton() {
  return (
    <div className="flex items-center gap-5">
      <div className="skeleton h-32 w-32 rounded-full shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="skeleton h-3.5 w-28 rounded" />
        <div className="skeleton h-3.5 w-24 rounded" />
        <div className="skeleton h-3.5 w-20 rounded" />
      </div>
    </div>
  );
}

function OccupancyEmpty() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-border-subtle dark:bg-border-subtle-dark">
        <Home className="h-5 w-5 text-fg-muted dark:text-fg-muted-dark" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-fg dark:text-fg-dark mb-1">No active properties</p>
      <p className="max-w-[16rem] text-xs text-fg-muted dark:text-fg-muted-dark">
        Activate a property to start tracking occupancy mix across your portfolio.
      </p>
    </div>
  );
}

export default function OccupancyMixChart({ properties, isLoading }: OccupancyMixChartProps) {
  if (isLoading) return <OccupancyMixSkeleton />;

  const active = properties.filter((p) => p.status === PropertyStatus.ACTIVE);
  const fullyOccupied = active.filter((p) => p.occupancyStatus === OccupancyStatus.FULLY_OCCUPIED).length;
  const vacant = active.filter((p) => p.occupancyStatus === OccupancyStatus.VACANT).length;

  if (active.length === 0) return <OccupancyEmpty />;

  return (
    <div className="flex h-full items-center justify-center">
      <div className="rounded-3xl p-5 ring-1 ring-black/5 shadow-inner bg-gradient-to-br from-border-subtle/70 via-transparent to-transparent dark:from-border-subtle-dark/40 dark:ring-white/5">
        <OccupancyDonut
          fullyOccupied={fullyOccupied}
          vacant={vacant}
          activeProperties={active.length}
        />
      </div>
    </div>
  );
}