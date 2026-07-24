"use client";

import { PublicPropertyResponse } from "../types/public-property";
import { PropertyCard } from "./property-card";

interface PropertyGridProps {
    properties: PublicPropertyResponse[];
}

export function PropertyGrid({
                                 properties,
                             }: PropertyGridProps) {
    return (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
                <PropertyCard
                    key={property.propertyId}
                    property={property}
                />
            ))}
        </div>
    );
}