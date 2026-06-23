// ─── Responses ────────────────────────────────────────────────────────────────

import {UnitStatus} from "@/features/unit";

export interface UnitResponse {
    id: string;
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
    createdAt: string;
    updatedAt: string;
}

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