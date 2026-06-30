"use client";

import Link from "next/link";
import { PublicUnitResponse } from "../types/public-unit";

interface UnitCardProps {
    propertyId: string;
    unit: PublicUnitResponse;
}

export function UnitCard({ propertyId, unit }: UnitCardProps) {
    return (
        <div className="block border rounded-lg overflow-hidden hover:shadow-md transition bg-white">
            <Link href={`/listings/${propertyId}/${unit.id}`}>
                {unit.images?.[0] ? (
                    <img
                        src={unit.images[0]}
                        alt={`Unit ${unit.unitNumber}`}
                        className="w-full h-40 object-cover"
                    />
                ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                        No image
                    </div>
                )}

                <div className="p-4">
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
                </div>
            </Link>

            {/* Reserve button — outside the Link to avoid nested anchor */}
            <div className="px-4 pb-4">
                <Link
                    href={`/reserve/${unit.id}`}
                    className="block w-full text-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                >
                    Reserve this unit
                </Link>
            </div>
        </div>
    );
}