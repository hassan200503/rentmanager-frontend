"use client";

import { useRouter } from "next/navigation";

import { PropertyTable } from "@/features/property/components/property-table";
import { PropertyFilters } from "@/features/property/components/property-filters";

import {
  PropertyFilterState,
  usePropertyFilters,
} from "@/features/property/hooks/use-property-filters";

export default function PropertiesPage() {
  const router = useRouter();

  const { filters, updateFilter } = usePropertyFilters();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Properties
          </h1>
          <p className="text-sm text-gray-500">
            Manage your property portfolio
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/properties/create")}
          className="btn-primary"
        >
          New Property
        </button>
      </div>

      {/* Filters */}
      <PropertyFilters
        onChange={(patch: Partial<PropertyFilterState>) =>
          updateFilter(patch)
        }
      />

      {/* Table */}
      <PropertyTable params={filters} />
    </div>
  );
}
