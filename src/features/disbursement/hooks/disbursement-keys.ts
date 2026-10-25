export const disbursementKeys = {
    all: ["disbursement"] as const,
    list: (status?: string) => [...disbursementKeys.all, "list", status ?? "all"],
    detail: (id: string) => [...disbursementKeys.all, "detail", id],
};
