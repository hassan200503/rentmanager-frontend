const base = "/units";

export const unitEndpoints = {
    base,
    search: `${base}/search`,
    byId: (id: string) => `${base}/${id}`,
    byProperty: (propertyId: string) => `${base}/property/${propertyId}`,
    byStatus: (propertyId: string, status: string) =>
        `${base}/property/${propertyId}/status/${status}`,
    uploadImage: (id: string) => `${base}/${id}/image`,
};
