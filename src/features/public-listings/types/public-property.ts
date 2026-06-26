export interface PublicPropertyResponse {
    propertyId: string;
    name: string;
    propertyType: string;
    address: unknown | null;
    geoLocation: unknown | null;
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