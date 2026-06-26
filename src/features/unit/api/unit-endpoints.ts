const base = "/units";

export const unitEndpoints = {
    base,
    summary: `${base}/summary`,
    search: `${base}/search`,
    byId: (id: string) => `${base}/${id}`,
    byProperty: (propertyId: string) => `${base}/property/${propertyId}`,
    byStatus: (propertyId: string, status: string) =>
        `${base}/property/${propertyId}/status/${status}`,
    uploadImage: (id: string) => `${base}/${id}/image`,
    uploadMedia: (id: string) => `${base}/${id}/media`,
};