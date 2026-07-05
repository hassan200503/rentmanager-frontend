export enum PropertyStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE",
    ARCHIVED = "ARCHIVED",
}

export enum OccupancyStatus {
    VACANT = "VACANT",
    FULLY_OCCUPIED = "FULLY_OCCUPIED",
}

export enum PropertyType {
    APARTMENT = "APARTMENT",
    BEDSITTER = "BEDSITTER",
    STUDIO = "STUDIO",
    MAISONETTE = "MAISONETTE",
    VILLA = "VILLA",
    COMMERCIAL = "COMMERCIAL",
    OFFICE = "OFFICE",
    WAREHOUSE = "WAREHOUSE",
    HOSTEL = "HOSTEL",
    AIRBNB = "AIRBNB",
}

export interface Address {
    streetAddress: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
}

export interface GeoLocation {
    latitude: number;
    longitude: number;
}

export interface PropertyDimensions {
    totalArea: number;
    occupiedArea: number;
    unitCount: number;
}

export interface Property {
    propertyId: string;
    tenantId: string;

    name: string;
    propertyType: PropertyType;

    status: PropertyStatus;
    occupancyStatus: OccupancyStatus;

    address: Address | null;
    geoLocation: GeoLocation | null;
    dimensions: PropertyDimensions | null;

    description?: string;
}
