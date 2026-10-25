"use client";

import { AnimatedCounter } from "./AnimatedCounter";
import { SectionHeader } from "./SectionHeader";

export function StatsSection({
  totalProperties,
  totalUnits,
  cityCount,
}: {
  /** null when the listings API has not answered or failed. */
  totalProperties: number | null;
  /** null when the listings API has not answered or failed. */
  totalUnits: number | null;
  cityCount: number;
}) {
  // Counts we do not have are dropped from the grid rather than animated up
  // to zero. This section is titled "RentManager in data" and described as
  // "live counts" — counting to 0 under that heading tells a visitor the
  // platform is empty, when what actually happened is that a request failed.
  //
  // The hero above had the opposite bug (it rendered Math.max(1, count), so
  // a failure showed "1"), which meant a single outage could put "1" and "0"
  // on the same page describing the same thing.
  const liveStats = [
    { end: totalProperties, suffix: "", label: "Properties Listed" },
    { end: totalUnits, suffix: "", label: "Available Units" },
    { end: cityCount, suffix: "", label: "Regions Showcased" },
  ].filter((stat): stat is { end: number; suffix: string; label: string } =>
    stat.end !== null && stat.end > 0
  );

  const stats = [
    ...liveStats,
    // Not a live count — a standing fact about how the platform charges, and
    // true whether or not the listings API answered.
    { end: 0, suffix: " KES", label: "Broker Fees Charged" },
  ];

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-b from-jade-500/[0.05] via-transparent to-jade-500/[0.05] pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="By the numbers"
          title="RentManager in data"
          description="Live counts of what's currently listed and available on the platform."
        />
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {stats.map((stat) => (
            <div key={stat.label}>
              <AnimatedCounter end={stat.end} suffix={stat.suffix} label={stat.label} />
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}