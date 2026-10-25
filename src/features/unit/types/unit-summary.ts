export interface UnitSummaryResponse {
    totalUnits: number;
    vacantUnits: number;
    occupiedUnits: number;
    reservedUnits: number;
}

/**
 * Real occupancy for one property, counted in SQL from its units.
 *
 * `occupancyPercent` is null when the property has no units yet — distinct
 * from 0%, which means it has units and none are let. Collapsing the two
 * would show a brand-new property as a problem.
 */
export interface PropertyOccupancyResponse {
    propertyId: string;
    totalUnits: number;
    occupiedUnits: number;
    occupancyPercent: number | null;
}
