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
 *
 * MIXED_USE is never auto-derived — it can only be chosen explicitly and
 * always requires an override reason (a building with both residential and
 * commercial tenants must split its income between the regimes; until
 * unit-level classification ships, mixed properties are excluded from MRI
 * and invoiced VAT-exempt).
 */
export enum PremisesType {
    RESIDENTIAL = "RESIDENTIAL",
    COMMERCIAL = "COMMERCIAL",
    MIXED_USE = "MIXED_USE",
}

/** PropertyType values whose backend-derived premises classification is COMMERCIAL. */
export const COMMERCIAL_PROPERTY_TYPES: readonly PropertyType[] = [
    PropertyType.COMMERCIAL,
    PropertyType.OFFICE,
    PropertyType.WAREHOUSE,
];

/**
 * Backend derivation rule: COMMERCIAL/OFFICE/WAREHOUSE -> COMMERCIAL, else
 * RESIDENTIAL. Never returns MIXED_USE. Used as a local fallback while the
 * taxonomy metadata endpoint is loading — the server response is the source
 * of truth for the form options.
 */
export function derivePremisesType(type: PropertyType): PremisesType {
    return COMMERCIAL_PROPERTY_TYPES.includes(type)
        ? PremisesType.COMMERCIAL
        : PremisesType.RESIDENTIAL;
}

/** True when an explicit premises override contradicts the auto-derivation. */
export function isPremisesOverrideContradicting(
    type: PropertyType | undefined,
    premises: PremisesType | undefined
): boolean {
    if (!type || !premises) return false;
    return derivePremisesType(type) !== premises;
}

/** Human-readable tax-regime label for a premises classification. */
export function premisesTypeLabel(premises: PremisesType): string {
    switch (premises) {
        case PremisesType.COMMERCIAL:
            return "Commercial · 16% VAT";
        case PremisesType.MIXED_USE:
            return "Mixed use · split regimes";
        default:
            return "Residential · MRI";
    }
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

    /** Free-text justification when premisesType was explicitly overridden; null when auto-derived. */
    premisesTypeOverrideReason?: string;
    premisesTypeChangedBy?: string;
    premisesTypeChangedAt?: string;

    status: PropertyStatus;
    occupancyStatus: OccupancyStatus;

    address: Address | null;
    geoLocation: GeoLocation | null;
    dimensions: PropertyDimensions | null;

    description?: string;

    /** Primary property photo (set via the media manager). Null until one is uploaded and marked primary. */
    thumbnailUrl?: string | null;
}

/** Backend GET /properties/types taxonomy descriptor (single source of truth). */
export interface PropertyTypeDescriptor {
    propertyType: PropertyType;
    /** What the backend would classify for the type with no override; never MIXED_USE. */
    derivedPremisesType: PremisesType;
}

export interface PropertyTypeMetadataResponse {
    propertyTypes: PropertyTypeDescriptor[];
    premisesTypes: PremisesType[];
}
