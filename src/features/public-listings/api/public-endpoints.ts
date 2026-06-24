export const publicEndpoints = {
    properties: "/api/v1/public/properties",
    propertyById: (id: string) =>
        `/api/v1/public/properties/${id}`,

    units: "/api/v1/public/units",
    unitById: (id: string) =>
        `/api/v1/public/units/${id}`,

    unitsByProperty: (propertyId: string) =>
        `/api/v1/public/units/property/${propertyId}`,
};