import { useQuery } from "@tanstack/react-query";
import { propertyApi } from "../api/property-api";
import { PropertyStatus, OccupancyStatus, Property } from "../types/property";

export interface PropertyDashboardMetrics {
    totalProperties: number;
    activeProperties: number;
    fullyOccupied: number;
    vacant: number;
    underMaintenance: number;
    draft: number;
    archived: number;
}

// Local key namespace, deliberately not touching an assumed `property-keys.ts`
// used elsewhere (referenced by the activate/archive mutations but not seen
// directly) to avoid guessing at its shape. Safe to fold in later.
const dashboardKeys = {
    total: (tenantId?: string) => ["properties", "dashboard", "total", tenantId] as const,
    byStatus: (status: PropertyStatus, tenantId?: string) =>
        ["properties", "dashboard", "status", status, tenantId] as const,
};

function countOccupancy(properties: Property[]) {
    let fullyOccupied = 0;
    let vacant = 0;
    for (const p of properties) {
        if (p.occupancyStatus === OccupancyStatus.FULLY_OCCUPIED) fullyOccupied += 1;
        else if (p.occupancyStatus === OccupancyStatus.VACANT) vacant += 1;
    }
    return { fullyOccupied, vacant };
}

export function usePropertyDashboardMetrics(tenantId: string | undefined) {
    const enabled = Boolean(tenantId);

    const totalQuery = useQuery({
        queryKey: dashboardKeys.total(tenantId),
        queryFn: () => propertyApi.list({ page: 0, size: 1 }),
        enabled,
    });

    const activeQuery = useQuery({
        queryKey: dashboardKeys.byStatus(PropertyStatus.ACTIVE, tenantId),
        queryFn: () => propertyApi.list({ status: PropertyStatus.ACTIVE }),
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
        totalQuery.isLoading ||
        activeQuery.isLoading ||
        maintenanceQuery.isLoading ||
        draftQuery.isLoading ||
        archivedQuery.isLoading;

    const isError =
        totalQuery.isError ||
        activeQuery.isError ||
        maintenanceQuery.isError ||
        draftQuery.isError ||
        archivedQuery.isError;

    const { fullyOccupied, vacant } = countOccupancy(activeQuery.data?.content ?? []);

    const metrics: PropertyDashboardMetrics = {
        totalProperties: totalQuery.data?.totalElements ?? 0,
        activeProperties: activeQuery.data?.totalElements ?? 0,
        fullyOccupied,
        vacant,
        underMaintenance: maintenanceQuery.data?.totalElements ?? 0,
        draft: draftQuery.data?.totalElements ?? 0,
        archived: archivedQuery.data?.totalElements ?? 0,
    };

    const refetch = () => {
        return Promise.all([
            totalQuery.refetch(),
            activeQuery.refetch(),
            maintenanceQuery.refetch(),
            draftQuery.refetch(),
            archivedQuery.refetch(),
        ]);
    };

    return { metrics, isLoading, isError, refetch };
}