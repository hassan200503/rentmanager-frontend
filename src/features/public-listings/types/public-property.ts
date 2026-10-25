import { Address, GeoLocation } from "@/features/property/types/property";
import type { MoneyValue } from "@/shared/utils/money";

export interface PublicPropertyResponse {
    propertyId: string;
    name: string;
    propertyType: string;
    address: Address | null;
    geoLocation: GeoLocation | null;
    description: string;

    images: string[];

    /**
     * How many units a renter could enquire about today. Absent (not zero)
     * when the backend has nothing to report — every property returned by
     * the public search has at least one vacant unit, so in practice this is
     * always present, but the type stays optional rather than assuming that.
     */
    availableUnits?: number;

    /** Asking rent of the cheapest and dearest available unit. */
    minRent?: MoneyValue;
    maxRent?: MoneyValue;
}

export interface PublicPropertyPageResponse {
    content: PublicPropertyResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}