// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UnitStatus {
    VACANT = "VACANT",
    OCCUPIED = "OCCUPIED",
    RESERVED = "RESERVED",
    MAINTENANCE = "MAINTENANCE",
}

// ─── Domain Model ─────────────────────────────────────────────────────────────

export interface Unit {
    unitId: string;
    propertyId: string;
    tenantId: string;

    unitNumber: string;
    status: UnitStatus;

    monthlyRent: number;
    depositAmount: number;

    bedrooms: number;
    bathrooms: number;
    squareFootage?: number;

    description?: string;
    imageUrl?: string;

    createdAt: string;
    updatedAt: string;
}