// property-card.tsx
"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { PublicPropertyResponse } from "../types/public-property";

interface PropertyCardProps {
    property: PublicPropertyResponse;
}

export function PropertyCard({ property }: PropertyCardProps) {
    return (
        <Link
            href={`/listings/${property.propertyId}`}
            className="group card-interactive p-0 overflow-hidden block"
        >
            {property.images?.[0] ? (
                <img
                    src={property.images[0]}
                    alt={property.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
            ) : (
                <div className="w-full h-48 bg-ink/[0.04] flex flex-col items-center justify-center text-ink-muted gap-2">
                    <Home className="w-8 h-8" />
                    <span className="text-xs">No image available</span>
                </div>
            )}

            <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-ink leading-snug">
                        {property.name}
                    </h3>
                    {/* was bg-blue-50/text-blue-600 — no blue anywhere else in the token
                        system; mapped to pill-neutral, matching how UnitCard treats its
                        own non-status badges. */}
                    <span className="shrink-0 pill pill-neutral">
                        {property.propertyType}
                    </span>
                </div>

                {property.description && (
                    <p className="text-sm text-ink-muted line-clamp-2">
                        {property.description}
                    </p>
                )}
            </div>
        </Link>
    );
}