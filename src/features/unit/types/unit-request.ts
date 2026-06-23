import { Unit, UnitStatus } from "./unit";

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface CreateUnitRequest {
    propertyId: string;
    unitNumber: string;
    status: UnitStatus;
    monthlyRent: number;
    depositAmount: number;
    bedrooms: number;
    bathrooms: number;
    squareFootage?: number;
    description?: string;
    imageUrl?: string;
}

export interface UpdateUnitRequest {
    unitNumber?: string;
    status?: UnitStatus;
    monthlyRent?: number;
    depositAmount?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    description?: string;
    imageUrl?: string;
}

export interface UnitListParams {
    propertyId: string;
    search?: string;
    status?: UnitStatus | "";
    minRent?: number | "";
    maxRent?: number | "";
    page?: number;
    size?: number;
}

// ─── Responses ────────────────────────────────────────────────────────────────

export type UnitResponse = Unit;

export interface UnitPageResponse {
    content: UnitResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}
