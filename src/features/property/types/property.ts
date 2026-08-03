export enum PropertyStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE",
    ARCHIVED = "ARCHIVED",
}

export enum OccupancyStatus {
    VACANT = "VACANT",
    PARTIALLY_OCCUPIED = "PARTIALLY_OCCUPIED",
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

/**
 * Tax-facing classification of a property (mirrors the backend enum).
 * The backend derives it from PropertyType when not supplied explicitly:
 * COMMERCIAL/OFFICE/WAREHOUSE -> COMMERCIAL, everything else -> RESIDENTIAL.
 * Drives the tax pipeline: residential rent is MRI-eligible (7.5% final),
 * commercial rent is standard-rated 16% VAT for VAT-registered landlords.
 */
export enum PremisesType {
    RESIDENTIAL = "RESIDENTIAL",
    COMMERCIAL = "COMMERCIAL",
}

/** PropertyType values whose backend-derived premises classification is COMMERCIAL. */
export const COMMERCIAL_PROPERTY_TYPES: readonly PropertyType[] = [
    PropertyType.COMMERCIAL,
    PropertyType.OFFICE,
    PropertyType.WAREHOUSE,
];

/** Backend derivation rule: COMMERCIAL/OFFICE/WAREHOUSE -> COMMERCIAL, else RESIDENTIAL. */
export function derivePremisesType(type: PropertyType): PremisesType {
    return COMMERCIAL_PROPERTY_TYPES.includes(type)
        ? PremisesType.COMMERCIAL
        : PremisesType.RESIDENTIAL;
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
    premisesType: PremisesType;

    status: PropertyStatus;
    occupancyStatus: OccupancyStatus;

    address: Address | null;
    geoLocation: GeoLocation | null;
    dimensions: PropertyDimensions | null;

    description?: string;
}
