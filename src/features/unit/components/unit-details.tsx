"use client";

import Image from "next/image";
import { Unit, UnitStatus } from "../types/unit";

type UnitDetailsProps = {
    unit: Unit;
};


const statusClasses: Partial<Record<UnitStatus, string>> = {
 [UnitStatus.VACANT]:
        "bg-green-100 text-green-700 border border-green-200",
    [UnitStatus.OCCUPIED]:
        "bg-blue-100 text-blue-700 border border-blue-200",
    [UnitStatus.MAINTENANCE]:
        "bg-amber-100 text-amber-700 border border-amber-200",
};

export function UnitDetails({ unit }: UnitDetailsProps) {


    return ( <div className="space-y-6">
        {/* Image */}
        {unit.imageUrl && ( <div className="overflow-hidden rounded-xl border border-gray-200 bg-white"> <div className="relative h-72 w-full">
                <Image
                    src={unit.imageUrl}
                    alt={`Unit ${unit.unitNumber}`}
                    fill
                    className="object-cover"
                /> </div> </div>
        )}

        ```
        {/* Header */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Unit {unit.unitNumber}
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Property Unit Details
                    </p>
                </div>

                <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${
                        statusClasses[unit.status] ??
                        "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                >
  {unit.status.charAt(0) + unit.status.slice(1).toLowerCase()}
</span>



            </div>
        </div>

        {/* Pricing */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Pricing
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <p className="text-sm text-gray-500">Monthly Rent</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                        KES {unit.monthlyRent.toLocaleString()}
                    </p>
                </div>

                <div>
                    <p className="text-sm text-gray-500">Deposit Amount</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">
                        KES {unit.depositAmount.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>

        {/* Configuration */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Configuration
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
                <div>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                        {unit.bedrooms}
                    </p>
                </div>

                <div>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                        {unit.bathrooms}
                    </p>
                </div>

                <div>
                    <p className="text-sm text-gray-500">Square Footage</p>
                    <p className="mt-1 text-lg font-medium text-gray-900">
                        {unit.squareFootage ?? "-"}
                    </p>
                </div>
            </div>
        </div>

        {/* Description */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Description
            </h2>

            <p className="whitespace-pre-wrap text-gray-700">
                {unit.description?.trim() || "No description provided."}
            </p>
        </div>

        {/* Metadata */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Metadata
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
                <div>
                    <p className="text-sm text-gray-500">Created At</p>
                    <p className="mt-1 text-gray-900">
                        {new Date(unit.createdAt).toLocaleString()}
                    </p>
                </div>

                <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="mt-1 text-gray-900">
                        {new Date(unit.updatedAt).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    </div>

);
}
