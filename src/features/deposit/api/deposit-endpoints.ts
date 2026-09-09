const base = "/deposits";

export const depositEndpoints = {
    byLease: (leaseId: string) => `${base}/lease/${leaseId}`,
    byId: (id: string) => `${base}/${id}`,
    refund: (id: string) => `${base}/${id}/refund`,
    forfeit: (id: string) => `${base}/${id}/forfeit`,
};
