const base = "/renters";

export const renterEndpoints = {
    base,
    search: (query: string) => `${base}/search?query=${encodeURIComponent(query)}`,
    list: (page = 0, size = 100) => `${base}?page=${page}&size=${size}`,
};
