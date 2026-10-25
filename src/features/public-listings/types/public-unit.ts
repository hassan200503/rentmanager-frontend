export interface PublicUnitResponse {
    id: string;
    propertyId: string;
    unitNumber: string;
    label?: string;
    floor?: string;
    description: string;
    rentAmount: string; // BigDecimal -> JSON string
    depositAmount?: string;
    occupancyStatus: string;
    images: string[];

    propertyName?: string;
    propertyArea?: string;
    vacatedAt?: string;
    landlordVerified?: boolean;
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