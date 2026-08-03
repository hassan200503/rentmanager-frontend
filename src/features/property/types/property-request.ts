import { PremisesType, PropertyType, Address, GeoLocation, PropertyDimensions } from "./property";

export interface CreatePropertyRequest {
    name: string;
    propertyType: PropertyType;
    /**
     * Optional RESIDENTIAL/COMMERCIAL override. When omitted the backend
     * derives it from propertyType (COMMERCIAL/OFFICE/WAREHOUSE -> COMMERCIAL).
     */
    premisesType?: PremisesType;
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
    page?: number;
    size?: number;
}
