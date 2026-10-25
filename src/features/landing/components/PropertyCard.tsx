"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Home, MapPin, ArrowUpRight, CalendarCheck } from "lucide-react";
import type { PublicPropertyResponse } from "@/features/public-listings/types/public-property";
import { useTilt } from "@/shared/hooks/use-tilt";
import { useMediaQuery } from "@/shared/hooks/use-media-query";

export function PropertyCard({ property }: { property: PublicPropertyResponse }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const image = property.images?.[0];
  const isDesktop = useMediaQuery("(min-width: 768px) and (hover: hover)");
  const { ref, style } = useTilt<HTMLAnchorElement>({ disabled: !isDesktop, maxTilt: 6, scale: 1.02 });

  return (
    <Link
      ref={ref}
      href={`/listings/${property.propertyId}`}
      style={isDesktop ? style : undefined}
      className="group block rounded-2xl overflow-hidden border border-white/15 bg-white/[0.06] backdrop-blur-sm transition-all duration-500 hover:border-jade-500/30 hover:shadow-2xl hover:shadow-jade-500/10 card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade-400"
    >
      <div className="relative overflow-hidden aspect-[4/3] bg-[#0a0f1c]">
        {image ? (
          <>
            <div
              className={`absolute inset-0 bg-[#0a0f1c] transition-opacity duration-500 ${
                imgLoaded ? "opacity-0" : "opacity-100"
              }`}
              aria-hidden="true"
            />
            <Image
              src={image}
              alt={property.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
              onLoad={() => setImgLoaded(true)}
              className={`object-cover transition-all duration-700 group-hover:scale-110 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-jade-900/20 to-blue-900/20 flex items-center justify-center">
            <Home className="w-10 h-10 text-white/20" strokeWidth={1.25} aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/80 via-transparent to-transparent" aria-hidden="true" />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-jade-500/20 text-jade-300 border border-jade-500/20 backdrop-blur-sm">
          {property.propertyType?.toLowerCase()}
        </span>
        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#030712]/75 backdrop-blur-md text-jade-300 border border-jade-400/40 shadow-lg shadow-black/30">
          {/* Was "Verified", shown on every card with nothing behind it.
              A property reaches this grid only while it has a unit with no
              active lease, which is what the word now says. */}
          <CalendarCheck className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden="true" />
          Vacant
        </span>
      </div>

      <div className="p-5 space-y-3">
        <h3 className="text-base font-semibold text-white group-hover:text-jade-300 transition-colors leading-snug">
          {property.name}
        </h3>
        {property.address?.city && (
          <div className="flex items-center gap-1.5 text-sm text-white/55">
            <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>
              {property.address.city}
              {property.address.state ? `, ${property.address.state}` : ""}
            </span>
          </div>
        )}
        {property.description && (
          <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">{property.description}</p>
        )}
        <div className="pt-2 flex items-center text-sm font-semibold text-jade-300 transition-colors group-hover:text-jade-400">
          <span>View details</span>
          <ArrowUpRight className="w-3.5 h-3.5 ml-1" strokeWidth={2} aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}