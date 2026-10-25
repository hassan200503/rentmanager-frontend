const base = "/disbursements";

export const disbursementEndpoints = {
    list: (status?: string) => {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        const qs = params.toString();
        return `${base}${qs ? `?${qs}` : ""}`;
    },
    byId: (id: string) => `${base}/${id}`,
    initiate: () => base,
};
