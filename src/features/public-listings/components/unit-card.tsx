"use client";

import Link from "next/link";
import { PublicUnitResponse } from "../types/public-unit";

interface UnitCardProps {
    propertyId: string;
    unit: PublicUnitResponse;
}

export function UnitCard({ propertyId, unit }: UnitCardProps) {
    return (
        <Link
            href={`/listings/${propertyId}/${unit.id}`}
            className="block border rounded-lg p-4 hover:shadow-md transition"
        >
            <div className="flex items-center justify-between">
                <h4 className="font-semibold">Unit {unit.unitNumber}</h4>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                    Vacant
                </span>
            </div>

            <p className="mt-2 text-lg font-semibold">
                KES {unit.rentAmount.toLocaleString()}
                <span className="text-sm font-normal text-gray-500"> / month</span>
            </p>

            {unit.description && (
                <p className="mt-1 text-sm text-gray-600">{unit.description}</p>
            )}
        </Link>
    );
}