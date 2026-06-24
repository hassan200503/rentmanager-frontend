export interface PublicUnitResponse {
    id: string;
    propertyId: string;
    unitNumber: string;
    description: string;
    rentAmount: number;
    occupancyStatus: string;
}

export interface PublicUnitPageResponse {
    content: PublicUnitResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}