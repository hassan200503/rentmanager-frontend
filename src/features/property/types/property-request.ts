import { PremisesType, PropertyType, Address, GeoLocation, PropertyDimensions } from "./property";

export interface CreatePropertyRequest {
    name: string;
    propertyType: PropertyType;
    /**
     * Optional RESIDENTIAL/COMMERCIAL/MIXED_USE override. When omitted the
     * backend derives it from propertyType (COMMERCIAL/OFFICE/WAREHOUSE ->
     * COMMERCIAL). MIXED_USE is only reachable through this override.
     */
    premisesType?: PremisesType;
    /**
     * Mandatory whenever premisesType is provided. Recorded in the audit
     * trail (with the authenticated user) because the classification drives
     * the MRI/VAT tax pipeline.
     */
    premisesTypeOverrideReason?: string;
    address: Address;
    geoLocation: GeoLocation;
    dimensions: PropertyDimensions;
    description?: string;
    imageUrl?: string;
}

export interface UpdatePropertyRequest {
    name?: string;
    description?: string;
    imageUrl?: string;
}

export interface PropertyListParams {
    search?: string;
    status?: string;
    propertyType?: string;
    /** Spring Data sort expression, e.g. "name,asc" or "status,desc". */
    sort?: string;
    page?: number;
    size?: number;
}
