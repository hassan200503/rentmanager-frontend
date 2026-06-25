"use client";

import { PublicUnitResponse } from "../types/public-unit";
import { UnitCard } from "./unit-card";

interface UnitGridProps {
    units: PublicUnitResponse[];
}

export function UnitGrid({
                             units,
                         }: UnitGridProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
                <UnitCard
                    key={unit.id}
                    unit={unit} propertyId={""}                />
            ))}
        </div>
    );
}