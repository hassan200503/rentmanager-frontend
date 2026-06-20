export interface PropertyFilterState {
    search?: string;
    status?: PropertyStatus;
    occupancyStatus?: OccupancyStatus;
    propertyType?: PropertyType;
    page?: number;
    size?: number;
}

export interface PropertyStatus {
    AVAILABLE: string;
    FULLY_OCCUPIED: string;
    VACANT: string;
    BEDSITTER: string;
    STUDIO: string;
    MAINSTE: string;
    HOUSING: string;
}

export interface OccupancyStatus {
    VACANT: string;
    FULLY_OCCUPIED: string;
}

export interface PropertyType {
    APARTMENT: string;
    BEDSITTER: string;
    STUDIO: string;
    MAINSTE: string;
    VILLA: string;
    COMMERCIAL: string;
    OFFICE: string;
    WAREHOUSE: string;
    HOSTEL: string;
}
