const base = "/units";

export const unitEndpoints = {
    base,
    summary: `${base}/summary`,
    search: `${base}/search`,
    byId: (id: string) => `${base}/${id}`,
    byProperty: (propertyId: string) => `${base}/property/${propertyId}`,
    byStatus: (status: string) => `${base}/status/${status}`,
    activate: (id: string) => `${base}/${id}/activate`,
    archive: (id: string) => `${base}/${id}/archive`,
    markOccupied: (id: string) => `${base}/${id}/occupied`,
    markVacant: (id: string) => `${base}/${id}/vacant`,
    uploadMedia: (id: string) => `${base}/${id}/media`,
    remove: (id: string) => `${base}/${id}`,
};
