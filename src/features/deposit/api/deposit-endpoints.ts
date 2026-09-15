const base = "/deposits";

export const depositEndpoints = {
    list: (status?: string) => status ? `${base}?status=${status}` : base,
    byLease: (leaseId: string) => `${base}/lease/${leaseId}`,
    byId: (id: string) => `${base}/${id}`,
    refund: (id: string) => `${base}/${id}/refund`,
    initiateRefund: (id: string) => `${base}/${id}/refund/initiate`,
    cancelRefund: (id: string) => `${base}/${id}/refund/cancel`,
    forfeit: (id: string) => `${base}/${id}/forfeit`,
};
