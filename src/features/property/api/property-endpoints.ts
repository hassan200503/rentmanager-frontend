const base = "/properties";

export const propertyEndpoints = {
    base,
    search: `${base}/search`,
    byId: (id: string) => `${base}/${id}`,
    // Added update endpoint – same as byId for PUT/PATCH requests
    update: (id: string) => `${base}/${id}`,
    activate: (id: string) => `${base}/${id}/activate`,
    archive: (id: string) => `${base}/${id}/archive`,
    remove: (id: string) => `${base}/${id}`,
    // Taxonomy metadata (single source of truth for type -> premises derivation)
    types: `${base}/types`,
};
