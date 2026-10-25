const base = "/leases";

export const leaseEndpoints = {
    base,
    byId: (id: string) => `${base}/${id}`,
    action: (id: string) => `${base}/${id}/action`,
    stats: `${base}/stats`,
};