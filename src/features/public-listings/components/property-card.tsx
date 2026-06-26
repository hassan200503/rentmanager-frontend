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
            className="group block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
        >
            {property.images?.[0] ? (
                <img
                    src={property.images[0]}
                    alt={property.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
            ) : (
                <div className="w-full h-48 bg-gray-100 flex flex-col items-center justify-center text-gray-300 gap-2">
                    <Home className="w-8 h-8" />
                    <span className="text-xs">No image available</span>
                </div>
            )}

            <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900 leading-snug">
                        {property.name}
                    </h3>
                    <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        {property.propertyType}
                    </span>
                </div>

                {property.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                        {property.description}
                    </p>
                )}
            </div>
        </Link>
    );
}