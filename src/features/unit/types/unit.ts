// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UnitStatus {
    INACTIVE = "INACTIVE",
    ACTIVE = "ACTIVE",
    MAINTENANCE = "MAINTENANCE",
    ARCHIVED = "ARCHIVED",
}

export enum UnitOccupancyStatus {
    VACANT = "VACANT",
    PENDING_PAYMENT = "PENDING_PAYMENT",
    OCCUPIED = "OCCUPIED",
    RESERVED = "RESERVED",
}

// ─── Domain Model ─────────────────────────────────────────────────────────────

export interface Unit {
    id: string;
    propertyId: string;
    tenantId: string;

    unitNumber: string;
    floor?: number;
    description?: string;

    rentAmount: number;

    status: string;
    occupancyStatus: string;
}
