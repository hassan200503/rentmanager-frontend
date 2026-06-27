export const publicEndpoints = {
    properties: "/public/properties",
    propertyById: (id: string) =>
        `/public/properties/${id}`,

    units: "/public/units",
    unitById: (id: string) =>
        `/public/units/${id}`,

    unitsByProperty: (propertyId: string) =>
        `/public/units/property/${propertyId}`,


    longestVacantUnit: "/public/units/featured/longest-vacant", // ADDED

};