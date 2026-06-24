"use client";

import Link from "next/link";
import { PublicUnitResponse } from "../types/public-unit";

interface UnitCardProps {
    unit: PublicUnitResponse;
}

export function UnitCard({
                             unit,
                         }: UnitCardProps) {
    return (
        <Link
            href={`/units/${unit.id}`}
            className="block border rounded-lg p-4 hover:shadow-md transition"
        >
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                    {unit.unitNumber}
                </h3>

                <span className="text-sm">
                    {unit.occupancyStatus}
                </span>
            </div>

            {unit.description && (
                <p className="mt-2 text-sm">
                    {unit.description}
                </p>
            )}

            <p className="mt-3 font-medium">
                {unit.rentAmount}
            </p>
        </Link>
    );
}