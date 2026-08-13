"use client";

import Link from "next/link";
import { ChevronRight, Home, RefreshCw, AlertTriangle } from "lucide-react";
import type { PublicPropertyResponse } from "@/features/public-listings/types/public-property";
import { PropertyCard } from "./PropertyCard";

interface FeaturedPropertiesSectionProps {
  isLoading: boolean;
  isError: boolean;
  properties: PublicPropertyResponse[];
  onRetry: () => void;
}

export function FeaturedPropertiesSection({
  isLoading,
  isError,
  properties,
  onRetry,
}: FeaturedPropertiesSectionProps) {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-b from-jade-500/[0.04] via-transparent to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-jade-400">
              <span className="w-8 h-px bg-gradient-to-r from-transparent to-jade-500/60" aria-hidden="true" />
              Featured
              <span className="w-8 h-px bg-gradient-to-l from-transparent to-jade-500/60" aria-hidden="true" />
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white mt-4 [text-wrap:balance]">
              Available properties
            </h2>
            <p className="text-white/55 mt-4 text-base">Real listings from our platform, updated in real-time.</p>
          </div>
          <Link
            href="/listings"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-jade-400 hover:text-jade-300 transition-colors group shrink-0"
          >
            View all properties
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>

        {isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Loading properties" aria-live="polite">
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
        )}

        {isError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-10 text-center" role="alert">
            <AlertTriangle className="w-10 h-10 text-red-400/80 mx-auto mb-4" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-lg font-semibold text-white">We couldn&apos;t load properties right now</p>
            <p className="text-sm text-white/50 mt-2 max-w-md mx-auto">
              Our listing service is unreachable. Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 min-h-11 rounded-xl bg-jade-600 hover:bg-jade-500 text-sm font-semibold text-white transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-400"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && properties.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.slice(0, 4).map((property) => (
              <PropertyCard key={property.propertyId} property={property} />
            ))}
          </div>
        )}

        {!isLoading && !isError && properties.length === 0 && (
          <div className="text-center py-20">
            <Home className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1.25} aria-hidden="true" />
            <p className="text-lg font-semibold text-white/70">No properties available yet</p>
            <p className="text-sm text-white/40 mt-2">Check back soon for new listings.</p>
          </div>
        )}
      </div>
    </section>
  );
}