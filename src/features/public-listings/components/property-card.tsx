"use client";

import Link from "next/link";
import { PublicPropertyResponse } from "../types/public-property";

interface PropertyCardProps {
    property: PublicPropertyResponse;
}

export function PropertyCard({
                                 property,
                             }: PropertyCardProps) {
    return (
        <Link
            href={`/listings/${property.propertyId}`}
            className="block border rounded-lg p-4 hover:shadow-md transition"
        >
            <h3 className="text-lg font-semibold">
                {property.name}
            </h3>

            <p className="text-sm text-gray-600">
                {property.propertyType}
            </p>

            {property.description && (
                <p className="mt-2 text-sm">
                    {property.description}
                </p>
            )}
        </Link>
    );
}