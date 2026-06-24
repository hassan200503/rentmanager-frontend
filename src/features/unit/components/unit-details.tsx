"use client";

import { Unit, UnitStatus } from "../types/unit";

type UnitDetailsProps = {
    unit: Unit;
};

const statusClasses: Record<string, string> = {
    [UnitStatus.INACTIVE]: "bg-gray-100 text-gray-700 border border-gray-200",
    [UnitStatus.ACTIVE]: "bg-green-100 text-green-700 border border-green-200",
    [UnitStatus.ARCHIVED]: "bg-red-100 text-red-700 border border-red-200",
};

export function UnitDetails({ unit }: UnitDetailsProps) {
    return (
        <div className="space-y-6">
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
                <div className="grid gap-6 md:grid-cols-1">
                    <div>
                        <p className="text-sm text-gray-500">Rent Amount</p>
                        <p className="mt-1 text-xl font-semibold text-gray-900">
                            KES {unit.rentAmount != null ? unit.rentAmount.toLocaleString() : "—"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Configuration */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Configuration
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <p className="text-sm text-gray-500">Floor</p>
                        <p className="mt-1 text-lg font-medium text-gray-900">
                            {unit.floor ?? "—"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Occupancy Status</p>
                        <p className="mt-1 text-lg font-medium text-gray-900">
                            {unit.occupancyStatus}
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
        </div>
    );
}