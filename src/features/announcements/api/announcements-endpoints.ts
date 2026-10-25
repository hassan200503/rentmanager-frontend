// api/announcements-endpoints.ts
// All paths are RELATIVE - apiClient prepends the base URL (/api/v1).
const base = "/announcements";

export const announcementsEndpoints = {
    create: () => `${base}`,
    preview: (channels: string[]) => `${base}/preview?channels=${channels.join(",")}`,
    history: () => `${base}`,
};
