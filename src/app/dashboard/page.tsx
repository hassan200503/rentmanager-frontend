"use client";

import Link from "next/link";
import { usePropertiesQuery } from "@/features/property/queries/use-properties-query";

import {useUnitSummaryQuery} from "@/features/unit/hooks/use-unit-summary-query";

function StatCard({
                      label,
                      value,
                      isLoading,
                  }: {
    label: string;
    value: number | string;
    isLoading: boolean;
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
                {isLoading ? "—" : value}
            </p>
        </div>
    );
}

export default function DashboardHomePage() {
    const { data: propertiesData, isLoading: propertiesLoading } =
        usePropertiesQuery({ page: 0, size: 1 });

    const { data: unitSummary, isLoading: unitsLoading } = useUnitSummaryQuery();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
                <p className="text-sm text-gray-500">
                    A snapshot of your property portfolio
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Properties"
                    value={propertiesData?.totalElements ?? 0}
                    isLoading={propertiesLoading}
                />
                <StatCard
                    label="Total units"
                    value={unitSummary?.totalUnits ?? 0}
                    isLoading={unitsLoading}
                />
                <StatCard
                    label="Vacant units"
                    value={unitSummary?.vacantUnits ?? 0}
                    isLoading={unitsLoading}
                />
                <StatCard
                    label="Occupied units"
                    value={unitSummary?.occupiedUnits ?? 0}
                    isLoading={unitsLoading}
                />
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                    Quick actions
                </h2>
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/dashboard/properties"
                        className="btn-primary px-4 py-2 rounded-md text-sm"
                    >
                        View properties
                    </Link>
                    <Link
                        href="/dashboard/properties/create"
                        className="btn-secondary px-4 py-2 rounded-md text-sm"
                    >
                        Add a property
                    </Link>
                </div>
            </div>
        </div>
    );
}