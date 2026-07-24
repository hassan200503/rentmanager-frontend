import { Address, GeoLocation } from "@/features/property/types/property";

export interface PublicPropertyResponse {
    propertyId: string;
    name: string;
    propertyType: string;
    address: Address | null;
    geoLocation: GeoLocation | null;
    description: string;

    images: string[];
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