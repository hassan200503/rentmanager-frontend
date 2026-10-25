import { useQuery } from "@tanstack/react-query";
import { propertyApi } from "../api/property-api";
import { PropertyStatus } from "../types/property";
import { unitApi } from "@/features/unit/api/unit-api";

export interface PropertyDashboardMetrics {
    totalProperties: number;
    activeProperties: number;
    underMaintenance: number;
    draft: number;
    archived: number;

    /** Units across the portfolio, from the server-side aggregate. */
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;

    /**
     * Occupied units as a percentage of all units, or null when there are no
     * units to divide by.
     *
     * <p>This used to be {@code fullyOccupied / activeProperties} — a count of
     * *properties* whose occupancyStatus was FULLY_OCCUPIED, divided by the
     * number of active properties. A 40-unit block with 39 tenants counted as
     * zero, because the block was only PARTIALLY_OCCUPIED. The figure was also
     * computed from a single page of results, so a landlord past the first
     * page had it silently truncated.
     *
     * <p>It now comes from GET /units/summary, which counts units in SQL.
     */
    occupancyRate: number | null;
}

// Local key namespace, deliberately not touching an assumed `property-keys.ts`
// used elsewhere (referenced by the activate/archive mutations but not seen
// directly) to avoid guessing at its shape. Safe to fold in later.
const dashboardKeys = {
    total: (tenantId?: string) => ["properties", "dashboard", "total", tenantId] as const,
    byStatus: (status: PropertyStatus, tenantId?: string) =>
        ["properties", "dashboard", "status", status, tenantId] as const,
};

export function usePropertyDashboardMetrics(tenantId: string | undefined) {
    const enabled = Boolean(tenantId);

    const totalQuery = useQuery({
        queryKey: dashboardKeys.total(tenantId),
        queryFn: () => propertyApi.list({ page: 0, size: 1 }),
        enabled,
    });

    const activeQuery = useQuery({
        queryKey: dashboardKeys.byStatus(PropertyStatus.ACTIVE, tenantId),
        // size: 1 — only totalElements is used. This previously fetched a full
        // unpaginated page so it could count occupancy in the browser, which
        // was both the wrong calculation and an unbounded transfer.
        queryFn: () => propertyApi.list({ page: 0, size: 1, status: PropertyStatus.ACTIVE }),
        enabled,
    });

    // One SQL aggregate for occupancy, replacing an in-browser count over a
    // truncated page of properties.
    const unitSummaryQuery = useQuery({
        queryKey: ["units", "summary", tenantId] as const,
        queryFn: () => unitApi.getSummary(),
        enabled,
    });

    const maintenanceQuery = useQuery({
        queryKey: dashboardKeys.byStatus(PropertyStatus.UNDER_MAINTENANCE, tenantId),
        queryFn: () => propertyApi.list({ status: PropertyStatus.UNDER_MAINTENANCE }),
        enabled,
    });

    const draftQuery = useQuery({
        queryKey: dashboardKeys.byStatus(PropertyStatus.DRAFT, tenantId),
        queryFn: () => propertyApi.list({ status: PropertyStatus.DRAFT }),
        enabled,
    });

    const archivedQuery = useQuery({
        queryKey: dashboardKeys.byStatus(PropertyStatus.ARCHIVED, tenantId),
        queryFn: () => propertyApi.list({ status: PropertyStatus.ARCHIVED }),
        enabled,
    });

    const isLoading =
        unitSummaryQuery.isLoading ||
        totalQuery.isLoading ||
        activeQuery.isLoading ||
        maintenanceQuery.isLoading ||
        draftQuery.isLoading ||
        archivedQuery.isLoading;

    const isError =
        unitSummaryQuery.isError ||
        totalQuery.isError ||
        activeQuery.isError ||
        maintenanceQuery.isError ||
        draftQuery.isError ||
        archivedQuery.isError;

    const units = unitSummaryQuery.data;
    const totalUnits = units?.totalUnits ?? 0;

    const metrics: PropertyDashboardMetrics = {
        totalProperties: totalQuery.data?.totalElements ?? 0,
        activeProperties: activeQuery.data?.totalElements ?? 0,
        underMaintenance: maintenanceQuery.data?.totalElements ?? 0,
        draft: draftQuery.data?.totalElements ?? 0,
        archived: archivedQuery.data?.totalElements ?? 0,

        totalUnits,
        occupiedUnits: units?.occupiedUnits ?? 0,
        vacantUnits: units?.vacantUnits ?? 0,

        // null, not 0: a landlord with no units yet has no occupancy rate,
        // and showing them "0% occupied" reads as a failure rather than an
        // empty portfolio.
        occupancyRate:
            units && totalUnits > 0
                ? Math.round((units.occupiedUnits / totalUnits) * 100)
                : null,
    };

    const refetch = () => {
        return Promise.all([
            totalQuery.refetch(),
            unitSummaryQuery.refetch(),
            activeQuery.refetch(),
            maintenanceQuery.refetch(),
            draftQuery.refetch(),
            archivedQuery.refetch(),
        ]);
    };

    return { metrics, isLoading, isError, refetch };
}