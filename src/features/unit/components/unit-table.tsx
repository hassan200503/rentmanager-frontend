"use client";

import { useRouter } from "next/navigation";
import { useUnitsQuery } from "../queries/use-units-query";
import { UnitStatusBadge } from "./unit-status-badge";
import { DEFAULT_UNIT_FILTERS, UnitFilterState } from "../hooks/use-unit-filters";
import { UnitResponse } from "../types/unit-request";
import { useUnitLifecycle } from "../hooks/use-unit-lifecycle";
import { UnitStatus } from "../types/unit";

type UnitTableProps = {
  propertyId: string;
  params?: Partial<UnitFilterState>;
};

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(amount);

export const UnitTable = ({ propertyId, params }: UnitTableProps) => {
  const filters: UnitFilterState = { ...DEFAULT_UNIT_FILTERS, ...params };
  const { data, isLoading, error } = useUnitsQuery({ propertyId, ...filters });
  const router = useRouter();
  const { activateUnit, deactivateUnit, isActivating, isDeactivating } =
      useUnitLifecycle();

  if (isLoading) {
    return (
        <div className="overflow-hidden rounded-2xl border border-ink/[0.08]">
          <div className="skeleton h-10 w-full rounded-none" />
          {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-14 w-full rounded-none border-t border-ink/[0.06]" />
          ))}
        </div>
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
      <div className="overflow-x-auto rounded-2xl border border-ink/[0.08]">
        <table className="min-w-full bg-surface">
          <thead className="bg-ink/[0.02]">
          <tr>
            <th className="p-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">
              Unit
            </th>
            <th className="p-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">
              Status
            </th>
            <th className="p-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">
              Rent amount
            </th>
            <th className="p-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">
              Floor
            </th>
            <th className="p-3 text-left text-xs font-medium text-ink-muted uppercase tracking-wide">
              Occupancy
            </th>
            <th className="p-3 text-right text-xs font-medium text-ink-muted uppercase tracking-wide">
              Actions
            </th>
          </tr>
          </thead>

          <tbody>
          {data?.content?.map((u: UnitResponse) => {
            const canActivate = u.status === UnitStatus.INACTIVE;
            const canDeactivate = u.status === UnitStatus.ACTIVE;

            return (
                <tr
                    key={u.id}
                    className="border-t border-ink/[0.06] hover:bg-ink/[0.02] transition-colors"
                >
                  <td className="p-3 text-sm font-medium text-ink">
                    {u.label || u.unitNumber}
                    {u.label && (
                        <span className="ml-1.5 text-xs text-ink-muted font-normal">{u.unitNumber}</span>
                    )}
                  </td>
                  <td className="p-3">
                    <UnitStatusBadge status={u.status} />
                  </td>
                  <td className="p-3 font-data text-sm text-ink">
                    {formatCurrency(u.rentAmount)}
                  </td>
                  <td className="p-3 text-sm text-ink-muted">
                    {u.floor ?? "—"}
                  </td>
                  <td className="p-3 text-sm text-ink-muted">
                    {u.occupancyStatus}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-2 justify-end flex-wrap">
                      {canActivate && (
                          <button
                              onClick={() => activateUnit(u.id)}
                              disabled={isActivating}
                              className="btn-success text-xs px-3 py-1.5 disabled:opacity-50"
                          >
                            {isActivating ? "Activating…" : "Activate"}
                          </button>
                      )}
                      {canDeactivate && (
                          <button
                              onClick={() => deactivateUnit(u.id)}
                              disabled={isDeactivating}
                              className="btn-danger text-xs px-3 py-1.5 disabled:opacity-50"
                          >
                            {isDeactivating ? "Deactivating…" : "Deactivate"}
                          </button>
                      )}
                      <button
                          onClick={() =>
                              router.push(
                                  `/dashboard/properties/${propertyId}/units/${u.id}`
                              )
                          }
                          className="btn-primary text-xs px-3 py-1.5"
                      >
                        View
                      </button>
                      <button
                          onClick={() =>
                              router.push(
                                  `/dashboard/properties/${propertyId}/units/${u.id}/edit`
                              )
                          }
                          className="btn-secondary text-xs px-3 py-1.5"
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
                <td colSpan={6} className="py-12 text-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-ink">No units found</p>
                    <p className="text-sm text-ink-muted">
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