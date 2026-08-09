"use client";

import { AnimatedCounter } from "./AnimatedCounter";
import { SectionHeader } from "./SectionHeader";

export function StatsSection({
  totalProperties,
  totalUnits,
  cityCount,
}: {
  totalProperties: number;
  totalUnits: number;
  cityCount: number;
}) {
  const stats = [
    { end: totalProperties, suffix: "", label: "Properties Listed" },
    { end: totalUnits, suffix: "", label: "Available Units" },
    { end: cityCount, suffix: "", label: "Regions Showcased" },
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