"use client";

import { useRouter } from "next/navigation";
import { useUnitsQuery } from "../queries/use-units-query";
import { UnitStatusBadge } from "./unit-status-badge";
import { UnitFilterState } from "../hooks/use-unit-filters";
import { UnitResponse } from "../types/unit-request";

type UnitTableProps = {
  propertyId: string;
  params: UnitFilterState;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);

export const UnitTable = ({ propertyId, params }: UnitTableProps) => {
  const { data, isLoading, error } = useUnitsQuery({ propertyId, ...params });
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-gray-600">Loading units...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-danger">
        Failed to load units.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Unit
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Status
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Monthly Rent
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Beds
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Baths
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Sq Ft
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {data?.content?.map((u: UnitResponse) => (
            <tr
              key={u.unitId}
              className="border-b border-gray-200 hover:bg-gray-50 transition"
            >
              <td className="p-3 text-sm font-medium text-gray-800">
                {u.unitNumber}
              </td>
              <td className="p-3">
                <UnitStatusBadge status={u.status} />
              </td>
              <td className="p-3 text-sm text-gray-800">
                {formatCurrency(u.monthlyRent)}
              </td>
              <td className="p-3 text-sm text-gray-800">{u.bedrooms}</td>
              <td className="p-3 text-sm text-gray-800">{u.bathrooms}</td>
              <td className="p-3 text-sm text-gray-800">
                {u.squareFootage ? `${u.squareFootage} ft²` : "—"}
              </td>
              <td className="p-3 text-right">
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/properties/${propertyId}/units/${u.unitId}`
                      )
                    }
                    className="btn-primary text-sm px-3 py-2 rounded"
                  >
                    View
                  </button>
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/properties/${propertyId}/units/${u.unitId}/edit`
                      )
                    }
                    className="btn-secondary text-sm px-3 py-2 rounded"
                  >
                    Edit
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {data?.empty && (
            <tr>
              <td
                colSpan={7}
                className="py-12 text-center text-sm text-gray-500"
              >
                <div className="space-y-2">
                  <p className="font-medium text-gray-600">No units found</p>
                  <p className="text-gray-400">
                    Add your first unit to get started.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
