const base = "/properties";

export const propertyEndpoints = {
    base,
    search: `${base}/search`,
    byId: (id: string) => `${base}/${id}`,
    byStatus: (status: string) => `${base}/status/${status}`,
    activate: (id: string) => `${base}/${id}/activate`,
    archive: (id: string) => `${base}/${id}/archive`,
    uploadImage: (id: string) => `${base}/${id}/image`,
};
