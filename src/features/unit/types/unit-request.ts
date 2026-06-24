import { Unit } from "./unit";

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface CreateUnitRequest {
    propertyId: string;
    unitNumber: string;
    label?: string;
    rentAmount: number;
    description?: string;
}

export interface UpdateUnitRequest {
    unitNumber?: string;
    label?: string;
    rentAmount?: number;
    description?: string;
}

export interface UnitListParams {
    propertyId: string;
    search?: string;
    status?: string;
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