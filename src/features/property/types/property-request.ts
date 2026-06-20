import { PropertyType, Address, GeoLocation, PropertyDimensions } from "./property";

export interface CreatePropertyRequest {
    name: string;
    propertyType: PropertyType;
    address: Address;
    geoLocation: GeoLocation;
    dimensions: PropertyDimensions;
    description?: string;
}

export interface UpdatePropertyRequest {
    name?: string;
    description?: string;
}

export interface PropertyListParams {
    search?: string;
    status?: string;
    page?: number;
    size?: number;
}
