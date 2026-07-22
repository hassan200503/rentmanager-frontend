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
    label?: string;
    floor?: string;
    description?: string;

    rentAmount: number;
    depositAmount: number;

    // FIXED: was `status: string` — UnitStatusBadge and UnitTable both compare
    // this against UnitStatus enum members (canActivate/canDeactivate checks,
    // statusConfig lookup), so the loose string type was masking a real mismatch
    // at the UnitStatusBadge prop boundary. Tightened to match how the value is
    // actually used everywhere downstream.
    status: UnitStatus;
    occupancyStatus: string;
}