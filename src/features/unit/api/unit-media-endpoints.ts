const base = "/units";

export const unitMediaEndpoints = {
    list: (unitId: string) => `${base}/${unitId}/media`,
    upload: (unitId: string) => `${base}/${unitId}/media`,
    delete: (unitId: string, mediaId: string) =>
        `${base}/${unitId}/media/${mediaId}`,
    setPrimary: (unitId: string, mediaId: string) =>
        `${base}/${unitId}/media/${mediaId}/primary`,
    updateCaption: (unitId: string, mediaId: string) =>
        `${base}/${unitId}/media/${mediaId}`,
    reorder: (unitId: string) => `${base}/${unitId}/media/reorder`,
};