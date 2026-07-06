"use client";

import { useRouter } from "next/navigation";
import { usePropertiesQuery } from "../queries/use-properties-query";
import { PropertyStatusBadge } from "./property-status-badge";
import { PropertyFilterState } from "../hooks/use-property-filters";
import { PropertyResponse } from "../types/property-response";
import { PropertyStatus } from "../types/property";
import { useActivateProperty } from "../hooks/use-activate-property";
import { useArchiveProperty } from "../hooks/use-archive-property";

type PropertyTableProps = {
  params: PropertyFilterState;
};

export const PropertyTable = ({ params }: PropertyTableProps) => {
  const { data, isLoading, error } = usePropertiesQuery(params);
  const router = useRouter();
  const { activateProperty, isLoading: isActivating } = useActivateProperty();
  const { archiveProperty, isLoading: isArchiving } = useArchiveProperty();

  if (isLoading) {
    return (
        <div className="p-4 text-sm text-gray-600">Loading properties...</div>
    );
  }

  if (error) {
    return (
        <div className="p-4 text-sm text-danger">
          Failed to load properties.
        </div>
    );
  }

  return (
      <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Name
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Type
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Status
            </th>
            <th className="p-3 text-left text-sm font-medium text-gray-700">
              Actions
            </th>
          </tr>
          </thead>

          <tbody>
          {data?.content?.map((p: PropertyResponse) => {
            const canActivate =
                p.status === PropertyStatus.DRAFT ||
                p.status === PropertyStatus.INACTIVE;
            const canDeactivate = p.status === PropertyStatus.ACTIVE;

            return (
                <tr
                    key={p.propertyId}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                >
                  <td className="p-3 text-sm text-gray-800">{p.name}</td>
                  <td className="p-3 text-sm text-gray-800">{p.propertyType}</td>
                  <td className="p-3">
                    <PropertyStatusBadge status={p.status} />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-2 justify-end flex-wrap">
                      {canActivate && (
                          <button
                              onClick={() => activateProperty(p.propertyId)}
                              disabled={isActivating}
                              className="btn-success text-sm px-3 py-2 rounded disabled:opacity-50"
                          >
                            {isActivating ? "Activating..." : "Activate"}
                          </button>
                      )}
                      {canDeactivate && (
                          <button
                              onClick={() => archiveProperty(p.propertyId)}
                              disabled={isArchiving}
                              className="btn-danger text-sm px-3 py-2 rounded disabled:opacity-50"
                          >
                            {isArchiving ? "Deactivating..." : "Deactivate"}
                          </button>
                      )}
                      <button
                          onClick={() => router.push(`/dashboard/properties/${p.propertyId}`)}
                          className="btn-primary text-sm px-3 py-2 rounded"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
            );
          })}

          {data?.empty && (
              <tr>
                <td
                    colSpan={4}
                    className="py-4 text-center text-sm text-gray-500"
                >
                  No properties found.
                </td>
              </tr>
          )}
          </tbody>
        </table>
      </div>
  );
};